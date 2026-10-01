// 랜덤 이벤트. 한 주가 끝날 때 가끔 하나씩 일어납니다.
//
// who   : 말하는 사람 (coach 감독, assistant 코치, teacher 담임, mom 엄마, dad 아빠,
//         friend 친구, rival 라이벌, mentor 멘토 선배, junior 후배, narr 해설)
// when  : grades 학년, months 달 (없으면 아무 때나)
// needs : 이 사람이 있어야 일어남 (friend, rival, mentor, junior)
// cond  : 추가 조건 (게임 상태를 보고 true/false)
// weight: 뽑힐 확률 비중 (기본 1) / once: true면 한 번만
// text  : 상황. {name} 나, {friend} {rival} {mentor} {junior} 각 인물, {coach} {assistant} {teacher}
// choices: label 선택지, fx 효과, result 결과 문장
//   fx: s 능력치 {"tech.shoot": 1}, fatigue 피로, morale 사기, coach 감독 신뢰, rel 관계 {friend: 5}

export const EVENTS = [
  // ── 학교생활 ──────────────────────────────────
  { id: "group_project", who: "friend", needs: "friend", weight: 1.2,
    text: "야, 사회 수행평가 모둠 과제 이번 주까지래. 우리 둘이 같은 모둠인데… 너 훈련 끝나고 시간 돼?",
    choices: [
      { label: "밤에 같이 끝내자", fx: { s: { "student.academic": 2, "student.attitude": 1 }, fatigue: 8, rel: { friend: 6 } }, result: "밤 11시까지 편의점 테이블에서 PPT를 만들었다. 발표 점수가 꽤 잘 나왔다." },
      { label: "미안, 너가 좀 해 줘", fx: { s: { "student.attitude": -1.5 }, rel: { friend: -8 } }, result: "{friend|이/가} 혼자 다 했다. 발표 날 눈을 안 마주친다." },
    ] },
  { id: "sports_day", who: "teacher", when: { months: [5, 10] }, once: false,
    text: "{name|아/야}, 체육대회 반 대항 계주 마지막 주자 좀 맡아 줄래? 축구부니까 다들 너 믿고 있어.",
    choices: [
      { label: "맡겠습니다", fx: { s: { "student.attitude": 1.5, "phys.speed": 0.5 }, fatigue: 6, morale: 6 }, result: "마지막 코너에서 두 명을 제쳤다. 반 애들이 운동장으로 뛰어나왔다." },
      { label: "다치면 안 돼서요…", fx: { s: { "student.attitude": -0.5 }, fatigue: -3 }, result: "선생님은 웃으며 괜찮다고 했지만, 반 단톡방은 조용했다." },
    ] },
  { id: "phone_confiscated", who: "teacher", cond: s => s.player.stats.student.attitude < 60,
    text: "수업 중에 하이라이트 영상을 보다가 {teacher}께 걸렸다. \"휴대폰은 종례 때 찾아가.\"",
    choices: [
      { label: "죄송합니다. 반성문 쓰겠습니다", fx: { s: { "student.attitude": 1.5 } }, result: "반성문 한 장. 선생님이 \"다음엔 쉬는 시간에 봐\" 하고 돌려주셨다." },
      { label: "축구 공부였다고 말한다", fx: { s: { "student.attitude": -2 }, morale: -3 }, result: "변명이 통하지 않았다. 감독님 귀에도 들어갔다.", fxAfter: { coach: -2 } },
    ] },
  { id: "class_president", who: "teacher", when: { months: [3] }, once: true, cond: s => s.player.stats.student.attitude >= 60,
    text: "반장 선거에 너를 추천하는 애들이 있더라. 운동하면서 할 수 있겠니?",
    choices: [
      { label: "해 보겠습니다", fx: { s: { "student.attitude": 3, "mental.teamwork": 1 }, fatigue: 5 }, result: "반장이 됐다. 아침 조회를 맡게 됐다. 바쁘지만 뿌듯하다." },
      { label: "운동에 집중할게요", fx: { morale: 2 }, result: "선생님은 고개를 끄덕였다. \"그래, 그것도 용기야.\"" },
    ] },
  { id: "field_trip", who: "narr", when: { months: [5, 10] }, once: false,
    text: "학년 체험학습 날. 나로우주센터 견학이다. 그런데 그날 오후에 팀 자율 훈련이 잡혀 있다.",
    choices: [
      { label: "체험학습에 끝까지 간다", fx: { morale: 8, fatigue: -8, s: { "student.academic": 1 } }, result: "로켓 발사대 앞에서 친구들과 사진을 찍었다. 오랜만에 축구 생각이 안 났다." },
      { label: "오후엔 빠져서 훈련한다", fx: { s: { "position": 0.6 }, coach: 1.5, morale: -3 }, result: "혼자 운동장에 남아 슈팅 50개. 감독님이 멀리서 보고 계셨다." },
    ] },
  { id: "late_school", who: "narr", cond: s => s.player.condition.fatigue >= 55,
    text: "아침 알람을 세 번 껐다. 눈을 뜨니 8시 25분.",
    choices: [
      { label: "택시 타고 간다 (용돈 손해)", fx: { morale: -2 }, result: "겨우 출석. 이번 달 용돈이 반으로 줄었다." },
      { label: "지각하고 혼난다", fx: { s: { "student.attitude": -2 }, fatigue: -6 }, result: "벌점 1점. 그래도 몸은 좀 개운하다. 피로가 쌓였다는 신호다." },
    ] },
  { id: "library_book", who: "teacher", when: { grades: [1, 2] },
    text: "도서관에 새로 들어온 축구 선수 자서전 있던데, 읽어 볼래? 독후감 쓰면 수행평가에도 들어가.",
    choices: [
      { label: "빌려서 읽는다", fx: { s: { "mental.focus": 1, "student.academic": 1.5, "mental.confidence": 0.5 }, fatigue: -2 }, result: "\"남들이 쉴 때 한 번 더 찼다\"는 문장에 밑줄을 그었다." },
      { label: "시간 없어서 패스", fx: {}, result: "책은 다른 반 친구가 빌려 갔다." },
    ] },
  { id: "exam_night", who: "friend", needs: "friend", cond: s => s.player.stats.student.academic < 60, when: { months: [4, 6, 10, 11] },
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
    ] },
  { id: "night_shooting", who: "coach", cond: s => s.relations.coach >= 55,
    text: "너, 남아서 슈팅 100개 찰 수 있냐? 다른 애들한테는 말 안 했다.",
    choices: [
      { label: "100개 차겠습니다", fx: { s: { "tech.shoot": 2, "mental.confidence": 0.5 }, fatigue: 14, coach: 3 }, result: "다리가 후들거렸지만 마지막 10개가 제일 잘 들어갔다." },
      { label: "오늘은 너무 지쳤습니다", fx: { fatigue: -4, coach: -1 }, result: "\"그래, 몸이 먼저다.\" 말은 그렇게 하셨지만 아쉬운 표정이었다." },
    ] },
  { id: "torn_boots", who: "narr",
    text: "축구화 밑창이 떨어졌다. 새 축구화는 20만 원이 넘는다.",
    choices: [
      { label: "엄마한테 말한다", fx: { morale: 3, rel: {} }, result: "엄마가 한숨을 쉬더니 주말에 같이 순천 가자고 했다. 새 축구화, 발이 가볍다.", fxAfter: { s: { "tech.firstTouch": 0.5 } } },
      { label: "테이프 감고 버틴다", fx: { s: { "mental.competitive": 0.8 }, morale: -2 }, result: "흰 테이프를 칭칭 감았다. 형들이 웃었지만 상관없다." },
    ] },
  { id: "pro_match", who: "dad", when: { months: [4, 5, 9, 10] },
    text: "이번 주말에 광양 가서 프로 경기 볼래? 표 두 장 생겼다.",
    choices: [
      { label: "같이 간다", fx: { s: { "mental.focus": 1, "mental.confidence": 0.5 }, morale: 8, fatigue: -5 }, result: "같은 포지션 선수만 90분 내내 봤다. 공 없을 때 움직임이 전혀 달랐다." },
      { label: "훈련하겠다고 한다", fx: { s: { "position": 0.5 }, morale: -2 }, result: "아빠는 \"그래, 다음에 가자\" 하고 혼자 웃었다." },
    ] },
  { id: "rival_bench", who: "rival", needs: "rival", cond: s => s.relations.people?.rival,
    text: "이번 주 연습경기에 감독님이 나를 네 자리에 세운대. 미안하다, 근데 양보 안 한다.",
    choices: [
      { label: "\"나도 안 진다\"", fx: { s: { "mental.competitive": 1.5 }, rel: { rival: 6 }, morale: 2 }, result: "둘 다 웃었다. 그날 미니게임은 거의 싸움이었다." },
      { label: "속으로 삭인다", fx: { morale: -5, s: { "mental.focus": 0.5 } }, result: "말없이 축구화 끈만 다시 맸다." },
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
    ] },
  { id: "senior_mistake", who: "narr", needs: "mentor", when: { grades: [1, 2] },
    text: "라커룸 정리를 안 한 게 걸렸다. 사실 {mentor} 선배가 마지막에 나갔다. 감독님이 1학년들을 보며 묻는다. \"누구야?\"",
    choices: [
      { label: "제가 했습니다 (대신 혼난다)", fx: { coach: -1, rel: { mentor: 12 }, s: { "mental.teamwork": 1 } }, result: "운동장 다섯 바퀴. 다음 날 선배가 몰래 음료수를 줬다." },
      { label: "사실대로 말한다", fx: { coach: 1, rel: { mentor: -10 } }, result: "감독님은 고개를 끄덕였다. 선배와는 한동안 어색했다." },
    ] },
  { id: "junior_slump", who: "junior", needs: "junior",
    text: "형… 저 축구 그만둘까 봐요. 경기도 못 나가고 엄마도 공부하래요.",
    choices: [
      { label: "내 중1 얘기를 해 준다", fx: { rel: { junior: 12 }, s: { "mental.teamwork": 1, "student.attitude": 0.5 }, fatigue: 2 }, result: "{junior|이/가} 한참 듣더니 \"내일도 나올게요\" 했다." },
      { label: "감독님께 말해 보라고 한다", fx: { rel: { junior: 3 } }, result: "{junior|은/는} 고개만 끄덕였다." },
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
      { label: "출전 기회를 달라고 한다", fx: { coach: -2, s: { "mental.confidence": 1 } }, result: "\"기회는 훈련에서 만드는 거다.\" 감독님은 그 말만 했다." },
    ] },
  { id: "video_analysis", who: "assistant", cond: s => s.record.apps >= 3,
    text: "지난 경기 네 장면만 모아 봤다. 같이 볼래?",
    choices: [
      { label: "끝까지 같이 본다", fx: { s: { "mental.focus": 1.5 }, coach: 1, fatigue: -2 }, result: "실수한 장면을 다섯 번 돌려 봤다. 다음엔 안 그럴 것 같다." },
      { label: "잘한 장면만 보고 싶다", fx: { s: { "mental.confidence": 1 } }, result: "골 장면만 세 번 봤다. 기분은 좋다." },
    ] },
  { id: "palyeong_hike", who: "coach", when: { months: [3, 9, 12, 1] },
    text: "이번 주 체력 훈련은 팔영산이다. 정상까지 뛰어서 간다.",
    choices: [
      { label: "선두로 뛴다", fx: { s: { "phys.stamina": 1.5, "mental.competitive": 0.5 }, fatigue: 12, coach: 2 }, result: "정상에서 내려다본 다도해. 숨이 턱까지 찼지만 1등이었다." },
      { label: "페이스 조절한다", fx: { s: { "phys.stamina": 0.8 }, fatigue: 5 }, result: "중간쯤 들어왔다. 다리는 멀쩡하다." },
    ] },
  // 경기에서 지면 다음 주에 자주 나옵니다 (엔진이 패배 직후 확률을 크게 올림)
  { id: "beach_training", who: "assistant", afterLoss: true, when: { months: [3, 4, 5, 6, 7, 8, 9, 10] },
    cond: s => { const m = s.record.matches.at(-1); return !!m && m.result === "패" && s.calendar.turn - m.turn <= 2; },
    text: "어제 그렇게 지고 그냥 넘어갈 순 없지. 오늘은 해변 모래 훈련이다. 다리 터질 각오 해라.",
    choices: [
      { label: "끝까지 버틴다", fx: { s: { "phys.strength": 1, "phys.agility": 0.8, "mental.competitive": 0.6 }, fatigue: 14, morale: 3 }, result: "모래에 발이 푹푹 빠진다. 마지막 왕복에서 다들 소리를 질렀다. 진 건 진 거고, 다음은 다음이다." },
      { label: "중간에 쉬었다 한다", fx: { s: { "phys.strength": 0.5 }, fatigue: 6 }, result: "파도 소리가 들렸다. 그래도 어제 경기 장면이 자꾸 떠올랐다." },
    ] },
  { id: "team_dinner", who: "narr", when: { months: [6, 8, 2] },
    text: "대회가 끝나고 감독님이 삼겹살을 쏘신다고 했다. 마침 그날 가족 외식 약속이 있다.",
    choices: [
      { label: "팀 회식에 간다", fx: { s: { "mental.teamwork": 1.5 }, morale: 5, rel: { mentor: 3, friend: 3, junior: 3 } }, result: "선배들이 고기를 구워 줬다. 처음으로 팀이 가족 같았다." },
      { label: "가족 외식에 간다", fx: { morale: 6, fatigue: -6 }, result: "엄마가 \"요즘 얼굴 좋아졌다\"며 웃었다." },
    ] },
  { id: "number_envy", who: "rival", needs: "rival", when: { grades: [2] },
    text: "내년에 10번 누가 달까? 난 이미 감독님한테 말해 놨다.",
    choices: [
      { label: "나도 노린다고 말한다", fx: { s: { "mental.competitive": 1 }, rel: { rival: 4 } }, result: "둘 다 웃었지만 눈은 웃고 있지 않았다." },
      { label: "번호는 상관없다고 한다", fx: { s: { "mental.focus": 0.5 } }, result: "{rival|이/가} \"너답다\" 하고 어깨를 쳤다." },
    ] },
  { id: "scout_rumor", who: "friend", needs: "friend", when: { grades: [3] }, cond: s => Object.keys(s.scouting || {}).length > 0,
    text: "야, 저번에 온 고등학교 감독님이 너 이름 물어봤다던데? 진짜야?",
    choices: [
      { label: "더 열심히 해야겠다", fx: { s: { "mental.confidence": 1 }, morale: 5 }, result: "괜히 그날 훈련이 가볍다." },
      { label: "괜히 부담된다", fx: { morale: -2, s: { "mental.focus": 0.5 } }, result: "잠자리에 누워서도 그 말이 맴돌았다." },
    ] },

  // ── 가족 ──────────────────────────────────────
  { id: "mom_birthday", who: "narr", once: true,
    text: "오늘이 엄마 생일이다. 훈련 끝나면 저녁 7시. 선물은 아직 못 샀다.",
    choices: [
      { label: "훈련을 일찍 마치고 케이크를 산다", fx: { morale: 8, coach: -1, fatigue: -4 }, result: "엄마가 울 것 같은 얼굴로 웃었다. 케이크 위 초가 흔들렸다." },
      { label: "편지를 써서 식탁에 둔다", fx: { morale: 5, s: { "student.academic": 0.5 } }, result: "다음 날 아침, 편지가 냉장고에 붙어 있었다." },
    ] },
  { id: "dad_busy", who: "dad", when: { months: [5, 9] },
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
  { id: "sibling_exam", who: "narr", when: { months: [11] },
    text: "누나가 고3 수능이다. 집안 분위기가 무겁다. 엄마가 이번 주엔 조용히 지내 달라고 했다.",
    choices: [
      { label: "누나 도시락 심부름을 한다", fx: { morale: 4, s: { "student.attitude": 1 } }, result: "수능 끝나고 누나가 축구화 끈을 사 줬다." },
      { label: "도서관에서 늦게까지 있는다", fx: { s: { "student.academic": 2 }, fatigue: 3 }, result: "조용한 도서관이 의외로 잘 맞았다." },
    ] },
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
