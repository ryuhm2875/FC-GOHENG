// 배경음악: 브라우저가 직접 연주합니다 (용량 0). data/audio.js 에 파일을 적으면 그 파일을 씁니다.
// home 잔잔한 로파이 / match 신나는 경기 음악 / ending 피아노
import { BGM_FILES } from "../../data/audio.js";

let ctx = null, master = null, revIn = null, noiseBuf = null;
let on = false, want = null, cur = null, timer = null;
let play = null;            // 지금 연주 중인 곡 { name, gain, step, nextT, seed, file }
const VOLUME = 0.32;

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

function ensure() {
  if (ctx) { if (ctx.state === "suspended") ctx.resume(); return true; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = VOLUME;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
  master.connect(comp); comp.connect(ctx.destination);
  // 잔향: 짧게 사라지는 잡음으로 만든 방 울림
  const len = ctx.sampleRate * 2.4, ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
  const conv = ctx.createConvolver(); conv.buffer = ir;
  revIn = ctx.createGain(); revIn.gain.value = 0.32;
  revIn.connect(conv); conv.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  return true;
}

// ── 악기 ──
function voice(dest, t, { type = "sine", freq, dur, vol, a = 0.01, d = 0.3, s = 0.4, r = 0.4, cut = 2400, detune = 0, send = 0.3 }) {
  const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
  o.type = type; o.frequency.value = freq; o.detune.value = detune;
  f.type = "lowpass"; f.frequency.value = cut; f.Q.value = 0.5;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.setTargetAtTime(vol * s, t + a, d / 3);
  g.gain.setTargetAtTime(0.0001, t + dur, r / 3);
  o.connect(f); f.connect(g); g.connect(dest);
  if (send) { const sg = ctx.createGain(); sg.gain.value = send; g.connect(sg); sg.connect(revIn); }
  o.start(t); o.stop(t + dur + r * 2);
}
const epiano = (dest, t, m, dur, vol = 0.07) => {
  voice(dest, t, { freq: mtof(m), dur, vol, a: 0.008, d: 0.6, s: 0.35, r: 0.5, cut: 2200, send: 0.35 });
  voice(dest, t, { type: "triangle", freq: mtof(m + 12), dur: dur * 0.5, vol: vol * 0.25, a: 0.005, d: 0.2, s: 0.1, r: 0.2, cut: 3000, send: 0.2 });
};
const piano = (dest, t, m, dur, vol = 0.08) => {
  voice(dest, t, { type: "triangle", freq: mtof(m), dur, vol, a: 0.006, d: 1.4, s: 0.15, r: 0.9, cut: 2600, send: 0.45 });
  voice(dest, t, { freq: mtof(m + 12), dur: dur * 0.6, vol: vol * 0.3, a: 0.004, d: 0.6, s: 0.05, r: 0.5, cut: 4000, send: 0.3 });
};
const pad = (dest, t, m, dur, vol = 0.03, cut = 900) => {
  voice(dest, t, { type: "sawtooth", freq: mtof(m), dur, vol, a: 0.5, d: 1, s: 0.9, r: 1.2, cut, detune: -7, send: 0.5 });
  voice(dest, t, { type: "sawtooth", freq: mtof(m), dur, vol, a: 0.5, d: 1, s: 0.9, r: 1.2, cut, detune: 7, send: 0.5 });
};
const bass = (dest, t, m, dur, vol = 0.16) => voice(dest, t, { type: "triangle", freq: mtof(m), dur, vol, a: 0.01, d: 0.25, s: 0.6, r: 0.12, cut: 520, send: 0 });
const pluck = (dest, t, m, vol = 0.05, cut = 2600) => voice(dest, t, { type: "square", freq: mtof(m), dur: 0.05, vol, a: 0.003, d: 0.12, s: 0.05, r: 0.15, cut, send: 0.25 });

function kick(dest, t, vol = 0.55) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.35);
}
function noiseHit(dest, t, { vol, dur, type = "highpass", freq = 7000, q = 0.7, send = 0 }) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(dest);
  if (send) { const sg = ctx.createGain(); sg.gain.value = send; g.connect(sg); sg.connect(revIn); }
  src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
}
const snare = (dest, t, vol = 0.18) => { noiseHit(dest, t, { vol, dur: 0.18, type: "bandpass", freq: 1900, q: 0.8, send: 0.25 }); voice(dest, t, { type: "triangle", freq: 190, dur: 0.05, vol: vol * 0.6, a: 0.002, d: 0.06, s: 0.01, r: 0.05, cut: 1200, send: 0 }); };
const hat = (dest, t, vol = 0.035, open = false) => noiseHit(dest, t, { vol, dur: open ? 0.18 : 0.04, freq: 8000 });

// 곡마다 다른 멜로디가 나오도록 쓰는 간단한 난수
const rng = s => () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;

// ── 곡 ── (한 마디 = 16칸, 4마디가 한 바퀴)
const TRACKS = {
  home: {
    bpm: 82, swing: 0.14,
    chords: [[48, [0, 4, 7, 11]], [45, [0, 3, 7, 10]], [41, [0, 4, 7, 11]], [43, [0, 4, 5, 9]]],   // Cmaj7 Am7 Fmaj7 Gsus
    scale: [72, 74, 76, 79, 81, 84],
    step(g, t, bar, s, r, beat) {
      const [root, iv] = this.chords[bar % 4];
      if (s === 0 || s === 10) iv.forEach((x, i) => epiano(g, t + i * 0.012, root + 12 + x, beat * (s === 0 ? 2.2 : 1.4), 0.055));
      if (s === 0) bass(g, t, root - 12, beat * 1.6);
      if (s === 8) bass(g, t, root - 12 + 7, beat * 0.8, 0.12);
      if (s === 14) bass(g, t, root - 12 + (bar % 2 ? 10 : 12), beat * 0.4, 0.1);
      if (s === 0 || s === 7 || s === 10) kick(g, t, s === 0 ? 0.42 : 0.3);
      if (s === 4 || s === 12) snare(g, t, 0.11);
      if (s % 2 === 0) hat(g, t, s % 4 === 2 ? 0.03 : 0.018);
      if (bar % 4 !== 3 && s % 2 === 0 && r() < 0.24) epiano(g, t, this.scale[Math.floor(r() * this.scale.length)], beat * 0.9, 0.045);
    },
  },
  match: {
    bpm: 124, swing: 0,
    chords: [[45, [0, 3, 7]], [41, [0, 4, 7]], [48, [0, 4, 7]], [43, [0, 4, 7]]],                 // Am F C G
    step(g, t, bar, s, r, beat) {
      const [root, iv] = this.chords[bar % 4];
      if (s === 0) iv.forEach(x => pad(g, t, root + 12 + x, beat * 3.8, 0.018, 1400));
      if (s % 2 === 0) bass(g, t, root - 12 + (s % 4 === 2 ? 12 : 0), beat * 0.4, 0.13);
      if (s % 4 === 0) kick(g, t, 0.5);
      if (s === 4 || s === 12) snare(g, t, 0.2);
      if (s % 4 === 2) hat(g, t, 0.05, true); else if (s % 2 === 1) hat(g, t, 0.02);
      const arp = [0, 1, 2, 1];
      if (bar % 8 >= 4 || s % 2 === 0) pluck(g, t, root + 24 + iv[arp[s % 4]], 0.022, bar % 8 >= 4 ? 3200 : 1800);
      if (bar % 8 === 7 && s >= 12) snare(g, t, 0.08 + (s - 12) * 0.03);   // 넘어가는 마디의 짧은 드럼 채움
    },
  },
  ending: {
    bpm: 70, swing: 0,
    chords: [[41, [0, 4, 7, 11]], [40, [0, 3, 8, 12]], [38, [0, 3, 7, 10]], [46, [0, 4, 7, 11]]],    // Fmaj7 C/E Dm7 Bbmaj7
    scale: [77, 79, 81, 84, 86, 88],
    step(g, t, bar, s, r, beat) {
      const [root, iv] = this.chords[bar % 4];
      if (s === 0) { bass(g, t, root - 12, beat * 3.6, 0.15); iv.forEach(x => pad(g, t, root + 12 + x, beat * 3.8, 0.02, 800)); }
      if (s % 2 === 0) { const seq = [0, 1, 2, 3, 2, 1, 2, 3]; piano(g, t, root + 12 + iv[seq[(s / 2) % 8]], beat * 1.2, 0.09); }
      if (s % 4 === 0 && r() < 0.55) piano(g, t + beat * 0.02, this.scale[Math.floor(r() * this.scale.length)], beat * 2.2, 0.12);
    },
  },
};

// ── 연주 예약 (조금씩 앞서서 미리 예약) ──
function schedule() {
  if (!play || play.file) return;
  const tr = TRACKS[play.name], beat = 60 / tr.bpm, six = beat / 4;
  while (play.nextT < ctx.currentTime + 0.15) {
    const s = play.step % 16, bar = Math.floor(play.step / 16);
    if (s === 0 && bar % 4 === 0) play.r = rng(play.seed + bar);       // 네 마디마다 멜로디가 조금씩 바뀜
    const t = play.nextT + (s % 2 === 1 ? six * tr.swing : 0);
    try { tr.step(play.gain, t, bar, s, play.r, beat); } catch { /* 한 칸이 실패해도 계속 */ }
    play.nextT += six; play.step++;
  }
}

function startTrack(name) {
  const g = ctx.createGain(); g.gain.value = 0.0001; g.connect(master);
  g.gain.setTargetAtTime(1, ctx.currentTime, 0.6);
  const file = BGM_FILES[name];
  const p = { name, gain: g, step: 0, nextT: ctx.currentTime + 0.1, seed: Math.floor(Math.random() * 1e6), r: Math.random, file: null };
  if (file) {                                       // mp3 파일은 브라우저 기본 재생기로 (내 컴퓨터에서 열어도 됨)
    const el = new Audio(`assets/audio/${file}`);
    el.loop = true; el.volume = 0;
    p.file = el;
    el.onerror = () => { p.file = null; };          // 파일이 없으면 직접 만든 음악으로
    el.play().then(() => fadeEl(el, VOLUME * 1.6)).catch(() => {});
  }
  return p;
}
function fadeEl(el, to, ms = 1200) {
  const from = el.volume, t0 = performance.now();
  const f = () => { const k = Math.min(1, (performance.now() - t0) / ms); el.volume = Math.max(0, Math.min(1, from + (to - from) * k)); if (k < 1) requestAnimationFrame(f); else if (to === 0) el.pause(); };
  requestAnimationFrame(f);
}
function stopTrack(p) {
  if (!p) return;
  p.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
  if (p.file) fadeEl(p.file, 0);
  setTimeout(() => { try { p.gain.disconnect(); } catch { /* 이미 끊김 */ } }, 2500);
}

function sync() {
  if (!on || !want) { if (play) { stopTrack(play); play = null; cur = null; } return; }
  if (!ensure()) return;
  if (cur === want) return;
  stopTrack(play);
  play = startTrack(want); cur = want;
  if (!timer) timer = setInterval(schedule, 40);
}

export const bgm = {
  get on() { return on; },
  set(v) { on = !!v; sync(); },
  play(name) { want = name; sync(); },
};

// 탭을 숨기면 쉬고, 돌아오면 다시 연주
document.addEventListener("visibilitychange", () => {
  if (!ctx) return;
  if (document.hidden) ctx.suspend(); else if (on) ctx.resume();
});
// 브라우저가 소리를 막아 두었다면 첫 터치에서 다시 시작
document.addEventListener("pointerdown", () => { if (on && ctx && ctx.state === "suspended") ctx.resume(); }, { passive: true });
