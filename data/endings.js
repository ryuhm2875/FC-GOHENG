// 엔딩. 위에서부터 차례로 조건을 확인해, 먼저 맞는 엔딩이 나옵니다.
// grade: S, A, B, C, D, 숨겨진(H), 전설(L)
// img: assets/img/ 안의 엔딩 그림 이름
// cond(c): c는 엔진이 계산한 3년 요약 (아래 career.js의 summarize 참고)
// story(c): 엔딩 문장. 줄바꿈은 \n

export const ENDINGS = [
  { id: "legend", grade: "L", title: "레전드", img: "ending_legend",
    cond: c => c.captain && c.wore10 && c.nationalChampion && c.nationalTeam,
    story: c => `주장 완장, 등번호 10번, 전국대회 우승 트로피, 그리고 태극마크.\n\n고흥대서중 운동장 한쪽 벽에 ${c.name}의 이름이 새겨졌다. 후배들은 지금도 그 앞을 지나며 한 번씩 고개를 든다.\n\n${c.schoolName}에서 시작될 다음 이야기는, 이미 많은 사람이 기다리고 있다.` },

  { id: "national", grade: "S", title: "청소년 국가대표", img: "ending_national",
    cond: c => c.nationalTeam,
    story: c => `U-15 대표팀 소집 명단, 맨 아래에 ${c.name}의 이름이 있었다.\n\n고흥에서 파주까지는 버스로 다섯 시간. 창밖을 보다가 입단 첫날 측정표가 떠올랐다. 그때 그 숫자들이 여기까지 왔다.\n\n봄에는 ${c.schoolName} 유니폼을 입는다.` },

  { id: "pro", grade: "S", title: "프로 유스 입단", img: "ending_pro",
    cond: c => c.tier === "proYouth",
    story: c => `${c.schoolName}의 하얀 훈련복을 받았다. 가슴에 프로 구단 엠블럼이 박혀 있다.\n\n중학교 3년 동안 ${c.apps}경기, ${c.goals}골. 숫자보다 오래 남는 건 비 오는 날 혼자 남아 찼던 슈팅들이다.\n\n이제부터는 매일이 시험이다.` },

  { id: "comeback", grade: "H", title: "역전의 아이콘", img: "ending_highschool",
    cond: c => c.wasBenchInG1 && c.g3StartRatio >= 0.85 && c.g3Rating >= 7.6 && c.ovr >= 70,
    story: c => `중1 때는 벤치에서 물통을 날랐다. 경기 명단에 이름이 없는 날이 더 많았다.\n\n중3, ${c.nameEun} 팀에서 가장 먼저 이름이 불리는 선수가 됐다. 3학년 평균 평점 ${c.g3Rating.toFixed(2)}.\n\n늦게 핀 꽃이 가장 오래 간다는 말, 이제는 조금 믿게 됐다. ${c.schoolName}에서도 그럴 것이다.` },

  { id: "captain", grade: "H", title: "주장", img: "ending_captain",
    cond: c => c.captain,
    story: c => `1년 동안 주황색 완장을 찼다.\n\n잘한 날보다, 진 날 라커룸에서 먼저 일어나 박수를 친 날들이 더 기억에 남는다. 후배들은 ${c.nameEul} "형"보다 "주장"이라고 더 많이 불렀다.\n\n졸업식 날, 완장은 ${c.juniorName || "후배"}에게 넘어갔다. ${c.schoolName}에서 또 다른 시작이다.` },

  { id: "model", grade: "H", title: "모범 학생선수", img: "ending_graduate",
    cond: c => c.academic >= 75 && c.attitude >= 75,
    story: c => `졸업식에서 ${c.teacherName}이 ${c.name}의 이름을 한 번 더 불렀다. 학교장상.\n\n훈련 끝나고 도서관, 시험 전날엔 단톡방 대신 문제집. 축구도 공부도 놓지 않은 3년이었다.\n\n${c.schoolName}에서도 그 균형은 계속된다.` },

  { id: "nationalSchool", grade: "A", title: "전국 강호 진학", img: "ending_highschool",
    cond: c => c.tier === "national",
    story: c => `${c.schoolName}. 전국대회 단골 우승 후보.\n\n입학 테스트 날, 운동장에 선 1학년만 서른 명이 넘었다. 고흥에서는 에이스였지만 여기서는 다시 맨 아래부터다.\n\n괜찮다. 중1 때도 그랬으니까.` },

  { id: "regionalBest", grade: "A", title: "지역 최고의 선수", img: "ending_highschool",
    cond: c => c.tier === "regional" && (c.g3Rating >= 7.1 || c.g3LeagueTitle),
    story: c => `전남 권역 주말리그에서 ${c.nameIrane} 이름을 모르는 지도자는 없었다.\n\n3년 통산 ${c.apps}경기 ${c.goals}골 ${c.assists}도움. ${c.schoolEun} 망설이지 않고 손을 내밀었다.\n\n더 큰 무대는 이제부터다.` },

  { id: "academicBan", grade: "D", title: "학업 부진으로 출전 정지", img: "ending_setback",
    cond: c => c.suspended >= 4,
    story: c => `공식 경기에 ${c.suspended}번 나서지 못했다. 이유는 부상이 아니라 성적표였다.\n\n관중석에서 동료들 경기를 보던 날들이 가장 길었다. "공부도 훈련이다." 감독님 말이 그제야 들렸다.\n\n고등학교에서는 다르게 할 수 있다. 아직 늦지 않았다.` },

  { id: "injury", grade: "D", title: "부상으로 좌절", img: "ending_setback",
    cond: c => c.injuryWeeks >= 22 && ["footballHS", "general", "regional", "none"].includes(c.tier),
    story: c => `3년 중 ${c.injuryWeeks}주를 재활실에서 보냈다.\n\n몸이 회복되면 다른 곳이 아팠다. 쉬어야 할 때 쉬지 못했던 날들이 하나씩 떠오른다.\n\n그래도 축구화를 버리지는 않았다. 몸을 아끼는 법을 배운 것도 3년의 결과다.` },

  { id: "bench", grade: "C", title: "만년 후보", img: "ending_bench",
    cond: c => c.g3StartRatio < 0.3,
    story: c => `3학년이 돼서도 선발 명단에 이름이 올라간 날은 손에 꼽았다.\n\n그래도 훈련엔 한 번도 빠지지 않았다. 교체로 들어간 ${c.apps}경기, 그 몇 분들을 위해 3년을 뛰었다.\n\n${c.schoolName}에서 다시 시작한다. 벤치에서 본 것들도 다 실력이 된다.` },

  { id: "dream", grade: "C", title: "벤치의 꿈", img: "ending_bench",
    cond: c => c.apps < 25,
    story: c => `3년 동안 공식 경기에 나선 건 ${c.apps}번.\n\n유니폼은 늘 깨끗했다. 그래도 경기 전날마다 축구화 끈을 새로 묶었다. 언젠가 부를지 모르니까.\n\n꿈은 아직 벤치 위에 그대로 있다.` },

  { id: "study", grade: "B", title: "공부형 학생선수", img: "ending_graduate",
    cond: c => c.tier === "general" && c.academic >= 70,
    story: c => `${c.schoolName}에 진학했다. 축구부가 아니라 일반 진학이다.\n\n후회는 없다. 3년 동안 배운 건 공 차는 법만이 아니었다. 지는 법, 버티는 법, 다시 일어나는 법.\n\n주말이면 여전히 고흥대서중 운동장에 나가 후배들 공을 받아 준다.` },

  { id: "ordinary", grade: "B", title: "평범한 학생선수", img: "ending_graduate",
    cond: () => true,
    story: c => `특별한 기록은 없었다. ${c.apps}경기, ${c.goals}골, 그리고 3년.\n\n그래도 운동장에서 웃던 날이 훨씬 많았다. 친구 ${c.friendName || ""}와 바닷가를 걷던 저녁도, 비 맞으며 찼던 공도 다 남았다.\n\n${c.schoolName}에서도 공은 계속 찬다.` },
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
