
// This file assumes Tone.js is loaded from a CDN.
// We declare Tone to satisfy TypeScript since there's no direct import.
declare const Tone: any;

let synth: any;

const initializeSynth = () => {
  if (typeof Tone !== 'undefined' && !synth) {
    synth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 1,
      },
    }).toDestination();
  }
};

export const playTimerFinishSound = () => {
  initializeSynth();
  if (synth && Tone.context.state !== 'running') {
    Tone.start();
  }
  
  if (synth) {
    const now = Tone.now();
    synth.triggerAttackRelease('C5', '8n', now);
    synth.triggerAttackRelease('E5', '8n', now + 0.2);
    synth.triggerAttackRelease('G5', '8n', now + 0.4);
  }
};
