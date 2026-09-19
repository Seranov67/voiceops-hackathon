import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../public/audio-worklet.js', import.meta.url), 'utf8');
function resample(rate, blockSize, length) {
  let Processor;
  const samples = [];
  vm.runInNewContext(source, {
    AudioWorkletProcessor: class { port = { postMessage(buffer) { samples.push(...new Int16Array(buffer)); } }; },
    registerProcessor(name, processor) { Processor = processor; }
  });
  const processor = new Processor({ processorOptions: { inputSampleRate: rate } });
  for (let offset = 0; offset < length; offset += blockSize) {
    const input = Float32Array.from({ length: Math.min(blockSize, length - offset) }, (_, i) => Math.sin((i + offset) / 20));
    processor.process([[input]]);
  }
  return samples;
}

for (const rate of [44100, 48000]) test(`resampling ${rate} Hz preserves duration and block continuity`, () => {
  const samples = resample(rate, 128, rate * 2);
  assert.ok(Math.abs(samples.length - 48000) <= 1);
  const alternative = resample(rate, 97, rate * 2);
  assert.equal(samples.length, alternative.length);
  assert.ok(samples.every((value, i) => Math.abs(value - alternative[i]) <= 1));
});
