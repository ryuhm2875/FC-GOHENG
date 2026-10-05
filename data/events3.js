// 이야기 줄기 이벤트: 라이벌 3년, 부모님 장면, 고흥 이야기
// date: [[월, 주]] 그 주에 반드시 / trigger: 상황이 맞으면 반드시 / when.grades: 학년
// 문장 안의 {rival} {friend} {mentor} {junior} {teacher} {coach} {name} {given}은 자동으로 바뀝니다.

import { turnInfo } from "../js/engine/calendar.js";
import { rivalGap, person } from "../js/engine/relations.js";

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
      { label: "엄마한테 답장을 써서 냉장고에 붙인다", fx: { morale: 5, s: { "mental.teamwork": 0.3 } },
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
