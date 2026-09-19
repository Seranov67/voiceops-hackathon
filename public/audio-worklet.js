class VoiceOpsPCMProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.ratio = options.processorOptions.inputSampleRate / 24000;
    this.position = 0;
    this.previous = 0;
  }
  process(inputs) {
    const input = inputs[0]?.[0]; if (!input) return true;
    const samples = [];
    // Preserve the fractional sampling position across render blocks. A one-sample
    // delay allows interpolation across the boundary without losing input time.
    while (this.position < input.length) {
      const index = Math.floor(this.position);
      const fraction = this.position - index;
      const left = index === 0 ? this.previous : input[index - 1];
      const sample = left + (input[index] - left) * fraction;
      samples.push(Math.max(-32768, Math.min(32767, Math.round(sample * 32767))));
      this.position += this.ratio;
    }
    this.position -= input.length;
    this.previous = input[input.length - 1];
    const output = new Int16Array(samples);
    this.port.postMessage(output.buffer, [output.buffer]); return true;
  }
}
registerProcessor('voiceops-pcm', VoiceOpsPCMProcessor);
