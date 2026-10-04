// 게임 안 화면들: 홈, 선수, 팀, 일정, 메시지
import { ACTION_MAP } from "../../data/actions.js";
import { POSITIONS, GROWTH_TYPES, TRAITS, STAT_GROUPS, ROLES, EARNABLE } from "../../data/player.js";
import { STAFF, ROSTER } from "../../data/roster.js";
import { PHASES, MONTHS } from "../../data/calendar.js";
import { turnInfo, upcoming, yearTurns, label } from "../engine/calendar.js";
import { SLOTS, slotLocked } from "../engine/week.js";
import { INJURIES } from "../engine/injury.js";
import { sortTable, US, tierLabel, ensureSeason, stillScheduled } from "../engine/season.js";
import { HIGH_SCHOOLS } from "../../data/world.js";
import { ovr, depthChart, activeRoster, mateGrade } from "../engine/team.js";
import { efficiency, conditionOf } from "../engine/growth.js";
import { SIGNATURE } from "../../data/match.js";
import { STAT_LABEL } from "../../data/player.js";
import { esc, img, faceOf, fl, stars, gauge, statLevel, AVATAR } from "./util.js";
import { getPath } from "../rng.js";
import { REL_ROLES, rivalGap, captainScore } from "../engine/relations.js";
import { isBirthdayWeek } from "../engine/birthday.js";
import { blessedThisTerm } from "../engine/events.js";
import { goalProgress } from "../engine/goals.js";
import { jnFixture, JN_WEEK } from "../engine/jn.js";

const ACADEMIC_ALERT = [
  null,
  ["gold", "학업 경고 중. 학업이 40을 넘으면 풀립니다."],
  ["gold", "학부모 상담까지 했습니다. 학업 30 아래."],
  ["", "대회 출전 제한. 학업이 20을 넘어야 하계·동계대회에 나갈 수 있습니다."],
  ["", "공식 경기 출전 정지. 학업이 10을 넘어야 합니다."],
];

// FC 시리즈 느낌의 선수 카드: 종합 능력치, 포지션, 얼굴, 여섯 가지 대표 능력치
const avg = (...v) => v.reduce((a, b) => a + b, 0) / v.length;
export function sixStats(p) {
  const t = p.stats.tech, h = p.stats.phys;
  return [["속도", avg(h.speed, h.agility)], ["슈팅", t.shoot], ["패스", avg(t.pass, t.cross)],
    ["드리블", avg(t.dribble, t.firstTouch)], ["수비", t.defense], ["체격", avg(h.strength, h.stamina, h.jump)]];
}
export function cardTier(o) { return o >= 75 ? "hero" : o >= 64 ? "gold" : o >= 50 ? "silver" : "bronze"; }

export function fcCard(state, { big = false } = {}) {
  const p = state.player;
  const o = fl(ovr(p));
  const role = ROLES.find(r => r.id === p.role);
  return `<div class="fccard t-${cardTier(o)} ${big ? "big" : ""}" aria-label="선수 카드">
    <div class="fc-shine" aria-hidden="true"></div>
    <div class="fc-top">
      <div class="fc-ovr num">${o}</div>
      <div class="fc-pos">${p.position}</div>
      <img class="fc-crest" src="assets/img/logo.png" alt="">
      ${state.flags.captain ? `<div class="fc-cap" title="주장">C</div>` : ""}
    </div>
    <div class="fc-face">${img(faceOf(p, state.calendar.grade), `${p.name} 얼굴`)}</div>
    <div class="fc-name">${esc(p.name)}</div>
    <div class="fc-stats">${sixStats(p).map(([k, v]) => `<div><b class="num">${fl(v)}</b><span>${k}</span></div>`).join("")}</div>
    <div class="fc-foot"><span class="num">#${p.number}</span><span>${GROWTH_TYPES[p.growthType].label}</span>${role ? `<span>${role.label}</span>` : ""}</div>
  </div>`;
}
export const jerseyCard = state => `<section class="cardwrap">${fcCard(state)}
  <div class="card-under"><span title="코치 평가">잠재력 ${stars(state.player.coachStars)}</span></div></section>`;

// 다음 경기 타일
function shield(name) {
  const ch = / 대표$/.test(name) ? name.slice(0, 1) : name.replace(/^(서울|경기|부산|대구|인천|울산|강원|충북|제주|여수|순천|광양|목포|보성|해남|완도|광주|남해안)\s?/, "").slice(0, 1);
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const hue = h % 360;
  return `<svg class="shield" viewBox="0 0 40 46" aria-hidden="true"><path d="M20 2 L37 8 V24 C37 35 29 41 20 44 C11 41 3 35 3 24 V8 Z" fill="hsl(${hue} 55% 38%)" stroke="hsl(${hue} 60% 70%)" stroke-width="1.5"/>
    <text x="20" y="29" text-anchor="middle">${esc(ch)}</text></svg>`;
}
function nextMatchTile(state) {
  let info = null, k = 0;
  for (let i = 0; i < 10; i++) {
    const x = turnInfo(state, i); if (!x) break;
    const jf = jnFixture(state, x);                    // 전남 대표 소년체전이 먼저 오면 그걸 보여 줌
    if (jf) return `<section class="tile next cup">
      <div class="nm-head"><span class="eyebrow">NEXT MATCH · 전남 대표</span><span class="nm-when">${i === 0 ? "이번 주" : `${i}주 뒤`}</span></div>
      <div class="nm-teams">
        <div class="nm-team">${shield("전남 대표")}<b>전남 대표</b></div>
        <span class="nm-vs">VS</span>
        <div class="nm-team">${shield(jf.opponent.name)}<b>${esc(jf.opponent.name)}</b></div>
      </div>
      <div class="nm-comp">전국소년체전, ${esc(jf.round)}<span>${x.month}월 ${x.week}주차</span></div>
    </section>`;
    if (x.match && stillScheduled(state, x)) { info = x; k = i; break; }
  }
  if (!info) return `<section class="tile next empty"><span class="eyebrow">NEXT MATCH</span><p class="mute">당분간 경기가 없습니다. 몸을 만들 시간입니다.</p></section>`;
  const locked = k === 0 ? slotLocked(state, "we") : null;
  let opp = locked?.fx?.opponent?.name;
  if (!opp && info.match.comp === "league") {
    ensureSeason(state, info);
    const pair = state.league?.rounds?.[info.leagueRound]?.find(x => x.includes(US));
    opp = pair && state.league.teams.find(t => t.id === (pair[0] === US ? pair[1] : pair[0]))?.name;
  }
  if (!opp && (info.match.comp === "summer" || info.match.comp === "winter") && info.match.stage === "group" && state.tour?.key === `${info.grade}-${info.match.comp}`) opp = state.tour.group[1 + state.tour.groupPlayed]?.name;
  opp ||= info.match.comp === "hs" ? "고등학교 팀" : "상대 미정";
  const when = k === 0 ? "이번 주말" : `${k}주 뒤`;
  return `<section class="tile next ${info.comp.tournament ? "cup" : ""}">
    <div class="nm-head"><span class="eyebrow">NEXT MATCH</span><span class="nm-when">${when}</span></div>
    <div class="nm-teams">
      <div class="nm-team"><img src="assets/img/logo.png" alt=""><b>고흥FC</b></div>
      <span class="nm-vs">VS</span>
      <div class="nm-team">${shield(opp)}<b>${esc(opp)}</b></div>
    </div>
    <div class="nm-comp">${info.comp.label}${info.match.round ? `, ${esc(info.match.round)}` : info.leagueRound != null ? `, ${info.leagueRound + 1}라운드` : ""}<span>${info.month}월 ${info.week}주차</span></div>
  </section>`;
}

function conditionPanel(state) {
  const p = state.player;
  const s = p.stats.student;
  const inj = p.condition.injury;
  const alert = ACADEMIC_ALERT[state.flags.academicLevel];
  const c = conditionOf(p);
  const mp = Math.round(c.match * 100);
  return `<section class="panel">
    <h2>컨디션 <span class="cond ${c.cls}">${c.label} ${Math.round(c.score)}</span></h2>
    <p class="cond-note">훈련 효율 <b class="num">${Math.round(c.train * 100)}%</b>, 경기 선택 성공률 <b class="num ${mp > 0 ? "up" : mp < 0 ? "down" : ""}">${mp > 0 ? "+" : ""}${mp}%p</b></p>
    <div class="gauges">
      ${gauge("피로", p.condition.fatigue, { invert: true })}
      ${gauge("사기", p.condition.morale)}
      ${gauge("감독 신뢰", state.relations.coach)}
      ${gauge("학업", s.academic)}
      ${gauge("생활태도", s.attitude)}
    </div>
    ${inj ? `<div class="alert">🩹 ${INJURIES[inj.type].label}, 복귀까지 약 ${Math.max(1, Math.ceil(inj.weeksLeft))}주. 훈련 대신 재활과 학교생활만 할 수 있습니다.</div>` : ""}
    ${p.condition.fatigue >= 85 ? `<div class="alert">피로 ${Math.round(p.condition.fatigue)}. 이대로면 감독님이 다음 공식 경기에서 선발로 안 쓰고 후반에 넣습니다. 다칠 확률도 크게 오릅니다.</div>`
      : p.condition.fatigue >= 50 ? `<div class="alert gold">피로가 쌓였습니다. 30을 넘으면 훈련 효율이, 40을 넘으면 경기 후반 집중력이 떨어집니다. 수면이나 가족 시간이 피로를 가장 많이 풉니다.</div>` : ""}
    ${alert ? `<div class="alert ${alert[0]}">📚 ${alert[1]}</div>` : ""}
  </section>`;
}

function weekPanel(state, opts = {}) {
  const eff = Math.round(efficiency(state) * 100);
  return `<section class="panel">
    <h2>이번 주 <small>훈련 효율 ${eff}%</small>
      <button class="linkbtn mg-toggle" data-mgtoggle aria-pressed="${!!opts.minigame}">🎮 미니게임 ${opts.minigame ? "ON" : "OFF"}</button>
      ${state.lastPlan ? `<button class="linkbtn right" data-repeat>지난주처럼</button>` : ""}</h2>
    <div class="slots">${SLOTS.map(s => {
      const locked = slotLocked(state, s.id);
      if (locked) {
        const fx = locked.fx;
        return `<div class="slot locked"><span class="when">${s.label}</span>
          <span><span class="what">⚽ vs ${esc(fx.opponent.name)}</span>
          <span class="hint">${fx.compLabel}${fx.round ? ` ${esc(fx.round)}` : ""}${fx.school ? `. ${esc(fx.school.coach)} 관전` : ""}</span></span><span></span></div>`;
      }
      const a = ACTION_MAP[state.plan[s.id]];
      return `<button class="slot ${a ? "filled" : ""}" data-slot="${s.id}">
        <span class="when">${s.label}</span>
        <span>${a ? `<span class="what"><span class="ic">${a.icon}</span>${a.label}</span>` : `<span class="what mute">행동 고르기</span>`}</span>
        <span class="chev" aria-hidden="true">›</span></button>`;
    }).join("")}</div>
  </section>`;
}

// 이미 탈락한 대회의 토너먼트 주간은 일정에서 뺍니다

function upcomingPanel(state) {
  const list = [];
  for (let k = 0; k < 8; k++) { const i = turnInfo(state, k); if (!i) break; if ((i.match && stillScheduled(state, i)) || i.exam || i.school.some(d => !d.hidden) || jnFixture(state, i)) list.push(i); }
  return `<section class="panel"><h2>다가오는 일정</h2>
    ${list.length ? list.map(i => `<div class="fixture"><span class="d">${i.month}월 ${i.week}주</span><span>
      ${jnFixture(state, i) ? `<span class="chip kit">전국소년체전</span>전남 대표` : ""}
      ${i.match && stillScheduled(state, i) ? `<span class="chip ${i.comp.tournament ? "kit" : i.match.comp === "hs" ? "gold" : "turf"}">${i.comp.label}</span>${i.match.round || (i.leagueRound != null ? `${i.leagueRound + 1}라운드` : "")}` : ""}
      ${i.exam ? `<span class="chip gold">시험</span>${i.exam.name}` : ""}
      ${i.school.filter(d => !d.hidden).map(d => `<span class="chip">학교</span>${d.label}`).join(" ")}
    </span></div>`).join("") : `<p class="mute">당분간 경기와 시험이 없습니다. 훈련에 집중할 때입니다.</p>`}
  </section>`;
}

function mailPreview(state) {
  const unread = state.inbox.filter(m => !m.read);
  const list = [...unread, ...state.inbox.filter(m => m.read)].slice(0, 4);
  return `<section class="panel mailbox ${unread.length ? "has-new" : ""}">
    <h2>메시지 ${unread.length ? `<span class="newbadge">새 메시지 ${unread.length}</span>` : ""}<button class="linkbtn right" data-go="inbox">전체 보기</button></h2>
    ${list.length ? list.map(m => mailRow(m, state)).join("") : `<p class="mute">아직 메시지가 없습니다.</p>`}</section>`;
}

// 보낸 사람 얼굴: 감독·코치·선생님·부모님은 인물 그림, 선수는 그 선수 얼굴, 단톡방은 엠블럼
const FACE_BY_NAME = Object.fromEntries(ROSTER.map(r => [r.name, r.face]));
function avatarOf(m) {
  const map = { [STAFF.coach]: "npc_coach", [STAFF.assistant]: "npc_assistant", [STAFF.teacher]: "npc_teacher", "엄마": "npc_mom", "아빠": "npc_dad" };
  const face = map[m.from] || FACE_BY_NAME[m.from];
  if (face) return img(face, "");
  if (m.kind === "group") return `<img src="assets/img/logo.png" alt="">`;
  return AVATAR[m.kind] || "💬";
}
const ago = (m, state) => {
  if (!state) return "";
  const d = state.calendar.turn - m.turn;
  return d <= 1 ? "이번 주" : `${d}주 전`;
};

export function mailRow(m, state) {
  const preview = String(m.body || "").replace(/\s+/g, " ").slice(0, 46);
  return `<button class="mail ${m.read ? "" : "unread"}" data-mail="${m.id}">
    <span class="av" aria-hidden="true">${avatarOf(m)}</span>
    <span class="mb"><span class="fr"><b>${esc(m.from)}</b><span class="ago">${ago(m, state)}</span></span>
      <span class="t">${esc(m.title)}</span><span class="pv">${esc(preview)}${String(m.body || "").length > 46 ? "…" : ""}</span></span></button>`;
}

function depthPanel(state) {
  const d = depthChart(state);
  return `<section class="panel"><h2>${POSITIONS[state.player.position].label} 주전 경쟁 <small>${d.slots}자리</small></h2>
    <table class="tbl"><thead><tr><th>순위</th><th>선수</th><th class="r">OVR</th></tr></thead><tbody>
    ${d.list.slice(0, Math.max(d.slots + 2, d.rank)).map((x, i) => `<tr class="${x.me ? "me" : ""}">
      <td class="num">${i + 1}${i < d.slots ? " ⚽" : ""}</td><td>${x.number}. ${esc(x.name)}</td><td class="r num">${fl(x.ovr)}</td></tr>`).join("")}
    </tbody></table>
    <p class="mute" style="font-size:12px;margin:8px 0 0">선발은 능력치와 감독 신뢰도로 정해집니다.</p></section>`;
}

export function leagueTable(state, compact = false) {
  const lg = state.league;
  if (!lg) return `<p class="mute">주말리그는 3월 2주차에 시작합니다.</p>`;
  const rows = sortTable(lg.table);
  return `<table class="tbl"><thead><tr><th>#</th><th>팀</th><th class="r">경기</th>${compact ? "" : `<th class="r">승</th><th class="r">무</th><th class="r">패</th><th class="r">득실</th>`}<th class="r">승점</th></tr></thead><tbody>
    ${rows.map((r, i) => `<tr class="${r.id === US ? "us" : ""}"><td class="num">${i + 1}</td><td>${esc(r.name)}</td><td class="r num">${r.p}</td>
      ${compact ? "" : `<td class="r num">${r.w}</td><td class="r num">${r.d}</td><td class="r num">${r.l}</td><td class="r num">${r.gf - r.ga > 0 ? "+" : ""}${r.gf - r.ga}</td>`}
      <td class="r num pts">${r.pts}</td></tr>`).join("")}</tbody></table>`;
}

function tourBlock(state) {
  const t = state.tour;
  if (!t) return `<p class="mute">아직 출전한 대회가 없습니다. 하계대회는 7월, 동계대회는 1월입니다.</p>`;
  const rows = sortTable(t.table);
  return `<p style="margin:0 0 8px"><b>${esc(t.name)}</b> <span class="chip ${t.champion ? "gold" : t.alive ? "turf" : ""}">${t.champion ? "우승" : t.alive ? (t.stage === "ko" ? (t.best.endsWith("진출") ? t.best : `${t.best} 진출`) : "조별리그 중") : t.best}</span></p>
    <table class="tbl"><thead><tr><th>#</th><th>조별리그</th><th class="r">경기</th><th class="r">득실</th><th class="r">승점</th></tr></thead><tbody>
    ${rows.map((r, i) => `<tr class="${r.id === US ? "us" : ""}"><td class="num">${i + 1}</td><td>${esc(r.name)}</td><td class="r num">${r.p}</td><td class="r num">${r.gf - r.ga > 0 ? "+" : ""}${r.gf - r.ga}</td><td class="r num pts">${r.pts}</td></tr>`).join("")}
    </tbody></table>
    ${t.log.length ? `<h3 style="font-size:13px;color:var(--mute);margin:14px 0 4px">경기 기록</h3>${t.log.map(l => `<div class="fixture"><span class="d">${esc(l.round)}</span><span>vs ${esc(l.opponent)} <b class="num">${l.gf}:${l.ga}</b>${l.shootoutWin != null ? ` (승부차기 ${l.shootoutWin ? "승" : "패"})` : ""}</span></div>`).join("")}` : ""}`;
}

function compPanel(state) {
  const info = turnInfo(state);
  const inTour = info && (info.phase === "summer" || info.phase === "winter") && state.tour?.key?.startsWith(`${info.grade}-`);
  if (inTour) return `<section class="panel"><h2>${esc(state.tour.label)}</h2>${tourBlock(state)}</section>`;
  const lg = state.league;
  return `<section class="panel"><h2>주말리그 순위 ${lg ? `<small>${lg.half}${lg.finished ? " 최종" : ` ${lg.played}/${lg.rounds.length}라운드`}</small>` : ""}
    <button class="linkbtn right" data-go="team">자세히</button></h2>${leagueTable(state, true)}</section>`;
}

// 나의 목표 (중2부터)
function goalsPanel(state) {
  const list = goalProgress(state);
  const main = list.find(g => g.main);
  return `<section class="panel goals"><h2>나의 목표 <small>${main ? `가장 이루고 싶은 목표: ${esc(main.label)}` : "3월 3주 감독님 면담에서 정함"}</small></h2>
    <ul class="goal-list">${list.map(g => `<li class="${g.state} ${g.main ? "is-main" : ""}">
      <span class="gi" aria-hidden="true">${g.icon}</span>
      <div class="gb"><div class="gt">${esc(g.label)}${g.main ? ` <span class="chip kit">목표</span>` : ""}${g.state === "done" ? ` <span class="chip ok">달성</span>` : g.state === "fail" ? ` <span class="chip">아쉽게 실패</span>` : ""}</div>
      <div class="gs mute">${g.state === "done" ? esc(g.desc) : esc(g.text)}</div></div></li>`).join("")}</ul></section>`;
}

export function homeView(state, opts = {}) {
  // 휴대폰에서는 다음 경기 → 카드 → 이번 주 → 컨디션 → 순위 → 메시지 → 경쟁 순서 (css .home)
  return `<div class="cols home">
    <div class="colwrap"><div class="o2">${jerseyCard(state)}</div><div class="o4">${conditionPanel(state)}</div><div class="o7">${depthPanel(state)}</div></div>
    <div class="colwrap"><div class="o1">${nextMatchTile(state)}</div><div class="o3">${weekPanel(state, opts)}</div>
      <div class="advance o3b"><button class="btn btn-kit btn-go" data-advance><span>이번 주 진행</span></button></div>
      <div class="o5">${compPanel(state)}</div>${state.calendar.grade >= 2 ? `<div class="o5g">${goalsPanel(state)}</div>` : ""}<div class="o6">${mailPreview(state)}</div><div class="o8">${upcomingPanel(state)}</div></div>
  </div>`;
}

// ── 선수 ────────────────────────────
export function playerView(state, tab = "stats") {
  const p = state.player;
  const keys = Object.keys(POSITIONS[p.position].weights);
  let body = "";
  if (tab === "stats") {
    body = `<div class="statgrid">${STAT_GROUPS.map(g => `<div class="statgroup"><h3>${g.label}</h3>
      ${g.stats.map(([k, l]) => {
        const v = p.stats[g.id][k], from = state.yearStart.stats[g.id][k], d = fl(v) - fl(from);
        const key = keys.includes(`${g.id}.${k}`);
        return `<div class="srow ${key ? "key" : ""}"><span class="k">${l}</span>
          <div class="track"><div class="fill ${statLevel(v)}" style="width:${v}%"></div></div>
          <span class="v num">${fl(v)}</span>
          <span class="ch num ${d > 0 ? "up" : d < 0 ? "down" : "mute"}">${d > 0 ? `▲${d}` : d < 0 ? `▼${-d}` : "–"}</span></div>`;
      }).join("")}</div>`).join("")}</div>
      <p class="mute" style="font-size:12px;margin:12px 0 0">주황색 이름은 ${POSITIONS[p.position].label} 종합 능력치에 들어가는 능력치입니다. 화살표는 올해 3월 대비 변화입니다.</p>`;
  }
  if (tab === "body") {
    body = `<dl class="kv" style="margin-bottom:14px">
        <dt>키</dt><dd class="num">${p.body.height.toFixed(1)}cm</dd>
        <dt>몸무게</dt><dd class="num">${p.body.weight.toFixed(1)}kg</dd>
        <dt>주발</dt><dd>${p.foot === "L" ? "왼발" : "오른발"}</dd>
        ${p.birthday ? `<dt>생일</dt><dd>${p.birthday.month}월 ${p.birthday.day}일${isBirthdayWeek(state, turnInfo(state)) ? " 🎂 생일 주간" : ""}</dd>` : ""}
        <dt>성장 유형</dt><dd>${GROWTH_TYPES[p.growthType].label}</dd>
      </dl>
      <table class="tbl"><thead><tr><th>측정</th><th class="r">키</th><th class="r">몸무게</th></tr></thead><tbody>
      ${p.body.history.map(h => `<tr><td>${h.label}</td><td class="r num">${h.height.toFixed(1)}</td><td class="r num">${h.weight.toFixed(1)}</td></tr>`).join("")}
      </tbody></table>
      <p class="mute" style="font-size:12px;margin:10px 0 0">신체 측정은 매년 3월과 9월에 합니다.</p>`;
  }
  if (tab === "traits") {
    const earnedIds = new Set((state.record.earned || []).map(e => e.id));
    const locked = Object.entries({ ...Object.fromEntries(Object.entries(TRAITS).filter(([, t]) => t.earned)), ...EARNABLE })
      .filter(([id]) => !p.traits.includes(id));
    body = p.traits.map(t => `<div style="margin-bottom:12px"><span class="trait ${TRAITS[t].good ? "good" : "bad"}">${TRAITS[t].label}</span>${earnedIds.has(t) ? ` <span class="chip kit">획득</span>` : ""}
      <div class="mute" style="font-size:14px">${TRAITS[t].desc}</div></div>`).join("") +
      `<h3 style="font-size:14px;margin:18px 0 6px">얻을 수 있는 특성 <small class="mute">조건을 채우면 특성이 생기고 능력치도 오릅니다</small></h3>
       <div class="sigs">${locked.map(([id, x]) => `<div class="sig"><span class="sn">☆ ${esc(TRAITS[id].label)}</span><span class="sr">${esc(x.how)}</span></div>`).join("")}</div>` +
      `<h3 style="font-size:14px;margin:18px 0 6px">경기 특기 <small class="mute">능력치가 기준을 넘으면 경기에서 선택지가 생깁니다</small></h3>
       <div class="sigs">${Object.entries(SIGNATURE).filter(([id]) => sigPos(id).includes(p.position)).map(([id, sg]) => {
         const okAll = Object.entries(sg.requires).every(([k, v]) => getPath(p.stats, k) >= v);
         return `<div class="sig ${okAll ? "on" : ""}"><span class="sn">${okAll ? "★" : "☆"} ${esc(sg.label)}</span>
           <span class="sr">${Object.entries(sg.requires).map(([k, v]) => `${STAT_LABEL[k]} <b class="num ${getPath(p.stats, k) >= v ? "up" : ""}">${Math.floor(getPath(p.stats, k))}</b>/${v}`).join(", ")}</span></div>`;
       }).join("")}</div>` +
      `<div style="margin-top:16px"><div class="mute" style="font-size:13px">코치 평가 (잠재력 추정)</div>${stars(p.coachStars)}
       <p class="mute" style="font-size:12px">코치님의 눈도 가끔 틀립니다. 매년 3월에 다시 평가합니다.</p></div>`;
  }
  if (tab === "record") {
    const r = state.record;
    const avg = r.ratings.length ? (r.ratings.reduce((a, b) => a + b, 0) / r.ratings.length).toFixed(2) : "–";
    const last = r.matches.filter(m => m.rating != null).slice(-5);
    body = `<dl class="kv" style="margin-bottom:14px">
        <dt>출전</dt><dd class="num">${r.apps}경기 (선발 ${r.starts})</dd>
        <dt>득점</dt><dd class="num">${r.goals}골</dd>
        <dt>도움</dt><dd class="num">${r.assists}개</dd>
        <dt>평균 평점</dt><dd class="num">${avg}</dd>
        <dt>최근 폼</dt><dd><div class="form">${last.length ? last.map(m => {
          const c = m.rating >= 7.5 ? "var(--turf)" : m.rating >= 6.5 ? "var(--gold)" : "var(--red)";
          return `<span style="background:${c};color:#0D1433">${m.rating.toFixed(1)}</span>`; }).join("") : `<span class="mute" style="width:auto">기록 없음</span>`}</div></dd>
      </dl>
      <table class="tbl"><thead><tr><th>날짜</th><th>대회</th><th>상대</th><th class="r">결과</th><th class="r">평점</th></tr></thead><tbody>
      ${r.matches.slice().reverse().slice(0, 30).map(m => {
        const t = turnInfo({ calendar: { turn: m.turn } });
        return `<tr><td class="num">${t ? `중${t.grade} ${t.month}/${t.week}` : ""}</td><td>${m.comp}</td><td>${esc(m.opponent)}</td>
        <td class="r num">${m.gf}:${m.ga}</td><td class="r num">${m.rating != null ? m.rating.toFixed(1) : `<span class="mute">${m.status === "bench" ? "벤치" : "–"}</span>`}</td></tr>`; }).join("")}
      </tbody></table>`;
  }
  const tabs = [["stats", "능력치"], ["body", "신체"], ["traits", "특성"], ["record", "기록"]];
  return `<div class="cols">
    <div>${jerseyCard(state)}</div>
    <section class="panel">
      <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" data-ptab="${k}" aria-selected="${tab === k}">${l}</button>`).join("")}</div>
      ${body}
    </section></div>`;
}

function sigPos(id) {
  return { fw_1v1: ["FW"], fw_through: ["FW"], fw_cross: ["FW"], mf_press: ["MF"], mf_space: ["MF"], mf_defend: ["MF"],
    df_1v1: ["DF"], df_cross: ["DF"], df_corner: ["DF"], freekick: ["FW", "MF"] }[id] || [];
}

// ── 팀 ──────────────────────────────
export function teamView(state, tab = "league") {
  const tabs = [["rel", "관계"], ["league", "리그"], ["tour", "대회"], ["scout", "진학"], ["squad", "선수단"]];
  let body = "";
  if (tab === "rel") {
    const P = state.relations.people || {};
    const word = v => v >= 85 ? "절친" : v >= 70 ? "가까움" : v >= 45 ? "보통" : v >= 25 ? "서먹함" : "불편함";
    const rivalWord = v => v >= 70 ? "불꽃 튀는 사이" : v >= 45 ? "신경 쓰이는 사이" : "아직은 덤덤";
    const g = state.calendar.grade;
    const tv = state.relations.teacher ?? 50;
    const teacherCard = `<div class="rel">
        <div class="rel-face">${img("npc_teacher", STAFF.teacher)}</div>
        <div class="rel-main">
          <div class="rel-head"><span class="rel-ic">📒</span><b>${esc(STAFF.teacher)}</b><span class="mute">담임, 국어</span></div>
          <div class="rel-bar"><div class="track"><div class="fill" style="width:${tv}%"></div></div><span class="num">${Math.round(tv)}</span><span class="mute">${word(tv)}</span></div>
          <p class="rel-desc">시험 성적, 수업 태도, 학교 행사에서의 선택에 따라 관계가 달라지고, 졸업식 날 받는 편지도 바뀝니다. 70 이상이면 학기마다 한 번 '류봉두의 축복'이 찾아옵니다${blessedThisTerm(state) ? " (이번 학기 받음 ✨)" : ""}.</p>
        </div></div>`;
    body = `<h2>관계</h2><div class="rels">${teacherCard}${Object.entries(REL_ROLES).map(([k, r]) => {
      const x = P[k];
      if (!x) return `<div class="rel empty"><div class="rel-head"><span class="rel-ic">${r.icon}</span><b>${r.label}</b></div>
        <p class="mute">${k === "junior" ? "중2가 되면 후배가 생깁니다." : "지금은 없습니다."}</p></div>`;
      const gap = k === "rival" ? rivalGap(state) : null;
      return `<div class="rel">
        <div class="rel-face">${img(x.face, x.name)}</div>
        <div class="rel-main">
          <div class="rel-head"><span class="rel-ic">${r.icon}</span><b>${esc(x.name)}</b><span class="mute">${r.label}, ${x.position}</span></div>
          <div class="rel-bar"><div class="track"><div class="fill" style="width:${x.value}%"></div></div><span class="num">${Math.round(x.value)}</span><span class="mute">${k === "rival" ? rivalWord(x.value) : word(x.value)}</span></div>
          <p class="rel-desc">${r.desc}</p>
          ${gap != null ? `<p class="rel-desc">종합 능력치 차이 <b class="num ${gap >= 0 ? "up" : "down"}">${gap > 0 ? "+" : ""}${gap}</b>${Math.abs(gap) <= 5 ? " · 라이벌 효과 켜짐 (훈련 효율 +5%)" : ""}</p>` : ""}
        </div></div>`;
    }).join("")}</div>
    ${g === 3 ? `<p class="mute" style="font-size:13px;margin:12px 0 0">${state.flags.captain ? "🟧 주장 완장을 차고 있습니다." : state.flags.captainVoted ? "주장 선거가 끝났습니다." : `3월 2주차에 주장 선거가 있습니다. 지금 지지도 ${Math.round(captainScore(state))} (손을 들었을 때 66 이상이면 당선)`}</p>`
      : `<p class="mute" style="font-size:13px;margin:12px 0 0">중3 3월에 주장 선거가 있습니다. 감독 신뢰, 팀워크, 생활태도, 관계가 모두 반영됩니다.</p>`}`;
  }
  if (tab === "league") {
    const lg = state.league;
    const past = state.record.leagues;
    body = `<h2>주말리그 ${lg ? `<small>${lg.grade}학년 ${lg.half}${lg.finished ? " 최종 순위" : ` ${lg.played}/${lg.rounds.length}라운드`}</small>` : ""}</h2>
      <div style="overflow-x:auto">${leagueTable(state)}</div>
      <p class="mute" style="font-size:12px;margin:8px 0 0">${lg ? lg.teams.length : 10}팀이 한 번씩 맞붙습니다. 이기면 3점, 비기면 1점.</p>
      ${past.length ? `<h2 style="margin-top:20px">지난 리그</h2>${past.map(l => `<div class="fixture"><span class="d">중${l.grade} ${l.half}</span><span>${l.rank === 1 ? "🏆 우승" : `${l.rank}위`}</span></div>`).join("")}` : ""}`;
  }
  if (tab === "tour") {
    const r = state.record;
    body = `<h2>전국대회</h2>${tourBlock(state)}
      ${r.tournaments.length ? `<h2 style="margin-top:20px">대회 성적</h2>${r.tournaments.map(t => `<div class="fixture"><span class="d">중${t.grade} ${esc(t.name)}</span><span>${t.best === "우승" ? "🏆 우승" : esc(t.best)}</span></div>`).join("")}` : ""}
      ${r.titles.length ? `<h2 style="margin-top:20px">우승 기록</h2>${r.titles.map(t => `<div class="fixture"><span class="d">중${t.grade}</span><span>🏆 ${esc(t.name)}</span></div>`).join("")}` : ""}`;
  }
  if (tab === "scout") {
    const seen = HIGH_SCHOOLS.filter(h => state.scouting[h.id]);
    body = `<h2>진학 관심도</h2>
      <p class="mute" style="font-size:14px;margin-top:0">고등학교 팀과의 진학 연습경기에서 활약하면 그 학교의 관심이 커집니다. 중3 4월과 6월에 꼭 열리고, 중2 2학기에도 가끔 잡힙니다.</p>
      ${seen.length ? seen.map(h => { const sc = state.scouting[h.id]; return `<div class="interest">
        <span>${esc(h.name)}<br><small class="mute">${tierLabel(h.tier)}${sc.offered ? ` <span class="chip kit">입학 제안</span>` : ""}</small></span>
        <div class="track"><div class="fill" style="width:${sc.interest}%"></div></div><span class="num r">${Math.round(sc.interest)}</span></div>`; }).join("")
      : `<p class="mute">아직 고등학교 감독님이 경기를 보러 온 적이 없습니다.</p>`}`;
  }
  if (tab === "squad") {
    const g = state.calendar.grade;
    const roster = activeRoster(state).map(m => ({ ...m, g: mateGrade(m, g) }));
    const me = state.player;
    const rows = [...roster, { name: me.name, number: me.number, position: me.position, ovrNow: ovr(me), g, me: true }]
      .sort((a, b) => b.g - a.g || ["FW", "MF", "DF"].indexOf(a.position) - ["FW", "MF", "DF"].indexOf(b.position) || b.ovrNow - a.ovrNow);
    body = `<h2>고흥FC U-15 <small>${rows.length}명</small></h2>
      <table class="tbl"><thead><tr><th>번호</th><th>이름</th><th>학년</th><th>포지션</th><th class="r">OVR</th></tr></thead><tbody>
      ${rows.map(r => `<tr class="${r.me ? "me" : ""}"><td class="num">${r.number}</td><td>${esc(r.name)}</td><td>중${r.g}</td>
        <td><span class="pos-tag ${r.position}">${r.position}</span></td><td class="r num">${fl(r.ovrNow)}</td></tr>`).join("")}
      </tbody></table>
      <p class="mute" style="font-size:12px;margin:10px 0 0">선수 명단은 data/roster.js 파일에서 바꿀 수 있습니다.</p>`;
  }
  return `<div class="cols"><div>${depthPanel(state)}</div>
    <section class="panel">
      <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" data-ttab="${k}" aria-selected="${tab === k}">${l}</button>`).join("")}</div>
      ${body}
    </section></div>`;
}

// ── 일정 ────────────────────────────
export function scheduleView(state, grade = state.calendar.grade) {
  const turns = yearTurns(grade);
  const now = state.calendar.turn;
  const byMonth = MONTHS.map(m => ({ ...m, weeks: turns.filter(t => t.month === m.month && turnInfo({ calendar: { turn: t.turn } })) }))
    .filter(m => m.weeks.length);
  return `<section class="panel">
    <div class="tabs" role="tablist">${[1, 2, 3].map(g => `<button role="tab" data-sgrade="${g}" aria-selected="${g === grade}">중${g}</button>`).join("")}</div>
    ${byMonth.map(m => `<div class="month"><h3>${m.month}월 <span class="chip ${PHASES[m.phase].color === "orange" ? "kit" : PHASES[m.phase].color === "pitch" ? "turf" : ""}">${PHASES[m.phase].label}</span></h3>
      ${m.weeks.map(t => {
        const info = turnInfo({ calendar: { turn: t.turn } });
        const cls = t.turn === now ? "now" : t.turn < now ? "past" : "";
        const items = [];
        if (info.match) items.push(`<span class="chip ${info.comp.tournament ? "kit" : info.match.comp === "hs" ? "gold" : "turf"}">${info.comp.label}</span>${info.match.round || (info.leagueRound != null ? `${info.leagueRound + 1}라운드` : info.match.hsChance?.[grade] ? (info.match.elemChance?.[grade] ? "고교·초등 팀일 수도" : "고교 팀일 수도") : "")}`);
        if (state.jnCup?.grade === grade && t.month === JN_WEEK.month && t.week === JN_WEEK.week && (state.jnCup.alive || state.jnCup.medal)) items.push(`<span class="chip kit">전국소년체전</span>전남 대표${state.jnCup.medal ? ` (${{ gold: "금메달", silver: "은메달", bronze: "동메달", first: "1회전" }[state.jnCup.medal]})` : ""}`);
        if (info.exam) items.push(`<span class="chip gold">시험</span>${info.exam.name}`);
        if (t.week === 1 && (t.month === 3 || t.month === 9)) items.push(`<span class="chip">측정</span>신체 측정`);
        for (const d of info.school.filter(d => !d.hidden)) items.push(`<span class="chip">학교</span>${d.label}`);
        if (info.vacation && !info.school.length && !info.match) items.push(`<span class="mute">${info.vacation.label}</span>`);
        return `<div class="week ${cls}"><span class="num">${t.week}주차</span><span>${items.join(" ") || `<span class="mute">훈련</span>`}</span></div>`;
      }).join("")}</div>`).join("")}
  </section>`;
}

export function inboxView(state) {
  const unread = state.inbox.filter(m => !m.read).length;
  return `<section class="panel inbox" style="max-width:720px;margin:0 auto;width:100%"><h2>메시지</h2>
    <div class="inbox-bar"><span class="mute">${unread ? `안 읽은 메시지 <b class="num">${unread}</b>개` : "모두 읽었습니다"}</span>
    <button class="btn btn-sm btn-ghost" data-readall ${unread ? "" : "disabled"}>모두 읽음</button></div>
    ${state.inbox.map(m => mailRow(m, state)).join("") || `<p class="mute">아직 받은 메시지가 없습니다.</p>`}</section>`;
}

export { label };
