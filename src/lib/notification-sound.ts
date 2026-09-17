// Synthesizes a crisp, pleasant chime using Web Audio API without needing external mp3 files

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

export function playOrderNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Harmonious multi-tone chime: Note 1 (E5 = 659.25Hz), Note 2 (G#5 = 830.61Hz), Note 3 (B5 = 987.77Hz), Note 4 (E6 = 1318.51Hz)
    const notes = [
      { freq: 659.25, time: now + 0.00, duration: 0.25 },
      { freq: 830.61, time: now + 0.12, duration: 0.25 },
      { freq: 987.77, time: now + 0.24, duration: 0.35 },
      { freq: 1318.51, time: now + 0.38, duration: 0.65 },
    ];

    notes.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      // Envelope: quick attack, smooth exponential decay
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(0.3, time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + duration);
    });
  } catch (err) {
    console.warn('Could not play notification sound:', err);
  }
}
