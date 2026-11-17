// Synthesized WebAudio: no audio files, no network. All sounds are tiny
// oscillator/noise envelopes. M toggles mute; the button on screen does too.
export function createAudio() {
  const audio = { ctx: null, muted: false };
  function ensure() {
    if (!audio.ctx) {
      try {
        audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        audio.ctx = null;
      }
    }
    if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
    return audio.ctx;
  }
  function tone(freq, dur, type, vol, slideTo) {
    if (audio.muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol || 0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }
  function noise(dur, vol, low) {
    if (audio.muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = low || 900;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol || 0.2, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(t0);
  }
  return {
    get muted() { return audio.muted; },
    toggle() { audio.muted = !audio.muted; return audio.muted; },
    click() { tone(660, 0.06, 'triangle', 0.08); },
    release() { noise(0.7, 0.28, 500); tone(180, 0.5, 'sine', 0.1, 60); },
    avalanche() { noise(1.4, 0.4, 320); tone(90, 1.1, 'sawtooth', 0.12, 40); },
    scare() { tone(880, 0.12, 'square', 0.07, 1320); },
    rescue() { tone(523, 0.1, 'sine', 0.1); setTimeout(() => tone(784, 0.14, 'sine', 0.1), 90); },
    horn() { tone(196, 0.5, 'triangle', 0.16, 392); },
    build() { tone(330, 0.08, 'square', 0.09); setTimeout(() => tone(440, 0.1, 'square', 0.09), 70); },
    stoke() { noise(0.25, 0.12, 1400); tone(220, 0.2, 'sine', 0.08, 330); },
    hurt() { tone(140, 0.3, 'sawtooth', 0.14, 70); },
    draft() { tone(523, 0.12, 'sine', 0.1); setTimeout(() => tone(659, 0.12, 'sine', 0.1), 100); setTimeout(() => tone(784, 0.2, 'sine', 0.1), 200); },
    win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.12), i * 130)); },
    lose() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.35, 'triangle', 0.12), i * 150)); },
  };
}
