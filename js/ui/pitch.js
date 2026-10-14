// 경기장 그리기: 경기 엔진의 경기장 시뮬레이션(engine/sim.js)이 기록한 장면(frames)을 그대로 재생합니다.
// 선수와 공의 움직임은 모두 시뮬레이션이 정하고, 여기서는 0.1초 간격의 기록 사이를 부드럽게 이어 그리기만 함.
// 좌표는 엔진 기준(우리 팀이 오른쪽 +x로 공격, 105×68). 후반 진영 교체는 그릴 때만 뒤집음
// frame: Float32Array [시뮬레이션 시각, 공 x, 공 y, 공 높이, 선수0 x, 선수0 y, 선수1 x, ...] (players와 같은 순서)

export function createPitch({ svg, players, dotEls, ballEl, shadowEl, calm = false }) {
  const N = players.length;
  // 처음 그릴 때 쓴 CSS 위치는 지우고 SVG transform 속성으로 (아이폰 사파리에서 더 부드러움)
  for (const p of players) { const el = dotEls[p.id]; if (el) el.style.transform = ""; }
  ballEl.style.transform = ""; shadowEl.style.transform = "";
  // 재생 배속: 보통도 실제 시간보다 조금 빠르게 (경기 하나가 3분 남짓)
  const SPEED = { normal: 1.35, fast: 3 };
  const S = { buf: [], i: 0, clock: 0, scale: SPEED.normal, flipped: false, dead: false, cur: null, onTime: null, paused: false, slow: 1 };
  let raf = 0, last = 0;

  // ── 그리기 ──
  const SX = x => (S.flipped ? 105 - x : x), SY = y => (S.flipped ? 68 - y : y);
  const put = (el, v) => { if (el._t !== v) { el._t = v; el.setAttribute("transform", v); } };
  const pos = new Float32Array(4 + N * 2);
  function render() {
    for (let k = 0; k < N; k++) {
      const el = dotEls[players[k].id];
      if (el) put(el, `translate(${SX(pos[4 + k * 2]).toFixed(2)} ${SY(pos[5 + k * 2]).toFixed(2)})`);
    }
    const x = SX(pos[1]), y = SY(pos[2]), z = pos[3];
    put(ballEl, `translate(${x.toFixed(2)} ${(y - z).toFixed(2)}) scale(${(1 + z * 0.06).toFixed(3)})`);
    put(shadowEl, `translate(${x.toFixed(2)} ${(y + 0.7).toFixed(2)}) scale(${Math.max(0.5, 1 - z * 0.07).toFixed(3)})`);
    const op = Math.max(0.25, 1 - z * 0.1).toFixed(2);
    if (shadowEl._o !== op) { shadowEl._o = op; shadowEl.setAttribute("opacity", op); }
  }
  // 시각 t의 모습 (앞뒤 기록 사이를 이어서)
  function sample(t) {
    const B = S.buf;
    if (!B.length) return;
    while (S.i < B.length - 1 && B[S.i + 1][0] <= t) S.i++;
    const a = B[S.i], b = B[Math.min(S.i + 1, B.length - 1)];
    const span = b[0] - a[0], u = span > 1e-6 ? Math.min(1, Math.max(0, (t - a[0]) / span)) : 1;
    for (let k = 0; k < pos.length; k++) pos[k] = a[k] + (b[k] - a[k]) * u;
  }

  function frame(now) {
    raf = 0;
    if (S.dead) return;
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now;   // 느린 휴대폰에서도 시간은 제대로 흐르게 (음수 방지)
    const end = S.buf.length ? S.buf[S.buf.length - 1][0] : 0;
    if (!S.paused && S.clock < end) {
      S.clock = Math.min(end, S.clock + dt * S.scale * (S.slow || 1));
      sample(S.clock);
      render();
    }
    S.onTime?.(S.clock, S.clock >= end - 1e-6);
    if (!document.hidden) raf = requestAnimationFrame(frame);
  }
  function wake() {
    if (S.dead || raf || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  const onVis = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else wake(); };
  document.addEventListener("visibilitychange", onVis);

  return {
    // 새로 굴린 경기장 기록을 이어 붙임 (오래된 기록은 버림)
    load(frames, cut = false) {
      if (!frames?.length) return;
      if (cut) { S.buf = []; S.i = 0; }                                  // 후반 시작처럼 이어지지 않는 장면
      if (S.buf.length > 600) { const cut = Math.max(0, S.i - 5); S.buf = S.buf.slice(cut); S.i -= cut; }
      if (!S.buf.length) { S.clock = frames[0][0]; for (let k = 0; k < pos.length; k++) pos[k] = frames[0][k]; render(); }
      for (const f of frames) S.buf.push(f);
      if (calm) { S.clock = S.buf[S.buf.length - 1][0]; S.i = S.buf.length - 1; sample(S.clock); render(); }   // 움직임 줄이기: 끝 모습으로 바로
      wake();
    },
    // 기록을 버리고 이 모습으로 바로 (결과만 보기 등)
    jump(f) { if (!f) return; S.buf = [f]; S.i = 0; S.clock = f[0]; for (let k = 0; k < pos.length; k++) pos[k] = f[k]; render(); },
    clock: () => S.clock,
    end: () => (S.buf.length ? S.buf[S.buf.length - 1][0] : 0),
    onTime(fn) { S.onTime = fn; wake(); },
    setSlow(v) { S.slow = v; },
    pause(v) { S.paused = v; },
    setSpeed(name) { S.scale = SPEED[name] || SPEED.normal; },
    // 후반 진영 교체: 잠깐 어두워졌다가 뒤집힌 채로 나타남 (순간이동처럼 보이지 않게)
    setFlip(v) {
      if (calm) { S.flipped = v; return render(); }
      svg.style.transition = "opacity .25s"; svg.style.opacity = "0";
      setTimeout(() => { S.flipped = v; render(); svg.style.opacity = "1"; }, 260);
    },
    ball() { return [pos[1], pos[2]]; },
    destroy() { S.dead = true; cancelAnimationFrame(raf); raf = 0; document.removeEventListener("visibilitychange", onVis); },
    render,
    _state: S,
  };
}
