// 경기장 그리기: 경기 엔진의 경기장 시뮬레이션(engine/sim.js)이 기록한 장면(frames)을 그대로 재생합니다.
// 선수와 공의 움직임은 모두 시뮬레이션이 정하고, 여기서는 0.1초 간격의 기록 사이를 부드럽게 이어 그리기만 함.
// 좌표는 엔진 기준(우리 팀이 오른쪽 +x로 공격, 105×68). 후반 진영 교체는 그릴 때만 뒤집음
// frame: Float32Array [시뮬레이션 시각, 공 x, 공 y, 공 높이, 선수0 x, 선수0 y, 선수1 x, ..., 공 가진 선수 번호(-1 없음)] (players와 같은 순서)

export function createPitch({ svg, players, dotEls, ballEl, shadowEl, trailEl = null, calm = false }) {
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
    // 공 가진 선수: 엔진이 기록한 선수(프레임 맨 끝)의 고리를 밝히고 이름을 띄움. 이름은 공이 떠난 뒤 0.6초 더 보임(원터치 패스도 읽히게). 나는 '나' 표시가 있어 이름은 뺌
    const hk = S.buf.length ? Math.round(S.buf[S.i][4 + N * 2] ?? -1) : -1;
    if (hk !== hasK) {
      if (hasK >= 0) dotEls[players[hasK].id]?.classList.remove("has");
      if (hk >= 0 && hk < N) {
        const el = dotEls[players[hk].id];
        if (el) { el.classList.add("has"); if (nameK >= 0 && nameK !== hk) dotEls[players[nameK].id]?.classList.remove("hold");
          const nm = el.querySelector(".nm"); if (nm && !players[hk].me) { nm.textContent = players[hk].name || ""; el.classList.add("hold"); nameK = hk; } else nameK = -1; }
      } else nameOff = S.clock + 0.6;
      hasK = hk;
    }
    if (hasK < 0 && nameK >= 0 && (S.clock >= nameOff || S.clock < nameOff - 0.7)) { dotEls[players[nameK].id]?.classList.remove("hold"); nameK = -1; }
    // 공 꼬리: 빠르게 날아가는 공(패스·슈팅) 뒤에 0.28초 동안 지나온 길을 옅게
    if (trailEl) {
      const by = y - z, lastT = trail.length ? trail[trail.length - 1] : null;
      if (lastT && (S.clock < lastT[2] || Math.hypot(x - lastT[0], by - lastT[1]) > 6)) trail.length = 0;   // 이어지지 않는 장면(진영 교체·건너뛰기)
      if (!lastT || S.clock > lastT[2]) trail.push([x, by, S.clock]);
      while (trail.length && trail[0][2] < S.clock - 0.28) trail.shift();
      let d = "", o = "0";
      if (trail.length > 2) {
        const a = trail[0], dt = S.clock - a[2], sp = dt > 0.05 ? Math.hypot(x - a[0], by - a[1]) / dt : 0;
        if (sp > 13) { d = "M" + trail.map(q => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join("L"); o = Math.min(0.5, 0.15 + (sp - 13) / 40).toFixed(2); }
      }
      if (trailEl._d !== d) { trailEl._d = d; trailEl.setAttribute("d", d); }
      if (trailEl._o !== o) { trailEl._o = o; trailEl.setAttribute("opacity", o); }
    }
  }
  let hasK = -1, nameK = -1, nameOff = 0; const trail = [];
  // 시각 t의 모습 (앞뒤 기록 사이를 이어서)
  function sample(t) {
    const B = S.buf;
    if (!B.length) return;
    while (S.i < B.length - 1 && B[S.i + 1][0] <= t) S.i++;
    const a = B[S.i], b = B[Math.min(S.i + 1, B.length - 1)];
    const span = b[0] - a[0], u = span > 1e-6 ? Math.min(1, Math.max(0, (t - a[0]) / span)) : 1;
    for (let k = 0; k < 4; k++) pos[k] = a[k] + (b[k] - a[k]) * u;
    // 선수: 앞뒤 기록까지 써서 곡선으로 이음 → 방향이 바뀔 때 꺾이지 않고 부드럽게 (0.1초에 2.5m 넘게 움직인 순간이동은 직선)
    const a0 = B[Math.max(0, S.i - 1)], b1 = B[Math.min(B.length - 1, S.i + 2)], u2 = u * u, u3 = u2 * u;
    for (let k = 4; k < pos.length; k++) {
      const p1 = a[k], p2 = b[k], d = p2 - p1;
      if (d > 2.5 || d < -2.5 || Math.abs(p1 - a0[k]) > 2.5 || Math.abs(b1[k] - p2) > 2.5) { pos[k] = p1 + d * u; continue; }
      const m1 = (p2 - a0[k]) * 0.5, m2 = (b1[k] - p1) * 0.5;
      pos[k] = (2 * u3 - 3 * u2 + 1) * p1 + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2 + (u3 - u2) * m2;
    }
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
