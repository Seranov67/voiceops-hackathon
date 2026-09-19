const TOKEN_URL = 'https://agents.assemblyai.com/v1/token';

export async function createVoiceToken({ apiKey, fetchImpl = fetch }) {
  if (!apiKey) throw new Error('ASSEMBLYAI_API_KEY is not configured');
  const url = new URL(TOKEN_URL);
  url.searchParams.set('expires_in_seconds', '60');
  url.searchParams.set('max_session_duration_seconds', '180');
  const response = await fetchImpl(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) throw new Error(`AssemblyAI token request failed (${response.status})`);
  const data = await response.json();
  if (typeof data.token !== 'string' || !data.token) throw new Error('AssemblyAI returned no token');
  return data.token;
}
