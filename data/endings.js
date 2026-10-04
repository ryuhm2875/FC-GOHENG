// 엔딩. 위에서부터 차례로 조건을 확인해, 먼저 맞는 엔딩이 나옵니다.
// grade: S, A, B, C, D, 숨겨진(H), 전설(L)
// img: assets/img/ 안의 엔딩 그림 이름
// cond(c): c는 엔진이 계산한 3년 요약 (아래 career.js의 summarize 참고)
// story(c): 엔딩 문장. 줄바꿈은 \n

// 받침이 있는지 (조사 고르기)
const batchim = w => { const c = String(w).charCodeAt(String(w).length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; };

export const ENDINGS = [
  { id: "legend", grade: "L", title: "레전드", img: "ending_legend",
    cond: c => c.captain && c.wore10 && c.nationalChampion && c.nationalTeam,
    story: c => `주장 완장, 등번호 10번, 전국대회 우승 트로피, 그리고 태극마크.\n\n고흥대서중 운동장 한쪽 벽에 ${c.name}의 이름이 새겨졌다. 후배들은 지금도 그 앞을 지나며 한 번씩 고개를 든다.\n\n${c.schoolName}에서 시작될 다음 이야기는, 이미 많은 사람이 기다리고 있다.`,
    later: c => `스무 살 겨울, 프로 데뷔전. 등번호는 여전히 10번이다.\n\n경기가 끝나고 휴대폰을 켜니 고흥대서중 축구부 단톡방이 난리가 나 있었다. 이제는 얼굴도 모르는 후배들이 경기 캡처를 올리고 있다.\n\n다음 주말엔 운동장에 들러 공 몇 개 차 주기로 했다.` },

  { id: "national", grade: "S", title: "청소년 국가대표", img: "ending_national",
    cond: c => c.nationalTeam,
    story: c => `U-15 대표팀 소집 명단, 맨 아래에 ${c.name}의 이름이 있었다.\n\n고흥에서 파주까지는 버스로 다섯 시간. 창밖을 보다가 입단 첫날 측정표가 떠올랐다. 그때 그 숫자들이 여기까지 왔다.\n\n봄에는 ${c.schoolName} 유니폼을 입는다.`,
    later: c => `대표팀 훈련장 라커룸. 옆자리 선수가 묻는다. "고흥? 거기서도 축구를 해?"\n\n웃으며 대답했다. "바다 보이는 운동장이 있어. 바람이 세서 공이 자꾸 밀려."\n\n그 바람 덕분에 크로스 하나는 누구보다 낮게 찬다.` },

  { id: "pro", grade: "S", title: "프로 유스 입단", img: "ending_pro",
    cond: c => c.tier === "proYouth",
    story: c => `${c.schoolName}의 하얀 훈련복을 받았다. 가슴에 프로 구단 엠블럼이 박혀 있다.\n\n중학교 3년 동안 ${c.apps}경기, ${c.goals}골. 숫자보다 오래 남는 건 비 오는 날 혼자 남아 찼던 슈팅들이다.\n\n이제부터는 매일이 시험이다.`,
    later: c => `프로 2군 경기장. 관중석은 듬성듬성하지만 맨 앞줄 아저씨 목소리는 크다. 아빠다.\n\n아직 1군 명단에 오른 적은 없다. 대신 한 번도 훈련에 늦은 적이 없다.\n\n코치가 그 이야기를 감독에게 했다는 소문이 돈다.` },

  { id: "comeback", grade: "H", title: "역전의 아이콘", img: "ending_highschool",
    cond: c => c.wasBenchInG1 && c.g3StartRatio >= 0.85 && c.g3Rating >= 7.6 && c.ovr >= 70,
    story: c => `중1 때는 벤치에서 물통을 날랐다. 경기 명단에 이름이 없는 날이 더 많았다.\n\n중3, ${c.nameEun} 팀에서 가장 먼저 이름이 불리는 선수가 됐다. 3학년 평균 평점 ${c.g3Rating.toFixed(2)}.\n\n늦게 핀 꽃이 가장 오래간다는 말, 이제는 조금 믿게 됐다. ${c.schoolName}에서도 그럴 것이다.`,
    later: c => `대학 축구부 주전 명단 맨 위에 ${c.name}의 이름이 있다.\n\n후배 하나가 벤치에서 고개를 숙이고 있길래 옆에 앉았다. "나도 중1 땐 물통만 날랐어."\n\n그 말을 믿지 않는 눈치였다. 그래서 그날 훈련은 그 후배랑 같이 남았다.` },

  { id: "captain", grade: "H", title: "주장", img: "ending_captain",
    cond: c => c.captain,
    story: c => `1년 동안 주황색 완장을 찼다.\n\n잘한 날보다, 진 날 라커룸에서 먼저 일어나 박수를 친 날들이 더 기억에 남는다. 후배들은 ${c.nameEul} "형"보다 "주장"이라고 더 많이 불렀다.\n\n졸업식 날, 완장은 ${c.juniorName || "후배"}에게 넘어갔다. ${c.schoolName}에서 또 다른 시작이다.`,
    later: c => `고흥대서중 운동장. 휴가 나온 김에 들렀다가 후배들 훈련을 지켜본다.\n\n주황색 완장을 찬 아이가 동료들한테 소리를 지르고 있다. 목소리가 갈라진다. 그 모습이 낯설지 않다.\n\n훈련이 끝나고 그 아이에게 음료수 하나를 건넸다. "목은 아껴. 진 날 써야 하니까."` },

  { id: "model", grade: "H", title: "모범 학생선수", img: "ending_graduate",
    cond: c => c.academic >= 75 && c.attitude >= 75,
    story: c => `졸업식에서 ${c.teacherName}께서 ${c.name}의 이름을 한 번 더 부르셨다. 학교장상.\n\n훈련 끝나고 도서관, 시험 전날엔 단톡방 대신 문제집. 축구도 공부도 놓지 않은 3년이었다.\n\n${c.schoolName}에서도 그 균형은 계속된다.`,
    later: c => `체육교육과 강의실 맨 앞줄. 운동장과 책상 사이에서 3년을 버텼던 게 여기까지 이어졌다.\n\n교생 실습은 고흥대서중으로 신청했다. ${c.teacherName}께서 전화로 웃으셨다. "이제 선생님이라고 불러야 하냐?"\n\n아직은 아니다. 대신 축구부 아이들 공부는 봐 줄 수 있다.` },

  { id: "injury", grade: "D", title: "부상으로 좌절", img: "ending_setback",
    cond: c => c.injuryWeeks >= 14 && c.g3Rating < 7.1 && ["footballHS", "general", "regional", "none"].includes(c.tier),
    story: c => `3년 중 ${c.injuryWeeks}주를 재활실에서 보냈다.\n\n몸이 회복되면 다른 곳이 아팠다. 쉬어야 할 때 쉬지 못했던 날들이 하나씩 떠오른다.\n\n그래도 축구화를 버리지는 않았다. 몸을 아끼는 법을 배운 것도 3년의 결과다.`,
    later: c => `재활 트레이너 자격증 시험장. 수험표를 쥔 손이 조금 떨린다.\n\n3년 동안 재활실에서 본 것, 들은 것, 아팠던 것. 그게 전부 공부가 됐다.\n\n언젠가 다친 아이가 찾아오면 제일 먼저 이렇게 말해 줄 거다. "아픈 건 숨기는 게 아니야."` },

  { id: "nationalSchool", grade: "A", title: "전국 강호 진학", img: "ending_highschool",
    cond: c => c.tier === "national",
    story: c => `${c.schoolName}. 전국대회 단골 우승 후보.\n\n입학 테스트 날, 운동장에 선 1학년만 서른 명이 넘었다. 고흥에서는 에이스였지만 여기서는 다시 맨 아래부터다.\n\n괜찮다. 중1 때도 그랬으니까.`,
    later: c => `대학 리그 결승전. 상대 팀 명단에 낯익은 이름이 보인다. ${c.rivalName ? `${c.rivalName}.` : "중학교 때 함께 뛰던 동기."}\n\n경기 전 악수를 하면서 둘 다 웃음을 참지 못했다. "아직도 오른쪽으로만 치고 가냐?"\n\n경기 결과는 중요하지 않았다. 아니, 사실 중요했다. 그래서 끝까지 뛰었다.` },

  { id: "regionalBest", grade: "A", title: "지역 최고의 선수", img: "ending_highschool",
    cond: c => c.tier === "regional" && (c.g3Rating >= 7.1 || c.g3LeagueTitle),
    story: c => `전남 권역 주말리그에서 ${c.nameIrane} 이름을 모르는 지도자는 없었다.\n\n3년 통산 ${c.apps}경기 ${c.goals}골 ${c.assists}도움. ${c.schoolEun} 망설이지 않고 손을 내밀었다.\n\n더 큰 무대는 이제부터다.`,
    later: c => `전남 지역 실업팀 입단 테스트. 운동장에 들어서자 바닷바람이 분다. 고흥에서 맡던 냄새다.\n\n테스트가 끝나고 감독이 다가와 물었다. "고흥대서중 출신이라고? 그 팀 경기 몇 번 봤다."\n\n합격 통보는 사흘 뒤에 왔다.` },

  { id: "academicBan", grade: "D", title: "학업 부진으로 출전 정지", img: "ending_setback",
    cond: c => c.suspended >= 4,
    story: c => `공식 경기에 ${c.suspended}번 나서지 못했다. 이유는 부상이 아니라 성적표였다.\n\n관중석에서 동료들 경기를 보던 날들이 가장 길었다. "공부도 훈련이다." 감독님 말이 그제야 들렸다.\n\n고등학교에서는 다르게 할 수 있다. 아직 늦지 않았다.`,
    later: c => `대학 스포츠학과 2학년. 성적표 맨 위 평점이 생각보다 높다.\n\n중학교 때 관중석에서 보낸 그 경기들을 가끔 떠올린다. 그날의 억울함이 책상 앞에 앉게 만들었다.\n\n주말엔 지역 클럽에서 공을 찬다. 이번엔 출전 정지 같은 건 없다.` },

  { id: "dream", grade: "C", title: "벤치의 꿈", img: "ending_bench",
    cond: c => c.g3StartRatio < 0.3 && c.apps > 0 && c.apps < 50,
    story: c => `3년 동안 경기에 나선 건 ${c.apps}번. 선발 명단에 이름이 오른 날은 손에 꼽았다.\n\n유니폼은 늘 깨끗했다. 그래도 경기 전날마다 축구화 끈을 새로 묶었다. 언젠가 부를지 모르니까.\n\n꿈은 아직 벤치 위에 그대로 있다.`,
    later: c => `지역 유소년 클럽 코치. 초등학생들이 공보다 먼저 달려와 다리에 매달린다.\n\n벤치에 앉아 있던 3년 동안 경기장을 누구보다 오래 봤다. 그 눈이 지금 아이들 움직임을 읽는다.\n\n"코치님은 선수 때 골 많이 넣었어요?" 웃으며 대답했다. "벤치에서 제일 크게 응원했어."` },

  { id: "bench", grade: "C", title: "만년 후보", img: "ending_bench",
    cond: c => c.g3StartRatio < 0.3,
    story: c => `3학년이 돼서도 선발 명단에 이름이 올라간 날은 손에 꼽았다.\n\n그래도 훈련엔 한 번도 빠지지 않았다. 대부분 교체로 나선 ${c.apps}경기, 그 몇 분을 위해 3년을 뛰었다.\n\n${c.schoolName}에서 다시 시작한다. 벤치에서 본 것들도 다 실력이 된다.`,
    later: c => `동네 조기축구회 최연소 회원. 아저씨들 사이에서 ${c.nameEun} 늘 선발이다.\n\n경기가 끝나면 아저씨들이 막걸리 대신 사이다를 따라 준다. "젊은 게 최고야."\n\n공을 차는 이유가 조금 바뀌었다. 그래도 축구화 끈은 여전히 두 번 묶는다.` },

  { id: "study", grade: "B", title: "공부형 학생선수", img: "ending_graduate",
    cond: c => c.tier === "general" && c.academic >= 70,
    story: c => `${c.schoolName}에 진학했다. 축구부가 아니라 일반 진학이다.\n\n후회는 없다. 3년 동안 배운 건 공 차는 법만이 아니었다. 지는 법, 버티는 법, 다시 일어나는 법.\n\n주말이면 여전히 고흥대서중 운동장에 나가 후배들 공을 받아 준다.`,
    later: c => `대학 도서관에서 밤을 새우고 나오는 길. 학교 운동장에서 누군가 공을 차고 있다.\n\n가방을 내려놓고 한 번만 차 달라고 했다. 발등에 맞는 감각이 그대로다.\n\n${c.friendName ? `${c.friendName}한테 사진을 보냈다. "아직 안 죽었네 ㅋㅋ" 답장이 바로 왔다.` : "몸은 기억하고 있었다."}` },

  { id: "ordinary", grade: "B", title: "평범한 학생선수", img: "ending_graduate",
    cond: () => true,
    story: c => `특별한 기록은 없었다. ${c.apps}경기, ${c.goals}골, 그리고 3년.\n\n그래도 운동장에서 웃던 날이 훨씬 많았다. ${c.friendName ? `친구 ${c.friendName}하고` : "친구하고"} 바닷가를 걷던 저녁도, 비 맞으며 찼던 공도 다 남았다.\n\n${c.schoolName}에서도 공은 계속 찬다.`,
    later: c => `명절에 고흥에 내려왔다. ${c.friendName ? `${c.friendName}${batchim(c.friendName) ? "이랑" : "랑"}` : "친구랑"} 방파제에 앉아 캔 음료를 딴다.\n\n"우리 그때 진짜 열심히 했다." "그치. 근데 골은 네가 더 못 넣었어." "아니거든."\n\n바다 위로 해가 진다. 운동장 조명이 하나둘 켜지는 게 보인다. 누군가 아직 공을 차고 있다.` },
];

export const GRADE_INFO = {
  L: { label: "전설", cls: "gL" },
  S: { label: "S", cls: "gS" },
  H: { label: "숨겨진 엔딩", cls: "gH" },
  A: { label: "A", cls: "gA" },
  B: { label: "B", cls: "gB" },
  C: { label: "C", cls: "gC" },
  D: { label: "D", cls: "gD" },
};
