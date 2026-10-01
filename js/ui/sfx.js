// 효과음: 소리 파일 없이 브라우저에서 직접 만듭니다 (용량 0). 처음에는 꺼져 있습니다.
let ctx = null, on = false, master = null;

function ensure() {
  if (ctx) { if (ctx.state === "suspended") ctx.resume(); return ctx; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
  return ctx;
}

// 짧은 음 하나
function tone(freq, { t = 0, dur = 0.12, type = "sine", vol = 0.2, slide = 0, attack = 0.005 } = {}) {
  const c = ctx, now = c.currentTime + t;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, now);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), now + dur);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(vol, now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.connect(g); g.connect(master); o.start(now); o.stop(now + dur + 0.02);
  return o;
}

// 잡음 (관중 함성, 휙 소리)
function noise({ t = 0, dur = 1, vol = 0.2, freq = 900, q = 0.8, type = "bandpass", attack = 0.08, sweep = 0 } = {}) {
  const c = ctx, now = c.currentTime + t;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, now); f.Q.value = q;
  if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(60, freq + sweep), now + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(vol, now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  src.connect(f); f.connect(g); g.connect(master); src.start(now); src.stop(now + dur + 0.02);
}

// 심판 휘슬: 높은 음 + 빠른 떨림
function whistle(t, dur) {
  const c = ctx, now = c.currentTime + t;
  const o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain();
  o.type = "sine"; o.frequency.value = 2900;
  lfo.frequency.value = 34; lg.gain.value = 140; lfo.connect(lg); lg.connect(o.frequency);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.13, now + 0.02);
  g.gain.setValueAtTime(0.13, now + dur - 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.connect(g); g.connect(master);
  o.start(now); lfo.start(now); o.stop(now + dur + 0.02); lfo.stop(now + dur + 0.02);
}

const SOUNDS = {
  tap: () => tone(1250, { dur: 0.05, vol: 0.07, slide: -400 }),
  select: () => { tone(660, { dur: 0.08, vol: 0.09, type: "triangle" }); tone(990, { t: 0.06, dur: 0.12, vol: 0.08, type: "triangle" }); },
  open: () => noise({ dur: 0.28, vol: 0.05, freq: 600, sweep: 1800, q: 0.6 }),
  good: () => { tone(784, { dur: 0.12, vol: 0.1, type: "triangle" }); tone(1175, { t: 0.09, dur: 0.22, vol: 0.1, type: "triangle" }); },
  bad: () => { tone(392, { dur: 0.14, vol: 0.1, type: "triangle" }); tone(294, { t: 0.12, dur: 0.25, vol: 0.1, type: "triangle" }); },
  up: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, { t: i * 0.07, dur: 0.18, vol: 0.08, type: "triangle" })),
  kickoff: () => whistle(0, 0.45),
  half: () => { whistle(0, 0.3); whistle(0.4, 0.55); },
  full: () => { whistle(0, 0.28); whistle(0.36, 0.28); whistle(0.72, 0.8); },
  goal: () => {
    noise({ dur: 2.2, vol: 0.22, freq: 700, q: 0.5, attack: 0.15 });
    noise({ t: 0.05, dur: 1.8, vol: 0.12, freq: 1800, q: 0.7, attack: 0.2 });
    [523, 659, 784].forEach((f, i) => tone(f, { t: 0.05 + i * 0.09, dur: 0.5, vol: 0.07, type: "triangle" }));
  },
  concede: () => { noise({ dur: 1.1, vol: 0.12, freq: 380, q: 0.7, attack: 0.1, sweep: -200 }); tone(220, { t: 0.1, dur: 0.5, vol: 0.06, slide: -80 }); },
};

export const sfx = {
  get on() { return on; },
  set(v) { on = !!v; },
  play(name) {
    if (!on) return;
    if (!ensure()) return;
    try { SOUNDS[name]?.(); } catch { /* 소리가 안 나도 게임은 계속 */ }
  },
};

// 버튼을 누를 때마다 작은 소리 (켜져 있을 때만)
document.addEventListener("pointerdown", e => {
  if (!on) return;
  const b = e.target.closest("button");
  if (!b || b.disabled) return;
  if (b.matches(".vn-choice, .mo-btn, .act, [data-c], [data-i]")) sfx.play("select");
  else sfx.play("tap");
}, { passive: true });
