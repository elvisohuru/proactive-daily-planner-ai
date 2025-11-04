// Sound functionality to play a notification when the timer is up.
// This is generated with the Web Audio API to ensure it works offline.

let audioContext: AudioContext | null = null;
let alarmInterval: number | null = null;
let idleAlarmInterval: number | null = null;

const getContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const stopTimerUpSound = () => {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
};

export const playTimerUpSound = () => {
  stopTimerUpSound(); // Stop any existing alarm first
  try {
    const context = getContext();
    if (!context) return;

    if (context.state === 'suspended') {
      context.resume();
    }

    const playBeep = () => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      gainNode.gain.setValueAtTime(0.5, context.currentTime); // Louder volume

      oscillator.type = 'square'; // More alerting sound
      oscillator.frequency.setValueAtTime(880, context.currentTime); // A5 note

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.1); // Short beep
    };
    
    playBeep(); // Play immediately
    alarmInterval = window.setInterval(playBeep, 600); // Repeat every 600ms

  } catch (error) {
    console.error("Failed to play timer up sound:", error);
  }
};

export const playCompletionSound = () => {
  try {
    const context = getContext();
    if (!context) return;

    if (context.state === 'suspended') {
      context.resume();
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 0.25);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, context.currentTime); // C5
    oscillator.frequency.linearRampToValueAtTime(1046.50, context.currentTime + 0.2); // C6

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.3);
  } catch (error) {
    console.error("Failed to play completion sound:", error);
  }
};


// For Hourly Review Feature
export const stopIdleAlarm = () => {
  if (idleAlarmInterval) {
    clearInterval(idleAlarmInterval);
    idleAlarmInterval = null;
  }
};

export const playIdleAlarm = () => {
  stopIdleAlarm();
  try {
    const context = getContext();
    if (!context) return;

    if (context.state === 'suspended') {
      context.resume();
    }

    const playChime = () => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.5);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(987.77, context.currentTime); // B5

      oscillator.start();
      oscillator.stop(context.currentTime + 1.5);
    };

    const playFullSequence = () => {
        playChime();
        setTimeout(playChime, 300);
    }
    
    playFullSequence();
    idleAlarmInterval = window.setInterval(playFullSequence, 5000); // Repeat every 5 seconds

    // Stop the alarm after 1 minute
    setTimeout(stopIdleAlarm, 60000);

  } catch (error) {
    console.error("Failed to play idle alarm:", error);
  }
};

export const playCelebrationPopSound = () => {
  try {
    const context = getContext();
    if (!context) return;
    if (context.state === 'suspended') context.resume();

    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.connect(gain);
    gain.connect(context.destination);

    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.1);

    osc.frequency.setValueAtTime(200, context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, context.currentTime + 0.1);

    osc.start(context.currentTime);
    osc.stop(context.currentTime + 0.15);
  } catch (error) {
    console.error("Failed to play pop sound:", error);
  }
};

export const playSparkleSound = () => {
  try {
    const context = getContext();
    if (!context) return;
    if (context.state === 'suspended') context.resume();

    const playNote = (freq: number, delay: number) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.connect(gain);
      gain.connect(context.destination);

      gain.gain.setValueAtTime(0, context.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.15, context.currentTime + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + delay + 0.8);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, context.currentTime + delay);

      osc.start(context.currentTime + delay);
      osc.stop(context.currentTime + delay + 1);
    };

    playNote(1046.50, 0); // C6
    playNote(1396.91, 0.1); // F6
    playNote(1567.98, 0.2); // G6
  } catch (error) {
    console.error("Failed to play sparkle sound:", error);
  }
};
