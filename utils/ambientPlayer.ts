class AmbientPlayer {
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioScheduledSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.2; // Default soft volume

  private getContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  stop() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (e) {
        // Can throw error if already stopped
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
  }

  play(sound: 'rain' | 'fire' | 'cafe') {
    this.stop();
    const context = this.getContext();
    this.gainNode = context.createGain();
    this.gainNode.gain.setValueAtTime(this.isMuted ? 0 : this.volume, context.currentTime);
    this.gainNode.connect(context.destination);

    if (sound === 'rain') {
      const bufferSize = context.sampleRate * 2; // 2 seconds of noise
      const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noiseSource = context.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const bandpass = context.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 1200;
      bandpass.Q.value = 0.6;
      
      noiseSource.connect(bandpass);
      bandpass.connect(this.gainNode);
      this.sourceNode = noiseSource;
    } else if (sound === 'fire') {
      const bufferSize = context.sampleRate * 2;
      const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() - 0.5) * 0.4 * (1 - Math.pow(i / bufferSize, 2));
      }

      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      filter.Q.value = 1;

      source.connect(filter);
      filter.connect(this.gainNode);
      this.sourceNode = source;

    } else if (sound === 'cafe') {
       // brown noise for cafe rumble
      const bufferSize = context.sampleRate * 2;
      const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
      const noiseSource = context.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500;

      noiseSource.connect(filter);
      filter.connect(this.gainNode);
      this.sourceNode = noiseSource;
    }
    
    this.sourceNode?.start();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.linearRampToValueAtTime(this.isMuted ? 0 : this.volume, this.audioContext.currentTime + 0.1);
    }
  }
}

export const ambientPlayer = new AmbientPlayer();
