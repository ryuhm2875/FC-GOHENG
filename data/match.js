// 경기 장면과 해설 문구. 장면을 추가하면 경기 중에 자동으로 섞여 나옵니다.
//
// 장면(situation)
//   pos     : 이 장면이 나오는 포지션
//   zone    : 전술판에서 공이 놓일 곳 (att 공격 / mid 중원 / def 수비)
//   text    : 상황 설명 (여러 개면 무작위)
//   choices : 선택지
//     stats : 성공 확률 계산에 쓰는 능력치와 비중
//     diff  : 난이도 (상대 수준에 더함. +면 어렵고 -면 쉬움)
//     win / lose : 결과 종류 (아래 OUTCOMES)
//     winText / loseText : 결과 문장
//
// 문장 안의 {mate}는 우리 팀 동료, {opp}는 상대 선수 이름으로 바뀝니다.
// {mate|이/가}처럼 쓰면 이름 받침에 맞춰 조사가 붙습니다.

export const OUTCOMES = {
  goal:     { label: "득점",        rating: 1.0 },
  shot:     { label: "슈팅 찬스",    rating: 0.25 },
  head:     { label: "헤더 찬스",    rating: 0.25 },
  assist:   { label: "결정적 패스",  rating: 0.3 },
  keyPass:  { label: "기회 창출",    rating: 0.2 },
  killPass: { label: "킬패스",       rating: 0.35 },
  chip:     { label: "특기 슈팅",    rating: 0.3 },
  win:      { label: "수비 성공",    rating: 0.3 },
  keep:     { label: "공 지킴",      rating: 0.1 },
  miss:     { label: "무산",        rating: -0.1 },
  turnover: { label: "공 뺏김",      rating: -0.25 },
  danger:   { label: "위기 허용",    rating: -0.35 },
};

export const SITUATIONS = [
  // ── 공격수 ─────────────────────────
  { id: "fw_1v1", pos: ["FW"], zone: "att", weight: 3,
    text: ["페널티 박스 앞, 수비수 한 명과 1대1로 마주 섰다.", "측면에서 공을 받았다. 앞에는 수비수 한 명뿐이다."],
    choices: [
      { label: "드리블로 제친다", stats: { "tech.dribble": 0.6, "phys.speed": 0.4 }, diff: 0, win: "shot", lose: "turnover",
        winText: ["몸을 한 번 흔들고 수비를 벗겨 냈다!", "공을 툭 치고 스피드로 따돌렸다!"], loseText: ["수비수 발끝에 공이 걸렸다.", "너무 길게 쳤다. 수비가 먼저 걷어 낸다."] },
      { label: "옆으로 내준다", stats: { "tech.pass": 0.8, "mental.teamwork": 0.2 }, diff: -6, win: "keyPass", lose: "turnover",
        winText: ["침착하게 {mate}에게 내줬다.", "수비를 끌어 놓고 {mate}에게 패스!"], loseText: ["패스가 수비 다리에 맞았다."] },
      { label: "바로 때린다", stats: { "tech.shoot": 1 }, diff: 10, win: "shot", lose: "miss",
        winText: ["수비 다리 사이로 낮게 깔아 찼다!", "생각할 틈도 없이 발을 휘둘렀다!"], loseText: ["슈팅이 수비수 몸에 막혔다.", "골대 위로 크게 뜬다."] },
    ] },
  { id: "fw_through", pos: ["FW"], zone: "att", weight: 3,
    text: ["수비 뒷공간으로 스루패스가 들어온다!", "{mate|이/가} 찔러 준 공이 수비 사이로 굴러온다."],
    choices: [
      { label: "잡아 놓고 슈팅", stats: { "tech.firstTouch": 0.6, "phys.speed": 0.4 }, diff: 2, win: "shot", lose: "turnover",
        winText: ["첫 터치가 완벽하다. 골키퍼와 마주했다!"], loseText: ["첫 터치가 길었다. 골키퍼가 먼저 덮친다."] },
      { label: "원터치 슈팅", stats: { "tech.shoot": 0.7, "tech.firstTouch": 0.3 }, diff: 8, win: "shot", lose: "miss",
        winText: ["달려오던 그대로 발을 갖다 댔다!"], loseText: ["발에 제대로 맞지 않았다. 옆 그물."] },
    ] },
  { id: "fw_cross", pos: ["FW"], zone: "att", weight: 2,
    text: ["측면에서 크로스가 올라온다.", "{mate|이/가} 오른쪽에서 공을 띄운다."],
    choices: [
      { label: "헤더로 노린다", stats: { "phys.jump": 0.6, "phys.strength": 0.4 }, diff: 2, win: "head", lose: "miss", physical: true,
        winText: ["수비보다 한 뼘 높이 떴다!"], loseText: ["수비수가 먼저 머리를 갖다 댄다."] },
      { label: "가슴으로 받아 슈팅", stats: { "tech.firstTouch": 0.5, "tech.shoot": 0.5 }, diff: 8, win: "shot", lose: "turnover",
        winText: ["가슴으로 떨어뜨리고 그대로 발리!"], loseText: ["트래핑하는 사이 수비가 달라붙었다."] },
    ] },
  { id: "fw_hold", pos: ["FW"], zone: "att", weight: 2,
    text: ["등을 지고 공을 받았다. 수비가 뒤에서 몸을 붙여 온다."],
    choices: [
      { label: "버티고 내준다", stats: { "phys.strength": 0.6, "tech.pass": 0.4 }, diff: 0, win: "keyPass", lose: "turnover", physical: true,
        winText: ["끝까지 버티다 달려오는 {mate}에게 내줬다."], loseText: ["몸싸움에서 밀려 넘어졌다. 반칙은 없다."] },
      { label: "돌아선다", stats: { "phys.agility": 0.5, "tech.dribble": 0.5 }, diff: 7, win: "shot", lose: "turnover",
        winText: ["순간적으로 몸을 돌렸다! 골문이 보인다."], loseText: ["돌아서다 공을 흘렸다."] },
    ] },
  { id: "fw_press", pos: ["FW"], zone: "att", weight: 1,
    text: ["상대 수비가 뒤에서 느긋하게 공을 돌린다."],
    choices: [
      { label: "전방 압박", stats: { "phys.stamina": 0.5, "mental.competitive": 0.5 }, diff: 4, win: "shot", lose: "keep",
        winText: ["끝까지 따라붙어 공을 빼앗았다! 바로 골문 앞이다!"], loseText: ["한 발 늦었다. 그래도 상대를 뒤로 몰았다."] },
      { label: "자리 지키기", stats: { "mental.focus": 1 }, diff: -10, win: "keep", lose: "keep",
        winText: ["무리하지 않고 패스 길을 막았다."], loseText: ["상대가 편하게 공을 돌린다."] },
    ] },

  // ── 미드필더 ───────────────────────
  { id: "mf_press", pos: ["MF"], zone: "mid", weight: 3,
    text: ["중원에서 공을 받는 순간 상대 둘이 달려든다.", "등 뒤로 압박이 붙었다."],
    choices: [
      { label: "원터치로 내준다", stats: { "tech.firstTouch": 0.5, "tech.pass": 0.5 }, diff: -2, win: "keep", lose: "turnover",
        winText: ["원터치로 깔끔하게 {mate}에게 연결했다."], loseText: ["패스가 짧았다. 상대가 가로챈다."] },
      { label: "드리블로 탈압박", stats: { "tech.dribble": 0.5, "phys.agility": 0.5 }, diff: 5, win: "keyPass", lose: "danger",
        winText: ["한 명, 두 명 벗겨 내고 앞으로! 공간이 열렸다."], loseText: ["압박에 갇혔다. 상대 역습이다!"] },
      { label: "뒤로 돌린다", stats: { "tech.pass": 1 }, diff: -14, win: "keep", lose: "turnover",
        winText: ["안전하게 수비에게 돌렸다."], loseText: ["백패스가 약했다!"] },
    ] },
  { id: "mf_space", pos: ["MF"], zone: "mid", weight: 3,
    text: ["앞이 열렸다. 공격수들이 뛰기 시작한다.", "상대 미드필더가 올라간 사이 공간이 생겼다."],
    choices: [
      { label: "스루패스", stats: { "tech.pass": 0.7, "mental.focus": 0.3 }, diff: 6, win: "assist", lose: "turnover",
        winText: ["수비 사이로 찔러 넣은 공이 {mate} 발 앞에 떨어진다!"], loseText: ["패스가 조금 길었다. 골키퍼가 잡는다."] },
      { label: "직접 몰고 간다", stats: { "tech.dribble": 0.5, "phys.speed": 0.5 }, diff: 5, win: "shot", lose: "turnover",
        winText: ["하프라인부터 단독 돌파! 박스 앞까지 왔다."], loseText: ["태클에 걸렸다."] },
      { label: "중거리 슈팅", stats: { "tech.shoot": 1 }, diff: 14, win: "shot", lose: "miss",
        winText: ["25미터 밖에서 힘껏 때렸다! 공이 골문으로 날아간다!"], loseText: ["힘이 너무 들어갔다. 관중석으로."] },
    ] },
  { id: "mf_switch", pos: ["MF"], zone: "mid", weight: 2,
    text: ["상대가 한쪽으로 몰려 있다. 반대편 측면이 텅 비었다."],
    choices: [
      { label: "반대편으로 롱패스", stats: { "tech.pass": 0.6, "tech.cross": 0.4 }, diff: 3, win: "keyPass", lose: "turnover",
        winText: ["40미터 대각선 패스! {mate|이/가} 받아 들어간다."], loseText: ["터치라인 밖으로 나갔다."] },
      { label: "직접 크로스", stats: { "tech.cross": 1 }, diff: 6, win: "assist", lose: "miss",
        winText: ["날카로운 크로스가 골문 앞으로!"], loseText: ["크로스가 골키퍼 품에 안겼다."] },
    ] },
  { id: "mf_defend", poss: "them", pos: ["MF"], zone: "mid", weight: 2,
    text: ["상대가 역습을 시작했다. 막아야 한다!"],
    choices: [
      { label: "태클", stats: { "tech.defense": 0.6, "phys.strength": 0.4 }, diff: 3, win: "win", lose: "danger", physical: true,
        winText: ["정확한 태클로 공만 걷어 냈다."], loseText: ["태클이 빗나갔다! 상대가 빠져나간다."] },
      { label: "속도 늦추기", stats: { "mental.focus": 0.5, "tech.defense": 0.5 }, diff: -5, win: "win", lose: "turnover",
        winText: ["앞을 막고 버텼다. 동료들이 돌아왔다."], loseText: ["상대가 패스로 풀어 나간다."] },
    ] },
  { id: "mf_second", pos: ["MF", "DF"], zone: "mid", weight: 1,
    text: ["골킥이 떨어진 자리, 세컨드볼 다툼이다."],
    choices: [
      { label: "몸으로 따낸다", stats: { "phys.strength": 0.6, "mental.competitive": 0.4 }, diff: 1, win: "keep", lose: "turnover", physical: true,
        winText: ["어깨싸움에서 이겼다. 공은 우리 것."], loseText: ["튕겨 나갔다."] },
      { label: "머리로 떨군다", stats: { "phys.jump": 1 }, diff: 2, win: "keyPass", lose: "turnover", physical: true,
        winText: ["헤더로 {mate} 앞에 정확히 떨궜다."], loseText: ["타이밍이 늦었다."] },
    ] },

  // ── 수비수 ─────────────────────────
  { id: "df_1v1", poss: "them", pos: ["DF"], zone: "def", weight: 3,
    text: ["상대 공격수 {opp|이/가} 빠르게 치고 들어온다.", "{opp|이/가} 측면을 타고 돌파를 시도한다."],
    choices: [
      { label: "태클", stats: { "tech.defense": 0.6, "phys.speed": 0.4 }, diff: 4, win: "win", lose: "danger",
        winText: ["미끄러지듯 들어간 태클, 공만 정확히 뺐다!"], loseText: ["태클이 늦었다! {opp|이/가} 빠져나간다."] },
      { label: "거리를 두고 막기", stats: { "tech.defense": 0.5, "mental.focus": 0.5 }, diff: -3, win: "win", lose: "turnover",
        winText: ["끝까지 따라붙어 슈팅 각도를 지웠다."], loseText: ["크로스를 허용했다."] },
    ] },
  { id: "df_cross", poss: "them", pos: ["DF"], zone: "def", weight: 3,
    text: ["상대 측면에서 크로스가 올라온다.", "코너킥. 상대 장신 선수가 들어온다."],
    choices: [
      { label: "헤더로 걷어낸다", stats: { "phys.jump": 0.6, "phys.strength": 0.4 }, diff: 2, win: "win", lose: "danger", physical: true,
        winText: ["가장 높이 떠서 멀리 걷어 냈다."], loseText: ["{opp}에게 먼저 머리를 내줬다!"] },
      { label: "몸으로 밀착", stats: { "phys.strength": 0.7, "mental.focus": 0.3 }, diff: 3, win: "win", lose: "danger", physical: true,
        winText: ["몸을 붙여 {opp}의 점프를 막았다."], loseText: ["밀려났다! 골문 앞 혼전."] },
    ] },
  { id: "df_build", pos: ["DF"], zone: "def", weight: 2,
    text: ["골키퍼가 공을 건넸다. 상대가 전방에서 압박한다."],
    choices: [
      { label: "짧게 연결", stats: { "tech.pass": 0.7, "tech.firstTouch": 0.3 }, diff: -6, win: "keep", lose: "danger",
        winText: ["침착하게 {mate}에게 연결. 압박을 풀었다."], loseText: ["패스가 끊겼다! 골문 앞에서 뺏겼다!"] },
      { label: "길게 찬다", stats: { "tech.pass": 0.5, "tech.cross": 0.5 }, diff: 3, win: "keyPass", lose: "turnover",
        winText: ["전방의 {mate}에게 정확히 떨어졌다."], loseText: ["상대 수비에게 그대로 갔다."] },
      { label: "직접 몰고 나간다", stats: { "tech.dribble": 0.6, "mental.confidence": 0.4 }, diff: 9, win: "keyPass", lose: "danger",
        winText: ["압박을 벗기고 하프라인까지 치고 올라갔다!"], loseText: ["뺏겼다! 위험하다!"] },
    ] },
  { id: "df_through", poss: "them", pos: ["DF"], zone: "def", weight: 2,
    text: ["상대가 수비 뒷공간을 노리고 있다."],
    choices: [
      { label: "라인 올리기", stats: { "mental.focus": 0.6, "mental.teamwork": 0.4 }, diff: 4, win: "win", lose: "danger",
        winText: ["동시에 올라섰다. 오프사이드!"], loseText: ["혼자 늦었다! 오프사이드가 아니다!"] },
      { label: "같이 뛴다", stats: { "phys.speed": 0.7, "phys.stamina": 0.3 }, diff: 2, win: "win", lose: "danger",
        winText: ["끝까지 따라붙어 공을 먼저 걷어 냈다."], loseText: ["{opp|이/가} 한 발 빨랐다."] },
    ] },
  { id: "df_corner", pos: ["DF"], zone: "att", weight: 1,
    text: ["우리 팀 코너킥. 감독님이 올라가라고 손짓한다."],
    choices: [
      { label: "공격 가담 헤더", stats: { "phys.jump": 0.6, "phys.strength": 0.4 }, diff: 8, win: "head", lose: "miss", physical: true,
        winText: ["상대 수비 머리 위로 솟구쳤다!"], loseText: ["헤더가 골대 위로 넘어갔다."] },
      { label: "뒤에 남는다", stats: { "mental.focus": 1 }, diff: -12, win: "keep", lose: "keep",
        winText: ["역습에 대비해 자리를 지켰다."], loseText: ["역습에 대비해 자리를 지켰다."] },
    ] },

  // ── 공통 ───────────────────────────
  { id: "freekick", pos: ["FW", "MF"], zone: "att", weight: 1,
    text: ["박스 바로 앞에서 프리킥을 얻었다. 공 앞에 섰다."],
    choices: [
      { label: "직접 찬다", stats: { "tech.shoot": 0.7, "mental.confidence": 0.3 }, diff: 14, win: "shot", lose: "miss",
        winText: ["공이 벽을 넘어 휘어 들어간다!"], loseText: ["벽에 맞았다."] },
      { label: "동료에게 맡긴다", stats: { "mental.teamwork": 1 }, diff: -15, win: "keep", lose: "keep",
        winText: ["{mate}에게 공을 양보했다."], loseText: ["{mate}에게 공을 양보했다."] },
    ] },
];

// 팀 단위 해설
export const LINES = {
  kickoff: ["주심의 휘슬. 경기가 시작됐다.", "킥오프! {us|이/가} 먼저 공을 잡았다."],
  ourChance: ["{mate|이/가} 측면을 파고든다.", "{mate}의 침투 패스!", "{mate|이/가} 박스 안으로 뛰어든다.", "코너킥. {mate|이/가} 머리를 갖다 댄다."],
  ourGoal: ["{mate}의 슈팅이 골망을 흔든다! 골!", "{mate|이/가} 밀어 넣었다! 골!", "흘러나온 공을 {mate|이/가} 마무리! 골!"],
  ourMiss: ["{mate}의 슈팅, 골키퍼 선방.", "{mate}의 슈팅이 골대를 살짝 벗어난다.", "골대를 맞고 나왔다!"],
  theirChance: ["{opp|이/가} 역습에 나선다.", "{opp}의 날카로운 크로스.", "{opp|이/가} 박스 앞에서 공을 잡는다.", "상대 프리킥. {opp|이/가} 찬다."],
  theirGoal: ["{opp}의 슈팅이 골망을 가른다. 실점.", "{opp|이/가} 마무리했다. 실점.", "혼전 끝에 {opp}에게 골을 내줬다."],
  theirMiss: ["{opp}의 슈팅, 우리 골키퍼가 잡아 낸다.", "{opp}의 슈팅이 크로스바를 넘어간다.", "{mate|이/가} 몸을 던져 막아 냈다!"],
  myShotGoal: ["골키퍼를 보고 침착하게 차 넣었다. 골!", "구석으로 꽂았다. 골!!"],
  myShotSaved: ["회심의 슈팅! 골키퍼가 손끝으로 쳐 냈다.", "슈팅이 골키퍼 정면으로 갔다."],
  myShotWide: ["아! 골대를 살짝 빗나간다.", "골포스트를 맞고 나왔다!"],
  myHeadGoal: ["헤더가 골문 구석으로! 골!"],
  myChipGoal: ["골! 골키퍼는 손을 뻗어 보지도 못했다!", "들어갔다! 관중석이 들썩인다!"],
  myChipMiss: ["골키퍼가 겨우 손끝으로 쳐 냈다!", "골대를 맞고 나왔다! 거의 들어갈 뻔했다."],
  myHeadMiss: ["헤더가 골키퍼 품으로 간다.", "헤더가 크로스바 위로 넘어간다."],
  assistGoal: ["{mate|이/가} 그대로 밀어 넣는다! 도움 기록!", "{mate}의 마무리! 내 패스가 골이 됐다!"],
  assistMiss: ["{mate}의 슈팅이 아쉽게 빗나간다.", "{mate}의 슈팅, 골키퍼 선방."],
  dangerGoal: ["결국 {opp}에게 골을 내줬다. 고개를 숙였다.", "그대로 실점으로 이어졌다."],
  dangerSave: ["골키퍼가 막아 냈다. 가슴을 쓸어내린다.", "{mate|이/가} 뒤에서 걷어 냈다. 살았다."],
  turnoverGoal: ["뺏긴 공이 역습으로 이어졌다. 실점."],
  halftime: ["전반 종료."],
  fulltime: ["경기 종료 휘슬이 울린다."],
  subIn: ["교체 투입. 감독님이 등을 두드린다. \"보여 줘라.\""],
};

// 하프타임 감독님 말
export const HALFTIME_TALK = {
  winning: ["좋다. 그런데 방심하는 순간 뒤집힌다. 하던 대로 해.", "잘하고 있다. 수비 라인 내리지 마라."],
  drawing: ["아직 아무것도 안 정해졌다. 한 골이면 된다.", "상대도 지쳤다. 더 뛰는 쪽이 이긴다."],
  losing: ["고개 들어. 35분이면 충분히 뒤집는다.", "겁먹지 마라. 우리 축구 하자."],
};

// ── 팀 공격 전개 ─────────────────────────────
// 우리 팀이 오른쪽으로 공격한다고 보고 좌표를 적습니다 (경기장 105×68).
// 상대 팀 공격일 때는 엔진이 좌우를 뒤집어 씁니다.
// at: [x, y]. y 자리에 "W"(측면) "H"(측면과 중앙 사이) "C"(중앙) "K"(코너)를 쓰면 매번 달라집니다.
// who: 그 장면에서 공을 가진 선수의 자리. {a}는 그 선수 이름, {b}는 다음 선수 이름.
// finish: shot 일반 슈팅 / header 헤더 / long 중거리 (득점 확률이 낮음)
export const PLAYS = [
  { id: "build", weight: 3, finish: "shot", steps: [
    { who: "DF", at: [24, "H"], t: ["{a|이/가} 뒤에서 차분하게 공을 돌린다.", "{a|이/가} 수비 라인에서 앞을 살핀다."] },
    { who: "MF", at: [47, "C"], t: ["{a}에게 연결. 한 번 접고 고개를 든다.", "{a|이/가} 받아 방향을 튼다."] },
    { who: "FW", at: [80, "C"], t: ["수비 사이로 찔러 준다. {a|이/가} 잡았다!", "{a}의 발밑으로 들어가는 패스!"] },
  ] },
  { id: "wing", weight: 3, finish: "header", steps: [
    { who: "MF", at: [42, "H"], t: ["{a|이/가} 측면으로 공을 벌린다.", "{a}의 방향 전환 패스."] },
    { who: "MF", at: [70, "W"], t: ["{a|이/가} 측면을 타고 달린다.", "{a|이/가} 터치라인을 따라 치고 올라간다."] },
    { who: "MF", at: [93, "W"], t: ["{a}의 크로스!", "{a|이/가} 문전으로 공을 띄운다."] },
    { who: "FW", at: [95, "C"], t: [] },
  ] },
  { id: "long", weight: 2, finish: "shot", steps: [
    { who: "DF", at: [22, "C"], t: ["{a}의 롱볼!", "{a|이/가} 전방으로 길게 찬다."] },
    { who: "FW", at: [68, "C"], t: ["{a|이/가} 머리로 떨군다.", "{a|이/가} 등지고 버티며 공을 내준다."] },
    { who: "MF", at: [82, "H"], t: ["세컨드볼을 {a|이/가} 잡았다!", "흘러나온 공, {a}에게 간다!"] },
  ] },
  { id: "counter", weight: 2, finish: "shot", steps: [
    { who: "MF", at: [38, "H"], t: ["{a|이/가} 공을 끊어 냈다! 역습!", "가로챘다! {a}에서 시작되는 역습."] },
    { who: "FW", at: [70, "H"], t: ["{a}에게 길게 연결. 상대 수비 숫자가 부족하다!", "{a|이/가} 수비 뒤로 빠져 들어간다!"] },
    { who: "FW", at: [88, "C"], t: [] },
  ] },
  { id: "corner", weight: 2, finish: "header", steps: [
    { who: "MF", at: [104, "K"], t: ["코너킥. {a|이/가} 공을 내려놓는다.", "코너킥 기회. {a|이/가} 손을 들어 신호를 보낸다."] },
    { who: "DF", at: [95, "C"], t: [] },
  ] },
  { id: "onetwo", weight: 2, finish: "shot", steps: [
    { who: "MF", at: [58, "C"], t: ["{a}와 {b}의 원투 패스!", "{a|이/가} 짧게 주고 다시 받는다."] },
    { who: "FW", at: [84, "C"], t: ["{a|이/가} 박스 안으로 파고든다!"] },
  ] },
  { id: "longshot", weight: 1, finish: "long", steps: [
    { who: "MF", at: [62, "C"], t: ["{a|이/가} 공을 잡고 앞을 본다. 수비가 물러선다.", "아무도 {a|을/를} 막지 않는다."] },
    { who: "MF", at: [72, "C"], t: [] },
  ] },
];

// 마무리 문장. {a} 슈팅한 선수, {gk} 골키퍼, {d} 몸을 던진 수비수
export const FINISH = {
  shot:   ["{a}의 오른발 슈팅!", "{a|이/가} 수비를 앞에 두고 때린다!", "{a}의 낮게 깔린 슈팅!", "{a}의 왼발 슈팅!"],
  header: ["{a}의 헤더!", "{a|이/가} 솟구쳐 머리를 갖다 댄다!"],
  long:   ["{a}의 중거리 슈팅!", "{a|이/가} 먼 거리에서 과감하게 때린다!"],
};
export const RESULT = {
  us: {
    goal:  ["골! {a|이/가} 골망을 흔든다!", "들어갔다! {a}의 골!", "골키퍼가 손도 못 댔다. {a}의 골!"],
    save:  ["{gk}의 선방에 막혔다.", "{gk|이/가} 몸을 날려 쳐 낸다!", "골키퍼 정면. {gk|이/가} 잡아 낸다."],
    wide:  ["골대를 살짝 벗어난다.", "크로스바를 넘어간다.", "옆 그물을 때린다. 아깝다."],
    block: ["수비수 몸에 맞고 굴절된다.", "수비가 발을 뻗어 막아 낸다."],
    post:  ["골대를 맞고 튀어나온다! 아깝다!", "크로스바를 때렸다!"],
  },
  them: {
    goal:  ["실점. {a}의 슈팅이 그대로 들어갔다.", "{a|이/가} 마무리한다. 실점.", "막을 수 없었다. {a}의 골."],
    save:  ["우리 골키퍼 {gk}의 선방!", "{gk|이/가} 정확하게 잡아 낸다.", "{gk|이/가} 손끝으로 쳐 낸다!"],
    wide:  ["골대를 벗어난다. 휴.", "크로스바 위로 날아간다."],
    block: ["{d|이/가} 몸을 던져 막아 낸다!", "{d}의 태클! 슈팅을 막았다."],
    post:  ["골대를 맞혔다! 가슴이 철렁한다."],
  },
};

// 경기 흐름 사이사이에 나오는 문장
// side: us 우리 팀 이야기 / them 상대 팀 이야기 / none 중립. card: 경고 카드
export const AMBIENT = [
  { side: "none", t: "중원에서 치열한 볼 다툼이 이어진다." },
  { side: "none", t: "양 팀 모두 쉽게 공을 내주지 않는다." },
  { side: "us",   t: "{a|이/가} 공을 길게 걷어 낸다. 스로인." },
  { side: "us",   t: "{coach|이/가} 사이드라인에서 소리친다. \"라인 올려! 간격 좁혀!\"" },
  { side: "them", t: "상대가 뒤에서 공을 돌리며 틈을 찾는다." },
  { side: "them", t: "{o|이/가} 측면으로 치고 들어오다 라인 밖으로 공을 흘린다." },
  { side: "them", t: "{o}의 거친 태클. 주심이 옐로카드를 꺼낸다.", card: "them" },
  { side: "us",   t: "{a|이/가} 늦게 들어간 태클로 경고를 받는다.", card: "us" },
  { side: "none", t: "관중석에서 학부모님들의 응원 소리가 들려온다." },
];

// 내 장면 직전, 공이 나에게 오는 문장
export const TO_ME = {
  att: ["{mate}의 패스가 나에게 온다.", "{mate|이/가} 공을 찔러 준다. 내 차례다."],
  mid: ["{mate|이/가} 나에게 공을 내준다.", "공이 중원으로 흘러나와 내 발 앞에 떨어진다."],
  def: ["{opp|이/가} 공을 몰고 내 쪽으로 온다.", "상대 공격이 내 쪽 측면으로 몰린다."],
};

// ── 특기 선택지 ─────────────────────────────
// 능력치가 requires 이상이면 그 장면에 선택지가 하나 더 생깁니다 (★ 특기).
// 능력치를 키울수록 경기에서 할 수 있는 일이 늘어나는 구조입니다.
export const SIGNATURE = {
  fw_1v1: { label: "개인기로 무너뜨린다", requires: { "tech.dribble": 68 }, stats: { "tech.dribble": 0.7, "phys.agility": 0.3 }, diff: -4,
    win: "shot", lose: "turnover", winText: ["헛다리 두 번에 수비수가 주저앉았다! 골키퍼와 1대1!"], loseText: ["너무 많이 보여 줬다. 수비가 공만 걷어 낸다."] },
  fw_through: { label: "골키퍼 키를 넘긴다", requires: { "tech.shoot": 70 }, stats: { "tech.shoot": 0.6, "mental.confidence": 0.4 }, diff: 6,
    win: "chip", lose: "miss", winText: ["달려 나온 골키퍼 머리 위로 살짝 띄웠다. 공이 천천히 골문으로…"], loseText: ["너무 높았다. 크로스바 위로."] },
  fw_cross: { label: "몸을 날려 다이빙 헤더", requires: { "phys.jump": 68 }, stats: { "phys.jump": 0.6, "mental.competitive": 0.4 }, diff: 4,
    win: "head", lose: "miss", physical: true, winText: ["몸을 던졌다! 공에 이마가 정확히 닿는다!"], loseText: ["한 뼘이 모자랐다."] },
  mf_press: { label: "마르세유 턴", requires: { "tech.dribble": 66, "phys.agility": 60 }, stats: { "tech.dribble": 0.5, "phys.agility": 0.5 }, diff: -6,
    win: "keyPass", lose: "turnover", winText: ["빙글 돌아 두 명 사이를 빠져나갔다! 관중석이 술렁인다."], loseText: ["돌다가 공이 발에서 떨어졌다."] },
  mf_space: { label: "수비 셋을 가르는 킬패스", requires: { "tech.pass": 70 }, stats: { "tech.pass": 0.8, "mental.focus": 0.2 }, diff: 4,
    win: "killPass", lose: "turnover", winText: ["수비 세 명 사이로 공이 빨려 들어간다. {mate} 앞에 골키퍼뿐이다!"], loseText: ["너무 욕심냈다. 끊겼다."] },
  mf_defend: { label: "가로채서 바로 역습", requires: { "tech.defense": 62, "mental.focus": 60 }, stats: { "tech.defense": 0.5, "mental.focus": 0.5 }, diff: 0,
    win: "keyPass", lose: "danger", winText: ["패스 길을 읽었다! 가로채서 그대로 앞으로 찔렀다!"], loseText: ["읽었는데 한 발 늦었다."] },
  df_1v1: { label: "공 뺏고 그대로 전진", requires: { "tech.defense": 70 }, stats: { "tech.defense": 0.7, "phys.strength": 0.3 }, diff: 0,
    win: "keyPass", lose: "danger", winText: ["깨끗하게 뺏었다! 그대로 하프라인까지 몰고 올라간다!"], loseText: ["태클은 정확했는데 공이 상대에게 튀었다."] },
  df_cross: { label: "제공권으로 압도", requires: { "phys.jump": 70 }, stats: { "phys.jump": 0.8, "phys.strength": 0.2 }, diff: -10,
    win: "win", lose: "danger", physical: true, winText: ["상대보다 머리 하나는 높이 떴다. 아무도 못 따라온다."], loseText: ["타이밍이 어긋났다!"] },
  df_corner: { label: "헤더로 골문 구석을 노린다", requires: { "phys.jump": 68 }, stats: { "phys.jump": 0.6, "tech.shoot": 0.4 }, diff: 2,
    win: "head", lose: "miss", physical: true, winText: ["수비 셋을 뚫고 솟구쳤다!"], loseText: ["골대 옆으로 비껴 갔다."] },
  freekick: { label: "벽을 넘겨 구석으로 감아 찬다", requires: { "tech.shoot": 74 }, stats: { "tech.shoot": 0.7, "mental.confidence": 0.3 }, diff: 8,
    win: "chip", lose: "miss", winText: ["벽을 넘은 공이 뚝 떨어지며 구석으로 휘어 들어간다…"], loseText: ["아깝게 골대를 스쳤다."] },
};

// 내가 팀 공격에 자동으로 끼는 장면 (능력치가 높을수록 자주)
export const ME_IN_PLAY = {
  build: ["{me|이/가} 공을 받아 앞을 본다. 상대가 두 명 붙는다.", "{me}에게 공이 모인다."],
  pass:  ["{me}의 정확한 패스!", "{me|이/가} 원터치로 방향을 바꿔 준다."],
  shot:  ["{me}의 슈팅!", "{me|이/가} 지체 없이 때린다!"],
  head:  ["{me}의 헤더!"],
  stop:  ["{me|이/가} 태클로 끊어 낸다!", "{me|이/가} 길목을 막고 공을 빼앗는다!", "{me|이/가} 몸을 날려 슈팅을 막아 낸다!"],
  marked: ["상대 감독이 {me|을/를} 가리키며 수비수에게 뭔가 지시한다.", "상대 수비수 둘이 {me} 주변에 붙어 다닌다."],
};
