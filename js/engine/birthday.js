// 생일 주간: 캐릭터를 만들 때 고른 생일이 들어 있는 주
// 그 주가 시작될 때 단톡방·부모님 축하 메시지와 함께 사기가 오르고 피로가 조금 풀림 (1년에 한 번)
import { YEAR } from "./calendar.js";
import { mail } from "../state.js";
import { chatText } from "./life.js";
import { pick } from "../rng.js";

const WEEKS = {};
for (const s of YEAR) WEEKS[s.month] = Math.max(WEEKS[s.month] || 0, s.week);

// 생일(일)이 그 달 몇째 주인지. 달력에 없는 5주차 등은 그 달 마지막 주로
export const birthdayWeekOf = b => (b ? { month: b.month, week: Math.min(Math.ceil(b.day / 7), WEEKS[b.month] || 4) } : null);

export function isBirthdayWeek(state, info) {
  const w = birthdayWeekOf(state.player.birthday);
  return !!(w && info && info.month === w.month && info.week === w.week);
}

const GROUP = {
  1: ["{mate}: 오늘 {name} 생일이래!!! 🎂\n\n{friend}: 생축생축 훈련 끝나고 매점 ㄱ\n\n{assistant}: 생일 축하한다. 훈련은… 그래도 똑같이 한다",
      "{friend}: 얘들아 오늘 {name} 생일임\n\n{mate2}: 헐 몰랐다 ㅋㅋ 축하해!!\n\n{mentor}: 막내 생일이네. 축하한다"],
  2: ["{junior}: {name} 형 생일 축하드려요!! 🎉\n\n{mate}: 선물은 오늘 패스 다섯 개로 대신함\n\n{mentor}: 축하한다. 저녁에 떡볶이 쏜다",
      "{mate2}: 🎂🎂🎂 {name} 생일\n\n{friend}: 작년에 케이크 얼굴에 맞은 거 기억나냐 ㅋㅋ\n\n{assistant}: 생일 축하한다. 미역국은 먹고 왔냐"],
  3: ["{junior}: 형 생일 축하드립니다!! 오늘 훈련 끝나고 다들 남으래요 🎉\n\n{friend}: 중학교 마지막 생일이다 크게 가자\n\n{coach}: 축하한다. 오늘 하루는 웃어라",
      "{mate}: 오늘 우리 {name} 생일 🎂\n\n{junior}: 형 축하드려요!!! 선물 사물함에 넣어 놨어요\n\n{assistant}: 축하한다. 3년 동안 생일마다 운동장에 있었구나"],
};

// 생일 주간이 시작될 때 한 번 (주가 넘어간 직후 week.js에서 부름)
export function birthdayWeek(state, info) {
  if (!isBirthdayWeek(state, info)) return false;
  const done = state.flags.bdayMail ||= [];
  if (done.includes(info.turn)) return false;
  done.push(info.turn);
  const p = state.player;
  p.condition.morale = Math.min(100, p.condition.morale + 8);
  p.condition.fatigue = Math.max(0, p.condition.fatigue - 8);
  const b = p.birthday;
  mail(state, "group", "생일 축하 🎂", chatText(state, pick(GROUP[info.grade] || GROUP[1])));
  mail(state, "mom", "생일 축하해", info.grade === 3
    ? `우리 아들, 중학생으로 맞는 마지막 생일이네. 미역국 끓여 놨어. 운동장에서 넘어져도 꼭 웃으면서 일어나는 사람이 되렴.`
    : pick(["생일 축하해, 우리 아들. 미역국 끓여 놨어. 늦게 와도 꼭 먹고 자.", "생일 축하해! 오늘은 일찍 와. 네가 좋아하는 갈비 재워 놨어."]));
  mail(state, "dad", `${b.month}월 ${b.day}일`, pick(["생일 축하한다. 새 축구화 끈 신발장 위에 올려 뒀다.", "축하한다. 아빠가 네 나이 때는 공이 하나뿐이었다. 너는 더 멀리 차라."]));
  return true;
}
