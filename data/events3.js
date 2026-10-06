// 이야기 줄기 이벤트: 라이벌 3년, 부모님 장면, 고흥 이야기
// date: [[월, 주]] 그 주에 반드시 / trigger: 상황이 맞으면 반드시 / when.grades: 학년
// 문장 안의 {rival} {friend} {mentor} {junior} {teacher} {coach} {name} {given}은 자동으로 바뀝니다.

import { turnInfo } from "../js/engine/calendar.js";
import { rivalGap, person } from "../js/engine/relations.js";

const marked = (s, k, gap = 0) => s.marks?.[k] != null && s.calendar.turn - s.marks[k] >= gap;   // 예전 선택 기억
const bat = w => { const c = String(w).charCodeAt(String(w).length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; };
const bond = (s, bonus, line, weeks = 0) => { s.flags.bond = { bonus, line, until: s.calendar.turn + weeks }; };
const lastMatch = s => { const m = s.record.matches.at(-1); return m && m.turn === s.calendar.turn - 1 ? m : null; };
const samePos = s => person(s, "rival")?.position === s.player.position;
const gapText = (s, ahead, close, behind) => { const g = rivalGap(s); return g == null ? close : g >= 4 ? ahead : g <= -4 ? behind : close; };

export const EVENTS_STORY = [
  // ── 라이벌 3년 ────────────────────────────────
  { id: "r_meet", needs: "rival", once: true, date: [[4, 1]], when: { grades: [1] }, bg: "ev_rival", who: "rival",
    text: s => (samePos(s) ? "훈련이 끝난 운동장. 같은 학년, 같은 자리에서 뛰는 {rival|이/가} 공을 발로 굴리며 다가온다." : "훈련이 끝난 운동장. 같은 학년 {rival|이/가} 공을 발로 굴리며 다가온다. 자리는 달라도 훈련 때마다 눈이 마주치는 녀석이다.") + " \"너 초등학교 어디 나왔냐? 나는 네 경기 본 적 있다. 그때도 잘하더라. …지금은 내가 더 잘하지만.\"",
    choices: [
      { label: "\"두고 보면 알겠지\" 하고 웃는다", fx: { s: { "mental.competitive": 0.8 }, rel: { rival: 3 } },
        result: "{rival|이/가} 피식 웃었다. 그날 이후로 운동장에서 서로를 의식하지 않는 날이 없었다." },
      { label: "같이 남아서 슈팅 내기를 하자고 한다", fx: { s: { "tech.shoot": 0.5 }, fatigue: 3, rel: { rival: 5 } },
        result: "열 개 차서 6 대 6. 해가 질 때까지 끝이 안 났다. \"내일 다시 해.\" 그 말을 누가 먼저 했는지 기억이 안 난다." },
      { label: "대꾸하지 않고 공을 챙겨 나간다", fx: { s: { "mental.focus": 0.5 }, rel: { rival: -2 } },
        result: "등 뒤에서 {rival|이/가} 혀를 차는 소리가 들렸다. 말보다 훈련으로 답하기로 했다." },
    ] },
  { id: "r_g1_end", needs: "rival", once: true, date: [[2, 3]], when: { grades: [1] }, bg: "bg_locker", who: "rival",
    text: s => `1학년 마지막 동계훈련. 코치님이 체력 측정 결과를 벽에 붙이셨다. ${gapText(s,
      "내 이름이 {rival}보다 위에 있다. {rival|이/가} 한참 그 종이를 보다가 말없이 나간다.",
      "내 이름 바로 옆에 {rival}의 이름이 있다. 기록 차이는 소수점 하나다.",
      "{rival}의 이름이 나보다 한참 위에 있다. {rival|이/가} 내 어깨를 툭 치고 지나간다.")}`,
    choices: [
      { label: "{rival}에게 2학년 때 다시 붙자고 말한다", fx: { s: { "mental.competitive": 1 }, morale: 2, rel: { rival: 4 } },
        result: "\"1년 동안 네 등만 보고 뛰었다.\" {rival|이/가} 그렇게 말하고는 먼저 웃었다. 나도 그랬다." },
      { label: "종이를 사진으로 찍어 둔다", fx: { s: { "mental.focus": 0.8 } },
        result: "휴대폰 배경화면을 그 사진으로 바꿨다. 2학년이 끝날 때 다시 찍을 생각이다." },
    ] },
  { id: "r_g2", needs: "rival", once: true, date: [[9, 3]], when: { grades: [2] }, bg: "ev_lineup", who: "coach",
    text: s => samePos(s) ? `{coach}님께서 선발 명단을 발표하신다. 내 자리에 들어갈 이름은 하나. ${gapText(s,
      "\"{name}.\" 내 이름이 불렸다. 옆에 선 {rival|이/가} 주먹을 꽉 쥐는 게 보였다.",
      "\"이번 주는 {rival}, 다음 주는 {given}. 둘 다 준비해라.\" 둘이 동시에 고개를 들었다.",
      "\"{rival}.\" 내 이름이 아니었다. {rival|이/가} 나를 한 번 돌아보더니 고개를 끄덕였다.")}`
      : `{coach}님께서 선발 명단을 발표하신다. 자리는 달라도 {rival}하고는 늘 명단 앞뒤를 다퉜다. ${gapText(s,
      "내 이름은 불렸고, {rival}의 이름은 교체 명단에 있었다. {rival|이/가} 입술을 깨무는 게 보였다.",
      "둘 다 선발이다. {rival|이/가} 옆에서 슬쩍 주먹을 내민다.",
      "{rival}의 이름은 선발에, 내 이름은 교체 명단에 있었다. {rival|이/가} 나를 한 번 돌아봤다.")}`,
    choices: [
      { label: "훈련이 끝나고 {rival}에게 먼저 다가간다", fx: { s: { "mental.teamwork": 0.8 }, rel: { rival: 5 } },
        result: "\"누가 뛰든 이기면 된다.\" 말은 그렇게 했지만, 둘 다 그 말을 반만 믿었다. 그래도 악수는 진심이었다." },
      { label: "명단과 상관없이 내 훈련을 한다", fx: { s: { "mental.focus": 0.6, "tech.firstTouch": 0.4 }, coach: 1 },
        result: "운동장 불이 꺼질 때까지 벽치기를 했다. 감독실 창문 너머로 누군가 보고 있는 것 같았다." },
      { label: "감독님께 이유를 여쭤본다", fx: { coach: -1, s: { "mental.confidence": 0.5 } },
        result: "\"이유는 네가 제일 잘 알 거다.\" 짧은 대답이었다. 돌아 나오면서 그 말을 몇 번이고 곱씹었다." },
    ] },
  { id: "r_g3", needs: "rival", once: true, date: [[7, 4]], when: { grades: [3] }, bg: "ev_dorm_night", who: "rival",
    text: "마지막 여름 대회 전날 밤, 숙소. 불을 끈 지 한참인데 옆자리 {rival|이/가} 아직 안 잔다. \"야, 자냐. …우리 이거 마지막 여름이다.\"",
    choices: [
      { label: "\"내일 같이 골 넣자\" 하고 주먹을 내민다", fx: { s: { "mental.teamwork": 0.6 }, morale: 4, rel: { rival: 5 } },
        result: "어둠 속에서 주먹이 맞부딪혔다. 3년 동안 서로를 이기려고 뛰었는데, 내일은 같은 쪽을 보고 뛴다." },
      { label: "1학년 때 슈팅 내기 얘기를 꺼낸다", fx: { morale: 5, rel: { rival: 4 } },
        result: "\"그거 내가 이긴 거다.\" \"아니거든.\" 새벽 2시까지 웃다가 코치님께 혼났다." },
      { label: "\"자라. 내일 뛰어야지\" 하고 돌아눕는다", fx: { fatigue: -4, s: { "mental.focus": 0.4 } },
        result: "한참 뒤 {rival}의 숨소리가 고르게 바뀌었다. 나는 조금 더 늦게 잠들었다." },
    ] },
  { id: "r_farewell", needs: "rival", once: true, date: [[12, 3]], when: { grades: [3] }, bg: "ev_breakwater", who: "rival",
    text: "진학 상담이 끝난 오후, 바닷가 방파제. {rival|이/가} 캔 음료 두 개를 들고 앉아 있다. \"3년 내내 너만 보고 뛰었는데, 이제 진짜 끝이네.\"",
    choices: [
      { label: "\"어디서든 다시 붙자\" 하고 웃는다", fx: { morale: 5, s: { "mental.competitive": 0.6 }, rel: { rival: 5 } },
        result: "\"그땐 진짜 안 봐준다.\" \"원래 안 봐줬잖아.\" 바다 위로 해가 천천히 내려앉았다." },
      { label: "3년 동안 고마웠다고 말한다", fx: { morale: 6, rel: { rival: 6 } },
        result: "{rival|이/가} 한참 바다만 봤다. \"…너 없었으면 나 이만큼 못 했다.\" 둘 다 그 말을 다시는 꺼내지 않기로 했다." },
    ] },

  // ── 부모님 ─────────────────────────────────
  { id: "p_lunchbox", family: true, once: true, date: [[7, 4]], when: { grades: [1] }, bg: "ev_lunchbox", who: "mom",
    text: "첫 여름 대회 날 새벽 4시 반. 부엌 불이 켜져 있다. 엄마가 김밥을 말고 계신다. \"깼어? 더 자. 다 싸 놓고 깨울게.\"",
    choices: [
      { label: "옆에 서서 김밥 끄트머리를 집어 먹는다", fx: { morale: 6, fatigue: 2 },
        result: "\"끄트머리는 원래 싸는 사람 거야.\" 엄마가 웃으며 하나를 더 입에 넣어 주셨다. 그날 김밥은 유난히 짭짤했다." },
      { label: "\"고마워요\" 하고 다시 들어가 잔다", fx: { fatigue: -5, morale: 3 },
        result: "이불 속에서 칼질 소리를 들으며 다시 잠들었다. 가방 안 도시락에는 쪽지가 붙어 있었다. '다치지만 마.'" },
    ] },
  { id: "p_dad_car", family: true, once: true, when: { grades: [1] }, bg: "ev_dadcar", who: "dad",
    trigger: s => { const m = lastMatch(s), i = turnInfo(s); return !!m && m.minutes > 0 && i?.month >= 5 && i.month <= 6; },
    text: "주말 경기가 끝나고 아빠 차 조수석. 라디오에서 옛날 노래가 나온다. 아빠는 한참 아무 말이 없다가 묻는다. \"오늘 어땠냐.\"",
    choices: [
      { label: "오늘 경기 이야기를 처음부터 끝까지 한다", fx: { morale: 5, s: { "mental.focus": 0.3 } },
        result: "아빠는 운전하면서 계속 고개를 끄덕였다. 축구는 잘 모르시면서 \"그래, 그때 패스가 좋았지\" 하신다. 다 보고 계셨던 거다." },
      { label: "\"그냥요\" 하고 창밖을 본다", fx: { fatigue: -3 },
        result: "아빠는 더 묻지 않았다. 대신 휴게소에 들러 호두과자를 사 오셨다. 봉지가 아직 따뜻했다." },
      { label: "아빠 학교 다닐 때 얘기를 여쭤본다", fx: { morale: 4, s: { "mental.teamwork": 0.3 } },
        result: "아빠가 고등학교 때 반 대표 축구 선수였다는 얘기를 처음 들었다. 집에 도착할 때까지 아빠 목소리가 들떠 있었다." },
    ] },
  { id: "p_mom_stands", family: true, once: true, bg: "ev_stands_mom", who: "mom",
    trigger: s => { const m = lastMatch(s); return !!m && m.status === "start" && s.record.starts === 1; },
    text: "첫 선발 경기가 끝나고 관중석을 올려다봤다. 맨 위 줄에서 엄마가 손을 흔들고 계신다. 일하는 날이라 못 온다고 하셨는데.",
    choices: [
      { label: "관중석까지 뛰어 올라간다", fx: { morale: 7, coach: -1 },
        result: "\"반차 냈어. 비밀이다.\" 엄마 손이 땀에 젖은 내 머리를 헝클었다. 감독님이 멀리서 헛기침을 하셨다." },
      { label: "손을 크게 흔들어 답한다", fx: { morale: 5 },
        result: "엄마가 두 손을 머리 위로 올려 동그라미를 그리셨다. 집에 가니 식탁에 갈비찜이 있었다." },
    ] },
  { id: "p_dad_injury", family: true, once: true, bg: "ev_injury_home", who: "dad",
    trigger: s => { const inj = s.player.condition.injury; return !!inj && inj.weeksLeft >= 3; },
    text: "다친 다리에 얼음을 대고 누워 있는데 아빠가 방문을 연다. \"병원 다녀왔다며. 의사 선생님이 뭐라시더냐.\"",
    choices: [
      { label: "괜찮다고, 금방 낫는다고 한다", fx: { morale: 2 },
        result: "\"그래.\" 아빠가 문을 닫으려다 말고 한마디 하셨다. \"괜찮지 않아도 괜찮다. 아빠한테는.\"" },
      { label: "무섭다고 솔직하게 말한다", fx: { morale: 5, s: { "mental.confidence": 0.4 } },
        result: "아빠가 침대 끝에 앉으셨다. 한참을 그렇게 계셨다. 다음 날부터 재활 병원은 아빠가 데려다주셨다." },
    ] },
  { id: "p_mom_note", family: true, once: true, date: [[2, 3]], when: { grades: [2] }, bg: "ev_note", who: "narr",
    text: "동계훈련 짐을 풀다가 가방 안쪽 주머니에서 접힌 쪽지를 발견했다. 엄마 글씨다.",
    choices: [
      { label: "그 자리에서 펼쳐 읽는다", fx: { morale: 6, s: { "mental.confidence": 0.5 } },
        result: "'잘하든 못하든 엄마는 네가 운동장에 서 있는 게 좋아. 2학년도 지금처럼.' 쪽지를 지갑에 넣었다." },
      { mark: "mom_reply", label: "엄마한테 답장을 써서 냉장고에 붙인다", fx: { morale: 5, s: { "mental.teamwork": 0.3 } },
        result: "'2학년엔 선발로 뛰는 거 보여 줄게요.' 다음 날 아침, 그 쪽지 옆에 하트 자석이 하나 더 붙어 있었다." },
    ] },
  { id: "p_admission", family: true, once: true, date: [[10, 3]], when: { grades: [3] }, bg: "ev_dinner", who: "dad",
    text: "저녁 식탁. 진학 이야기가 나왔다. 엄마는 공부도 놓지 않을 학교를, 아빠는 네가 가고 싶은 곳을 말하라고 한다. 두 분이 동시에 나를 본다.",
    choices: [
      { label: "축구를 제일 잘할 수 있는 곳에 가고 싶다고 말한다", fx: { morale: 4, s: { "mental.competitive": 0.6 } },
        result: "엄마가 한숨을 쉬다가 웃으셨다. \"대신 성적표는 계속 보여 줘.\" 아빠가 내 어깨를 두 번 두드렸다." },
      { label: "두 분 이야기를 다 듣고 같이 정하자고 한다", fx: { morale: 3, s: { "mental.teamwork": 0.4, "student.attitude": 0.5 } },
        result: "식탁 위에 학교 이름 세 개가 적힌 종이가 놓였다. 그날 밤 우리 가족은 처음으로 같은 종이를 오래 들여다봤다." },
    ] },

  // ── 전남 대표 소년체전 ─────────────────────────
  { id: "jn_camp", once: true, bg: "ev_jn_camp", who: "coach",
    trigger: s => { const c = s.jnCup, i = turnInfo(s); return !!c && c.alive && c.stage === 0 && i?.grade === c.grade && i.month === 5 && i.week === 2 && !s.player.condition.injury; },
    text: "전국소년체전 소집 첫날, 숙소 강당. 광양, 목포, 순천에서 온 낯선 얼굴들이 서로 눈치만 본다. 올해 전남 대표 감독은 {coach}님이 맡으셨다. \"학교는 잊어라. 이번 주는 전부 전남이다.\"",
    choices: [
      { label: "먼저 다가가 이름부터 묻는다", fx: { s: { "mental.teamwork": 0.6 }, morale: 3 },
        result: "목포에서 온 미드필더가 웃으며 손을 내밀었다. \"너 고흥이지? 리그에서 붙어 봤잖아.\" 그날 밤 숙소 방이 제일 시끄러웠다." },
      { label: "말없이 축구화 끈부터 다시 묶는다", fx: { s: { "mental.focus": 0.6 } },
        result: "다들 잘하는 애들이다. 여기서는 고흥에서처럼 공이 저절로 오지 않는다. 첫 훈련부터 목소리를 냈다." },
      { label: "부모님께 \"잘 도착했어요\" 하고 문자한다", fx: { morale: 4 },
        result: "엄마 답장이 1초 만에 왔다. '밥 많이 먹고, 텔레비전에 나오면 손 흔들어.'" },
    ] },
  { id: "jn_return", once: true, bg: s => (s.jnCup?.medal === "gold" ? "ev_medal" : "ev_bus_sunset"), who: "narr",
    trigger: s => { const c = s.jnCup, i = turnInfo(s); return !!c && i?.grade === c.grade && i.month === 5 && i.week === 3; },
    text: s => {
      const c = s.jnCup, m = c.medal;
      return m === "gold" ? "고흥으로 돌아오는 버스. 목에 건 금메달이 덜컹거릴 때마다 가슴을 친다. 정류장에 내리자 축구부 동료들이 현수막을 들고 서 있다. '전남 대표 {name}, 금메달!'"
        : m === "silver" ? "결승에서 졌다. 은메달은 생각보다 무거웠다. 고흥 정류장에 내리자 {friend|이/가} 달려와 메달부터 만져 본다. \"이게 진짜 은이냐?\""
        : m === "bronze" ? "준결승에서 멈췄지만, 동메달을 들고 돌아왔다. 운동장에 들어서자 훈련하던 후배들이 일제히 박수를 친다. 괜히 목이 멘다."
        : m === "first" ? "1회전에서 짐을 쌌다. 돌아오는 버스 안, 같은 방을 쓴 목포 친구한테서 문자가 왔다. '고등학교 가서 또 보자. 그땐 이긴다.'"
        : "부상 때문에 소년체전 경기를 다 뛰지 못했다. 텔레비전으로 전남 대표 경기를 보는데, 그 유니폼이 유난히 눈에 밟혔다.";
    },
    choices: [
      { label: "운동장에 바로 가서 공을 찬다", fx: { s: { "mental.competitive": 0.6 }, fatigue: 3 },
        result: "익숙한 잔디 냄새. 낯선 경기장에서 뛰다 돌아오니 고흥 운동장이 이렇게 넓었나 싶다." },
      { label: "후배들에게 대표팀 이야기를 들려준다", fx: { s: { "mental.teamwork": 0.6 }, morale: 3, rel: { junior: 3 } },
        result: "후배들이 눈을 반짝이며 물었다. \"형, 다른 지역 애들은 진짜 잘해요?\" \"응. 근데 우리도 할 수 있어.\"" },
      { label: "집에 가서 하루 푹 쉰다", fx: { fatigue: -10, morale: 2 },
        result: "엄마가 끓여 준 미역국을 먹고 열두 시간을 잤다. 꿈속에서도 경기를 뛰었다." },
    ] },

  // ── 복선 회수: 예전에 한 선택이 시간이 지나 돌아오는 장면 (choices의 mark로 기억) ─────────
  { id: "pay_rival_dawn", once: true, needs: "rival", bg: "ev_rival", who: "rival",
    trigger: s => { const i = turnInfo(s); return marked(s, "rival_dawn", 8) && i?.grade === 3 && i.month === 7 && i.week <= 3; },
    text: "훈련이 끝나고 {rival|이/가} 공 하나를 툭 차 보낸다. \"기억나냐. 그 새벽에 네가 내 옆에서 같이 찼던 거. 그날부터 너 의식하면서 뛰었다.\" 곧 마지막 여름 대회다.",
    choices: [
      { label: "\"이번엔 같은 골문을 보고 뛰자\"", fx: { morale: 4, rel: { rival: 4 } },
        act: s => { const r = person(s, "rival")?.name || "라이벌"; bond(s, 0.05, `${r}${bat(r) ? "과" : "와"} 눈이 마주쳤다. 그 새벽처럼, 오늘은 같은 골문을 본다.`, 4); },
        result: "둘이 동시에 웃었다. 대회 첫 경기에서 서로를 한 번 더 찾게 될 것 같다." },
      { label: "\"그때 너 진짜 얄미웠다\" 하고 웃는다", fx: { morale: 5, rel: { rival: 3 } },
        act: s => { const r = person(s, "rival")?.name || "라이벌"; bond(s, 0.05, `킥오프 직전, ${r}${bat(r) ? "이" : "가"} 내 등을 두 번 두드린다. 그 새벽의 신호다.`, 4); },
        result: "\"너도 만만치 않았거든.\" 공을 주고받는 소리가 해 질 때까지 이어졌다." },
    ] },
  { id: "pay_mom_reply", once: true, family: true, bg: "ev_lunchbox", who: "narr",
    trigger: s => { const i = turnInfo(s); return marked(s, "mom_reply", 10) && i?.grade === 3 && [11, 12].includes(i.month); },
    text: "엄마 지갑에서 코팅된 종이 한 장이 떨어졌다. 2학년 겨울, 냉장고에 붙여 두었던 내 답장이다. 글씨가 삐뚤빼뚤하다.",
    choices: [
      { label: "엄마한테 이게 뭐냐고 묻는다", fx: { morale: 6 },
        result: "\"버리기 아까워서.\" 엄마는 그렇게만 말하고 부엌으로 가셨다. 귀가 빨갰다." },
      { label: "모른 척 다시 넣어 둔다", fx: { morale: 4, s: { "student.attitude": 0.5 } },
        result: "지갑을 원래대로 닫아 두었다. 그날 저녁 설거지는 내가 했다." },
    ] },
  { id: "pay_book", once: true, school: true, bg: "ev_classroom", who: "teacher",
    trigger: s => { const i = turnInfo(s); return marked(s, "book_read", 10) && i?.grade === 3 && [9, 10].includes(i.month) && (s.relations.teacher ?? 50) >= 60; },
    text: "{teacher}께서 진로 상담 자료를 넘기다 멈추신다. \"그때 준 책 기억나니? 그 주에 다 읽고 한 줄 써 왔던 거. 선생님이 추천서에 그 얘기를 썼다.\"",
    choices: [
      { label: "그 한 줄을 아직 기억한다고 말씀드린다", fx: { teacher: 3, s: { "student.academic": 0.5 } },
        result: "\"그럼 됐다.\" 선생님이 웃으며 서류를 덮으셨다. 진학 상담 때 추천서가 힘이 될 거다." },
      { label: "감사하다고 고개를 숙인다", fx: { teacher: 2, morale: 3 },
        result: "\"고마운 건 선생님이지. 그 책 끝까지 읽은 애가 몇 없었거든.\"" },
    ] },
  { id: "pay_turf", once: true, bg: "bg_field_day", who: "coach",
    trigger: s => { const i = turnInfo(s); return marked(s, "turf", 10) && i?.grade === 3 && [11, 12].includes(i.month); },
    text: "시즌 마지막 훈련. {coach}님께서 운동장을 한 바퀴 둘러보시더니 말씀하신다. \"저기 페널티 박스 앞, 비 오고 패였던 데. 그날 삽 들고 나온 놈 기억한다. 너다.\"",
    choices: [
      { label: "\"그날 흙 많이 날랐습니다\" 하고 웃는다", fx: { coach: 4, morale: 4 },
        result: "\"그래. 그런 놈이 결국 운동장을 지킨다.\" 감독님이 처음으로 어깨를 두드려 주셨다." },
      { label: "말없이 고개를 숙인다", fx: { coach: 3, s: { "mental.teamwork": 0.5 } },
        result: "감독님은 더 말씀하지 않으셨다. 대신 마지막 정리 운동 구령을 나에게 맡기셨다." },
    ] },
  { id: "pay_kids", once: true, bg: "bg_stadium", who: "narr",
    trigger: s => marked(s, "kids", 30) && !!turnInfo(s)?.match,
    text: "경기 날 아침. 관중석 앞줄에 초등학생 몇 명이 삐뚤빼뚤한 현수막을 들고 서 있다. 예전에 운동장 앞에서 슈팅을 보여 줬던 그 아이들이다.",
    choices: [
      { label: "손을 크게 흔들어 준다", fx: { morale: 5 },
        act: s => bond(s, 0.03, "관중석 앞줄에서 초등학생들이 현수막을 흔든다. '형 파이팅!' 다리에 힘이 들어간다."),
        result: "아이들이 펄쩍펄쩍 뛰며 소리를 질렀다. 오늘은 골을 넣고 싶다." },
      { label: "경기 끝나고 사진 찍어 주겠다고 약속한다", fx: { morale: 4, s: { "student.attitude": 0.5 } },
        act: s => bond(s, 0.03, "관중석 앞줄에서 초등학생들이 현수막을 흔든다. 경기 끝나고 사진 찍어 주기로 한 약속이 떠오른다."),
        result: "새끼손가락을 걸었다. 그 아이들 앞에서 지는 모습은 보여 주기 싫다." },
    ] },
  { id: "pay_lunch_friend", once: true, school: true, bg: "ev_classroom", who: "narr",
    trigger: s => marked(s, "lunch_friend", 20),
    text: "아침에 책상 서랍을 여니 접힌 종이가 들어 있다. 급식실에서 같이 밥을 먹던 그 아이가 그린 그림이다. 주황색 유니폼을 입은 내가 골을 넣고 있다.",
    choices: [
      { label: "쉬는 시간에 찾아가 고맙다고 한다", fx: { morale: 5, s: { "mental.teamwork": 0.4 } },
        result: "그 아이가 처음으로 먼저 웃었다. \"다음 경기 보러 가도 돼?\"" },
      { label: "그림을 사물함 안쪽에 붙여 둔다", fx: { morale: 4, s: { "mental.focus": 0.3 } },
        result: "사물함을 열 때마다 그림 속 내가 골을 넣고 있다. 괜히 힘이 난다." },
    ] },
  { id: "pay_umbrella", once: true, bg: "bg_stadium", who: "narr",
    trigger: s => { const i = turnInfo(s); return marked(s, "umbrella", 15) && !!i?.match && [5, 6, 7, 8, 9].includes(i.month); },
    text: "비 소식이 있는 경기 날. 운동장 입구에서 누가 우비를 내민다. 예전에 우산을 같이 썼던 옆 반 아이다. \"오늘은 내가 갚을게.\"",
    choices: [
      { label: "우비를 받아 벤치 가방에 넣는다", fx: { morale: 4 },
        result: "비가 오든 말든 오늘은 춥지 않을 것 같다." },
      { label: "같이 보자며 관중석 자리를 알려 준다", fx: { morale: 5, s: { "mental.teamwork": 0.3 } },
        result: "그 아이는 끝까지 자리를 지켰다. 경기가 끝나고 우비를 돌려주려 했지만 받지 않았다." },
    ] },
  { id: "pay_junior_coach", once: true, needs: "junior", bg: "bg_field_day", who: "junior",
    trigger: s => { const i = turnInfo(s); return marked(s, "junior_coach", 10) && i?.grade === 3 && !i.vacation; },
    text: "후배 {junior|이/가} 연습경기에서 왼발로 골을 넣고는 세리머니도 잊고 나에게 달려온다. \"형! 봤어요? 형이 봐 준 그 왼발이요!\"",
    choices: [
      { label: "머리를 마구 헝클어 준다", fx: { morale: 4, rel: { junior: 5 } },
        result: "{junior|이/가} 비명을 지르면서도 웃었다. 그 30분이 이렇게 돌아올 줄은 몰랐다." },
      { label: "\"다음엔 오른발도 봐 줄게\"", fx: { s: { "mental.teamwork": 0.5 }, rel: { junior: 4 } },
        result: "\"진짜죠? 약속이에요!\" 그날 훈련은 둘이 제일 늦게 끝났다." },
    ] },
  { id: "pay_asked_coach", once: true, bg: "ev_office", who: "coach",
    trigger: s => { const m = lastMatch(s); return marked(s, "asked_coach", 2) && !!m && m.status === "start" && m.minutes > 0 && m.turn > s.marks.asked_coach; },
    text: "경기가 끝나고 {coach}님께서 부르셨다. \"벤치 옆에서 '뭘 더 하면 되냐'고 물었던 거 기억하냐. 지난 경기에서 그 답을 네가 직접 보여 줬다.\"",
    choices: [
      { label: "\"아직 멀었습니다\"", fx: { coach: 3, s: { "mental.competitive": 0.4 } },
        result: "\"그 말 할 줄 알았다. 그래서 너를 넣은 거다.\"" },
      { label: "꾸벅 인사한다", fx: { coach: 3, morale: 3 },
        result: "감독님은 고개만 한 번 끄덕이셨다. 그걸로 충분했다." },
    ] },
  { id: "pay_elder", once: true, bg: "bg_field_day", who: "narr",
    trigger: s => marked(s, "elder", 20) && !!turnInfo(s)?.match,
    text: "경기 시작 전, 운동장 울타리 앞에 낯익은 할머니가 서 계신다. 예전에 쌀 포대를 들어 드렸던 그 할머니다. 보자기에 싼 식혜 병을 내미신다. \"축구하는 학생들 다 같이 나눠 마셔.\"",
    choices: [
      { label: "두 손으로 받고 꾸벅 인사한다", fx: { morale: 5, s: { "student.attitude": 0.5 } },
        act: s => bond(s, 0.03, "울타리 너머에서 할머니가 손을 흔드신다. 식혜 맛이 아직 입에 남아 있다."),
        result: "할머니가 내 손을 꼭 잡으셨다. \"다치지 말고.\"" },
      { label: "동료들을 불러 같이 인사드린다", fx: { morale: 4, s: { "mental.teamwork": 0.5 } },
        act: s => bond(s, 0.03, "울타리 너머에서 할머니가 손을 흔드신다. 동료들이 일제히 고개를 숙여 인사한다."),
        result: "열 명 넘는 아이들이 한꺼번에 인사하자 할머니가 소리 내어 웃으셨다." },
    ] },

  // ── 고흥 이야기 ────────────────────────────────
  { id: "l_launch", needs: "friend", once: true, date: [[6, 2]], when: { grades: [2] }, bg: "ev_launch", who: "narr",
    text: "나로우주센터 발사가 있는 날. 훈련이 끝나자 {friend|이/가} 자전거를 끌고 왔다. \"우주발사전망대 가자. 지금 가면 딱 맞아.\"",
    choices: [
      { label: "자전거 뒤에 타고 전망대로 간다", fx: { morale: 6, fatigue: 3, rel: { friend: 4 } },
        result: "카운트다운이 끝나자 바다 너머에서 하얀 줄기가 하늘로 솟았다. 둘 다 입을 벌린 채 아무 말도 못 했다. \"우리도 저렇게 올라가자.\" {friend|이/가} 말했다." },
      { label: "운동장에 남아 하늘을 올려다본다", fx: { morale: 3, s: { "mental.focus": 0.3 } },
        result: "멀리 하늘에 가느다란 연기 한 줄이 그어졌다. 그걸 보면서 공을 한 번 더 찼다." },
    ] },
  { id: "l_geogeum", once: true, date: [[5, 3]], when: { grades: [1] }, bg: "ev_bridge", who: "assistant",
    text: "{assistant}님께서 오늘 체력 훈련은 자전거라고 하신다. 코스는 거금대교. 바다 위 다리를 왕복한다.",
    choices: [
      { label: "선두에서 페달을 밟는다", fx: { s: { "phys.stamina": 0.8, "phys.strength": 0.3 }, fatigue: 7 },
        result: "다리 한가운데서 맞바람이 몰아쳤다. 허벅지가 터질 것 같았지만 내려다본 바다는 눈부셨다." },
      { label: "뒤처진 동료와 나란히 달린다", fx: { s: { "phys.stamina": 0.5, "mental.teamwork": 0.6 }, fatigue: 5 },
        result: "꼴찌 둘이서 노래를 부르며 다리를 건넜다. 코치님이 \"너희가 제일 시끄럽다\"며 웃으셨다." },
    ] },
  { id: "l_ssukseom", family: true, once: true, date: [[4, 4]], when: { grades: [2] }, bg: "ev_ssukseom", who: "mom",
    text: "엄마가 쑥섬에 꽃이 한창이라며 배 시간표를 내미신다. \"딱 오전만. 오후엔 훈련 가도 돼.\"",
    choices: [
      { label: "배를 타고 쑥섬에 간다", fx: { morale: 6, fatigue: -4 },
        result: "섬 꼭대기 꽃밭에서 엄마랑 사진을 찍었다. 엄마가 그 사진을 가족 단톡방 프로필로 바꾸셨다." },
      { label: "훈련 때문에 다음에 가자고 한다", fx: { s: { "phys.stamina": 0.3 }, morale: -1 },
        result: "\"다음에 꼭이다.\" 엄마가 사진만 잔뜩 찍어 보내셨다. 화면 속 꽃이 생각보다 예뻤다." },
    ] },
  { id: "l_sunset", once: true, date: [[11, 1]], when: { grades: [3] }, bg: "ev_bus_sunset", who: "narr",
    text: "훈련을 마치고 돌아오는 버스가 고흥만 방조제를 지난다. 창밖이 온통 주황색이다. 누군가 \"우리 유니폼 색이네\" 하고 중얼거린다.",
    choices: [
      { label: "창문을 열고 바닷바람을 맞는다", fx: { morale: 5 },
        result: "3년 동안 이 길을 몇 번이나 지났을까. 오늘따라 노을이 오래 남았다." },
      { label: "동기들과 단체 사진을 찍자고 한다", fx: { morale: 4, s: { "mental.teamwork": 0.5 } },
        result: "버스 뒷자리에 끼어 앉아 찍은 흔들린 사진 한 장. 졸업 앨범보다 그 사진을 더 자주 꺼내 보게 될 것 같다." },
    ] },
];
