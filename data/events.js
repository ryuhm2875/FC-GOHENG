import { CAPTAINS } from "./roster.js";
import { EVENTS_MORE } from "./events2.js";
import { EVENTS_STORY } from "./events3.js";
import { turnInfo } from "../js/engine/calendar.js";
import { pick } from "../js/rng.js";
// 이번 주(이벤트가 보이는 주)에 경기가 있는지 / 다음 주에 정기시험이 있는지
const matchWeek = s => !!turnInfo(s)?.match;
const examNextWeek = s => { const n = turnInfo(s, 1); return !!n?.exam && !n.exam.free; };
const lastMatch = s => { const m = s.record.matches.at(-1); return m && s.calendar.turn - m.turn <= 1 ? m : null; };
// 랜덤 이벤트. 한 주가 끝날 때 가끔 하나씩 일어납니다.
//
// who   : 말하는 사람 (coach 감독, assistant 코치, teacher 담임, mom 엄마, dad 아빠,
//         friend 친구, rival 라이벌, mentor 멘토 선배, junior 후배, narr 해설)
// when  : grades 학년, months 달 (없으면 아무 때나)
// needs : 이 사람이 있어야 일어남 (friend, rival, mentor, junior)
// cond  : 추가 조건 (게임 상태를 보고 true/false)
// school: true면 방학 중에는 안 나옴
// fixed : true면 무작위로 뽑히지 않고 data/calendar.js 의 SCHOOL_DAYS 일정에만 나옴
// fx.teacher: 류봉두 선생님과의 관계 / hurt: { p 확률, type 부상 종류, cause, result } 다칠 수 있는 선택
// text, result 자리에 (s) => 문장 함수를 쓰면 상황에 따라 문장이 달라집니다
// bg    : 배경 그림 이름 (assets/img/). 있으면 글 상자 뒤에 그림이 깔립니다
// urgent: true면 조건이 맞을 때 무작위 이벤트보다 먼저 찾아옴 (경기 뒤 면담 등)
// weight: 뽑힐 확률 비중 (기본 1) / once: true면 한 번만
// text  : 상황. {name} 나, {friend} {rival} {mentor} {junior} 각 인물, {coach} {assistant} {teacher}
// choices: label 선택지, fx 효과, result 결과 문장
//   fx: s 능력치 {"tech.shoot": 1}, fatigue 피로, morale 사기, coach 감독 신뢰, rel 관계 {friend: 5}

export const EVENTS = [
  // ── 학교생활 ──────────────────────────────────
  { id: "group_project", bg: "ev_groupwork", school: true, who: "friend", needs: "friend", weight: 1.2,
    text: "야, 사회 수행평가 모둠 과제 이번 주까지래. 우리 둘이 같은 모둠인데… 너 훈련 끝나고 시간 돼?",
    choices: [
      { label: "밤에 같이 끝내자", fx: { s: { "student.academic": 2, "student.attitude": 1 }, fatigue: 8, rel: { friend: 6 } }, result: "밤 11시까지 편의점 테이블에서 PPT를 만들었다. 발표 점수가 꽤 잘 나왔다." },
      { label: "미안, 네가 좀 해 줘", fx: { s: { "student.attitude": -1.5 }, rel: { friend: -8 } }, result: "{friend|이/가} 혼자 다 했다. 발표 날 눈을 안 마주친다." },
    ] },
  { id: "sports_day", date: [[10, 2]], bg: "ev_sportsday", who: "teacher", school: true, when: { months: [10] }, once: true,
    text: "2학기 학급 대항 줄다리기 날. {teacher}께서 부르신다. \"{given|아/야}, 반 아이들이 맨 앞자리를 너한테 맡기자는데?\"",
    choices: [
      { label: "맡겠습니다", fx: { s: { "student.attitude": 1.5, "phys.strength": 0.5 }, fatigue: 6, morale: 6 }, result: "구령에 맞춰 버텼다. 마지막 한 뼘에서 우리 반이 끌려가지 않았다. 반 아이들이 한꺼번에 달려들었다." },
      { label: "다치면 안 돼서요…", fx: { s: { "student.attitude": -0.5 }, fatigue: -3 }, result: "선생님은 웃으며 괜찮다고 하셨지만, 반 단톡방은 조용했다." },
      { label: "허리를 낮추고 줄을 어깨에 감는다", req: { "phys.strength": 60 }, fx: { s: { "phys.strength": 0.5, "mental.teamwork": 0.5 }, morale: 3, teacher: 1 },
        result: "웨이트로 다진 허리가 버텼다. 첫 당김에 상대 반이 한 걸음 끌려왔다. 반 아이들이 내 이름을 연호한다." },
    ] },
  { id: "phone_confiscated", school: true, who: "teacher", cond: s => s.player.stats.student.attitude < 60,
    text: "수업 중에 하이라이트 영상을 보다가 {teacher}께 걸렸다. \"휴대폰은 종례 때 찾아가.\"",
    choices: [
      { label: "죄송합니다. 반성문 쓰겠습니다", fx: { s: { "student.attitude": 1.5 } }, result: "반성문 한 장. 선생님이 \"다음엔 쉬는 시간에 봐\" 하며 휴대폰을 돌려주셨다." },
      { label: "축구 공부였다고 말한다", fx: { s: { "student.attitude": -2 }, morale: -3 }, result: "변명이 통하지 않았다. 감독님 귀에도 들어갔다.", fxAfter: { coach: -2 } },
    ] },
  { id: "class_president", date: [[3, 3]], school: true, who: "teacher", when: { months: [3] }, once: true, cond: s => s.player.stats.student.attitude >= 50,
    text: "반장 선거에 너를 추천하는 애들이 있더라. 운동하면서 할 수 있겠니?",
    choices: [
      { label: "해 보겠습니다", fx: { s: { "student.attitude": 3, "mental.teamwork": 1 }, fatigue: 5 }, result: "반장이 됐다. 아침 조회를 맡게 됐다. 바쁘지만 뿌듯하다." },
      { label: "운동에 집중할게요", fx: { morale: 2 }, result: "선생님은 고개를 끄덕이셨다. \"그래, 그것도 용기야.\"" },
    ] },
  { id: "field_trip", date: [[10, 3]], school: true, who: "narr", when: { months: [5, 10] }, once: true,
    text: "학년 체험학습 날. 나로우주센터 견학이다. 그런데 그날 오후에 팀 자율 훈련이 잡혀 있다.",
    choices: [
      { label: "체험학습에 끝까지 간다", fx: { morale: 8, fatigue: -8, s: { "student.academic": 1 } }, result: "로켓 발사대 앞에서 친구들과 사진을 찍었다. 오랜만에 축구 생각이 안 났다." },
      { label: "오후엔 빠져서 훈련한다", fx: { s: { "position": 0.6 }, coach: 1.5, morale: -3 }, result: "혼자 운동장에 남아 슈팅 50개. 감독님이 멀리서 보고 계셨다." },
    ] },
  { id: "late_school", school: true, who: "narr", cond: s => s.player.condition.fatigue >= 55,
    text: "아침 알람을 세 번 껐다. 눈을 뜨니 8시 25분.",
    choices: [
      { label: "택시 타고 간다 (용돈 손해)", fx: { morale: -2 }, result: "겨우 출석. 이번 달 용돈이 반으로 줄었다." },
      { label: "지각하고 혼난다", fx: { s: { "student.attitude": -2 }, fatigue: -6 }, result: "벌점 1점. 그래도 몸은 좀 개운하다. 알람을 세 번이나 끈 건 피로가 쌓였다는 신호다." },
    ] },
  { id: "library_book", school: true, who: "teacher", when: { grades: [1, 2] },
    text: "도서관에 새로 들어온 축구 선수 자서전 있던데, 읽어 볼래? 독후감 쓰면 수행평가에도 들어가.",
    choices: [
      { label: "빌려서 읽는다", fx: { s: { "mental.focus": 1, "student.academic": 1.5, "mental.confidence": 0.5 }, fatigue: -2 }, result: "\"남들이 쉴 때 한 번 더 찼다\"는 문장에 밑줄을 그었다." },
      { label: "시간 없어서 패스", fx: {}, result: "책은 다른 반 친구가 빌려 갔다." },
    ] },
  { id: "exam_night", school: true, who: "friend", needs: "friend", cond: s => s.player.stats.student.academic < 60 && examNextWeek(s),
    text: "다음 주 시험인데 나 수학 하나도 모르겠다… 같이 공부할래? 대신 내가 떡볶이 쏜다.",
    choices: [
      { label: "도서관 가자", fx: { s: { "student.academic": 3 }, fatigue: 4, rel: { friend: 5 } }, result: "서로 모르는 걸 물어보다 보니 의외로 머리에 남았다." },
      { label: "난 그냥 훈련할래", fx: { s: { "position": 0.4 }, rel: { friend: -3 } }, result: "{friend|은/는} 혼자 도서관에 갔다." },
    ] },

  // ── 축구부 ────────────────────────────────────
  { id: "senior_errand", who: "mentor", needs: "mentor", when: { grades: [1] },
    text: "야 1학년, 물통 좀 채워 와라. 콘도 정리하고.",
    choices: [
      { label: "네! 바로 하겠습니다", fx: { s: { "student.attitude": 1 }, fatigue: 3, rel: { mentor: 6 } }, result: "선배가 어깨를 툭 쳤다. \"너 괜찮네.\"" },
      { label: "오늘 당번 아닌데요…", fx: { rel: { mentor: -8 }, morale: -2 }, result: "선배 표정이 굳었다. 그날 훈련 내내 패스가 안 왔다." },
    ] },
  { id: "rainy_training", who: "assistant",
    text: "비가 이렇게 오는데 훈련할 사람? 자율이다. 안 나와도 뭐라 안 한다.",
    choices: [
      { label: "비 맞으며 훈련", fx: { s: { "mental.competitive": 1, "tech.firstTouch": 0.6 }, fatigue: 10, coach: 2 }, result: "젖은 잔디에서 공이 미끄러진다. 그래서 터치가 더 늘었다." },
      { label: "실내에서 영상 분석", fx: { s: { "mental.focus": 1 }, fatigue: -4 }, result: "지난 경기 영상을 돌려 봤다. 내가 공 없을 때 너무 서 있었다." },
      { label: "집에 가서 쉰다", fx: { fatigue: -12, coach: -1 }, result: "따뜻한 라면 한 그릇. 몸이 풀린다." },
      { label: "빗속 체력 훈련을 자청한다", req: { "phys.stamina": 62 }, fx: { s: { "phys.stamina": 0.8, "mental.competitive": 0.4 }, fatigue: 6, coach: 2 },
        result: "물 먹은 잔디 위를 왕복 스무 번. {coach}님께서 우산도 없이 끝까지 지켜보셨다. \"그래, 그런 놈이 경기 뛴다.\"" },
    ] },
  { id: "night_shooting", who: "coach", cond: s => s.relations.coach >= 55,
    text: "너, 남아서 슈팅 100개 찰 수 있냐? 다른 애들한테는 말 안 했다.",
    choices: [
      { label: "100개 차겠습니다", fx: { s: { "tech.shoot": 2, "mental.confidence": 0.5 }, fatigue: 14, coach: 3 }, result: "다리가 후들거렸지만 마지막 10개가 제일 잘 들어갔다." },
      { label: "오늘은 너무 지쳤습니다", fx: { fatigue: -4, coach: -1 }, result: "\"그래, 몸이 먼저다.\" 말은 그렇게 하셨지만 아쉬운 표정이었다." },
      { label: "100개 전부 구석만 노린다", req: { "tech.shoot": 65 }, fx: { s: { "tech.shoot": 1, "mental.focus": 0.3 }, fatigue: 5, coach: 2 },
        result: "왼쪽 위, 오른쪽 아래. 구석만 고집했다. 마지막 스무 개는 거의 다 들어갔다. 감독님이 말없이 공을 주워 주셨다." },
    ] },
  { id: "torn_boots", who: "narr",
    text: "축구화 밑창이 떨어졌다. 새 축구화는 20만 원이 넘는다.",
    choices: [
      { label: "엄마한테 말한다", fx: { morale: 3, rel: {} }, result: "엄마가 한숨을 쉬더니 주말에 같이 순천 가자고 했다. 새 축구화, 발이 가볍다.", fxAfter: { s: { "tech.firstTouch": 0.5 } } },
      { label: "테이프 감고 버틴다", fx: { s: { "mental.competitive": 0.8 }, morale: -2 }, result: "흰 테이프를 칭칭 감았다. 다들 웃었지만 상관없다." },
    ] },
  { id: "pro_match", who: "dad", when: { months: [4, 5, 9, 10] }, cond: s => !matchWeek(s),
    text: "이번 주말에 광양 가서 프로 경기 볼래? 표 두 장 생겼다.",
    choices: [
      { label: "같이 간다", fx: { s: { "mental.focus": 1, "mental.confidence": 0.5 }, morale: 8, fatigue: -5 }, result: "같은 포지션 선수만 90분 내내 봤다. 공 없을 때 움직임이 전혀 달랐다." },
      { label: "훈련하겠다고 한다", fx: { s: { "position": 0.5 }, morale: -2 }, result: "아빠는 \"그래, 다음에 가자\" 하고 혼자 웃었다." },
    ] },
  { id: "rival_bench", who: "rival", needs: "rival", cond: s => s.relations.people?.rival?.position === s.player.position,   // 같은 포지션일 때만
    text: "이번 주 연습경기에 감독님이 나를 네 자리에 세운대. 미안하다, 근데 양보 안 한다.",
    choices: [
      { label: "\"나도 안 진다\"", fx: { s: { "mental.competitive": 1.5 }, rel: { rival: 6 }, morale: 2 }, result: "둘 다 웃었다. 그날 미니게임은 거의 싸움이었다." },
      { label: "속으로 삭인다", fx: { morale: -5, s: { "mental.focus": 0.5 } }, result: "말없이 축구화 끈만 다시 맸다." },
      { label: "\"그 자리, 훈련에서 다시 가져간다\"", req: { "mental.confidence": 62 }, fx: { s: { "mental.competitive": 0.6 }, morale: 2, rel: { rival: 3 } },
        result: "{rival|이/가} 피식 웃었다. \"그 말 기다렸다.\" 그날 훈련은 둘 다 평소보다 한 시간 늦게 끝났다." },
    ] },
  { id: "rival_injury", who: "narr", needs: "rival", once: true,
    text: "{rival|이/가} 훈련 중 발목을 접질렸다. 일주일은 못 뛴다고 한다.",
    choices: [
      { label: "병원에 찾아간다", fx: { rel: { rival: 15, friend: 3 }, s: { "mental.teamwork": 1 } }, result: "\"빨리 와라. 너 없으니까 재미없다.\" {rival|이/가} 피식 웃었다." },
      { label: "이번이 기회라고 생각한다", fx: { s: { "mental.competitive": 1 }, coach: 1, rel: { rival: -5 } }, result: "그 주 훈련에서 유난히 많이 뛰었다. 마음 한쪽이 조금 불편했다." },
    ] },
  { id: "mentor_tip", who: "mentor", needs: "mentor", cond: s => s.relations.people?.mentor?.value >= 55,
    text: "너 공 받기 전에 어깨 너머로 한 번 봐라. 그거 하나로 달라진다. 나도 작년에 감독님한테 배운 거다.",
    choices: [
      { label: "그 자리에서 따라 해 본다", fx: { s: { "tech.firstTouch": 1, "mental.focus": 1 }, rel: { mentor: 5 } }, result: "고개를 한 번 돌렸을 뿐인데 다음 패스가 보였다." },
      { label: "고맙다고만 한다", fx: { rel: { mentor: 2 } }, result: "선배가 \"꼭 해 봐라\" 하고 돌아섰다." },
      { label: "바로 미니게임에서 써 본다", req: { "mental.focus": 60 }, fx: { s: { "tech.firstTouch": 0.8, "mental.focus": 0.3 }, rel: { mentor: 2 } },
        result: "공이 오기 전에 어깨 너머를 봤다. 받자마자 몸을 돌렸다. {mentor} 선배가 멀리서 엄지를 들었다." },
    ] },
  { id: "senior_mistake", who: "narr", needs: "mentor", when: { grades: [1, 2] },
    text: "라커룸 정리를 안 한 게 걸렸다. 사실 {mentor} 선배가 마지막에 나갔다. 감독님이 우리 학년을 보며 물으신다. \"누구야?\"",
    choices: [
      { label: "제가 했습니다 (대신 혼난다)", fx: { coach: -1, rel: { mentor: 12 }, s: { "mental.teamwork": 1 } }, result: "운동장 다섯 바퀴. 다음 날 선배가 몰래 음료수를 줬다." },
      { label: "사실대로 말한다", fx: { coach: 1, rel: { mentor: -10 } }, result: "감독님은 고개를 끄덕이셨다. 선배와는 한동안 어색했다." },
    ] },
  { id: "junior_slump", who: "junior", needs: "junior",
    text: "형… 저 축구 그만둘까 봐요. 경기도 못 나가고 엄마도 공부하래요.",
    choices: [
      { label: "내 중1 얘기를 해 준다", fx: { rel: { junior: 12 }, s: { "mental.teamwork": 1, "student.attitude": 0.5 }, fatigue: 2 }, result: "{junior|이/가} 한참 듣더니 \"내일도 나올게요\" 했다." },
      { label: "감독님께 말해 보라고 한다", fx: { rel: { junior: 3 } }, result: "{junior|은/는} 고개만 끄덕였다." },
      { label: "\"오늘부터 나랑 같이 남아서 하자\"", req: { "rel.junior": 60 }, fx: { s: { "mental.teamwork": 0.6 }, fatigue: 3, rel: { junior: 5 } },
        result: "그날부터 훈련 끝나고 30분씩 같이 공을 찼다. 일주일 뒤 {junior|이/가} 먼저 말했다. \"형, 내일도 남을 거죠?\"" },
    ] },
  { id: "junior_ask", who: "junior", needs: "junior",
    text: "형, 저 왼발 슈팅 좀 봐 주시면 안 돼요? 10분만요.",
    choices: [
      { label: "30분 봐 준다", fx: { rel: { junior: 8 }, s: { "tech.shoot": 0.5, "mental.teamwork": 0.5 }, fatigue: 5 }, result: "가르치다 보니 내 자세도 고쳐졌다." },
      { label: "오늘은 피곤하다", fx: { rel: { junior: -5 }, fatigue: -3 }, result: "{junior|은/는} 혼자 골대 앞으로 갔다." },
    ] },
  { id: "coach_talk", who: "coach", cond: s => s.relations.coach < 45,
    text: "잠깐 와 봐라. 요즘 너 훈련 태도, 스스로는 어떻게 생각하냐?",
    choices: [
      { label: "솔직하게 부족했다고 말한다", fx: { coach: 4, s: { "student.attitude": 1 } }, result: "\"알면 됐다. 내일부터 보여 줘라.\"" },
      { label: "출전 기회를 달라고 한다", fx: { coach: -2, s: { "mental.confidence": 1 } }, result: "\"기회는 훈련에서 만드는 거다.\" 감독님은 그 말만 하셨다." },
      { label: "\"팀을 위해 제가 뭘 하면 될까요\"", req: { "rel.coach": 65 }, fx: { s: { "mental.teamwork": 0.5 }, coach: 3 },
        result: "감독님이 한참 나를 보셨다. \"그 질문을 하는 놈이 몇 없다.\" 수첩에 뭔가를 적으셨다." },
    ] },
  { id: "video_analysis", who: "assistant", cond: s => s.record.apps >= 3 && lastMatch(s)?.minutes > 0,
    text: "지난 경기에서 네가 나온 장면만 모아 봤다. 같이 볼래?",
    choices: [
      { label: "끝까지 같이 본다", fx: { s: { "mental.focus": 1.5 }, coach: 1, fatigue: -2 }, result: "실수한 장면을 다섯 번 돌려 봤다. 다음엔 안 그럴 것 같다." },
      { label: "잘한 장면만 보고 싶다", fx: { s: { "mental.confidence": 1 } }, result: "골 장면만 세 번 봤다. 기분은 좋다." },
      { label: "내 실수 장면을 직접 골라 온다", req: { "mental.focus": 62 }, fx: { s: { "mental.focus": 0.6, "tech.firstTouch": 0.3 }, coach: 2 },
        result: "실수 장면 다섯 개를 골라 갔다. 코치님이 놀라셨다. \"이걸 네가 먼저 찾아왔어?\" 그날 분석은 평소의 두 배로 길었다." },
    ] },
  { id: "palyeong_hike", date: [[9, 4]], cool: 70, who: "coach", when: { months: [3, 9, 12, 1] },
    text: "이번 주 체력 훈련은 팔영산이다. 정상까지 뛰어서 간다.",
    choices: [
      { label: "선두로 뛴다", fx: { s: { "phys.stamina": 1.5, "mental.competitive": 0.5 }, fatigue: 12, coach: 2 }, result: "정상에서 내려다본 다도해. 숨이 턱까지 찼지만 1등이었다." },
      { label: "페이스 조절한다", fx: { s: { "phys.stamina": 0.8 }, fatigue: 5 }, result: "중간쯤 들어왔다. 다리는 멀쩡하다." },
      { label: "정상까지 쉬지 않고 뛰어 1등을 한다", req: { "phys.stamina": 66 }, fx: { s: { "phys.stamina": 1, "mental.competitive": 0.4 }, fatigue: 8, coach: 2, morale: 2 },
        result: "팔영산 정상 바위에 제일 먼저 손을 댔다. 숨이 턱까지 찼지만, 아래로 다도해가 한눈에 들어왔다." },
    ] },
  // 경기에서 지면 다음 주에 자주 나옵니다 (엔진이 패배 직후 확률을 크게 올림)
  { id: "beach_training", bg: "ev_beach", who: "assistant", afterLoss: true, when: { months: [3, 4, 5, 6, 7, 8, 9, 10] },
    cond: s => { const m = s.record.matches.at(-1); return !!m && m.result === "패" && s.calendar.turn - m.turn <= 2; },
    text: () => pick(["지난 경기 그렇게 지고 그냥 넘어갈 순 없지. 오늘은 해변 모래 훈련이다. 다리 터질 각오 해라.",
      "진 경기는 모래가 기억하게 한다. 신발 벗고 따라와.", "오늘은 공 없다. 해변 끝까지 왕복이다. 지난 경기 실점 장면 떠올리면서 뛰어라."]),
    choices: [
      { label: "끝까지 버틴다", fx: { s: { "phys.strength": 1, "phys.agility": 0.8, "mental.competitive": 0.6 }, fatigue: 14, morale: 3 }, result: "모래에 발이 푹푹 빠진다. 마지막 왕복에서 다들 소리를 질렀다. 진 건 진 거고, 다음은 다음이다." },
      { label: "중간에 쉬었다 한다", fx: { s: { "phys.strength": 0.5 }, fatigue: 6 }, result: "파도 소리가 들렸다. 그래도 지난 경기 장면이 자꾸 떠올랐다." },
    ] },
  { id: "team_dinner", bg: "ev_dinner", who: "narr", once: true,
    cond: s => !(s.flags.lastCelebration && s.calendar.turn - s.flags.lastCelebration <= 6) && ((s.tour && !s.tour.alive && s.tour.grade === s.calendar.grade && s.calendar.turn - (s.record.matches.at(-1)?.turn ?? 0) <= 2)
      || (s.league?.finished && s.calendar.turn - (s.record.matches.at(-1)?.turn ?? 0) <= 2)),
    text: "대회가 끝나고 감독님이 삼겹살을 쏘신다고 했다. 마침 그날 가족 외식 약속이 있다.",
    choices: [
      { label: "팀 회식에 간다", fx: { s: { "mental.teamwork": 1.5 }, morale: 5, rel: { mentor: 3, friend: 3, junior: 3 } },
        result: s => s.calendar.grade === 3 ? "이번엔 내가 고기를 구웠다. 후배들이 젓가락을 들고 줄을 섰다." : "선배들이 고기를 구워 줬다. 처음으로 팀이 가족 같았다." },
      { label: "가족 외식에 간다", fx: { morale: 6, fatigue: -6 }, result: "엄마가 \"요즘 얼굴 좋아졌다\"며 웃었다." },
    ] },
  { id: "number_envy", who: "rival", needs: "rival", when: { grades: [2] },
    text: "내년에 10번 누가 달까? 난 이미 감독님한테 말해 놨다.",
    choices: [
      { label: "나도 노린다고 말한다", fx: { s: { "mental.competitive": 1 }, rel: { rival: 4 } }, result: "둘 다 웃었지만 눈은 웃고 있지 않았다." },
      { label: "번호는 상관없다고 한다", fx: { s: { "mental.focus": 0.5 } }, result: "{rival|이/가} \"너답다\" 하고 어깨를 쳤다." },
    ] },
  { id: "scout_rumor", bg: "ev_scout", who: "friend", needs: "friend", when: { grades: [3] }, cond: s => Object.keys(s.scouting || {}).length > 0,
    text: "야, 저번에 온 고등학교 감독님이 네 이름 물어봤다던데? 진짜야?",
    choices: [
      { label: "더 열심히 해야겠다", fx: { s: { "mental.confidence": 1 }, morale: 5 }, result: "괜히 그날 훈련 내내 몸이 가벼웠다." },
      { label: "괜히 부담된다", fx: { morale: -2, s: { "mental.focus": 0.5 } }, result: "잠자리에 누워서도 그 말이 맴돌았다." },
    ] },

  // ── 가족 ──────────────────────────────────────
  { id: "mom_birthday", who: "narr", once: true,
    text: "오늘이 엄마 생일이다. 훈련 끝나면 저녁 7시. 선물은 아직 못 샀다.",
    choices: [
      { label: "훈련을 일찍 마치고 케이크를 산다", fx: { morale: 8, coach: -1, fatigue: -4 }, result: "엄마가 울 것 같은 얼굴로 웃었다. 케이크 위 초가 흔들렸다." },
      { label: "편지를 써서 식탁에 둔다", fx: { morale: 5, s: { "student.academic": 0.5 } }, result: "다음 날 아침, 편지가 냉장고에 붙어 있었다." },
    ] },
  { id: "dad_busy", who: "dad", when: { months: [5, 9] }, cond: matchWeek,
    text: "이번 경기엔 일 때문에 못 가겠다. 미안하다. 대신 끝나면 전화해라.",
    choices: [
      { label: "괜찮다고 한다", fx: { morale: 1 }, result: "경기 끝나고 전화를 했다. 아빠는 점수를 이미 알고 있었다. 단톡방을 보고 있었던 거다." },
      { label: "서운하다고 말한다", fx: { morale: -3 }, result: "아빠가 한참 말이 없었다. 다음 주 경기엔 맨 앞줄에 계셨다.", fxAfter: { morale: 6 } },
    ] },
  { id: "mom_worry", who: "mom", cond: s => s.player.stats.student.academic < 45,
    text: "성적표 봤어. 축구도 좋지만… 엄마는 네가 공부를 아예 놓을까 봐 무서워.",
    choices: [
      { label: "주 1회는 꼭 공부하겠다고 약속한다", fx: { s: { "student.academic": 2 }, morale: 2 }, result: "엄마가 손가락을 걸자고 했다. 좀 유치했지만 걸었다." },
      { label: "축구로 성공하면 된다고 한다", fx: { morale: -4, s: { "mental.competitive": 0.5 } }, result: "엄마는 대답 대신 설거지를 시작했다." },
    ] },
  { id: "allowance", who: "mom",
    text: "이번 달 용돈이다. 아껴 써라.",
    choices: [
      { label: "닭가슴살과 단백질 음료를 산다", fx: { s: { "phys.strength": 0.6 }, morale: -1 }, result: "맛은 없다. 근데 형들이 다 이렇게 했다더라." },
      { label: "친구들과 PC방에 간다", fx: { morale: 6, fatigue: -4, rel: { friend: 4 } }, result: "오랜만에 크게 웃었다." },
      { label: "축구 영상 강의를 결제한다", fx: { s: { "mental.focus": 1, "tech.pass": 0.4 } }, result: "패스 각도 강의를 세 번 돌려 봤다." },
    ] },
  { id: "sibling_exam", date: [[11, 3]], who: "narr", once: true, when: { months: [11] },
    text: "이번 주는 고3 누나의 수능이다. 집안 분위기가 무겁다. 엄마가 이번 주엔 조용히 지내 달라고 했다.",
    choices: [
      { label: "누나 도시락 심부름을 한다", fx: { morale: 4, s: { "student.attitude": 1 } }, result: "수능 끝나고 누나가 축구화 끈을 사 줬다." },
      { label: "도서관에 늦게까지 남는다", fx: { s: { "student.academic": 2 }, fatigue: 3 }, result: "조용한 도서관이 의외로 잘 맞았다." },
    ] },
  // ── 경기 뒤 개인 면담 (urgent: 조건이 맞으면 다음 주에 먼저 찾아옴) ──
  { id: "co_scold", bg: "ev_office", urgent: true, who: "coach",
    cond: s => { const m = s.record.matches.at(-1); return m && m.turn >= s.calendar.turn - 1 && m.rating != null && m.rating < 5.9 && !m.elementary; },
    text: "감독실. 감독님께서 아무 말 없이 지난 경기 영상을 틀어 놓으셨다. 내가 공을 뺏기는 장면에서 화면이 멈춘다. \"이게 너냐?\"",
    choices: [
      { label: "변명 없이 끝까지 듣는다", fx: { coach: 4, morale: -4, s: { "mental.focus": 1 } }, result: "한 장면씩 짚으실 때마다 얼굴이 뜨거워졌다. 나올 때 감독님이 어깨를 한 번 두드리셨다." },
      { label: "\"컨디션이 안 좋았어요\"", fx: { coach: -3, morale: 2 }, result: "\"컨디션은 네가 만드는 거다.\" 감독님 목소리가 한 톤 낮아졌다." },
      { label: "다음 경기에서 보여 드리겠다고 한다", fx: { coach: 1, morale: -1, s: { "mental.competitive": 1.5 } }, result: "\"말은 쉽다. 훈련장에서 보자.\" 그래도 감독님 입꼬리가 아주 조금 올라간 것 같았다." },
    ] },
  { id: "co_scold_elem", urgent: true, who: "coach",
    cond: s => { const m = s.record.matches.at(-1); return m && m.turn >= s.calendar.turn - 1 && m.elementary && m.result !== "승" && !(m.reason || "").includes("부상"); },
    text: "{coach}: \"동생들한테 그 결과는 아니지. 다들 운동장 열 바퀴부터 돌고 와.\" 동기들이 한숨을 쉰다.",
    choices: [
      { label: "말없이 맨 앞에서 뛴다", fx: { coach: 3, fatigue: 8, s: { "phys.stamina": 1 } }, result: "맨 앞에서 뛰니 뒤에서 하나둘 속도를 맞춰 왔다. 열 바퀴째에 감독님이 고개를 끄덕이셨다." },
      { label: "동기들에게 같이 뛰자고 소리친다", fx: { fatigue: 6, rel: { friend: 4 }, s: { "mental.teamwork": 1.5 } }, result: "\"한 바퀴만 더!\" 소리가 운동장을 몇 번 돌았다. 다 뛰고 나니 이상하게 웃음이 났다." },
      { label: "\"걔네가 잘했던 거예요\"", fx: { coach: -4, morale: 2 }, result: "\"그래, 그럼 너희는 못한 거다.\" 다섯 바퀴가 더 붙었다." },
    ] },
  { id: "co_scold_attitude", bg: "ev_office", urgent: true, who: "coach",
    cond: s => { const m = s.record.matches.at(-1); return s.player.stats.student.attitude < 45 && m && m.turn >= s.calendar.turn - 1 && m.rating != null && m.rating < 6.5; },
    text: "{coach}: \"담임 선생님께 전화 받았다. 수업 시간에 엎드려 있다며. 경기장에서도 그게 보이더라.\"",
    choices: [
      { label: "잘못했다고 말씀드린다", fx: { coach: 3, s: { "student.attitude": 2 }, teacher: 2 }, result: "\"축구는 교실에서부터다.\" 짧은 말이 오래 남았다." },
      { label: "피곤해서 그랬다고 말한다", fx: { coach: -2, fatigue: -4 }, result: "\"다들 피곤하다.\" 감독님은 더 말씀하지 않으셨다. 그게 더 무서웠다." },
    ] },
  { id: "co_praise", bg: "ev_office", urgent: true, who: "coach",
    cond: s => { const m = s.record.matches.at(-1); return m && m.turn >= s.calendar.turn - 1 && m.rating != null && m.rating >= 8.0; },
    text: "훈련이 끝나고 감독님께서 부르셨다. \"앉아 봐라. 혼내려는 거 아니다. 지난 경기, 잘했다.\"",
    choices: [
      { label: "꾸벅 감사 인사를 한다", fx: { morale: 6, coach: 2 }, result: "\"고맙긴. 네가 한 거다.\" 짧은 한마디였는데, 집에 가는 길 내내 발걸음이 가벼웠다." },
      { label: "부족했던 점을 여쭤본다", fx: { coach: 4, s: { "mental.focus": 1.5 } }, result: "감독님이 한참 웃으셨다. \"그 질문이 나오는 게 네가 크는 이유다.\" 그리고 세 가지를 짚어 주셨다." },
      { label: "동료들 덕분이라고 말한다", fx: { coach: 2, rel: { friend: 3 }, s: { "mental.teamwork": 1.5 } }, result: "\"그 말, 팀 앞에서도 해라.\" 다음 날 훈련 전, 감독님이 내 말을 그대로 전하셨다." },
    ] },
  { id: "as_praise", urgent: true, who: "assistant",
    cond: s => { const m = s.record.matches.at(-1); return m && m.turn >= s.calendar.turn - 1 && m.decisions >= 4 && m.successes / m.decisions >= 0.75 && (m.rating ?? 0) < 8.0 && (s.eventLog?.as_praise == null || s.calendar.turn - s.eventLog.as_praise >= 20); },
    text: "코치님께서 태블릿을 내미셨다. \"지난 경기 네 선택만 쭉 모아 봤다. 이번엔 맞힌 게 더 많더라. 오늘은 칭찬할 거 위주다.\"",
    choices: [
      { label: "같이 본다", fx: { morale: 5, s: { "mental.confidence": 1.5 } }, result: "좋은 장면을 연달아 보니 어깨가 펴졌다. \"이게 네 기준이다. 여기서 내려가지 마라.\"" },
      { label: "실수한 장면도 보여 달라고 한다", fx: { coach: 2, s: { "mental.focus": 1.5 } }, result: "코치님이 잠깐 놀라시더니 실수 장면 두 개를 골라 주셨다. 고칠 게 분명해졌다." },
    ] },
  { id: "co_bench_talk", urgent: true, who: "coach",
    cond: s => { const ms = s.record.matches.filter(m => m.grade === s.calendar.grade).slice(-3); return ms.length === 3 && ms[2].turn >= s.calendar.turn - 1 && ms.every(m => ["bench", "out"].includes(m.status) && !m.reason); },
    text: "감독님께서 운동장 벤치 옆으로 부르셨다. \"세 경기째 너를 못 넣어 줬다. 서운하지?\"",
    choices: [
      { label: "솔직하게 서운하다고 한다", fx: { coach: 2, morale: 3 }, result: "\"그 마음 그대로 훈련에서 보여 줘라. 나는 거기서 정한다.\"" },
      { label: "아니라고, 괜찮다고 한다", fx: { morale: -2, s: { "mental.focus": 1 } }, result: "\"괜찮으면 안 되는 거다.\" 감독님은 그 말만 남기고 가셨다." },
      { label: "무엇을 더 하면 되는지 묻는다", fx: { coach: 4, s: { "mental.competitive": 1 } }, result: "감독님이 내 포지션에서 제일 필요한 것 하나를 짚어 주셨다. 이번 주 훈련 목표가 생겼다." },
    ] },

  // ── 소소한 학교생활 ──────────────────────────
  { id: "s_rain_pe", school: true, who: "narr", when: { months: [6, 7, 9] },
    text: "체육 시간에 비가 온다. 체육관에서 반 대항 피구를 한단다. 반 아이들이 축구부인 나를 쳐다본다.",
    choices: [
      { label: "에이스처럼 공을 던진다", fx: { morale: 5, rel: { friend: 3 } }, result: "세 명을 연달아 맞혔다. 축구부는 피구도 잘한다는 소문이 났다." },
      { label: "친구들이 던지게 양보한다", fx: { s: { "mental.teamwork": 1 }, teacher: 1 }, result: "공을 넘겨줬더니 평소 조용하던 친구가 마지막 한 명을 맞혔다. 반이 이겼다." },
      { label: "날아오는 공을 다 피해 끝까지 살아남는다", req: { "phys.agility": 60 }, fx: { s: { "phys.agility": 0.4 }, morale: 3 },
        result: "왼쪽, 오른쪽, 점프. 마지막 한 명이 될 때까지 아무도 나를 못 맞혔다. 반 아이들이 \"민첩성 실화냐\"며 웃었다." },
    ] },
  { id: "s_bag", who: "narr", cond: s => !!lastMatch(s),
    text: "원정 다녀오는 버스에서 내렸는데, 축구화 가방이 없다. 버스는 이미 떠났다.",
    choices: [
      { label: "코치님께 바로 연락한다", fx: { coach: -1, fatigue: 2 }, result: "코치님이 기사님께 전화해 주셨다. \"다음엔 내리기 전에 자리부터 한 번 돌아봐라.\"" },
      { label: "다음 날 일찍 가서 찾는다", fx: { fatigue: 4, s: { "student.attitude": 0.5 } }, result: "새벽같이 차고지에 갔더니 가방이 맨 뒷자리에 그대로 있었다." },
    ] },
  { id: "s_cooking", school: true, who: "narr", when: { grades: [1, 2] },
    text: "기술·가정 수행평가로 조별 요리를 한다. 우리 조 메뉴는 김치볶음밥. 조원들이 칼을 나에게 넘긴다.",
    choices: [
      { label: "자신 있게 칼을 잡는다", fx: { morale: 4, s: { "student.academic": 1 } }, result: "양파가 조금 굵었지만 맛은 괜찮았다. 선생님이 \"축구부 손맛 좋네\" 하셨다." },
      { label: "설거지 담당을 맡는다", fx: { s: { "student.attitude": 1.5 }, rel: { friend: 2 } }, result: "조원들이 요리하는 동안 묵묵히 설거지를 했다. 점수는 조원들이 챙겨 줬다." },
    ] },
  { id: "s_little", who: "narr",
    text: "훈련 끝나고 운동장을 나서는데, 초등학생 몇 명이 공을 들고 다가온다. \"형, 축구부죠? 슈팅 한 번만 보여 주세요!\"",
    choices: [
      { label: "몇 개 차 주고 같이 놀아 준다", fx: { morale: 6, fatigue: 3, s: { "mental.teamwork": 1 } }, result: "해가 질 때까지 공을 찼다. 꼬마들이 내 등번호를 외우고 갔다." },
      { label: "다음에 하자고 하고 집에 간다", fx: { fatigue: -3 }, result: "아쉬워하는 얼굴들이 자꾸 떠올랐다. 다음 주에 다시 와 보기로 했다." },
    ] },
  { id: "s_phone", who: "narr",
    text: "휴대폰을 떨어뜨렸다. 액정에 거미줄이 쫙 갔다. 엄마한테 말해야 한다.",
    choices: [
      { label: "바로 솔직하게 말한다", fx: { morale: -2, s: { "student.attitude": 1 } }, result: "엄마는 한숨을 쉬셨지만 혼내지는 않으셨다. \"대신 이번 달 용돈에서 반 낸다.\"" },
      { label: "케이스로 가리고 버틴다", fx: { morale: -3 }, result: "사흘 만에 들켰다. 엄마는 액정보다 거짓말에 더 화를 내셨다." },
    ] },
  { id: "s_vote", date: [[3, 4]], cool: 70, school: true, who: "narr", when: { months: [3, 9] },
    text: "학급 체육부장을 뽑는다. 누군가 \"축구부가 해야지!\" 하며 내 이름을 칠판에 적었다.",
    choices: [
      { label: "맡겠다고 한다", fx: { s: { "mental.teamwork": 1, "student.attitude": 1 }, fatigue: 3, teacher: 2 }, result: "체육 시간마다 준비물을 챙기느라 바빠졌다. 그래도 반 아이들과 훨씬 가까워졌다." },
      { label: "훈련 때문에 어렵다고 한다", fx: { fatigue: -2 }, result: "다른 친구가 맡았다. 조금 미안했지만 훈련에 집중하기로 했다." },
    ] },
  { id: "t_hallway", bg: "ev_hallway", who: "teacher", school: true, cond: s => { const m = s.record.matches.at(-1); return m && m.turn >= s.calendar.turn - 1; },
    text: "복도에서 {teacher}께서 부르신다. \"{given|아/야}, 지난 주말 경기 결과 봤다. 선생님도 축구 좀 아는 사람이야.\"",
    choices: [
      { label: "경기 이야기를 신나게 한다", fx: { teacher: 4, morale: 3 }, result: "선생님은 쉬는 시간이 끝날 때까지 들어 주셨다. \"다음 경기는 선생님도 보러 갈게.\"" },
      { label: "쑥스러워서 웃기만 한다", fx: { teacher: 2 }, result: "선생님이 웃으며 어깨를 두드리셨다. \"말 안 해도 다 안다.\"" },
    ] },
  { id: "t_essay", date: [[5, 2]], bg: "ev_classroom", who: "teacher", school: true, once: true, when: { months: [4, 5, 10] },
    text: "국어 시간, {teacher}께서 '나의 꿈'에 대해 한 쪽씩 써 오라고 하셨다. 집에 와서 원고지를 앞에 두고 한참을 앉아 있었다.",
    choices: [
      { label: "축구 선수의 꿈을 솔직하게 쓴다", fx: { teacher: 4, s: { "student.academic": 1, "mental.focus": 1 } }, result: "선생님이 빨간 펜으로 한 줄 남기셨다. \"꿈을 이렇게 구체적으로 쓴 글은 처음이다.\"" },
      { label: "축구 말고 다른 꿈도 함께 쓴다", fx: { teacher: 3, s: { "student.academic": 1.5 } }, result: "쓰다 보니 축구 말고도 해 보고 싶은 게 있었다. 선생님은 그 부분에 밑줄을 그어 주셨다." },
    ] },
  { id: "t_doze", who: "teacher", school: true, cond: s => s.player.condition.fatigue >= 55,
    text: "5교시 국어 시간. 눈꺼풀이 자꾸 내려온다. {teacher}께서 내 책상 옆을 지나가시다 멈추셨다.",
    choices: [
      { label: "벌떡 일어나 뒤에 서서 듣는다", fx: { teacher: 3, s: { "student.attitude": 1 }, fatigue: 2 }, result: "\"그래, 그 정신이면 됐다.\" 반 아이들이 킥킥 웃었다." },
      { label: "그대로 엎드린다", fx: { teacher: -4, fatigue: -5, s: { "student.attitude": -1.5 } }, result: "종이 울리고 나서야 일어났다. 선생님은 아무 말씀 없이 출석부에 뭔가를 적으셨다." },
    ] },
  { id: "t_lunch", who: "teacher", school: true,
    text: "급식 줄에서 {teacher}께서 배식을 도와주고 계신다. 내 식판을 보시더니 \"운동하는 애가 이것만 먹어?\" 하신다.",
    choices: [
      { label: "한 국자 더 받는다", fx: { teacher: 2, fatigue: -3 }, result: "선생님이 고기반찬을 한 국자 더 얹어 주셨다. 오후 훈련이 든든했다." },
      { label: "다이어트 중이라고 농담한다", fx: { teacher: 1, morale: 2 }, result: "\"축구부가 무슨 다이어트야.\" 선생님이 웃으며 반찬을 두 배로 주셨다." },
    ] },

  // ── 학교 행사 (data/calendar.js 의 SCHOOL_DAYS 일정에 맞춰 반드시 나옴) ──
  { id: "retreat", bg: "ev_retreat", fixed: true, who: "narr",
    text: "수련회 첫날 밤, 레크리에이션 시간. 반 아이들이 \"축구부니까 네가 나가!\" 하며 등을 떠민다.",
    choices: [
      { label: "무대에 나간다", fx: { morale: 8, s: { "mental.teamwork": 1, "mental.confidence": 1 }, rel: { friend: 6 } }, result: "다리 찢기를 하다 바지가 터졌다. 반 아이들이 바닥을 굴렀다. 이제 다들 내 이름을 안다." },
      { label: "끝까지 안 나간다", fx: { fatigue: -4 }, result: "다른 애가 끌려 나갔다. 무사히 넘어갔는데, 조금 아쉬운 것도 같다." },
      { label: "몰래 숙소 앞에서 줄넘기", fx: { s: { "phys.stamina": 1, "student.attitude": -1.5 }, fatigue: 3 }, result: "교관 선생님한테 걸렸다. 벌로 숙소 앞 청소. 그래도 천 개는 채웠다." },
    ] },
  { id: "singapore", bg: "ev_singapore", fixed: true, who: "narr",
    text: "싱가포르 국제교류. 현지 학교 운동장에서 그쪽 친구들이 공을 차고 있다. 한 명이 손짓을 한다. 말은 잘 안 통한다.",
    choices: [
      { label: "영어로 먼저 말을 건다", fx: { s: { "student.academic": 2, "mental.confidence": 1.5 }, morale: 5 }, result: "\"Do you play football?\" 떨리는 첫마디에 걔가 웃었다. 그날 저녁 SNS 친구가 하나 생겼다." },
      { label: "공으로 대화한다", fx: { s: { "tech.dribble": 1, "mental.teamwork": 1 }, morale: 6 }, result: "헛다리 한 번에 다들 소리를 질렀다. 축구는 어디서나 통한다." },
      { label: "멀리서 구경한다", fx: { fatigue: -8 }, result: "그늘에 앉아 쉬었다. 습하고 더운 공기 속에서 남의 축구를 보는 것도 나쁘지 않았다." },
    ] },
  { id: "sportsday", bg: "ev_sportsday", fixed: true, who: "teacher",
    text: "고흥 연합 체육대회 날. 다른 학교 축구부 애들도 보인다. {teacher}께서 부르신다. \"{given|아/야}, 반 대항 계주 마지막 주자 해 볼래?\"",
    choices: [
      { label: "마지막 주자를 맡는다", fx: { s: { "phys.speed": 0.8, "student.attitude": 1 }, morale: 7, fatigue: 6, teacher: 3 },
        hurt: { p: 0.05, type: "hamstring", cause: "체육대회 계주 마지막 코너에서 허벅지 뒤가 당겼다.", result: "마지막 코너에서 허벅지가 뚝 하고 당겼다. 1등은 했는데, 결승선을 지나 주저앉았다." },
        result: "마지막 코너에서 다른 학교 축구부를 제쳤다. 반 아이들이 운동장으로 뛰어나왔다." },
      { label: "응원단장을 한다", fx: { s: { "mental.teamwork": 1.5 }, morale: 5, teacher: 2, rel: { friend: 4 } }, result: "목이 쉬도록 소리를 질렀다. 반이 2등을 했다." },
      { label: "다칠까 봐 빠진다", fx: { fatigue: -5, teacher: -2 }, result: "다칠까 봐 빠졌다. 반 단톡방이 조용했다." },
    ] },
  { id: "harmony_camp", bg: "bg_home", fixed: true, who: "teacher",
    text: "1학기 마지막 날, 대서어울림문화캠프. 학교에서 하룻밤을 잔다. 밤 11시, {teacher}께서 손전등을 들고 복도를 도신다. \"{given|아/야}, 아직 안 자냐?\"",
    choices: [
      { label: "선생님께 고민을 꺼낸다", fx: { s: { "mental.focus": 1, "mental.confidence": 1 }, teacher: 8 }, result: "복도 창가에 나란히 섰다. 선생님은 끝까지 듣기만 하셨다. \"넌 생각보다 단단한 애야.\" 그 말이 오래 남았다." },
      { label: "친구들과 밤새 논다", fx: { morale: 10, fatigue: 8, rel: { friend: 6 } }, result: "교실 바닥에 이불을 깔고 새벽까지 웃었다. 내일부터 방학이다." },
      { label: "일찍 잔다", fx: { fatigue: -8 }, result: "다음 주부터 하계훈련이다. 눈을 감자마자 잠들었다." },
    ] },
  { id: "summer_camp", bg: "bg_field_day", fixed: true, who: "coach",
    text: "{coach}: \"이번 주는 합숙이다. 휴대폰 걷는다. 하계대회 전까지 몸을 만든다.\" 이번 주 훈련은 효과가 크게 오르고 피로도 더 쌓인다. 어디에 집중할까?",
    choices: [
      { label: "기술 (볼 터치, 슈팅)", fx: { camp: true, s: { "tech.firstTouch": 1, "tech.shoot": 1, "tech.dribble": 1 }, fatigue: 6 }, result: "하루 천 번 볼 터치. 공이 발에 붙기 시작했다." },
      { label: "체력 (오르막 달리기)", fx: { camp: true, s: { "phys.stamina": 1.5, "phys.speed": 1 }, fatigue: 10 }, result: "팔영산 오르막을 다섯 번 뛰었다. 토할 것 같았는데, 다리가 단단해졌다." },
      { label: "전술 (영상 분석, 포지션 훈련)", fx: { camp: true, s: { "position": 0.8, "mental.focus": 1 }, fatigue: 4, coach: 2 }, result: "밤마다 상대 팀 영상을 봤다. 감독님이 내 질문을 마음에 들어 하셨다." },
    ] },
  { id: "winter_camp", bg: "bg_field_day", fixed: true, who: "coach",
    text: "{coach}: \"동계훈련이다. 곧 3학년 형들 없이 처음 나가는 대회다. 이번 합숙에서 팀을 새로 만든다.\" 어디에 집중할까?",
    choices: [
      { label: "기술 (볼 터치, 슈팅)", fx: { camp: true, s: { "tech.firstTouch": 1, "tech.shoot": 1, "tech.pass": 1 }, fatigue: 6 }, result: "손이 얼어도 공은 차진다. 한겨울 운동장에서 슈팅 500개." },
      { label: "체력 (모래사장 달리기)", fx: { camp: true, s: { "phys.stamina": 1.5, "phys.strength": 1 }, fatigue: 10 }, result: "겨울 바다 모래사장을 달렸다. 바람이 칼 같았다." },
      { label: "전술 (새 포메이션)", fx: { camp: true, s: { "position": 0.8, "mental.teamwork": 1 }, fatigue: 4, coach: 2 },
        result: s => s.calendar.grade === 1 ? "새로 맞춘 포메이션. 형들이 비운 자리를 우리 1학년이 메워야 한다." : "새로 맞춘 포메이션. 후배들 자리를 잡아 주는 게 내 몫이 됐다." },
    ] },
  { id: "school_trip", bg: "ev_schooltrip", fixed: true, who: "narr",
    text: "수학여행 둘째 날 저녁, 노을 지는 광화문 광장을 걷는다. 앞서 걷던 {friend|이/가} 뒤돌아 묻는다. \"너 고등학교 가서도 축구 할 거야?\"",
    choices: [
      { label: "진지하게 답한다", fx: { s: { "mental.focus": 1.5, "mental.confidence": 1 }, rel: { friend: 5 } }, result: "말로 하니까 오히려 분명해졌다. 왜 이걸 하는지, 어디까지 가고 싶은지." },
      { label: "웃어넘긴다", fx: { morale: 6 }, result: "\"모르지~\" 하고 웃었다. 하늘이 온통 주황색이었다. 지금은 그걸로 됐다." },
      { label: "같은 질문을 되묻는다", fx: { rel: { friend: 8 }, s: { "mental.teamwork": 1 } }, result: "{friend}의 꿈 얘기를 처음 들었다. 3년 동안 몰랐던 게 많았다." },
    ] },
  { id: "ski_camp", bg: "ev_ski", fixed: true, who: "coach",
    text: s => s.calendar.grade === 3 ? "스키캠프 출발 전. 감독님께서 3학년만 따로 부르셨다. \"고등학교 가기 전에 다치면 너희만 손해다. 알아서들 해라.\""
      : "스키캠프 출발 전. 감독님께서 축구부만 따로 부르셨다. \"다치면 동계대회 없다. 알아서들 해라.\"",
    choices: [
      { label: "상급 코스에 도전한다", fx: { morale: 9, s: { "mental.competitive": 1.5, "phys.agility": 0.5 } },
        hurt: { p: 0.14, type: "ankle", cause: "스키캠프 상급 코스에서 넘어지며 발목이 돌아갔다.", result: "세 번째로 내려올 때 넘어졌다. 발목이 돌아갔다. 감독님 얼굴이 떠올랐다." },
        result: "넘어지지 않고 끝까지 내려왔다. 다리가 후들거렸지만 짜릿했다." },
      { label: "초급 코스에서 천천히", fx: { morale: 5 }, result: "친구들과 엉거주춤 내려왔다. 다들 웃느라 정신이 없었다." },
      { label: "숙소에서 쉰다", fx: { fatigue: -10, morale: -2 }, result: "창밖으로 친구들이 스키 타는 걸 봤다. 몸은 편했다." },
    ] },
  { id: "festival", bg: "ev_festival", fixed: true, who: "narr",
    text: s => s.calendar.grade === 3 ? "봉두예술제. 축구부 장기자랑 무대가 잡혔다. 후배들이 나를 쳐다본다. \"형이 센터 해 주세요.\""
      : "봉두예술제. 축구부 장기자랑 무대가 잡혔다. 선배가 나를 가리킨다. \"센터는 너다.\"",
    choices: [
      { label: "춤을 맡는다", fx: { morale: 9, s: { "mental.confidence": 1.5, "mental.teamwork": 1 }, fatigue: 4 }, result: "연습 일주일, 무대 3분. 강당이 떠나가라 함성이 터졌다. 영상이 학교 전체에 돌았다." },
      { label: "뒤에서 소품을 맡는다", fx: { s: { "student.attitude": 1.5, "mental.teamwork": 1 }, teacher: 2 },
        result: s => `조명과 소품을 맡았다. 무대가 끝나고 ${s.calendar.grade === 3 ? "후배들이" : "선배가"} 제일 먼저 나를 찾았다.` },
      { label: "객석에서 본다", fx: { fatigue: -5 }, result: "다른 반 공연을 보며, 한 해가 끝나 간다는 걸 실감했다." },
    ] },
  { id: "graduation", bg: "ev_graduation", fixed: true, who: "narr",
    text: s => {
      const g = s.calendar.grade, m = s.relations.people?.mentor;
      const leaving = m && ((m.cohort === "3학년선배" && g === 1) || (m.cohort === "2학년선배" && g === 2));
      const cap = CAPTAINS[g] || "주장";
      if (leaving && m.value >= 60) return `졸업식 날. ${m.name} 선배가 낡은 축구화 한 켤레를 건넨다. "이거 신고 여기까지 왔다. 이제 네 차례다."`;
      if (leaving) return `졸업식 날. 3학년 선배들이 꽃다발을 들고 운동장에 모였다. ${m.name} 선배가 어깨를 툭 친다. "잘해라."`;
      return `졸업식 날. 3학년 선배들이 꽃다발을 들고 운동장에 모였다. 주장 ${cap} 선배가 후배들을 한 명씩 안아 준다.`;
    },
    choices: [
      { label: "고개 숙여 인사한다", fx: { s: { "mental.focus": 1 }, morale: 4 }, result: "선배들이 교문을 나간다. 동계대회는 우리끼리다. 내일부터 방학이다." },
      { label: "\"꼭 다시 같이 뛰어요\"", fx: { s: { "mental.competitive": 1 }, morale: 6 }, result: "\"고등학교 와라. 기다린다.\" 선배가 웃었다." },
    ] },
  { id: "graduation_me", bg: "ev_graduation", fixed: true, who: "teacher",
    text: s => {
      const t = s.relations.teacher ?? 50;
      return t >= 70 ? "졸업식. 마지막 종례 시간에 {teacher}께서 한 명씩 이름을 부르며 손편지를 주신다. 내 편지는 다른 애들 것보다 두 장이나 더 길다."
        : t >= 45 ? "졸업식. 마지막 종례 시간에 {teacher}께서 한 명씩 이름을 부르며 손편지를 주신다."
        : "졸업식. 마지막 종례 시간에 {teacher}께서 한 명씩 손편지를 주신다. 나한테 주실 때 잠깐 망설이시는 것 같았다.";
    },
    choices: [
      { label: "편지를 펼친다", fx: { morale: 5 }, result: "마지막 줄까지 다 읽었다. 고개를 들 수가 없었다." },
      { label: "집에 가서 읽기로 한다", fx: { morale: 3 }, result: "가방 맨 안쪽에 편지를 넣었다. 운동장을 한 바퀴 돌고 교문을 나섰다." },
    ] },


  // ── 생일 주간 (js/engine/birthday.js, rollEvent) ──
  { id: "bday_team", bg: "ev_birthday", fixed: true, who: "friend",
    text: s => s.calendar.grade === 1
      ? "훈련이 끝나고 라커룸 불이 갑자기 꺼졌다. 어둠 속에서 촛불 하나가 다가온다. 입단하고 처음 맞는 생일인데, 다들 어떻게 알았지?"
      : s.calendar.grade === 3 ? "훈련이 끝나고 라커룸 불이 꺼졌다. 이번엔 후배들까지 줄을 서서 노래를 부른다. 중학교에서 맞는 마지막 생일이다."
      : "훈련이 끝나고 라커룸 불이 꺼졌다. 작년에 당한 걸 알면서도 또 당했다. {friend|이/가} 케이크를 들고 웃고 있다.",
    choices: [
      { label: "소원을 빌고 촛불을 끈다", fx: { morale: 5, s: { "mental.confidence": 0.8 } },
        result: s => s.calendar.grade === 3 ? "소원은 말하지 않았다. 다들 안다는 얼굴이었다. 촛불이 꺼지자 박수가 길게 이어졌다." : "눈을 감았다. 소원은 비밀이다. 대충 짐작은 가겠지만." },
      { label: "케이크를 {friend} 얼굴에 먼저 묻힌다", fx: { morale: 7, rel: { friend: 5 }, coach: -1 },
        result: "선제공격은 성공했다. 그 뒤로 라커룸이 생크림 범벅이 됐고, 다음 날 아침 정 코치님께 단체로 혼났다. 그래도 다들 웃고 있었다." },
      { label: "한 조각씩 직접 잘라 돌린다", fx: { s: { "mental.teamwork": 1.2 }, morale: 4, rel: { mentor: 2, junior: 3 } },
        result: s => s.calendar.grade === 1 ? "선배들부터 돌렸다. \"막내가 센스 있네.\" 마지막 조각은 크림만 남았지만 괜찮았다." : "후배들 것부터 크게 잘랐다. 내 몫은 제일 작았는데, 이상하게 제일 달았다." },
    ] },
  { id: "bday_home", bg: "ev_birthday_home", fixed: true, who: "mom",
    text: "방학 중에 맞은 생일. 훈련 끝나고 집에 들어서니 거실 불이 꺼져 있다. 엄마 아빠가 케이크를 들고 서 있고, 식탁 위에 포장지에 싸인 상자가 하나 놓여 있다.",
    choices: [
      { label: "소원을 빌고 상자를 연다", fx: { morale: 6, fatigue: -4 },
        result: "새 정강이 보호대였다. 아빠가 \"이번엔 네 등번호 박아 왔다\"며 웃었다. 엄마는 사진을 스무 장쯤 찍었다." },
      { label: "\"고맙습니다\" 하고 먼저 안아 드린다", fx: { morale: 5, s: { "student.attitude": 1, "mental.focus": 0.5 } },
        result: "엄마가 잠깐 말을 못 했다. 아빠는 괜히 창밖을 봤다. 그날 미역국은 두 그릇을 먹었다." },
    ] },

  // ── 우승·준우승 축하: 대회가 끝난 뒤 며칠 안에 반드시 찾아옴 (js/engine/events.js rollEvent) ──
  { id: "cel_league", bg: "ev_dinner", fixed: true, who: "coach",
    text: s => `${s.celebration?.label || "주말리그"} 우승 기념 회식 날. 감독님께서 읍내 고깃집을 통째로 빌리셨다. "오늘은 아무도 칼로리 계산 안 한다." 불판마다 삼겹살이 지글거리고, 우승 트로피는 상추 바구니 옆에 놓였다.`,
    choices: [
      { label: "후배들 먼저 챙긴다", fx: { s: { "mental.teamwork": 1.5 }, morale: 6, rel: { junior: 4, friend: 3 } },
        result: s => s.calendar.grade === 1 ? "막내라고 뒷정리부터 하려는데 선배가 손을 붙잡았다. \"우승한 날은 막내도 먹는 거다.\" 처음으로 팀 사진 한가운데 앉았다."
          : "후배들 접시부터 채웠다. 정작 내 접시는 마지막까지 비어 있었는데, 이상하게 배가 불렀다." },
      { label: "감독님 옆자리에 앉는다", fx: { coach: 5, s: { "mental.focus": 1 }, morale: 4 },
        result: "감독님은 거의 드시지 않고 사이다만 드셨다. \"우승은 오늘까지만 기뻐해라. 내일부터 너희는 쫓기는 팀이다.\" 그 말이 이상하게 좋았다." },
      { label: "소감 한마디 하라는 말에 일어선다", fx: { s: { "mental.confidence": 1.5 }, morale: 5, rel: { mentor: 2, friend: 2 } },
        result: s => s.flags.captain ? "주장답게 일어섰다. \"우리가 잘해서가 아니라, 같이 해서 이긴 겁니다.\" 정 코치님이 제일 크게 박수를 치셨다."
          : "일어서자마자 머리가 하얘졌다. \"어… 고기 맛있습니다!\" 고깃집이 떠나가게 웃음이 터졌다. 그날 별명이 하나 생겼다." },
    ] },
  { id: "cel_national", bg: "ev_welcome", fixed: true, who: "teacher",
    // 전국대회는 방학 중에 열리므로, 학교로 돌아오는 버스 장면으로 (방학이어도 어색하지 않게)
    text: s => `${s.celebration?.label || "전국대회"} 우승컵을 싣고 고흥으로 돌아오는 길. 버스가 교문 앞에 서자 현수막이 보였다. "축 우승 고흥대서중 축구부". 교장 선생님과 부모님들이 박수를 치고, 맨 앞줄에서 류봉두 선생님이 휴대폰을 들고 계신다.`,
    choices: [
      { label: "버스에서 내려 크게 인사한다", fx: { s: { "mental.confidence": 2 }, morale: 8, teacher: 2 },
        result: "\"응원해 주셔서 감사합니다!\" 목소리가 운동장 끝까지 울렸다. 엄마가 제일 크게 손을 흔들었다." },
      { label: "류봉두 선생님 목에 메달을 걸어 드린다", fx: { teacher: 8, morale: 6, s: { "student.attitude": 1 } },
        result: "선생님은 한참 메달을 내려다보셨다. \"이거 국어 시간에 쓴 글보다 무겁네.\" 그 사진이 학교 홈페이지 첫 화면에 올라갔다." },
      { label: "반 단톡방에 메달 사진을 올린다", fx: { morale: 7, rel: { friend: 5 }, fatigue: -4 },
        result: "답장이 순식간에 백 개를 넘겼다. 반장이 \"교실 칠판에 '우리 반 전국 챔피언'이라고 써 놓겠다\"며 약속했다." },
    ] },
  { id: "cel_runnerup", bg: "ev_jjajang", fixed: true, who: "coach",
    text: s => `${s.celebration?.label || "대회"} 준우승. 돌아오는 길에 감독님께서 버스를 중국집 앞에 세우셨다. "자장면 곱빼기, 탕수육은 테이블마다 하나씩." 목에 건 은메달이 자꾸 그릇에 부딪힌다.`,
    choices: [
      { label: "웃으며 곱빼기를 비운다", fx: { morale: 6, fatigue: -6, rel: { friend: 2, junior: 2 } },
        result: "누군가 \"내년엔 여기서 탕수육 두 개 먹자\"고 했다. 다들 웃었다. 진 날인데도 이상하게 배부른 저녁이었다." },
      { label: "메달을 만지작거리며 결승을 떠올린다", fx: { s: { "mental.competitive": 1.5, "mental.focus": 0.5 }, morale: 2 },
        result: "결승 마지막 10분이 머릿속에서 자꾸 다시 돌아갔다. 감독님이 옆에 앉으며 말씀하셨다. \"그 기분, 잊지 마라. 그게 다음 대회 연료다.\"" },
    ] },

  // ── 류봉두의 축복: 선생님과의 관계가 70 이상이면 학기마다 한 번, 무작위로 찾아옴 (js/engine/events.js) ──
  { id: "t_blessing", bg: "ev_classroom", fixed: true, who: "teacher",
    text: "방과 후, {teacher}께서 국어실로 부르셨다. \"이번 학기 내내 운동장에서도 교실에서도 손을 놓지 않더라. 선생님이 주는 선물이다.\" 작은 봉투 안에 손글씨 쪽지가 한 장 들어 있다.",
    choices: [
      { label: "고개 숙여 감사드린다", fx: { blessing: true, teacher: 2 },
        result: s => `쪽지에는 한 줄이 적혀 있었다. "너는 이미 충분히 잘하고 있다." 그날부터 이상하게 몸이 가벼웠다. ✨ 류봉두의 축복: ${s.lastBlessing || "능력치"} 상승` },
      { label: "\"왜 저한테 주세요?\" 하고 여쭌다", fx: { blessing: true, teacher: 2 },
        result: s => `"선생님 눈에는 다 보이거든." 선생님이 웃으며 쪽지를 접어 주머니에 넣어 주셨다. ✨ 류봉두의 축복: ${s.lastBlessing || "능력치"} 상승` },
    ] },
  // ── 류봉두 선생님 ──────────────────────────────
  { id: "t_diary", bg: "ev_classroom", fixed: true, who: "teacher",
    text: "생활 일기 첫 장에 {teacher}께서 빨간 펜으로 한 줄을 남기셨다. \"운동장에서 네 목소리가 제일 크더라. 교실에서도 들려줄래?\"",
    choices: [
      { label: "답을 적는다", fx: { teacher: 6, s: { "student.attitude": 1 } }, result: "\"수업 시간에도 크게 말해 볼게요.\" 다음 날 일기장에 웃는 얼굴이 그려져 있었다." },
      { label: "그냥 넘긴다", fx: {}, result: "일기장을 덮었다. 선생님은 다음 주에도 한 줄을 남기셨다." },
    ] },
  { id: "t_sixth", who: "teacher", school: true, weight: 1.3, cond: s => s.player.condition.fatigue >= 55,
    text: "6교시 국어 시간. 새벽 훈련 때문에 눈꺼풀이 무겁다. {teacher}께서 시를 읽고 계신다.",
    choices: [
      { label: "허벅지를 꼬집으며 버틴다", fx: { s: { "student.academic": 1, "mental.focus": 0.5 }, fatigue: 2, teacher: 2 }, result: "끝까지 버텼다. 선생님이 지나가며 책상을 톡 두드리셨다. 칭찬인지 경고인지 모르겠다." },
      { label: "엎드린다", fx: { fatigue: -6, teacher: -4, s: { "student.attitude": -1 } }, result: "깨어 보니 종이 울렸다. 칠판에 '피곤해도 국어는 국어다'라고 적혀 있었다." },
      { label: "손을 들고 질문한다", fx: { s: { "student.academic": 1.5, "mental.confidence": 0.5 }, teacher: 5 }, result: "\"이 시는 왜 바다 얘기만 해요?\" 반 아이들이 웃었다. 선생님은 그 질문으로 남은 20분을 쓰셨다." },
    ] },
  { id: "t_presentation", bg: "ev_classroom", fixed: true, who: "teacher",
    text: "{teacher}: \"다음 주 목요일 국어 수행평가, 발표다. 빠지면 대체 과제는 없어.\" 그런데 그날 오후 고등학교 팀과 연습경기가 잡혔다. 고등학교 감독님이 보러 오신다고 한다.",
    choices: [
      { label: "감독님께 말씀드리고 발표한다", fx: { s: { "student.academic": 2, "student.attitude": 2 }, coach: -2, teacher: 6 }, result: "발표를 마치고 운동장으로 뛰어갔다. 경기는 끝나 있었다. 감독님은 \"공부도 경기다\" 한마디만 하셨다." },
      { label: "연습경기에 간다", fx: { s: { "student.academic": -2, "position": 0.4 }, coach: 3, teacher: -5 }, result: "후반에 들어가 열심히 뛰었다. 다음 날 국어 시간, 선생님과 눈이 마주치지 않았다." },
      { label: "발표를 미리 녹화해 내게 해 달라고 부탁한다", fx: { s: { "student.academic": 1 }, fatigue: 12, teacher: 3, coach: 1 },
        result: s => (s.relations.teacher ?? 50) >= 60
          ? "선생님이 웃으셨다. \"이번 한 번만이다.\" 새벽 2시까지 녹화를 했다. 둘 다 지켰다."
          : "\"규칙은 규칙이야.\" 결국 발표는 놓쳤다. 밤새 준비한 영상만 남았다." },
      { label: "점심시간에 먼저 발표하게 해 달라고 부탁드린다", req: { "rel.teacher": 65 }, fx: { s: { "student.academic": 0.8 }, teacher: 2, coach: 1 },
        result: "{teacher}께서 웃으며 허락하셨다. \"평소에 성실했으니까 가능한 거야.\" 발표도 하고, 연습경기도 뛰었다." },
    ] },
  { id: "t_book", date: [[10, 2]], who: "teacher", school: true, once: true, when: { grades: [2], months: [9, 10, 11] },
    text: "{teacher}께서 책 한 권을 건네신다. 축구 선수가 쓴 에세이다. \"읽고 한 줄만 써 와. 숙제 아니야.\"",
    choices: [
      { label: "그 주 안에 다 읽는다", fx: { s: { "mental.focus": 1, "student.academic": 1.5, "mental.confidence": 0.5 }, teacher: 6 }, result: "\"재능은 출발선일 뿐이다\"에 밑줄을 그었다. 그 문장을 써서 드렸다." },
      { label: "나중에 읽는다", fx: { teacher: -1 }, result: "책은 가방 속에서 한 달을 보냈다. 선생님은 아무 말도 안 하셨다." },
    ] },
  { id: "t_injured", who: "teacher", school: true, weight: 2.5, cond: s => !!s.player.condition.injury && s.player.condition.injury.total >= 3,
    text: "다리를 절며 교무실 앞을 지나가는데 {teacher}께서 부르신다. \"운동 못 하는 동안 뭐 할 거냐.\"",
    choices: [
      { label: "공부 계획을 말한다", fx: { s: { "student.academic": 1.5 }, morale: 4, teacher: 5 }, result: "선생님이 문제집 한 권을 꺼내 주셨다. \"다 풀면 가져와.\" 다리 대신 머리를 쓰는 몇 주가 됐다." },
      { label: "모르겠다고 한다", fx: { morale: 2, teacher: 2 }, result: "\"모르는 게 당연해. 근데 가만히 있지는 마.\" 선생님이 어깨를 두드리셨다." },
    ] },
  { id: "t_report", who: "teacher", weight: 3, cond: s => !!s.lastExam && s.calendar.turn - s.lastExam.turn <= 2 && s.lastExam.score < 50,
    text: "시험 성적표가 나왔다. {teacher}께서 교무실로 부르신다. \"축구 그만두라는 얘기 아니다. 둘 다 하라는 거다.\"",
    choices: [
      { label: "같이 계획을 짠다", fx: { s: { "student.academic": 2.5, "student.attitude": 1 }, teacher: 6, fatigue: 3 }, result: "훈련 없는 저녁 두 번은 공부하기로 했다. 선생님이 달력에 동그라미를 쳐 주셨다." },
      { label: "고개만 끄덕인다", fx: { teacher: -2 }, result: "고개만 끄덕이고 교무실을 나왔다. 문을 닫고 나서야 한숨이 나왔다." },
    ] },
  { id: "t_counsel", fixed: true, who: "teacher",
    text: s => {
      const st = s.player.stats.student;
      return st.attitude >= 65 && st.academic >= 55
        ? "3자 진로 상담. 엄마, {teacher}, 그리고 나. 선생님이 생활기록부를 펼치신다. \"3년 동안 성실했어요. 고등학교에서도 이런 건 다 봅니다.\" 엄마 눈가가 빨개진다."
        : "3자 진로 상담. 엄마, {teacher}, 그리고 나. 선생님이 생활기록부를 펼치시더니 잠깐 말을 고르신다. \"운동은 정말 열심히 했어요. 다만…\" 엄마가 내 쪽을 본다.";
    },
    choices: [
      { label: "내 생각을 먼저 말한다", fx: { s: { "mental.confidence": 1.5, "student.attitude": 1 }, teacher: 5, morale: 4 }, result: "가고 싶은 학교와 이유를 말했다. 엄마와 선생님이 동시에 고개를 끄덕이셨다." },
      { label: "어른들 이야기를 듣는다", fx: { s: { "mental.focus": 1 }, teacher: 2 }, result: "고등학교 이야기가 내 머리 위로 오갔다. 끝나고 엄마가 떡볶이를 사 주셨다." },
    ] },
  // ── 추가 이벤트 86개 (data/events2.js) ──
  ...EVENTS_MORE,
  ...EVENTS_STORY,
];

// 주장 선거 (중3 3월 2주차에 반드시 일어남). 결과는 엔진이 계산합니다.
export const CAPTAIN_EVENT = {
  id: "captain_vote", who: "coach",
  text: "올해 주장을 뽑는다. 3학년들, 스스로 하고 싶은 사람 있으면 손 들어라.",
  choices: [
    { label: "손을 든다", run: true },
    { label: "다른 친구를 추천한다", run: false },
  ],
};
