// 부상: 종류, 진단 메시지
import { mail } from "../state.js";
import { int, clamp } from "../rng.js";

export const INJURIES = {
  growingPains: { label: "성장통", weeks: [1, 2] },
  ankle:        { label: "발목 염좌", weeks: [2, 4] },
  hamstring:    { label: "햄스트링 부상", weeks: [3, 5] },
  knee:         { label: "무릎 부상", weeks: [6, 10] },
};

export function injure(state, type, cause = null) {
  const def = INJURIES[type];
  const weeks = int(def.weeks[0], def.weeks[1]);
  state.player.condition.injury = { type, weeksLeft: weeks, total: weeks };
  state.record.injuries = (state.record.injuries || 0) + 1;
  state.player.condition.morale = clamp(state.player.condition.morale - 10, 0, 100);
  const p = state.player;
  const why = cause ? cause : type === "growingPains" ? `이번 측정에서 키가 많이 컸다. 뼈가 자라는 속도를 근육이 못 따라가서 생기는 통증이다.`
    : `훈련 직전 피로가 ${Math.round(p.condition.fatigue)}이었다. 지친 상태에서는 다칠 확률이 크게 오른다.${p.traits.includes("glassBody") ? " 원래 몸이 약한 편이니 더 조심해야 한다." : ""}`;
  mail(state, "medical", `${def.label} 진단`,
    `예상 회복 기간 ${weeks}주.\n\n${why}\n\n그동안 개인훈련과 단체훈련은 할 수 없다. 재활 훈련 한 칸이면 회복이 1주 빨라진다. 남는 시간엔 공부나 독서로 학업을 챙겨 두자.`);
  return { type, label: def.label, weeks };
}

