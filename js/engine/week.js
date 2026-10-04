// 한 주 진행: 행동 → 경기 → 시험 → 부상 → 학업 체크 → 다음 주
import { ACTION_MAP } from "../../data/actions.js";
import { STAT_GROUPS } from "../../data/player.js";
import { turnInfo, label, GRAD_INDEX } from "./calendar.js";
import { applyGain, expandGains, growBody, weeklyDrift, hasTrait } from "./growth.js";
import { matchFor } from "./season.js";
import { prepareMatch, autoPlay, finishMatch } from "./match.js";
import { previewChat, weeklyAdvice, drillFor } from "./advice.js";
import { adjustRel, weeklyRelations, relationsNewYear, rivalGap, seniorsLeave } from "./relations.js";
import { rollEvent } from "./events.js";
import { goalsWeekly } from "./goals.js";
import { birthdayWeek } from "./birthday.js";
import { careerMilestones } from "./career.js";
import { STAT_LABEL, POSITIONS } from "../../data/player.js";
import { getPath } from "../rng.js";
import { ovr, ageRoster, activeRoster, mateGrade, roleFor, randomFreeNumber, freeNumbers, depthChart } from "./team.js";
import { mail, snapshotStats } from "../state.js";
import { CAPTAINS, STAFF } from "../../data/roster.js";
import { INJURIES, injure } from "./injury.js";
import { checkTraits } from "./traits.js";
const _bat = w => { const c = String(w).charCodeAt(String(w).length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; };

import { normal, chance, clamp, int, weighted, range } from "../rng.js";

export const SLOTS = [
  { id: "wd1", label: "평일 1" },
  { id: "wd2", label: "평일 2" },
  { id: "we",  label: "주말" },
];


export function actionAllowed(state, action) {
  if (action.needs && !state.relations.people?.[action.needs]) return { ok: false, reason: "아직 없음" };
  const injured = !!state.player.condition.injury;
  if (action.injured === "block" && injured) return { ok: false, reason: "부상 중" };
  if (action.injured === "only" && !injured) return { ok: false, reason: "부상 중에만" };
  if (action.schoolOnly && turnInfo(state)?.vacation) return { ok: false, reason: "방학 중" };
  return { ok: true };
}

// 이번 주 경기 (탈락한 대회 주간은 null)
export function currentFixture(state) {
  const info = turnInfo(state);
  return info ? matchFor(state, info) : null;
}

export function slotLocked(state, slotId) {
  if (slotId !== "we") return null;
  const fx = currentFixture(state);
  return fx ? { fx, info: turnInfo(state) } : null;
}

export function planReady(state) {
  return SLOTS.every(s => slotLocked(state, s.id) || state.plan[s.id]);
}

function academicLevel(v) {
  if (v < 10) return 4; if (v < 20) return 3; if (v < 30) return 2; if (v < 40) return 1; return 0;
}

// 경기까지 자동으로 처리하는 한 주 (자동 시뮬레이션용)
export function runWeek(state) {
  const ctx = beginWeek(state);
  let result = null;
  for (let fx = ctx.fx; fx;) {
    const m = prepareMatch(state, ctx.info, fx);
    autoPlay(state, m);
    result = finishMatch(state, m);
    const nx = fx.jn && result.result === "승" ? currentFixture(state) : null;   // 소년체전은 이기면 같은 주에 다음 경기
    fx = nx?.jn ? nx : null;
  }
  return endWeek(state, ctx, result);
}

// 1부: 평일·주말 행동 반영. 경기가 있으면 ctx.fx에 상대가 담깁니다
export function beginWeek(state) {
  const p = state.player;
  const info = turnInfo(state);
  const before = snapshotStats(state);
  const coachBefore = state.relations.coach;
  const report = { info, title: label(info), actions: [], match: null, exam: null, injury: null,
                   recovered: false, body: null, yearEnd: null, graduation: false, mails: [] };
  const mailStart = state.inbox.length;

  // 1. 행동
  const chosenSlots = SLOTS.filter(s => !slotLocked(state, s.id) && ACTION_MAP[state.plan[s.id]]).map(s => ({ slot: s.id, a: ACTION_MAP[state.plan[s.id]] }));
  const chosen = chosenSlots.map(x => x.a);
  let risk = 0, didSchool = false, didTeam = false, rehab = 0, sprint = false;
  const gap = rivalGap(state);
  const rivalMult = gap != null && Math.abs(gap) <= 5 ? 1.05 : 1;
  const camp = info.camp;                              // 합숙 훈련 주간
  if (camp) report.camp = true;
  for (const { slot, a } of chosenSlots) {
    if (!actionAllowed(state, a).ok) continue;
    const mg = state.planMult?.[slot] ?? 1;          // 미니게임 결과 배율
    const campMult = camp && (a.cat === "personal" || a.cat === "team") ? 1.2 : 1;
    const studyMult = a.cat === "school" && hasTrait(p, "scholar") ? 1.2 : 1;
    for (const [path, base] of Object.entries(expandGains(state, a.gains))) applyGain(state, path, base, { mult: mg * rivalMult * campMult * studyMult });
    if (a.rel) for (const [k, v] of Object.entries(a.rel)) adjustRel(state, k, v);
    p.condition.fatigue = clamp(p.condition.fatigue + (a.fatigue || 0) * (camp && a.fatigue > 0 ? 1.25 : 1), 0, 100);
    p.condition.morale = clamp(p.condition.morale + (a.morale || 0), 0, 100);
    if (a.coach) state.relations.coach = clamp(state.relations.coach + a.coach, 0, 100);
    if (a.academicLoss) p.stats.student.academic = clamp(p.stats.student.academic - a.academicLoss, 0, 100);
    risk += a.risk || 0;
    if (a.cat === "school") didSchool = true;
    if (a.cat === "team") didTeam = true;
    if (a.heal) rehab += a.heal;
    if (a.id === "sprint") sprint = true;
    report.actions.push(a.label);
  }

  report.minigames = state.planMult || null;
  state.planMult = null;
  state.history ||= [];
  state.history.push({ turn: info.turn, acts: chosen.map(a => a.id) });
  if (state.history.length > 12) state.history.shift();
  const fx = currentFixture(state);
  return { info, fx, report, before, coachBefore, mailStart, chosen, risk, didSchool, didTeam, rehab, sprint };
}

// 2부: 경기 결과를 받아 시험·부상·학업·다음 주 처리
export function endWeek(state, ctx, matchResult) {
  const p = state.player;
  const { info, report, before, coachBefore, mailStart, chosen, didSchool, didTeam, rehab, sprint } = ctx;
  let risk = ctx.risk;
  if (matchResult) {
    report.match = matchResult;
    risk += 0.006 * (matchResult.minutes / 70);       // 경기 중 부상은 경기 안에서 따로 판정
    // 경기 경험: 뛴 시간만큼 포지션 능력치가 조금 오름 (주말 훈련 대신 경기를 뛴 몫)
    if (matchResult.minutes > 0) for (const [path, base] of Object.entries(expandGains(state, { position: 0.15 * matchResult.minutes / 70 }))) applyGain(state, path, base);
  }

  // 3. 시험
  if (info.exam) report.exam = runExam(state, info, chosen);

  // 4. 자연 변화와 특성
  weeklyDrift(state, didSchool);
  weeklyRelations(state);
  const att = p.stats.student.attitude;
  if (att >= 70) state.relations.coach += 0.2;
  if (att < 40) state.relations.coach -= 0.5;
  if (!didTeam && !matchResult) state.relations.coach -= 0.3;
  state.relations.coach += (50 - state.relations.coach) * 0.025;
  if (hasTrait(p, "inconsistent")) p.condition.morale += normal(0, 6);
  if (hasTrait(p, "slump") && chance(0.06)) {
    p.condition.morale -= 15;
    mail(state, "system", "괜히 다 안 되는 한 주", "공이 발에 안 붙는다. 이유는 모르겠다. 슬럼프인가…");
  }
  // 학업 80 이상: 감독님 신뢰와 집중력이 조금씩 오르고, 오래 지키면 '모범생' 특성
  if (p.stats.student.academic >= 80) {
    state.relations.coach += 0.15;
    applyGain(state, "mental.focus", 0.04, { raw: true });
    state.flags.acad80Weeks = (state.flags.acad80Weeks || 0) + 1;
  }
  if (hasTrait(p, "modelStudent")) state.relations.coach += 0.1;
  if (hasTrait(p, "steelMental")) p.condition.morale = Math.max(p.condition.morale, 30);
  if (hasTrait(p, "comeback")) p.condition.morale = Math.max(p.condition.morale, 25);
  p.condition.morale = clamp(p.condition.morale, 0, 100);
  p.condition.fatigue = clamp(p.condition.fatigue - 8, 0, 100);
  state.relations.coach = clamp(state.relations.coach, 0, 100);

  // 5. 부상
  const inj = p.condition.injury;
  if (inj) {
    state.record.injuryWeeks = (state.record.injuryWeeks || 0) + 1;
    inj.weeksLeft -= 1 + rehab;
    if (inj.weeksLeft <= 0) {
      p.condition.injury = null;
      report.recovered = true;
      if (inj.total >= 6) { state.flags.comebackReady = true; state.flags.returnTurn = state.calendar.turn + 1; }
      mail(state, "medical", `${INJURIES[inj.type].label} 회복`, "훈련에 복귀해도 좋다는 소견이 나왔다. 처음 일주일은 무리하지 말 것.");
    }
  } else if (matchResult?.injury) {
    const mi = matchResult.injury;
    report.injury = injure(state, mi.type, `${mi.minute}분, ${mi.cause} 피로가 쌓여 있을수록 경기 중 부상 위험도 커진다.`);
  } else {
    const r = risk * 0.32 * (1 + p.condition.fatigue / 40) * (hasTrait(p, "glassBody") ? 1.8 : 1) * (hasTrait(p, "comeback") ? 0.8 : 1);
    if (chance(r)) report.injury = injure(state, weighted([["ankle", 0.55], ["hamstring", sprint ? 0.6 : 0.3], ["knee", 0.15]]));
  }

  // 6. 학업 단계
  checkAcademics(state);
  const newTraits = checkTraits(state);
  if (newTraits.length) report.traits = newTraits;

  // 7. 다음 주로
  state.plan = { wd1: null, wd2: null, we: null };
  state.calendar.turn++;
  const next = turnInfo(state);
  if (!next) {
    state.finished = true;
    report.graduation = true;
  } else {
    if (next.grade !== info.grade) report.yearEnd = yearTransition(state, info.grade);
    else if (next.index === GRAD_INDEX + 1) graduateSeniors(state, info.grade);   // 졸업식 다음 주: 3학년 선배들이 떠남
    state.calendar.grade = next.grade;
    state.calendar.semester = next.semester;
    const k = growthIndex(next);
    if (k !== null) {
      const g = growBody(state, k);
      report.body = g;
      if (g.growingPains && !p.condition.injury) {
        report.injury = injure(state, "growingPains");
      }
      roleMail(state);
    }
  }

  if (!state.finished) {
    state.career ||= {};
    careerMilestones(state, next);
    birthdayWeek(state, next);
    goalsWeekly(state, next);
    rollEvent(state);
    weeklyAdvice(state, report);
    const nfx = currentFixture(state);
    if (nfx) previewChat(state, nfx);              // 경기 분석은 경기 직전 미팅 장면에서
  }

  report.deltas = diffStats(before.stats, state.player.stats);
  report.coachDelta = state.relations.coach - coachBefore;
  report.mails = state.inbox.slice(0, state.inbox.length - mailStart);
  return report;
}

function growthIndex(info) {
  if (info.week !== 1) return null;
  if (info.month === 9) return (info.grade - 1) * 2;
  if (info.month === 3 && info.grade > 1) return (info.grade - 1) * 2 - 1;
  return null;
}

function runExam(state, info, chosen) {
  const s = state.player.stats.student;
  const studied = chosen.some(a => a.id === "study" || a.id === "assessment");
  if (info.exam.free) {
    applyGain(state, "student.attitude", studied ? 1.5 : 0.3, { raw: true });
    mail(state, "teacher", info.exam.name,
      studied ? "모둠 발표 준비를 성실하게 해 왔더구나. 칭찬한다." : "수행평가 제출물이 조금 아쉬웠어. 다음엔 미리 준비하자.");
    return { name: info.exam.name, free: true };
  }
  const score = clamp(s.academic + normal(0, 6) + (studied ? 5 : 0) + (hasTrait(state.player, "scholar") ? 4 : 0), 0, 100);
  const tier = score >= 85 ? "상위권" : score >= 70 ? "중상위권" : score >= 55 ? "중위권" : score >= 40 ? "중하위권" : "하위권";
  if (score >= 70) state.relations.coach = clamp(state.relations.coach + 1, 0, 100);
  if (score >= 85) state.record.topExams = (state.record.topExams || 0) + 1;
  state.relations.teacher = clamp((state.relations.teacher ?? 50) + (score >= 70 ? 3 : score < 40 ? -2 : 0) + (studied ? 1 : 0), 0, 100);
  state.lastExam = { tier: score >= 85 ? "상위권" : score >= 70 ? "중상위권" : score >= 55 ? "중위권" : score >= 40 ? "중하위권" : "하위권", score, turn: state.calendar.turn };
  const comment = {
    상위권: "축구하면서 이 성적이면 정말 대단하다. 부모님께서도 기뻐하시겠구나.",
    중상위권: "운동과 공부를 잘 챙기고 있구나. 지금처럼만 하자.",
    중위권: "나쁘지 않아. 조금만 더 하면 한 단계 올라갈 수 있겠다.",
    중하위권: "훈련으로 피곤한 건 알지만, 수업 시간엔 집중하자.",
    하위권: "성적이 많이 걱정된다. 감독님과도 이야기를 나눠 봐야겠어.",
  }[tier];
  const rank = Math.max(1, Math.round((100 - score) / 100 * 28));
  mail(state, "teacher", `${info.exam.name} 결과: ${tier}`,
    `평균 ${Math.round(score)}점, 반에서 28명 중 ${rank}등 정도야.\n\n${comment}\n\n${studied ? "시험 주에 공부한 게 점수에 보였어." : "시험 주에 공부하는 모습을 한 번도 못 봤어. 하루만 책을 폈어도 5점은 더 나왔을 거야."}${score >= 70 ? "\n\n감독님께도 말씀드렸어. 좋아하시더라." : ""}`);
  return { name: info.exam.name, tier, score: Math.round(score) };
}

function checkAcademics(state) {
  const v = state.player.stats.student.academic;
  const lv = academicLevel(v);
  const prev = state.flags.academicLevel;
  if (lv === prev) return;
  state.flags.academicLevel = lv;
  if (lv > prev) {
    if (lv >= 1 && prev < 1) { state.relations.coach -= 2;
      mail(state, "coach", "학업 경고", "담임 선생님께 연락을 받았다. 성적이 계속 떨어지고 있다는구나. 이번 주부터 공부 시간도 챙겨라. 경고다."); }
    if (lv >= 2 && prev < 2) { state.relations.coach -= 2; state.player.condition.morale -= 10;
      mail(state, "mom", "선생님이랑 상담했어", "오늘 학교 가서 담임 선생님이랑 감독님 만나고 왔어. 축구 계속하려면 공부도 놓으면 안 된대. 엄마도 걱정돼."); }
    if (lv >= 3 && prev < 3)
      mail(state, "coach", "대회 출전 제한", "학업 성적이 기준에 못 미친다. 성적이 오를 때까지 대회(하계·동계)에는 데려갈 수 없다.");
    if (lv >= 4 && prev < 4)
      mail(state, "coach", "공식 경기 출전 정지", "주말리그를 포함한 모든 공식 경기에 나설 수 없다. 지금은 공부가 먼저다.");
  } else {
    mail(state, "coach", "성적이 올랐구나", lv === 0
      ? "학업 경고를 풀겠다. 운동도 공부도 이렇게만 하자."
      : "조금씩 나아지고 있다. 제한 하나를 풀어 주마. 계속 노력해라.");
  }
  state.relations.coach = clamp(state.relations.coach, 0, 100);
  state.player.condition.morale = clamp(state.player.condition.morale, 0, 100);
}

const josaWord = (w, a, b) => { const c = w.charCodeAt(w.length - 1); return w + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? a : b); };

function roleMail(state) {
  const role = roleFor(state);
  state.player.role = role.id;
  const p = state.player;
  const d = depthChart(state);
  const lines = {
    key: "지금 팀에서 네가 제일 믿음직하다. 그만큼 책임감도 가져라.",
    starter: "이번 학기 주전으로 생각하고 있다. 자리는 지키는 게 더 어렵다.",
    rotation: "주전과 교체를 오갈 거다. 훈련에서 보여 주면 기회는 온다.",
    prospect: "아직 1학년이다. 서두르지 말고 기본기를 쌓아라.",
    reserve: "지금은 출전 기회가 적을 거다. 포기하지 말고 버텨라.",
  };
  const keys = Object.keys(POSITIONS[p.position].weights);
  const weak = keys.slice().sort((x, y) => getPath(p.stats, x) - getPath(p.stats, y))[0];
  const drill = drillFor(weak);
  const last = d.list[d.slots - 1];
  const gap = last ? last.ovr - ovr(p) : 0;
  const body = [lines[role.id],
    d.rank <= d.slots ? "네 자리는 지금 네 거다. 다만 뒤에서 쫓아오는 발소리도 들어라."
      : gap > 8 ? "앞에 선 선수들과는 아직 거리가 있다. 조급해하지 말고, 하루하루 쌓아라."
      : "선발까지 그리 멀지 않다. 한 학기면 충분히 따라잡을 수 있는 거리다.",
    `이번 학기엔 ${josaWord(STAT_LABEL[weak], "을", "를")} 채워 와라. 네 자리에서 지금 제일 아쉬운 부분이다.${drill ? ` ${josaWord(drill.label, "이", "가")} 도움이 될 거다.` : ""}`];
  mail(state, "coach", `이번 학기 역할: ${role.label}`, body.join("\n\n"));
}

function graduateSeniors(state, g) {
  const leaving = state.team.roster.filter(m => mateGrade(m, g) === 3).map(m => m.name);
  (state.flags.gradMail ||= {})[g] = true;
  if (leaving.length) mail(state, "group", "선배들이 졸업했습니다",
    `${leaving.join(", ")} ${leaving.length > 1 ? "선배들이" : "선배가"} 졸업했다. 고등학교에 가서도 잘할 거다.\n동계대회부터는 선배들 없이 뛴다. 남긴 자리는 이제 우리가 채워야 한다.`);
  seniorsLeave(state, g);
}

function yearTransition(state, oldGrade) {
  const p = state.player;
  const summary = {
    grade: oldGrade,
    ovrFrom: null, ovrTo: Math.round(ovr(p)),
    heightFrom: state.yearStart.height, heightTo: p.body.height,
    matches: state.record.matches.filter(m => m.grade === oldGrade && m.minutes > 0).length,
    goals: state.record.matches.filter(m => m.grade === oldGrade).reduce((s, m) => s + m.goals, 0),
  };
  const fake = { ...p, stats: state.yearStart.stats };
  summary.ovrFrom = Math.round(ovr(fake));

  if (oldGrade === 1) {
    const off = state.record.matches.filter(m => m.grade === 1 && m.official);
    const starts = off.filter(m => m.status === "start").length;
    state.flags.wasBenchInG1 = off.length > 0 && starts / off.length < 0.3;
  }

  state.calendar.grade = oldGrade + 1;
  ageRoster(state);
  relationsNewYear(state);
  const leaving = state.team.roster.filter(m => mateGrade(m, oldGrade) === 3).map(m => m.name);
  const joining = state.team.roster.filter(m => mateGrade(m, oldGrade + 1) === 1 && m.cohort !== "동기").map(m => m.name);

  if (leaving.length && !state.flags.gradMail?.[oldGrade]) mail(state, "group", "선배들이 졸업했습니다",
    `${leaving.join(", ")} ${leaving.length > 1 ? "선배들이" : "선배가"} 졸업했다. 고등학교에 가서도 잘할 거다.\n선배들이 남긴 번호와 자리는 이제 우리가 채워야 한다.`);
  if (joining.length) mail(state, "group", "신입생이 들어왔습니다",
    `새 1학년 ${joining.join(", ")} 입단! 이제 너도 선배다. 잘 챙겨 줘라.`);

  if (oldGrade + 1 === 2) {
    p.number = randomFreeNumber(state, 13, 29);
    p.numberHistory.push({ grade: 2, number: p.number });
    mail(state, "coach", `2학년 등번호: ${p.number}번`, `2학년은 13번부터 29번 사이에서 번호를 준다. 올해 너는 ${p.number}번이다.`);
  } else if (oldGrade + 1 === 3) {
    state.pending = { type: "number" };
    mail(state, "coach", "3학년 등번호를 골라라", "이제 3학년이다. 원하는 번호를 골라 와라. 다만 7번, 9번, 10번은 탐내는 녀석이 많을 거다.");
  }

  // 코치 재평가
  const est = p.potential + normal(0, 3);
  p.coachStars = clamp(Math.round(((est - 55) / 7) * 2) / 2, 1, 5);

  const ms = state.record.matches.filter(m => m.grade === oldGrade && m.rating != null);
  const best = ms.slice().sort((a, b) => b.rating - a.rating)[0];
  const avg = ms.length ? (ms.reduce((a, m) => a + m.rating, 0) / ms.length).toFixed(2) : null;
  const tours = state.record.tournaments.filter(t => t.grade === oldGrade).map(t => `${t.name} ${t.best}`).join(", ");
  const lg = state.record.leagues.filter(l => l.grade === oldGrade).map(l => `${l.half} ${l.rank}위`).join(", ");
  const grow = summary.ovrTo - summary.ovrFrom;
  mail(state, "coach", `중${oldGrade} 시즌 총평`, [
    grow >= 15 ? "1년 사이에 다른 선수가 됐다. 3월에 처음 봤을 때랑 지금은 공 받는 자세부터 다르다."
      : grow >= 8 ? "꾸준히 늘었다. 눈에 확 띄진 않아도, 뒤돌아보면 많이 왔다."
      : "생각보다 덜 늘었다. 열심히 안 했다는 게 아니라, 방향을 한번 돌아보자는 얘기다.",
    best ? `올해 제일 기억에 남는 건 ${best.opponent}전이다. 그날 너는 정말 좋았다.` : "올해는 경기장보다 훈련장에서 더 많은 걸 배웠을 거다.",
    (() => { const ls = state.record.leagues.filter(l => l.grade === oldGrade); if (!ls.length) return "";
      if (ls.some(l => l.rank === 1)) return "리그 우승도 했다. 그 순간은 오래 기억해라. 다만 내년엔 다들 우리를 잡으러 온다.";
      const avgR = ls.reduce((a, l) => a + l.rank, 0) / ls.length;
      return avgR <= 3 ? "팀으로도 좋은 한 해였다. 위에서 버티는 것도 실력이다." : "팀으로도 쉽지 않은 한 해였다. 그래도 끝까지 같이 뛰었다."; })(),
    oldGrade === 1 ? "이제 후배가 들어온다. 선배가 된다는 건 책임이 생긴다는 뜻이다." : "이제 3학년이다. 진학이 걸린 해다. 고등학교 감독님들이 경기를 보러 오실 거다.",
  ].filter(Boolean).join("\n\n"));
  if (oldGrade === 1 && CAPTAINS?.[2]) {
    mail(state, "group", "새 시즌, 새 주장",
      `${STAFF.coach}: 올해 주장은 ${CAPTAINS[2]}${_bat(CAPTAINS[2]) ? "이다" : "다"}. 다들 박수.\n\n주장 ${CAPTAINS[2]}: 작년 선배들만큼은 못해도, 우리 학년은 절대 안 무너진다. 2학년들도 이제 선배다. 후배들 잘 챙겨라.`);
  }

  state.yearStart = snapshotStats(state);
  return summary;
}

// 3학년 등번호 고르기. 인기 번호는 동기와 경쟁
export const POPULAR = [7, 9, 10];
export function numberChoices(state) { return freeNumbers(state, 1, 99); }

export function chooseNumber(state, n) {
  const p = state.player;
  if (POPULAR.includes(n)) {
    const taken = state.pending?.takenBy || [];      // 이미 다른 번호를 가져간 동기는 빼고
    const rivals = activeRoster(state).filter(m => m.cohort === "동기" && !taken.includes(m.id)).sort((a, b) => b.ovrNow - a.ovrNow);
    const rival = rivals[0];
    if (rival) {
      const tried = state.pending?.tried || [];
      if (tried.includes(n)) return { ok: false, msg: `${n}번은 이미 ${state.pending?.owners?.[n] || rival.name}에게 넘어갔다.` };
      const pWin = clamp(0.5 + (ovr(p) - rival.ovrNow) / 20 + (state.relations.coach - 50) / 100, 0.15, 0.9);
      if (!chance(pWin)) {
        rival.number = n;                              // 그 동기가 실제로 그 번호를 달게 됨
        state.pending = { type: "number", tried: [...tried, n], takenBy: [...taken, rival.id], owners: { ...(state.pending?.owners || {}), [n]: rival.name } };
        mail(state, "group", `${n}번 쟁탈전`, `${rival.name}도 ${n}번을 원했다. 감독님은 ${rival.name}의 손을 들어 주셨다.`);
        return { ok: false, msg: `${rival.name}도 ${n}번을 원했고, 감독님은 ${rival.name}의 손을 들어 주셨습니다. 다른 번호를 골라 주세요.` };
      }
      mail(state, "group", `${n}번 쟁탈전`, `${rival.name}도 ${n}번을 노렸지만, 감독님은 ${p.name}에게 ${n}번을 맡기셨다.`);
    }
  }
  p.number = n;
  p.numberHistory.push({ grade: 3, number: n });
  if (n === 10) state.flags.wore10 = true;
  state.pending = null;
  return { ok: true, msg: `올해 등번호는 ${n}번입니다.` };
}

function diffStats(a, b) {
  const out = [];
  for (const g of STAT_GROUPS) for (const [k, l] of g.stats) {
    const d = b[g.id][k] - a[g.id][k];
    if (Math.abs(d) >= 0.05) out.push({ path: `${g.id}.${k}`, label: l, from: a[g.id][k], to: b[g.id][k], d });
  }
  return out.sort((x, y) => Math.abs(y.d) - Math.abs(x.d));
}
