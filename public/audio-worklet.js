class VoiceOpsPCMProcessor extends AudioWorkletProcessor {
  constructor(options) { super(); this.ratio = options.processorOptions.inputSampleRate / 24000; }
  process(inputs) {
    const input = inputs[0]?.[0]; if (!input) return true;
    const output = new Int16Array(Math.floor(input.length / this.ratio));
    for (let i = 0; i < output.length; i++) { const sample = input[Math.floor(i * this.ratio)] || 0; output[i] = Math.max(-32768, Math.min(32767, Math.round(sample * 32767))); }
    this.port.postMessage(output.buffer, [output.buffer]); return true;
  }
}
registerProcessor('voiceops-pcm', VoiceOpsPCMProcessor);
