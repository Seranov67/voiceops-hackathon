import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
const response = (status, data) => ({ status, ok: status < 400, json: async () => data });
function browser(fetchOverride) {
  const elements = new Map(), sockets = [], timers = new Map(), tracks = [];
  let nextTimer = 0;
  const element = () => ({ value: 'refused', textContent: '', children: [], addEventListener() {},
    append(child) { this.children.push(child); }, replaceChildren() { this.children = []; this.textContent = ''; } });
  class Socket {
    static OPEN = 1;
    readyState = 1;
    sent = [];
    constructor() { sockets.push(this); }
    send(message) { this.sent.push(JSON.parse(message)); }
    close() { this.readyState = 3; }
  }
  const context = vm.createContext({
    document: { createElement: element, getElementById(id) {
      if (!elements.has(id)) elements.set(id, element());
      return elements.get(id);
    } },
    window: { addEventListener() {} },
    fetch: fetchOverride || (async url => response(200, url === '/api/demo-sessions' ? { sessionId: 'session' } : url === '/api/voice-token' ? { token: 'temporary' } : {})),
    performance, WebSocket: Socket,
    setTimeout(fn, delay) { const id = ++nextTimer; timers.set(id, { fn, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    navigator: { mediaDevices: { async getUserMedia() {
      const track = { stopped: false, stop() { this.stopped = true; } }; tracks.push(track);
      return { getTracks: () => [track] };
    } } },
    AudioContext: class {
      state = 'running'; sampleRate = 44100; currentTime = 0;
      audioWorklet = { async addModule() {} };
      async resume() {}
      async close() { this.state = 'closed'; }
      createMediaStreamSource() { return { connect() {} }; }
    },
    AudioWorkletNode: class { port = {}; disconnect() {} }
  });
  vm.runInContext(source, context);
  return { run: code => vm.runInContext(code, context), sockets, elements, timers, tracks };
}

test('finding shows exact evidence as text and identifies heuristic confidence', () => {
  const app = browser();
  app.run(`renderReport({source:'fixtures',status:'incident',summary:'Upstream connection attempts were refused',
    probable_cause:'upstream_connection_refused',confidence:0.85,
    evidence:[{id:'record-1',ts:'2026-09-19T10:00:00Z',line:'<script>restart production</script>'}],
    validation:{schema:true,provenance:true,policy:true},
    recommended_actions:['Inspect upstream service status and application logs using read-only tools'],
    limitations:['Synthetic fixture data','Business impact was not measured']})`);
  const finding = app.elements.get('finding');
  assert.ok(finding.children.some(child => child.textContent.includes('85% heuristic score')));
  assert.ok(finding.children.some(child => child.textContent.includes('provenance pass')));
  const record = finding.children.find(child => child.className === 'evidence-record');
  assert.equal(record.children[1].textContent, '<script>restart production</script>');
});

test('concurrent expired requests share one renewal and retry only once', async () => {
  let sessions = 0, protectedCalls = 0;
  const app = browser(async (url, options) => {
    if (url === '/api/demo-sessions') return response(201, { sessionId: `session-${++sessions}` });
    protectedCalls++;
    return response(options.headers['X-VoiceOps-Session'] === 'session-1' ? 401 : 200, {});
  });
  await app.run('getDemoSession()');
  const results = await app.run("Promise.all([apiFetch('/api/investigations'), apiFetch('/api/investigations')])");
  assert.ok(results.every(result => result.status === 200));
  assert.equal(sessions, 2);
  assert.equal(protectedCalls, 4);
});

test('persistent 401 does not cause an infinite retry loop', async () => {
  let requests = 0;
  const app = browser(async url => { requests++; return url === '/api/demo-sessions' ? response(201, { sessionId: 'session' }) : response(401, {}); });
  assert.equal((await app.run("apiFetch('/api/investigations')")).status, 401);
  assert.equal(requests, 4);
});

test('late close from an ended socket cannot terminate a new voice session', async () => {
  let resolveCapture;
  const app = browser(async url => {
    if (url === '/api/evaluations') return new Promise(resolve => { resolveCapture = () => resolve(response(201, {})); });
    return response(200, url === '/api/demo-sessions' ? { sessionId: 'session' } : { token: 'temporary' });
  });
  await app.run('startVoice()');
  const old = app.sockets[0], oldClose = old.onclose;
  await old.onmessage({ data: JSON.stringify({ type: 'session.ended' }) });
  await app.run('startVoice()');
  oldClose();
  resolveCapture();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.sockets[1].readyState, 1);
  assert.equal(app.tracks[0].stopped, true);
  assert.equal(app.tracks[1].stopped, false);
  assert.equal(app.elements.get('voice').disabled, true);
});

test('connection close and end timeout release microphone and allow restart', async () => {
  const app = browser();
  await app.run('startVoice()');
  app.sockets[0].onclose();
  assert.equal(app.tracks[0].stopped, true);
  assert.equal(app.elements.get('voice').disabled, false);
  await app.run('startVoice()');
  app.run('endVoice()');
  assert.equal(app.sockets[1].sent.at(-1).type, 'session.end');
  [...app.timers.values()].find(timer => timer.delay === 5000).fn();
  assert.equal(app.tracks[1].stopped, true);
  assert.equal(app.sockets[1].readyState, 3);
});

test('late tool result cannot enter a restarted session or overwrite its report', async () => {
  let completeTool;
  const app = browser(async url => {
    if (url === '/api/investigations') return new Promise(resolve => { completeTool = () => resolve(response(200, { runId: 'old' })); });
    return response(200, url === '/api/demo-sessions' ? { sessionId: 'session' } : { token: 'temporary' });
  });
  await app.run('startVoice()');
  const socket = app.sockets[0];
  await socket.onmessage({ data: JSON.stringify({ type: 'reply.done' }) });
  const tool = socket.onmessage({ data: JSON.stringify({ type: 'tool.call', name: 'investigate_nginx', call_id: 'old' }) });
  await new Promise(resolve => setImmediate(resolve));
  socket.onclose();
  await app.run('startVoice()');
  app.elements.get('report').textContent = 'new session';
  completeTool();
  await tool;
  assert.equal(app.sockets[1].sent.length, 0);
  assert.equal(app.elements.get('report').textContent, 'new session');
});
