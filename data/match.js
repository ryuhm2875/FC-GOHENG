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
//   intro   : false면 "공이 나에게 온다" 문장 없이 바로 상황 설명으로 시작
//   late / leading / trailing : 경기 막판(55분 이후) / 앞설 때 / 뒤질 때만 나옴
//   once    : 한 경기에 한 번만 나옴
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
  tapIn:    { label: "문전 마무리",  rating: 0.3 },
  pk:       { label: "페널티킥 성공", rating: 0.1 },
  matePk:   { label: "키커 양보",    rating: 0.05 },
  setPiece: { label: "프리킥 획득",  rating: 0.15 },
  offside:  { label: "오프사이드",   rating: -0.05 },
  pkAgainst:{ label: "페널티킥 허용", rating: -0.5 },
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
  { id: "fw_through", intro: false, pos: ["FW"], zone: "att", weight: 3,
    text: ["수비 뒷공간으로 스루패스가 들어온다!", "{mate|이/가} 찔러 준 공이 수비 사이로 굴러온다."],
    choices: [
      { label: "잡아 놓고 슈팅", stats: { "tech.firstTouch": 0.6, "phys.speed": 0.4 }, diff: 2, win: "shot", lose: "turnover",
        winText: ["첫 터치가 완벽하다. 골키퍼와 마주했다!"], loseText: ["첫 터치가 길었다. 골키퍼가 먼저 덮친다."] },
      { label: "원터치 슈팅", stats: { "tech.shoot": 0.7, "tech.firstTouch": 0.3 }, diff: 8, win: "shot", lose: "miss",
        winText: ["달려오던 그대로 발을 갖다 댔다!"], loseText: ["발에 제대로 맞지 않았다. 옆 그물."] },
    ] },
  { id: "fw_cross", intro: false, pos: ["FW"], zone: "att", weight: 2,
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
  { id: "fw_press", intro: false, poss: "them", pos: ["FW"], zone: "att", weight: 1,
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
        winText: ["40미터 대각선 패스! {mate|이/가} 받아서 치고 들어간다."], loseText: ["터치라인 밖으로 나갔다."] },
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
  { id: "mf_second", intro: false, pos: ["MF", "DF"], zone: "mid", weight: 1,
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
        winText: ["미끄러지듯 들어간 태클, 공만 정확히 빼냈다!"], loseText: ["태클이 늦었다! {opp|이/가} 빠져나간다."] },
      { label: "거리를 두고 막기", stats: { "tech.defense": 0.5, "mental.focus": 0.5 }, diff: -3, win: "win", lose: "turnover",
        winText: ["끝까지 따라붙어 슈팅 각도를 지웠다."], loseText: ["크로스를 허용했다."] },
    ] },
  { id: "df_cross", intro: false, poss: "them", pos: ["DF"], zone: "def", weight: 3,
    text: ["상대 측면에서 크로스가 올라온다.", "코너킥. 상대 장신 선수가 들어온다."],
    choices: [
      { label: "헤더로 걷어 낸다", stats: { "phys.jump": 0.6, "phys.strength": 0.4 }, diff: 2, win: "win", lose: "danger", physical: true,
        winText: ["가장 높이 떠서 멀리 걷어 냈다."], loseText: ["{opp}에게 먼저 머리를 내줬다!"] },
      { label: "몸으로 밀착", stats: { "phys.strength": 0.7, "mental.focus": 0.3 }, diff: 3, win: "win", lose: "danger", physical: true,
        winText: ["몸을 붙여 {opp}의 점프를 막았다."], loseText: ["밀려났다! 골문 앞 혼전."] },
    ] },
  { id: "df_build", intro: false, pos: ["DF"], zone: "def", weight: 2,
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
  { id: "df_corner", intro: false, pos: ["DF"], zone: "att", weight: 1,
    text: ["우리 팀 코너킥. 감독님이 올라가라고 손짓한다."],
    choices: [
      { label: "공격 가담 헤더", stats: { "phys.jump": 0.6, "phys.strength": 0.4 }, diff: 8, win: "head", lose: "miss", physical: true,
        winText: ["상대 수비 머리 위로 솟구쳤다!"], loseText: ["헤더가 골대 위로 넘어갔다."] },
      { label: "뒤에 남는다", stats: { "mental.focus": 1 }, diff: -12, win: "keep", lose: "keep",
        winText: ["역습에 대비해 자리를 지켰다."], loseText: ["역습에 대비해 자리를 지켰다."] },
    ] },

  // ── 공통 ───────────────────────────
  { id: "freekick", intro: false, pos: ["FW", "MF"], zone: "att", weight: 1,
    text: ["박스 바로 앞에서 프리킥을 얻었다. 공 앞에 섰다."],
    choices: [
      { label: "직접 찬다", stats: { "tech.shoot": 0.7, "mental.confidence": 0.3 }, diff: 14, win: "shot", lose: "miss",
        winText: ["공이 벽을 넘어 휘어 들어간다!"], loseText: ["벽에 맞았다."] },
      { label: "동료에게 맡긴다", stats: { "mental.teamwork": 1 }, diff: -15, win: "keep", lose: "keep",
        winText: ["{mate}에게 공을 양보했다."], loseText: ["{mate}에게 공을 양보했다."] },
    ] },
  // ── 추가 장면: 공격수 ──────────────
  { id: "fw_rebound", intro: false, pos: ["FW"], zone: "att", weight: 1,
    text: ["{mate}의 슈팅을 골키퍼가 쳐 냈다. 공이 박스 안으로 흘러나온다!", "골대를 맞고 튀어나온 공이 내 앞으로 떨어진다!"],
    choices: [
      { label: "바로 밀어 넣는다", stats: { "tech.firstTouch": 0.4, "tech.shoot": 0.4, "mental.focus": 0.2 }, diff: -4, win: "tapIn", lose: "miss",
        winText: ["넘어지면서도 발끝을 갖다 댔다!", "누구보다 먼저 공에 발을 뻗었다!"], loseText: ["발에 제대로 맞지 않았다. 수비가 걷어 낸다."] },
      { label: "한 번 잡고 각을 본다", stats: { "tech.firstTouch": 0.6, "mental.focus": 0.4 }, diff: 4, win: "shot", lose: "turnover",
        winText: ["침착하게 잡아 놓았다. 골키퍼가 아직 일어나지 못했다!"], loseText: ["잡는 사이 수비 셋이 몰려왔다."] },
    ] },
  { id: "fw_counter", intro: false, pos: ["FW"], zone: "att", weight: 1,
    text: ["역습! 공을 몰고 달린다. 옆에서 {mate}도 같이 뛴다. 막는 수비는 한 명뿐.", "2대1이다. 수비수 한 명이 뒷걸음질 친다. 오른쪽에 {mate|이/가} 있다."],
    choices: [
      { label: "끌고 가다 내준다", stats: { "tech.pass": 0.5, "mental.focus": 0.5 }, diff: -2, win: "assist", lose: "turnover",
        winText: ["수비가 나에게 붙는 순간 옆으로 밀어 줬다!"], loseText: ["패스 타이밍이 늦었다. 수비 발에 걸렸다."] },
      { label: "끝까지 직접 해결", stats: { "phys.speed": 0.4, "tech.shoot": 0.6 }, diff: 6, win: "shot", lose: "miss",
        winText: ["수비가 패스를 의식한 순간, 그대로 치고 들어갔다!"], loseText: ["욕심이었다. 각이 없는 데서 때렸다."] },
    ] },
  { id: "fw_offside", intro: false, pos: ["FW"], zone: "att", weight: 2,
    text: ["{mate|이/가} 공을 잡고 고개를 든다. 상대 수비 라인이 한 줄로 서 있다."],
    choices: [
      { label: "뒷공간으로 침투", stats: { "mental.focus": 0.5, "phys.speed": 0.5 }, diff: 3, win: "shot", lose: "offside",
        winText: ["타이밍이 딱 맞았다! 라인을 깨고 골키퍼와 마주했다!"], loseText: ["한 발 먼저 나갔다. 부심 깃발이 올라간다. 오프사이드."] },
      { label: "내려와서 받아 준다", stats: { "tech.firstTouch": 0.6, "mental.teamwork": 0.4 }, diff: -6, win: "keyPass", lose: "turnover",
        winText: ["내려와 받아 주고 측면으로 벌렸다. {mate|이/가} 달려 들어간다."], loseText: ["받는 순간 뒤에서 수비가 발을 넣었다."] },
    ] },
  { id: "fw_volley", intro: false, pos: ["FW", "MF"], zone: "att", weight: 1,
    text: ["상대가 걷어 낸 공이 허리 높이로 떠서 박스 앞으로 날아온다."],
    choices: [
      { label: "논스톱 발리", stats: { "tech.shoot": 0.6, "phys.agility": 0.4 }, diff: 12, win: "shot", lose: "miss",
        winText: ["떨어지는 공을 그대로 후려쳤다!"], loseText: ["공이 발등 옆에 맞았다. 하늘 높이 뜬다."] },
      { label: "가슴으로 잡아 놓는다", stats: { "tech.firstTouch": 0.7, "phys.strength": 0.3 }, diff: 2, win: "keep", lose: "turnover",
        winText: ["부드럽게 잡아 놓고 {mate}에게 내줬다."], loseText: ["트래핑이 튀었다. 상대가 먼저 걷어 낸다."] },
    ] },
  { id: "fw_last", intro: false, pos: ["FW", "MF"], zone: "att", weight: 3, late: true, trailing: true,
    text: ["시간이 얼마 없다. 한 골이 필요하다. 박스 앞에서 공이 나에게 왔다.", "벤치에서 다들 일어섰다. 공이 내 발 앞에 떨어졌다. 마지막 기회일지도 모른다."],
    choices: [
      { label: "그대로 때린다", stats: { "tech.shoot": 0.7, "mental.confidence": 0.3 }, diff: 8, win: "shot", lose: "miss",
        winText: ["망설이지 않았다. 온몸을 실어 때렸다!"], loseText: ["너무 서둘렀다. 공이 크로스바 위로 넘어간다."] },
      { label: "한 명 더 제친다", stats: { "tech.dribble": 0.6, "phys.agility": 0.4 }, diff: 8, win: "shot", lose: "turnover",
        winText: ["한 번 접어 수비를 넘어뜨렸다! 이제 골문이 보인다!"], loseText: ["수비가 끝까지 붙었다. 공을 잃었다."] },
      { label: "빈 동료를 찾는다", stats: { "tech.pass": 0.6, "mental.focus": 0.4 }, diff: 2, win: "assist", lose: "turnover",
        winText: ["모두 나를 볼 때 {mate}에게 살짝 밀어 줬다!"], loseText: ["패스가 수비 발에 걸렸다."] },
    ] },
  { id: "penalty", intro: false, once: true, pos: ["FW", "MF"], zone: "att", weight: 0.3,
    text: ["박스 안에서 수비 발에 걸려 넘어졌다. 주심이 페널티 지점을 가리킨다!"],
    choices: [
      { label: "구석으로 낮게 찬다", stats: { "tech.shoot": 0.6, "mental.focus": 0.4 }, diff: -18, win: "pk", lose: "miss",
        winText: ["숨을 고르고 달려간다… 골키퍼와 반대 방향!"], loseText: ["골키퍼가 방향을 읽었다. 막혔다."] },
      { label: "가운데로 강하게", stats: { "mental.confidence": 0.7, "tech.shoot": 0.3 }, diff: -14, win: "pk", lose: "miss",
        winText: ["골키퍼가 먼저 몸을 날렸다. 가운데가 비었다!"], loseText: ["너무 정직했다. 골키퍼 발에 걸렸다."] },
      { label: "키커를 양보한다", stats: { "mental.teamwork": 1 }, diff: -40, win: "matePk", lose: "matePk",
        winText: ["{mate}에게 공을 건넸다. \"네가 차.\""], loseText: ["{mate}에게 공을 건넸다."] },
    ] },

  // ── 추가 장면: 미드필더 ────────────
  { id: "mf_corner", intro: false, pos: ["MF"], zone: "att", weight: 1,
    text: ["코너킥. 감독님이 나를 키커로 지목했다."],
    choices: [
      { label: "니어 포스트로 빠르게", stats: { "tech.cross": 0.8, "mental.focus": 0.2 }, diff: 4, win: "keyPass", lose: "miss",
        winText: ["낮고 빠르게 감아 찼다! {mate|이/가} 앞으로 끊어 들어간다!"], loseText: ["첫 번째 수비수 머리에 걸렸다."] },
      { label: "먼 쪽으로 높게", stats: { "tech.cross": 1 }, diff: 2, win: "keyPass", lose: "miss",
        winText: ["공이 골키퍼 손을 넘어 먼 쪽 포스트로! {mate|이/가} 뛰어오른다!"], loseText: ["너무 길었다. 반대편 터치라인 밖으로."] },
      { label: "짧게 주고받는다", stats: { "tech.pass": 0.6, "mental.teamwork": 0.4 }, diff: -8, win: "keep", lose: "turnover",
        winText: ["짧게 주고 다시 받았다. 상대 수비가 허둥댄다."], loseText: ["주고받다가 끊겼다."] },
    ] },
  { id: "mf_onetwo", intro: false, pos: ["MF", "FW"], zone: "att", weight: 1,
    text: ["박스 앞, {mate|과/와} 눈이 마주쳤다. 주고받을 수 있는 거리다."],
    choices: [
      { label: "원투 패스로 침투", stats: { "tech.pass": 0.4, "tech.firstTouch": 0.3, "mental.teamwork": 0.3 }, diff: 3, win: "shot", lose: "turnover",
        winText: ["주고, 달리고, 다시 받았다! 수비가 따라오지 못한다!"], loseText: ["돌려받는 공이 수비 발에 걸렸다."] },
      { label: "내주고 빠진다", stats: { "tech.pass": 0.6, "mental.focus": 0.4 }, diff: -4, win: "keyPass", lose: "keep",
        winText: ["{mate}에게 내주고 수비를 끌고 빠졌다. 공간이 생겼다!"], loseText: ["{mate|이/가} 돌아서지 못하고 다시 뒤로 돌린다."] },
    ] },
  { id: "mf_intercept", intro: false, poss: "them", pos: ["MF"], zone: "mid", weight: 2,
    text: ["상대 미드필더 {opp|이/가} 공을 잡고 돌아선다. 패스할 곳을 찾는다."],
    choices: [
      { label: "강하게 압박", stats: { "phys.stamina": 0.4, "tech.defense": 0.6 }, diff: 3, win: "keyPass", lose: "danger",
        winText: ["달려들어 공을 빼앗았다! 바로 앞으로 찔러 준다!"], loseText: ["{opp|이/가} 몸을 돌려 나를 벗겨 냈다!"] },
      { label: "패스 길을 막는다", stats: { "mental.focus": 0.7, "tech.defense": 0.3 }, diff: -4, win: "win", lose: "turnover",
        winText: ["앞쪽 패스 길을 막자 {opp|이/가} 결국 뒤로 돌린다."], loseText: ["옆으로 빠지는 패스까지는 막지 못했다."] },
    ] },
  { id: "mf_foul", intro: false, pos: ["MF", "FW"], zone: "mid", weight: 1,
    text: ["공을 받자마자 {opp|이/가} 뒤에서 거칠게 밀어붙인다."],
    choices: [
      { label: "버티며 지킨다", stats: { "phys.strength": 0.7, "mental.competitive": 0.3 }, diff: 2, win: "keep", lose: "turnover", physical: true,
        winText: ["몸을 낮추고 버텼다. 공은 아직 내 발밑이다."], loseText: ["힘에서 밀렸다. 공을 빼앗겼다."] },
      { label: "끝까지 공을 지켜 파울을 얻는다", stats: { "tech.dribble": 0.5, "mental.focus": 0.5 }, diff: 1, win: "setPiece", lose: "turnover",
        winText: ["{opp|이/가} 결국 내 다리를 걷어찼다. 휘슬! 좋은 위치에서 프리킥이다."], loseText: ["주심은 휘슬을 불지 않았다. 공은 이미 상대 발에 있다."] },
      { label: "먼저 내주고 피한다", stats: { "tech.firstTouch": 0.5, "tech.pass": 0.5 }, diff: -4, win: "keep", lose: "turnover",
        winText: ["부딪히기 직전에 {mate}에게 내줬다. {opp|이/가} 허공을 밀었다."], loseText: ["내주려는 순간 발이 걸렸다."] },
    ] },
  { id: "mf_lead", intro: false, pos: ["MF", "DF"], zone: "mid", weight: 3, late: true, leading: true,
    text: ["앞서고 있다. 남은 시간은 얼마 없다. 상대가 라인을 끌어올린다."],
    choices: [
      { label: "공을 돌리며 시간 쓰기", stats: { "tech.pass": 0.6, "mental.focus": 0.4 }, diff: -8, win: "keep", lose: "turnover",
        winText: ["침착하게 옆으로, 뒤로. 상대가 공을 만져 보지도 못한다."], loseText: ["너무 느긋했다. 상대가 낚아챈다."] },
      { label: "뒷공간에 한 방", stats: { "tech.pass": 0.8, "mental.confidence": 0.2 }, diff: 6, win: "keyPass", lose: "turnover",
        winText: ["비어 있는 뒷공간으로 길게! {mate|이/가} 혼자 달린다!"], loseText: ["너무 길었다. 골키퍼가 잡는다."] },
    ] },

  // ── 추가 장면: 수비수 ──────────────
  { id: "df_2v1", intro: false, poss: "them", pos: ["DF"], zone: "def", weight: 1,
    text: ["역습을 맞았다. 상대 둘이 달려오는데 막을 사람은 나 하나다."],
    choices: [
      { label: "패스 길을 끊는 자리로", stats: { "mental.focus": 0.7, "tech.defense": 0.3 }, diff: 2, win: "win", lose: "danger",
        winText: ["패스 길에 서서 버텼다. 동료들이 돌아올 시간을 벌었다."], loseText: ["{opp|이/가} 그대로 몰고 들어왔다!"] },
      { label: "공 가진 선수에게 달려든다", stats: { "tech.defense": 0.6, "phys.speed": 0.4 }, diff: 5, win: "win", lose: "danger",
        winText: ["공 가진 선수의 발끝을 정확히 걷어 냈다!"], loseText: ["달려드는 순간 옆으로 패스가 갔다. 골문 앞이 비었다!"] },
    ] },
  { id: "df_box", intro: false, poss: "them", pos: ["DF"], zone: "def", weight: 1,
    text: ["박스 안 혼전. 튕겨 나온 공이 내 발 앞에 떨어졌다. 상대가 달려든다."],
    choices: [
      { label: "멀리 걷어 낸다", stats: { "mental.focus": 0.5, "phys.strength": 0.5 }, diff: -6, win: "win", lose: "danger",
        winText: ["생각할 것 없이 멀리 걷어 냈다."], loseText: ["헛발질! 공이 상대 앞으로 굴렀다!"] },
      { label: "침착하게 연결", stats: { "tech.firstTouch": 0.5, "tech.pass": 0.5 }, diff: 6, win: "keyPass", lose: "danger",
        winText: ["한 번 접어 상대를 흘리고 {mate}에게 연결! 역습이다!"], loseText: ["접다가 뺏겼다! 골문 바로 앞이다!"] },
    ] },
  { id: "df_overlap", intro: false, pos: ["DF"], zone: "att", weight: 2,
    text: ["측면이 텅 비었다. {mate|이/가} 올라오라고 손짓한다."],
    choices: [
      { label: "올라가서 크로스", stats: { "phys.stamina": 0.3, "tech.cross": 0.7 }, diff: 4, win: "keyPass", lose: "turnover",
        winText: ["끝까지 달려가 올린 크로스가 문전으로!"], loseText: ["크로스가 수비 발에 맞았다. 내 자리가 비었다!"] },
      { label: "자리를 지킨다", stats: { "mental.focus": 1 }, diff: -12, win: "keep", lose: "keep",
        winText: ["뒤를 지켰다. 역습이 와도 걱정 없다."], loseText: ["뒤를 지켰다. 공격은 흐지부지 끝났다."] },
    ] },
  { id: "df_boxdribble", intro: false, poss: "them", pos: ["DF"], zone: "def", weight: 2,
    text: ["{opp|이/가} 공을 몰고 박스 안으로 들어온다. 발재간이 좋은 선수다."],
    choices: [
      { label: "슬라이딩 태클", stats: { "tech.defense": 0.7, "phys.agility": 0.3 }, diff: 6, win: "win", lose: "pkAgainst",
        winText: ["몸을 던져 공만 정확히 걷어 냈다! 관중석에서 박수가 터진다."], loseText: ["공보다 다리가 먼저 걸렸다. 휘슬. 페널티킥이다…"] },
      { label: "서서 버틴다", stats: { "tech.defense": 0.5, "mental.focus": 0.5 }, diff: 0, win: "win", lose: "danger",
        winText: ["끝까지 서서 따라붙었다. {opp|이/가} 결국 뒤로 돌린다."], loseText: ["순간 방향을 바꾼 {opp}에게 슈팅 각을 내줬다!"] },
    ] },
  { id: "df_last", intro: false, poss: "them", pos: ["DF", "MF"], zone: "def", weight: 2, late: true,
    text: ["경기 막판. 상대가 마지막 공격에 모든 걸 건다. 높은 공이 박스로 떨어진다."],
    choices: [
      { label: "머리로 걷어 낸다", stats: { "phys.jump": 0.6, "mental.focus": 0.4 }, diff: 3, win: "win", lose: "danger", physical: true,
        winText: ["가장 높이 떠서 걷어 냈다. 동료들이 소리를 지른다!"], loseText: ["머리에 빗맞았다. 공이 골문 앞으로 떨어진다!"] },
      { label: "상대 공격수를 막는다", stats: { "phys.strength": 0.6, "mental.competitive": 0.4 }, diff: 2, win: "win", lose: "danger", physical: true,
        winText: ["상대 공격수가 뛰지 못하게 몸으로 막았다. 공은 골라인 밖으로."], loseText: ["놓쳤다! {opp|이/가} 자유롭게 머리를 갖다 댄다!"] },
    ] },
];

// 팀 단위 해설
export const LINES = {
  kickoff: ["주심의 휘슬. 경기가 시작됐다.", "킥오프! {us|이/가} 먼저 공을 잡았다.", "양 팀 선수들이 손을 맞잡고 흩어진다. 킥오프.",
    "주장끼리 악수를 나누고 동전을 던진다. 킥오프.", "관중석이 잠깐 조용해진다. 휘슬이 울린다."],
  ourChance: ["{mate|이/가} 측면을 파고든다.", "{mate}의 침투 패스!", "{mate|이/가} 박스 안으로 뛰어든다.", "코너킥. {mate|이/가} 머리를 갖다 댄다."],
  ourGoal: ["{mate}의 슈팅이 골망을 흔든다! 골!", "{mate|이/가} 밀어 넣었다! 골!", "흘러나온 공을 {mate|이/가} 마무리! 골!"],
  ourMiss: ["{mate}의 슈팅, 골키퍼 선방.", "{mate}의 슈팅이 골대를 살짝 벗어난다.", "골대를 맞고 나왔다!"],
  theirChance: ["{opp|이/가} 역습에 나선다.", "{opp}의 날카로운 크로스.", "{opp|이/가} 박스 앞에서 공을 잡는다.", "상대 프리킥. {opp|이/가} 찬다."],
  theirGoal: ["{opp}의 슈팅이 골망을 가른다. 실점.", "{opp|이/가} 마무리했다. 실점.", "혼전 끝에 {opp}에게 골을 내줬다."],
  theirMiss: ["{opp}의 슈팅, 우리 골키퍼가 잡아 낸다.", "{opp}의 슈팅이 크로스바를 넘어간다.", "{mate|이/가} 몸을 던져 막아 냈다!"],
  myShotGoal: ["골키퍼를 보고 침착하게 차 넣었다. 골!", "구석으로 꽂았다. 골!!", "발등에 제대로 얹혔다. 그물이 출렁인다. 골!", "골키퍼 가랑이 사이로! 골!"],
  myShotSaved: ["회심의 슈팅! 골키퍼가 손끝으로 쳐 냈다.", "슈팅이 골키퍼 정면으로 갔다.", "골키퍼가 몸을 날려 막아 냈다. 손바닥이 얼얼할 거다."],
  myShotWide: ["아! 골대를 살짝 빗나간다.", "골포스트를 맞고 나왔다!", "발목에 힘이 덜 들어갔다. 골대 옆으로 흘러간다."],
  myHeadGoal: ["헤더가 골문 구석으로! 골!", "이마에 맞는 순간 알았다. 골!", "머리로 방향만 바꿨다. 골키퍼 반대편으로! 골!"],
  myChipGoal: ["골! 골키퍼는 손을 뻗어 보지도 못했다!", "들어갔다! 관중석이 들썩인다!"],
  myChipMiss: ["골키퍼가 겨우 손끝으로 쳐 냈다!", "골대를 맞고 나왔다! 거의 들어갈 뻔했다."],
  myHeadMiss: ["헤더가 골키퍼 품으로 간다.", "헤더가 크로스바 위로 넘어간다."],
  assistGoal: ["{mate|이/가} 그대로 밀어 넣는다! 도움 기록!", "{mate}의 마무리! 내 패스가 골이 됐다!"],
  assistMiss: ["{mate}의 슈팅이 아쉽게 빗나간다.", "{mate}의 슈팅, 골키퍼 선방."],
  dangerGoal: ["결국 {opp}에게 골을 내줬다. 고개를 숙였다.", "그대로 실점으로 이어졌다."],
  dangerSave: ["골키퍼가 막아 냈다. 가슴을 쓸어내린다.", "{mate|이/가} 뒤에서 걷어 냈다. 살았다."],
  turnoverGoal: ["뺏긴 공이 역습으로 이어졌다. 실점.", "공을 잃은 지 10초 만에 실점했다."],
  leakGoal: ["결국 상대가 슈팅까지 연결했다. 실점.", "한 번 열린 틈을 상대가 놓치지 않았다. 실점."],
  tapGoal: ["골! 빈 골문으로 밀어 넣었다!", "골라인 앞에서 툭. 골!"],
  pkGoal: ["골키퍼는 반대로 몸을 날렸다. 골!", "그물이 출렁인다. 페널티킥 성공!"],
  matePkGoal: ["{mate|이/가} 침착하게 차 넣었다. 골!", "{mate|이/가} 골키퍼를 반대로 보냈다. 골!"],
  matePkMiss: ["{mate}의 페널티킥, 골키퍼에게 막혔다!"],
  fkGoal: ["{mate}의 프리킥이 벽을 넘어 그대로 꽂힌다! 골!", "{mate}의 프리킥이 벽 사이를 뚫고 들어간다! 골!"],
  fkMiss: ["{mate}의 프리킥, 벽에 맞고 나온다.", "{mate}의 프리킥이 골대 위로 넘어간다."],
  pkAgainstGoal: ["{opp|이/가} 침착하게 차 넣는다. 실점.", "골키퍼 {gk|이/가} 방향은 맞혔지만 닿지 않았다. 실점."],
  pkAgainstSave: ["골키퍼 {gk}의 선방! 페널티킥을 막아 냈다!", "{opp}의 페널티킥이 골대를 맞고 나온다! 살았다!"],
  secondHalf: ["후반전 시작.", "후반 휘슬이 울린다. 마지막 35분이다.", "진영을 바꿔 후반이 시작된다.", "물병을 내려놓고 다시 운동장으로. 후반전이다."],
  halftime: ["전반 종료.", "전반 종료 휘슬. 선수들이 벤치로 걸어 들어온다.", "전반이 끝났다. 다들 숨이 턱까지 찼다."],
  fulltime: ["경기 종료 휘슬이 울린다.", "주심이 두 팔을 들어 올린다. 경기 끝.", "길게 휘슬이 울린다. 선수들이 그 자리에 주저앉는다.", "경기가 끝났다. 양 팀 선수들이 악수를 나눈다."],
  subIn: ["교체 투입. 감독님이 등을 두드린다. \"보여 줘라.\"", "감독님이 짧게 말한다. \"생각하지 말고 뛰어.\"",
    "코치님이 등을 떠민다. \"오른쪽 비었다. 거기로 가.\"", "사이드라인을 넘는 순간 심장이 빨라진다. 이제 내 차례다."],
};

// 하프타임 감독님 말
export const HALFTIME_TALK = {
  winning: ["좋다. 그런데 방심하는 순간 뒤집힌다. 하던 대로 해.", "잘하고 있다. 수비 라인 내리지 마라.", "한 골 더 넣으면 끝난다. 물러서지 마.",
    "점수는 잊어라. 0 대 0이라고 생각하고 다시 들어가.", "상대가 후반에 라인 올린다. 뒷공간 노려."],
  drawing: ["아직 아무것도 안 정해졌다. 한 골이면 된다.", "상대도 지쳤다. 더 뛰는 쪽이 이긴다.", "측면이 열린다. 후반엔 더 넓게 벌려라.",
    "전반은 탐색전이었다. 이제 우리가 먼저 때린다.", "물 마시고 숨 골라. 후반 10분 안에 승부 본다."],
  losing: ["고개 들어. 35분이면 충분히 뒤집는다.", "겁먹지 마라. 우리 축구 하자.", "실점은 잊어. 지금부터 0 대 0이라고 생각해.",
    "한 골씩만 생각해라. 한 번에 두 골 넣으려 하지 말고.", "졌다고 생각하는 사람 손 들어 봐. 없지? 그럼 나가."],
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
    { who: "MF", at: [93, "W"], same: true, t: ["{a}의 크로스!", "{a|이/가} 문전으로 공을 띄운다."] },
    { who: "FW", at: [95, "C"], t: [] },
  ] },
  { id: "long", weight: 2, finish: "shot", steps: [
    { who: "DF", at: [22, "C"], t: ["{a}의 롱볼!", "{a|이/가} 전방으로 길게 찬다."] },
    { who: "FW", at: [68, "C"], t: ["{a|이/가} 머리로 떨군다.", "{a|이/가} 등지고 버티며 공을 내준다."] },
    { who: "MF", at: [82, "H"], t: ["세컨드볼을 {a|이/가} 잡았다!", "흘러나온 공, {a}에게 간다!"] },
  ] },
  { id: "counter", weight: 2, finish: "shot", steps: [
    { who: "MF", at: [38, "H"], t: ["{a|이/가} 공을 끊어 냈다! 역습!", "가로챘다! {a}에서 시작되는 역습."] },
    { who: "FW", at: [70, "H"], t: ["{a}에게 길게 연결. 수비 숫자가 부족하다!", "{a|이/가} 수비 뒤로 빠져 들어간다!"] },
    { who: "FW", at: [88, "C"], same: true, t: [] },
  ] },
  { id: "corner", weight: 2, finish: "header", steps: [
    { who: "MF", at: [104, "K"], t: ["코너킥. {a|이/가} 공을 내려놓는다.", "코너킥 기회. {a|이/가} 손을 들어 신호를 보낸다."] },
    { who: "DF", at: [95, "C"], t: [] },
  ] },
  { id: "onetwo", weight: 2, finish: "shot", steps: [
    { who: "MF", at: [58, "C"], t: ["{a|과/와} {b}의 원투 패스!", "{a|이/가} 짧게 주고 다시 받는다."] },
    { who: "FW", at: [84, "C"], t: ["{a|이/가} 박스 안으로 파고든다!"] },
  ] },
  { id: "longshot", weight: 1, finish: "long", steps: [
    { who: "MF", at: [62, "C"], t: ["{a|이/가} 공을 잡고 앞을 본다. 수비가 물러선다.", "아무도 {a|을/를} 막지 않는다."] },
    { who: "MF", at: [72, "C"], same: true, t: [] },
  ] },
  { id: "cutback", weight: 2, finish: "shot", steps: [
    { who: "MF", at: [55, "H"], t: ["{a|이/가} 측면으로 찔러 준다.", "{a}의 전진 패스가 측면으로."] },
    { who: "FW", at: [100, "W"], t: ["{a|이/가} 골라인 끝까지 파고든다!", "{a|이/가} 수비를 달고 엔드라인까지 간다."] },
    { who: "MF", at: [88, "C"], t: ["뒤로 내준 컷백! {a|이/가} 달려 들어온다!", "{a} 앞으로 컷백이 굴러간다!"] },
  ] },
  { id: "overlap", weight: 2, finish: "header", steps: [
    { who: "MF", at: [60, "H"], t: ["{a|이/가} 공을 잡고 측면을 본다.", "{a|이/가} 측면 수비가 올라올 시간을 번다."] },
    { who: "DF", at: [92, "W"], t: ["측면 수비 {a}의 오버래핑! 크로스!", "{a|이/가} 끝까지 올라가 공을 띄운다!"] },
    { who: "FW", at: [95, "C"], t: [] },
  ] },
  { id: "switch", weight: 2, finish: "shot", steps: [
    { who: "DF", at: [35, "H"], t: ["{a|이/가} 반대편으로 길게 공을 바꾼다.", "{a}의 대각선 롱패스."] },
    { who: "MF", at: [66, "W"], t: ["반대편의 {a|이/가} 가슴으로 받아 놓는다.", "{a|이/가} 깔끔하게 잡았다."] },
    { who: "FW", at: [86, "C"], t: ["안쪽으로 파고드는 {a}에게!", "{a|이/가} 공을 받아 돌아선다!"] },
  ] },
  { id: "press", weight: 2, finish: "shot", steps: [
    { who: "FW", at: [82, "H"], t: ["{a|이/가} 수비수를 끝까지 쫓아간다. 빼앗았다!", "전방 압박! {a|이/가} 수비수의 공을 낚아챘다!"] },
    { who: "FW", at: [90, "C"], same: true, t: [] },
  ] },
  { id: "solo", weight: 1, finish: "shot", steps: [
    { who: "FW", at: [62, "C"], t: ["{a|이/가} 공을 잡고 그대로 드리블을 시작한다.", "{a|이/가} 수비 한 명을 제치고 속도를 올린다!"] },
    { who: "FW", at: [84, "H"], same: true, t: ["또 한 명! {a|이/가} 박스 앞까지 왔다!", "{a|이/가} 두 번째 수비까지 벗겨 낸다!"] },
  ] },
  { id: "freekick", weight: 1, finish: "fk", steps: [
    { who: "MF", at: [78, "C"], t: ["박스 앞에서 프리킥. {a|이/가} 공을 내려놓는다.", "좋은 위치에서 프리킥. 키커는 {a}."] },
  ] },
  { id: "penalty", weight: 0.4, finish: "pk", steps: [
    { who: "FW", at: [92, "C"], t: ["{a|이/가} 박스 안에서 넘어졌다! 주심이 페널티 지점을 가리킨다!", "핸드볼! 주심이 휘슬과 함께 페널티 지점을 가리킨다. 키커는 {a}."] },
  ] },
  { id: "buildup", weight: 2, finish: "shot", steps: [
    { who: "DF", at: [20, "C"], t: ["{a|이/가} 옆 수비에게 짧게 내준다.", "{a|이/가} 뒤에서 공을 돌리며 압박을 끌어낸다."] },
    { who: "DF", at: [24, "H"], t: ["{a|이/가} 받아서 한 번 더 옆으로.", "{a}의 짧은 패스가 중원으로 향한다."] },
    { who: "MF", at: [45, "C"], t: ["{a|이/가} 내려와서 받는다. 압박을 한 번에 벗겨 낸다.", "{a|이/가} 등을 진 채 받아 돌아선다."] },
    { who: "MF", at: [66, "H"], t: ["{a}에게 다시 연결. 미드필드 라인을 넘었다.", "{a|이/가} 전진 패스를 받는다."] },
    { who: "FW", at: [86, "C"], t: ["박스 앞의 {a}에게!", "{a|이/가} 수비 사이에서 공을 잡는다!"] },
  ] },
  { id: "keeper", weight: 1, finish: "shot", steps: [
    { who: "GK", at: [5, "C"], t: ["골키퍼 {a|이/가} 길게 찬다.", "{a}의 골킥이 하프라인을 넘는다."] },
    { who: "FW", at: [62, "C"], t: ["{a|이/가} 머리로 떨궈 준다.", "{a|이/가} 공중볼을 따내 옆으로 흘린다."] },
    { who: "MF", at: [78, "H"], t: ["흘러나온 공을 {a|이/가} 잡아 그대로 몰고 간다!", "{a|이/가} 세컨드볼을 따냈다!"] },
  ] },
  { id: "wingdribble", weight: 2, finish: "shot", steps: [
    { who: "MF", at: [60, "W"], t: ["측면의 {a|이/가} 수비와 1대1로 마주 섰다.", "{a|이/가} 터치라인 쪽에서 공을 잡는다."] },
    { who: "MF", at: [90, "W"], same: true, t: ["{a|이/가} 헛다리 한 번에 수비를 제쳤다! 엔드라인까지!", "{a|이/가} 속도로 수비를 따돌린다!"] },
    { who: "FW", at: [93, "C"], t: ["낮게 깔아 준 크로스, {a|이/가} 달려든다!", "{a} 앞으로 땅볼 크로스!"] },
  ] },
  { id: "throwin", weight: 1, finish: "header", steps: [
    { who: "DF", at: [88, "W"], t: ["{a}의 롱 스로인. 공이 박스 안으로 날아간다.", "{a|이/가} 수건으로 공을 닦고 길게 던진다."] },
    { who: "FW", at: [94, "C"], t: [] },
  ] },
];

// 공격이 슈팅까지 못 가고 끊기는 경우 (전개 중간에 무작위로)
// {a} 공을 가진 쪽 선수, {d} 끊어 낸 수비, {gk} 막는 쪽 골키퍼
export const BREAK = {
  intercept: ["{d|이/가} 패스 길을 읽고 끊어 낸다.", "{d|이/가} 발을 쭉 뻗어 공을 가로챘다.", "{d|이/가} 한 발 먼저 들어와 패스를 잘라 낸다."],
  tackle:    ["{d}의 태클! {a|이/가} 공을 빼앗겼다.", "{d|이/가} 몸을 붙여 {a}의 공을 빼냈다.", "{d|이/가} 뒤에서 발을 넣어 {a}의 공을 걷어 낸다."],
  offside:   ["{a|이/가} 한 발 먼저 나갔다. 부심 깃발이 올라간다. 오프사이드.", "오프사이드. {a|이/가} 아쉬운 듯 고개를 젓는다.", "수비 라인이 한 발 올라섰다. {a|은/는} 오프사이드에 걸렸다."],
  out:       ["패스가 길었다. 공이 터치라인을 넘어간다.", "{a}의 패스가 너무 강했다. 골라인 아웃.", "{a}의 크로스가 반대편 터치라인까지 날아갔다."],
  claim:     ["골키퍼 {gk|이/가} 뛰어나와 공을 잡아 낸다.", "{gk|이/가} 먼저 나와 공을 품에 안았다.", "{gk|이/가} 높이 떠서 크로스를 두 손으로 낚아챈다."],
};

// 마무리 문장. {a} 슈팅한 선수, {gk} 골키퍼, {d} 몸을 던진 수비수
export const FINISH = {
  shot:   ["{a}의 오른발 슈팅!", "{a|이/가} 수비를 앞에 두고 때린다!", "{a}의 낮게 깔린 슈팅!", "{a}의 왼발 슈팅!",
           "{a|이/가} 반 박자 빠르게 때린다!", "{a}의 감아 차기!", "{a|이/가} 수비 사이로 슈팅 각을 만든다. 슈팅!"],
  header: ["{a}의 헤더!", "{a|이/가} 솟구쳐 머리를 갖다 댄다!", "{a|이/가} 수비 사이에서 머리를 돌린다!", "{a}의 머리에 정확히 걸렸다!", "{a|이/가} 몸을 날려 머리로 받는다!"],
  long:   ["{a}의 중거리 슈팅!", "{a|이/가} 먼 거리에서 과감하게 때린다!", "{a|이/가} 30미터 밖에서 그대로 때린다!"],
  fk:     ["{a}의 프리킥! 벽을 향해 감아 찬다!", "{a|이/가} 감아 찬다!"],
  pk:     ["{a|이/가} 키커로 나선다. 달려간다…", "{a}의 페널티킥!"],
};
export const RESULT = {
  us: {
    goal:  ["골! {a|이/가} 골망을 흔든다!", "들어갔다! {a}의 골!", "골키퍼가 손도 못 댔다. {a}의 골!", "골키퍼 손끝을 스치고 들어간다! {a}의 골!"],
    save:  ["{gk}의 선방에 막혔다.", "{gk|이/가} 몸을 날려 쳐 낸다!", "골키퍼 정면. {gk|이/가} 잡아 낸다.", "{gk|이/가} 다리를 뻗어 막아 낸다."],
    wide:  ["골대를 살짝 벗어난다.", "크로스바를 넘어간다.", "옆 그물을 때린다. 아깝다.", "힘이 너무 들어갔다. 관중석으로."],
    block: ["수비수 몸에 맞고 굴절된다.", "수비가 발을 뻗어 막아 낸다.", "몸을 던진 {d}에게 맞았다."],
    post:  ["골대를 맞고 튀어나온다! 아깝다!", "크로스바를 때렸다!", "골대 안쪽을 맞고 골라인 위로 굴러 나온다! 이게 안 들어가나!"],
  },
  them: {
    goal:  ["실점. {a}의 슈팅이 그대로 들어갔다.", "{a|이/가} 마무리한다. 실점.", "막을 수 없었다. {a}의 골.", "{gk|이/가} 손을 뻗었지만 닿지 않았다. 실점."],
    save:  ["우리 골키퍼 {gk}의 선방!", "{gk|이/가} 정확하게 잡아 낸다.", "{gk|이/가} 손끝으로 쳐 낸다!", "{gk|이/가} 끝까지 공을 보고 막아 낸다!"],
    wide:  ["골대를 벗어난다. 휴.", "크로스바 위로 날아간다.", "{a}의 슈팅이 골대 옆으로 흘러간다."],
    block: ["{d|이/가} 몸을 던져 막아 낸다!", "{d}의 태클! 슈팅을 막았다.", "{d|이/가} 다리를 쭉 뻗어 슈팅 길을 막았다!"],
    post:  ["골대를 맞혔다! 가슴이 철렁한다.", "{a}의 슈팅이 골대를 때리고 나온다. 운이 따랐다.", "크로스바를 맞고 위로 튄다. 휴, 살았다."],
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
  { side: "none", t: "양 팀 모두 탐색전이다. 서로의 움직임을 살핀다.", early: true },
  { side: "none", t: "바닷바람이 거세진다. 높이 뜬 공이 자꾸 바람에 밀린다." },
  { side: "none", t: "부심의 깃발이 올라간다. 오프사이드." },
  { side: "none", t: "공이 관중석으로 넘어갔다. 학부모 한 분이 공을 던져 준다." },
  { side: "us",   t: "{gk|이/가} 높게 날아온 크로스를 가볍게 잡아 낸다." },
  { side: "us",   t: "{a|이/가} 수비 라인을 정리하며 소리친다. \"하나, 둘, 올려!\"" },
  { side: "us",   t: "{a|이/가} 상대 선수와 부딪혀 쓰러졌다. 잠시 경기가 멈췄다. 다행히 곧 털고 일어선다." },
  { side: "us",   t: "{a}의 스로인. 짧게 주고받으며 공을 지킨다." },
  { side: "us",   t: "{coach|이/가} 벤치에서 일어나 손뼉을 친다. \"좋아, 그렇게!\"" },
  { side: "them", t: "상대 벤치가 선수를 바꾼다. 발 빠른 공격수가 들어온다.", min: 40 },
  { side: "them", t: "상대 골키퍼가 길게 찬 공이 하프라인을 넘어온다." },
  { side: "them", t: "{o|이/가} 몸싸움 끝에 넘어지며 항의한다. 주심은 고개를 젓는다." },
  { side: "none", t: "양 팀 선수들 다리가 무거워 보인다. 종아리를 주무르는 선수도 있다.", late: true },
  { side: "us",   t: "{coach|이/가} 시계를 가리키며 소리친다. \"집중! 끝까지!\"", late: true },
  { side: "none", t: "대기심이 추가 시간 2분을 알린다.", min: 66 },
];

// 내 장면 직전, 공이 나에게 오는 문장
export const TO_ME = {
  att: ["{mate}의 패스가 나에게 온다.", "{mate|이/가} 공을 찔러 준다. 내 차례다.", "{mate|이/가} 고개를 들어 나를 찾는다. 공이 온다.",
    "수비 사이에 틈이 보인다. 손을 들자 {mate|이/가} 바로 공을 보낸다.", "흘러나온 공이 내 쪽으로 굴러온다.", "{mate|이/가} 수비 둘을 끌고 가며 나에게 내준다."],
  mid: ["{mate|이/가} 나에게 공을 내준다.", "공이 중원으로 흘러나와 내 발 앞에 떨어진다.", "{mate}의 패스를 받으러 내려왔다.",
    "{mate|이/가} 고개를 들더니 나에게 공을 밀어 준다.", "골키퍼가 짧게 굴려 준 공이 돌고 돌아 나에게 온다.", "몸을 반쯤 열고 {mate}의 패스를 기다린다. 왔다."],
  def: ["{opp|이/가} 공을 몰고 내 쪽으로 온다.", "상대 공격이 내 쪽 측면으로 몰린다.", "상대가 빠르게 공을 돌리며 우리 진영으로 들어온다.",
    "{opp|이/가} 속도를 붙여 내 쪽으로 파고든다.", "상대 롱볼이 내 머리 위로 날아온다.", "{opp|이/가} 등을 지고 공을 받는다. 내가 붙어야 한다."],
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
    win: "head", lose: "miss", physical: true, winText: ["수비 셋을 뚫고 솟구쳤다!"], loseText: ["골대 옆으로 비껴갔다."] },
  freekick: { label: "벽을 넘겨 구석으로 감아 찬다", requires: { "tech.shoot": 74 }, stats: { "tech.shoot": 0.7, "mental.confidence": 0.3 }, diff: 8,
    win: "chip", lose: "miss", winText: ["벽을 넘은 공이 뚝 떨어지며 구석으로 휘어 들어간다…"], loseText: ["아깝게 골대를 스쳤다."] },
};

// 내가 팀 공격에 자동으로 끼는 장면 (능력치가 높을수록 자주)
export const ME_IN_PLAY = {
  build: ["{me|이/가} 공을 받아 앞을 본다. 상대가 두 명 붙는다.", "{me}에게 공이 모인다."],
  pass:  ["{me}의 정확한 패스!", "{me|이/가} 원터치로 방향을 바꿔 준다."],
  shot:  ["{me}의 슈팅!", "{me|이/가} 지체 없이 때린다!"],
  head:  ["{me}의 헤더!", "{me|이/가} 수비 머리 위로 솟구친다!", "{me|이/가} 공 떨어지는 곳을 먼저 잡고 머리를 갖다 댄다!"],
  fk:    ["{me|이/가} 프리킥 키커로 나섰다. 숨을 고르고… 찼다!"],
  pk:    ["{me|이/가} 페널티킥 키커로 나선다. 심장이 쿵쾅거린다…"],
  stop:  ["{me|이/가} 태클로 끊어 낸다!", "{me|이/가} 길목을 막고 공을 빼앗는다!", "{me|이/가} 몸을 날려 슈팅을 막아 낸다!"],
  marked: ["상대 감독이 {me|을/를} 가리키며 수비수에게 뭔가 지시한다.", "상대 수비수 둘이 {me} 주변에 붙어 다닌다."],
};

// ── 경기 전 한마디 ───────────────────────────
// who: coach 감독 / assistant 코치. tag: 지시 내용 (경기 중 같은 종류의 선택을 하면 성공률 +4%p)
//   shoot 슈팅 / pass 패스 / dribble 돌파 / defend 수비 / physical 몸싸움 / safe 안정 / null 지시 없음
// when: start 선발 / sub 교체 / bench 벤치 / big 대회·진학 경기 / ko 토너먼트 / hs 고교 감독 관전 / tired 피로 높음 / star 에이스
export const PREMATCH = [
  { who: "coach", when: "start", tag: "shoot", t: "박스 근처에서 망설이지 마라. 보이면 때려. 빗나가도 내가 뭐라 안 한다." },
  { who: "coach", when: "start", tag: "pass", t: "오늘은 공 오래 끌지 마라. 원터치, 투터치. 공이 사람보다 빨라야 한다." },
  { who: "coach", when: "start", tag: "dribble", t: "측면에서 1대1 붙으면 자신 있게 들어가. 상대 풀백 발이 느리다." },
  { who: "coach", when: "start", tag: "defend", t: "오늘은 실점 안 하는 게 먼저다. 태클은 뒤에서 들어가지 말고, 타이밍 봐라." },
  { who: "coach", when: "start", tag: "physical", t: "상대가 몸으로 밀고 들어온다. 첫 번째 부딪힘에서 밀리면 경기 내내 밀린다." },
  { who: "coach", when: "start", tag: "safe", t: "무리하지 마라. 쉽게 쉽게. 실수만 안 하면 우리가 이기는 경기다." },
  { who: "assistant", when: "start", tag: "pass", t: "상대 미드필더가 공 잡으면 등 돌린다. 그 순간 앞으로 찔러 줘." },
  { who: "assistant", when: "start", tag: "shoot", t: "상대 골키퍼가 키가 작다. 높은 쪽 구석, 기억해." },
  { who: "assistant", when: "start", tag: "defend", t: "역습 맞으면 일단 늦춰. 혼자 뛰어들지 말고 동료 기다려." },
  { who: "assistant", when: "start", tag: "dribble", t: "공 잡으면 고개 먼저 들고. 앞이 비면 그냥 치고 가." },
  { who: "coach", when: "sub", tag: "dribble", t: "들어가면 바로 템포 올려라. 상대 다리가 무거울 때다." },
  { who: "coach", when: "sub", tag: "shoot", t: "시간 얼마 없다. 기회 오면 바로 때려." },
  { who: "assistant", when: "sub", tag: "pass", t: "벤치에서 보니까 오른쪽이 비더라. 들어가면 그쪽으로 공 돌려." },
  { who: "assistant", when: "bench", tag: null, t: "벤치에서도 경기 읽어라. 언제 부를지 모른다. 몸은 계속 데워 두고." },
  { who: "assistant", when: "bench", tag: null, t: "오늘 못 뛰어도 상대 풀백 버릇 하나만 찾아 와라. 다음에 네가 쓴다." },
  { who: "coach", when: "bench", tag: null, t: "오늘은 형들 뛰는 거 봐라. 공 없을 때 어디 서 있는지. 그게 공부다." },
  { who: "coach", when: "sub", tag: "physical", t: "후반엔 다들 지친다. 들어가서 첫 경합부터 이겨라. 그럼 분위기가 바뀐다." },
  { who: "coach", when: "big", tag: "safe", t: "큰 경기는 실수 적은 팀이 이긴다. 오늘은 욕심보다 정확하게." },
  { who: "coach", when: "big", tag: "physical", t: "전국대회다. 다들 우리보다 크다. 그래도 피하지 마라." },
  { who: "coach", when: "ko", tag: "defend", t: "지면 끝이다. 먼저 실점하지 않는 게 첫째. 그다음은 너희 몫이다." },
  { who: "assistant", when: "ko", tag: "safe", t: "토너먼트는 한 번 실수가 끝이다. 위험한 곳에서는 그냥 걷어 내." },
  { who: "assistant", when: "hs", tag: "pass", t: "고등학교 감독님이 보신다. 화려한 거 말고, 공 주고 움직이는 거. 그걸 보러 오신 거다." },
  { who: "coach", when: "hs", tag: "physical", t: "형들이다. 몸으로 밀릴 거다. 그래도 한 번은 버텨 봐라. 그 한 번을 보러 오신 거다." },
  { who: "coach", when: "tired", tag: "safe", t: "너 오늘 다리 무거워 보인다. 아끼면서 뛰어. 무리한 질주는 하지 마라." },
  { who: "assistant", when: "tired", tag: "pass", t: "오늘은 짧게 주고 많이 움직이지 마라. 아낀 힘은 후반에 써라." },
  { who: "coach", when: "star", tag: "pass", t: "상대가 너만 본다. 그럼 너 말고 다른 애가 비겠지. 그걸 이용해." },
  { who: "assistant", when: "star", tag: "shoot", t: "수비 둘이 붙어도 너는 슈팅 각 나온다. 주눅 들지 마." },
];
