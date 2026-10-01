// 일상 메시지. 한 주가 끝나면 가끔 하나씩 옵니다. 자유롭게 고치거나 더하셔도 됩니다.
//
// from : mom 엄마, dad 아빠, teacher 담임, coach 감독, assist 코치, group 단톡방, news 고흥 소식,
//        friend 단짝 친구, rival 라이벌, mentor 멘토 선배, junior 후배
// when : months 달 / grades 학년 (없으면 언제나)
// cond : 게임 상태를 보고 true일 때만
// body 안의 {name} 나, {friend} {rival} {mentor} {junior} {mate} 동료, {coach} {assistant} {teacher}
// {name|이/가} 처럼 쓰면 받침에 맞는 조사가 붙습니다.

export const LIFE = [
  // ── 엄마 ──
  { id: "mom_food", from: "mom", title: "냉장고 열어 봐", body: "닭가슴살 삶아 놨어. 운동하는 애가 컵라면만 먹으면 안 돼.\n\n밥은 꼭 두 공기 먹고 자." },
  { id: "mom_rain", from: "mom", when: { months: [6, 7, 8] }, title: "우산 챙겼어?", body: "오후에 비 온대. 훈련 끝나고 젖은 채로 버스 타지 말고 엄마 부르고." },
  { id: "mom_cold", from: "mom", when: { months: [12, 1, 2] }, title: "목도리", body: "현관에 목도리 걸어 놨다. 운동장 바람 장난 아니라던데. 감기 걸리면 너만 손해야." },
  { id: "mom_laundry", from: "mom", title: "유니폼", body: "주황색 유니폼 흙물이 안 빠진다. 다음부터 벗자마자 물에 담가 놔. 엄마 손목 나간다 😅" },
  { id: "mom_proud", from: "mom", cond: s => (s.record.goals || 0) >= 3, title: "아빠가 자랑하더라", body: "아빠가 회사에서 네가 넣은 골 영상 보여 주고 다닌대. 모르는 척해 줘. 엄청 좋아하신다." },
  { id: "mom_sleep", from: "mom", cond: s => s.player.condition.fatigue >= 50, title: "불 끄고 자", body: "새벽 1시에 방에 불 켜져 있던데. 휴대폰 보는 거 다 안다. 키는 자는 동안 큰대." },
  { id: "mom_exam", from: "mom", when: { months: [4, 6, 9, 11] }, title: "시험 기간이지?", body: "시험 끝나면 먹고 싶은 거 말해. 고기든 회든. 대신 이번 주는 폰 엄마한테 맡기자." },
  // ── 아빠 ──
  { id: "dad_watch", from: "dad", title: "이번 주 경기", body: "이번 주는 아빠가 꼭 보러 간다. 관중석에서 소리 지르는 아저씨 있으면 아빠다. 창피해하지 마라." },
  { id: "dad_boots", from: "dad", cond: s => s.calendar.turn > 10, title: "축구화", body: "축구화 밑창 다 닳았더라. 주말에 순천 가서 새로 하나 보자. 너무 비싼 건 안 된다." },
  { id: "dad_fish", from: "dad", when: { months: [9, 10] }, title: "녹동항", body: "주말에 녹동항 가서 전어 먹자. 가을 전어는 집 나간 며느리도 돌아온다더라. 너도 훈련 끝나고 와라." },
  { id: "dad_talk", from: "dad", cond: s => s.player.condition.morale < 45, title: "아빠도 그랬다", body: "아빠도 고등학교 때 2년 동안 벤치만 지켰다. 그때 그만뒀으면 지금 너한테 할 말도 없었겠지.\n\n밥 먹고 산책이나 하자." },
  // ── 친구 ──
  { id: "fr_pcroom", from: "friend", title: "ㅋㅋㅋ", body: "야 오늘 훈련 끝나고 PC방 ㄱ? 1시간만. 너 피파 실력 좀 보자. 실제랑 다른지 ㅋㅋ" },
  { id: "fr_homework", from: "friend", title: "수학 숙제 몇 쪽까지야", body: "나 진짜 몰라서 묻는 거임. 62쪽까지? 64쪽까지? 빨리 답 좀 ㅠ" },
  { id: "fr_goal", from: "friend", cond: s => s.record.matches.at(-1)?.goals > 0, title: "야 미쳤다", body: "오늘 골 영상 단톡에 돌던데 ㅋㅋㅋ 반 애들 다 봄. 내일 학교 오면 사인해 줘라" },
  { id: "fr_bench", from: "friend", cond: s => s.record.matches.at(-1)?.status === "bench", title: "괜찮냐", body: "오늘 경기 못 뛰었다며. 다음엔 뛰겠지. 떡볶이 먹으러 가자. 내가 산다." },
  { id: "fr_crush", from: "friend", title: "비밀인데", body: "옆 반 걔가 너 축구하는 거 보러 운동장 왔었대. 진짜임. 나한테 들었다고 하지 마라 ㅋㅋ" },
  { id: "fr_cafe", from: "friend", when: { months: [7, 8] }, title: "덥다", body: "더워 죽겠다. 너 훈련 끝나면 편의점 앞에서 아이스크림 먹자. 바닷바람 맞으면서." },
  // ── 라이벌 ──
  { id: "rv_challenge", from: "rival", title: "내일 일찍 나와", body: "내일 아침 7시 운동장. 슈팅 100개 누가 더 넣나 내기. 지는 사람 음료수." },
  { id: "rv_respect", from: "rival", cond: s => s.record.matches.at(-1)?.rating >= 7.5, title: "…", body: "오늘 좀 하더라. 인정은 오늘만 한다." },
  { id: "rv_number", from: "rival", when: { grades: [2] }, title: "내년에", body: "내년에 등번호 고를 때 10번은 내 거다. 미리 말해 둔다." },
  // ── 멘토 선배 ──
  { id: "mt_tip_first", from: "mentor", title: "첫 터치", body: "공 받기 전에 어깨 너머로 한 번 봐라. 받고 나서 보면 늦다. 이것만 고쳐도 반은 간다." },
  { id: "mt_tip_rest", from: "mentor", cond: s => s.player.condition.fatigue >= 60, title: "형 말 들어", body: "나도 1학년 때 매일 개인훈련 했다가 발목 나갔다. 쉬는 것도 훈련이다. 이번 주 하루는 그냥 자라." },
  { id: "mt_shoes", from: "mentor", title: "축구화 끈", body: "경기 전에 축구화 끈 두 번 묶어라. 나 작년 결승에서 끈이 풀려서 결정적인 찬스를 놓쳤다. 아직도 생각난다." },
  { id: "mt_exam", from: "mentor", when: { months: [4, 6, 9, 11] }, title: "성적표 나왔냐", body: "형 작년에 공부 안 해서 대회 하나 못 나갔다. 너는 그러지 마라. 진짜 후회한다." },
  // ── 후배 ──
  { id: "jr_thanks", from: "junior", title: "형!!", body: "형 오늘 알려 주신 대로 해 봤는데 코치님이 잘했다고 하셨어요!! 감사합니다 ㅠㅠ" },
  { id: "jr_ask", from: "junior", title: "질문 있어요", body: "형 혹시 왼발 연습 어떻게 하셨어요? 저 왼발로 차면 공이 자꾸 옆으로 가요…" },
  { id: "jr_scared", from: "junior", title: "형 저 내일 선발이래요", body: "떨려서 잠이 안 와요. 형은 처음 선발 때 어땠어요?" },
  // ── 담임 선생님 ──
  { id: "tc_notice", from: "teacher", title: "가정통신문", body: "내일까지 가정통신문 회신서 가져오기. 축구부라고 안 봐준다. 어머님 서명 꼭 받아 오고." },
  { id: "tc_cleaning", from: "teacher", title: "청소 당번", body: "이번 주 교실 청소 당번이다. 훈련 때문에 바쁜 건 아는데, 반 친구들이 대신하면 서운하겠지?" },
  { id: "tc_book", from: "teacher", title: "이번 주 한 문장", body: "\"넘어지는 건 실패가 아니다. 그대로 누워 있는 게 실패다.\"\n\n국어 시간에 읽은 문장인데, 너 생각나서 보낸다." },
  { id: "tc_good", from: "teacher", cond: s => (s.relations.teacher ?? 50) >= 65, title: "수업 시간에", body: "요즘 수업 시간에 눈빛이 달라졌더라. 피곤할 텐데 대단하다. 선생님이 다 보고 있어." },
  { id: "tc_seat", from: "teacher", when: { months: [3, 9] }, title: "자리 바꾸기", body: "이번 달 자리 바꾼다. 창가 자리 원하면 일찍 와. 운동장 보이는 자리 좋아하잖아." },
  // ── 감독·코치 ──
  { id: "co_video", from: "assist", title: "영상 보내 줌", body: "지난 경기에서 네가 나온 장면만 잘라서 단톡에 올렸다. 공 받기 전 위치를 봐라. 반 발짝만 앞에 있었으면 됐다." },
  { id: "co_early", from: "coach", cond: s => s.relations.coach >= 65, title: "내일 15분 일찍", body: "내일 훈련 15분 일찍 나와라. 따로 할 얘기 있다. 혼나는 거 아니다." },
  { id: "co_diet", from: "assist", title: "음료수 그만", body: "운동장 옆 자판기 탄산 그만 마셔라. 다 보인다. 물 마셔라 물." },
  { id: "co_weather", from: "assist", when: { months: [7, 8] }, title: "폭염 주의", body: "낮 훈련은 4시 이후로 미룬다. 물병 두 개 챙겨라. 어지러우면 바로 말하고." },
  { id: "co_quote", from: "coach", title: "한마디", body: "잘하는 선수는 많다. 끝까지 하는 선수는 적다. 오늘 훈련에서 끝까지 뛴 사람이 누군지 나는 안다." },
  // ── 단톡방 ──
  { id: "gp_bus", from: "group", title: "버스 시간 공지", body: "{assistant}: 이번 주 원정 버스 7시 30분 학교 정문 출발. 늦으면 놓고 간다. 진짜로.\n\n{mate}: 넵!!\n\n{mate2}: 7시 30분 실화냐…" },
  { id: "gp_birthday", from: "group", title: "생일 축하 🎂", body: "{mate}: 오늘 {mate2} 생일임!!\n\n{mentor}: 축하한다. 내일 훈련 끝나고 초코우유 돌린다.\n\n{mate2}: 형 감사합니다 ㅠㅠ" },
  { id: "gp_meme", from: "group", title: "ㅋㅋㅋㅋ", body: "{mate}: (어제 연습경기에서 헛발질하는 {mate2} 사진)\n\n{mate2}: 야 지워라\n\n{mate}: 이미 프사함 ㅋㅋ" },
  { id: "gp_lost", from: "group", title: "분실물", body: "{assistant}: 운동장에 정강이 보호대 한 짝 떨어져 있었다. 이름 없음. 주인 찾아가라.\n\n{mate}: 저거 {mate2} 거 같은데요" },
  { id: "gp_rain", from: "group", when: { months: [6, 7, 8, 9] }, title: "우천 훈련", body: "{assistant}: 오늘 비 와서 체육관에서 한다. 실내화 챙겨.\n\n{mate}: 풋살 하나요?!\n\n{assistant}: 체력이다." },
  // ── 고흥 소식 ──
  { id: "nw_yuja", from: "news", when: { months: [11, 12] }, title: "고흥 유자 수확철", body: "고흥 유자 수확이 한창이다. 엄마가 유자차 담근다고 주말에 손 좀 보태라고 하셨다." },
  { id: "nw_rocket", from: "news", title: "나로우주센터 소식", body: "나로우주센터에서 발사 준비 소식이 들려왔다. 반 아이들이 그날 운동장에서 하늘을 보자고 난리다." },
  { id: "nw_palyeong", from: "news", when: { months: [4, 5, 10] }, title: "팔영산 산행", body: "주말에 팔영산 등산하는 사람들이 많다. 감독님이 '다음 체력 훈련은 저기다'라고 하셨다는 소문이 돈다." },
  { id: "nw_fest", from: "news", when: { months: [10] }, title: "지역 축제", body: "읍내에서 축제가 열린다. 단톡방이 '훈련 몇 시에 끝나요'로 도배됐다." },
];

// 경기 뒤 단톡방 대화 (결과와 내 활약에 따라)
export const AFTER_MATCH = {
  win: [
    "{mate}: 이겼다!!!! 😆\n\n{mate2}: 오늘 수비 미쳤다",
    "{mate}: 3점 챙겼다 ㅋㅋ\n\n{mentor}: 들뜨지 마라. 다음 경기 준비",
    "{mate2}: 오늘 버스에서 노래 틀어도 됨?\n\n{assistant}: 한 곡만.",
    "{mate}: 편의점 들렀다 가자 ㅋㅋ\n\n{mentor}: 탄산은 안 된다",
    "{mate2}: 오늘 골 장면 다시 보고 싶다\n\n{mate}: 코치님이 찍으셨대 월요일에 보여 준대",
  ],
  draw: [
    "{mate}: 아 아깝다 진짜\n\n{mate2}: 마지막에 그거 들어갔어야 했는데",
    "{mentor}: 비긴 경기는 진 경기라고 생각해라. 월요일에 다시 보자",
    "{mate2}: 승점 1점이라도 챙긴 게 어디냐\n\n{mentor}: 그 1점이 나중에 순위 가른다",
    "{mate}: 골대만 두 번 맞혔네 ㅠ\n\n{mate2}: 운이 다음 경기로 미뤄진 거임",
    "{assistant}: 오늘 비긴 거 아무도 탓하지 마라. 다음 주 수요일 영상 미팅 있다",
  ],
  loss: [
    "{mate}: …\n\n{mentor}: 다들 고개 들어. 우리 아직 안 끝났다",
    "{mate2}: 오늘 내가 실수했다 미안\n\n{mate}: 아니야 다 같이 진 거야",
    "{mate}: 버스 안 너무 조용하다\n\n{assistant}: 오늘은 그냥 쉬어라. 월요일에 다시 한다",
    "{mentor}: 오늘 진 거 기억해 둬라. 다음에 똑같이 갚으면 된다",
    "{mate2}: 배고픈데 밥이 안 넘어감\n\n{mate}: 그래도 먹어라 내일 회복훈련이다",
  ],
  myGoal: [
    "{mate}: {name} 골 뭐냐 ㅋㅋㅋㅋ 영상 있는 사람\n\n{mate2}: 내가 찍음 올림",
    "{mentor}: {name} 오늘 잘했다. 근데 세리머니는 연습 좀 해라",
    "{mate2}: {name} 골 넣고 어디로 뛰어간 거임 ㅋㅋ\n\n{mate}: 관중석에 엄마 계셨대",
    "{assistant}: {name}, 골 장면 위치 선정 좋았다. 다음에도 그 자리에 서 있어라",
  ],
  myBad: [
    "{rival}: 오늘 {name} 컨디션 안 좋던데\n\n{friend}: 그런 날도 있지 ㅋ 다음 경기 보자",
    "{friend}: {name} 괜찮냐? 오늘 너무 신경 쓰지 마라\n\n{mentor}: 다들 한 번씩 그런 날 있다",
    "{mentor}: {name}, 오늘 거 다시 보지 말고 일찍 자라. 내일 이야기하자",
  ],
};
