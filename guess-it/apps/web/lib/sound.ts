'use client';

/**
 * Sound & haptic juice — synthesized with WebAudio (no assets), plus
 * navigator.vibrate on supporting devices. Respects the Settings toggle.
 */
let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean): void {
  enabled = on;
  try {
    localStorage.setItem('guessit-sound', on ? '1' : '0');
  } catch {}
}

export function soundEnabled(): boolean {
  try {
    return localStorage.getItem('guessit-sound') !== '0';
  } catch {
    return true;
  }
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, startMs: number, durMs: number, type: OscillatorType = 'sine', gain = 0.08): void {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + startMs / 1000;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + durMs / 1000);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + durMs / 1000 + 0.02);
}

function buzz(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {}
}

export const sfx = {
  tap(): void {
    if (!enabled || !soundEnabled()) return;
    tone(620, 0, 50, 'square', 0.03);
  },
  good(): void {
    if (!enabled || !soundEnabled()) return;
    tone(520, 0, 90);
    tone(720, 80, 120);
  },
  bad(): void {
    if (!enabled || !soundEnabled()) return;
    tone(220, 0, 140, 'sawtooth', 0.05);
    buzz(70);
  },
  win(): void {
    if (!enabled || !soundEnabled()) return;
    tone(523, 0, 120);
    tone(659, 110, 120);
    tone(784, 220, 200);
    tone(1046, 340, 320);
    buzz([60, 40, 60, 40, 120]);
  },
  lose(): void {
    if (!enabled || !soundEnabled()) return;
    tone(330, 0, 180, 'triangle', 0.06);
    tone(247, 170, 260, 'triangle', 0.06);
  },
};
