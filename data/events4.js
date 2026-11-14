// 출신 이야기: 출신(축구 처음 시작·초등 득점왕·육상부·클럽 탈락)마다 1·2·3학년에 한 번씩 (HANDOFF 29절)
// 앞의 선택은 marks로 기억해 두고 뒤 이야기에서 다시 꺼냄. 오프닝 회상(data/story.js growthAnswers.memory)과 이어짐
// 문장 안의 {coach} {assistant} {teacher} {friend} {junior} {name}은 자동으로 바뀝니다.

import { turnInfo } from "../js/engine/calendar.js";

const is = k => s => s.player.growthType === k;
// 그 달 w1~w2주 사이 처음 빈 주에 (같은 주에 다른 이야기가 겹쳐 밀려도 다음 주에 나옴)
const win = (m, w1, w2) => s => { const i = turnInfo(s); return !!i && i.month === m && i.week >= w1 && i.week <= w2; };
const weeks = (...list) => s => { const i = turnInfo(s); return !!i && list.some(([m, w]) => i.month === m && i.week === w); };   // 달을 넘어가는 창
const marked = (s, k) => s.marks?.[k] != null;
const firstApp = s => s.record.matches.find(m => m.official && m.minutes > 0);
const POS = { FW: "공격수", MF: "미드필더", DF: "수비수" };

export const EVENTS_ORIGIN = [
  // ── 축구 처음 시작 ───────────────────────────
  { id: "o_rk_juggle", cond: is("rookie"), once: true, priority: 1, trigger: win(4, 2, 4), when: { grades: [1] }, bg: "ev_lifting", who: "assistant",
    text: "훈련이 끝나고 다들 씻으러 간 사이, 혼자 남아 리프팅을 했다. 하나, 둘… 세 번째에 공이 정강이를 맞고 튀어 나갔다. 공을 주우러 가는데 벤치에 {assistant}님이 앉아 계셨다. \"몇 개 하냐?\"",
    choices: [
      { mark: "rk_juggle", label: "\"세 개요…\" 솔직하게 말한다", fx: { s: { "tech.firstTouch": 1 }, morale: 3 },
        result: "\"세 개면 됐다. 내일은 네 개 해.\" 코치님이 공을 다시 던져 주셨다. 해 질 때까지 다섯 개를 못 넘겼는데, 이상하게 기분이 나쁘지 않았다." },
      { mark: "rk_juggle", label: "요령을 여쭤본다", fx: { s: { "tech.firstTouch": 0.6, "tech.dribble": 0.4 }, coach: 1 },
        result: "\"발등으로 때리지 말고 받쳐. 무릎은 살짝 굽히고.\" 코치님이 시범을 보여 주셨다. 공이 발에 붙어서 내려올 생각을 안 한다. 저게 언젠가 내 발이 될까." },
      { mark: "rk_juggle", label: "\"내일은 백 개 할 거예요\" 큰소리친다", fx: { s: { "mental.confidence": 1 }, fatigue: 3 },
        result: "코치님이 웃음을 참으며 고개를 끄덕이셨다. 다음 날 기록은 일곱 개. 백 개까지 아흔세 개 남았다." },
    ] },
  { id: "o_rk_debut", cond: is("rookie"), once: true, priority: 1, trigger: s => !!firstApp(s), bg: "bg_locker", who: "narr",
    text: s => {
      const m = firstApp(s), sub = m.status !== "start";
      return `처음으로 공식 경기에 나갔다. ${sub ? `교체로, ${m.minutes}분.` : "그것도 선발로."} 경기장에 들어설 때는 다리가 내 다리가 아닌 것 같았다.`
        + `${m.goals ? " 그런데 골까지 넣었다." : ""} 라커룸에 돌아와 앉으니 그제야 손이 떨린다.`;
    },
    choices: [
      { label: "유니폼을 빨지 않고 방에 걸어 둔다", fx: { morale: 6 },
        result: "빨래 바구니를 들고 들어오셨던 엄마가 그냥 나가셨다. 흙 묻은 등번호가 침대 맞은편 벽에 걸렸다." },
      { label: "경기 영상을 다시 돌려 본다", fx: { s: { "mental.focus": 1, "tech.firstTouch": 0.3 } },
        result: s => marked(s, "rk_juggle")
          ? "첫 터치가 두 번 길었다. 리프팅 세 개에서 시작한 발치고는… 아니, 그래도 길었다. 공이 발에서 떨어질 때마다 화면을 멈췄다."
          : "첫 터치가 두 번 길었다. 공이 발에서 떨어질 때마다 화면을 멈췄다. 내일 고칠 게 생겼다." },
      { label: "단톡방에 \"나 오늘 뛰었다\" 한 줄 남긴다", fx: { morale: 4, rel: { friend: 3 } },
        result: s => `1분 만에 답이 쏟아졌다. "ㄹㅇ?" "축구 시작한 지 ${s.calendar.grade === 1 ? "1년도 안 됐는데" : "얼마나 됐다고"}?" "사인 미리 받아 둔다." 휴대폰을 엎어 놓고도 한참 웃었다.` },
    ] },
  { id: "o_rk_edge", cond: is("rookie"), once: true, priority: 1, school: true, trigger: win(4, 3, 5), when: { grades: [3] }, bg: "bg_field_day", who: "narr",
    text: "점심시간. 운동장 가장자리에 1학년 하나가 서 있다. 공이 그쪽으로 굴러가자 그 아이가 머뭇거리다 손으로 공을 집어 던져 준다.\n\n축구부에 들어오기 전의 나다.",
    choices: [
      { label: "\"발로 차 봐\" 하고 공을 다시 굴려 준다", fx: { s: { "mental.teamwork": 1 }, morale: 5 },
        result: "공이 엉뚱한 데로 날아갔다. 아이가 얼굴이 빨개져서 사과한다. \"괜찮아. 나도 처음엔 그랬어.\" 빈말이 아니었다." },
      { label: "같이 차자고 불러들인다", fx: { s: { "mental.teamwork": 1.2, "student.attitude": 0.5 }, morale: 4 },
        result: "종이 칠 때까지 아이가 공만 쫓아다녔다. 숨을 헐떡이며 묻는다. \"형, 축구부는 언제 들어갈 수 있어요?\" 예전에 내가 묻고 싶었던 질문이다." },
      { label: "리프팅을 보여 준다", req: { "tech.firstTouch": 55 }, fx: { s: { "mental.confidence": 1 }, morale: 6 },
        result: s => `발등, 무릎, 머리, 다시 발등. 서른 개를 넘기자 구경하던 1학년들이 박수를 쳤다.${marked(s, "rk_juggle") ? " 1학년 4월에 세 개에서 멈추던 공이었다." : ""}` },
    ] },

  // ── 초등 득점왕 출신 ─────────────────────────
  { id: "o_ace_seniors", cond: is("ace"), once: true, priority: 1, trigger: weeks([3, 4], [3, 5], [4, 1], [4, 2], [4, 3]), when: { grades: [1] }, bg: "bg_field_day", who: "narr",
    text: "청백전. 공을 잡기만 하면 3학년 선배가 몸을 붙여 온다. 세 번째로 넘어졌을 때 위에서 목소리가 들렸다.\n\n\"초등부 득점왕이라며. 여긴 중학교야.\"",
    choices: [
      { label: "말없이 일어나 다음 공을 기다린다", fx: { s: { "mental.focus": 1, "mental.competitive": 0.5 }, coach: 1 },
        result: "네 번째 공. 몸이 붙기 전에 한 번 접고 돌아섰다. 슈팅은 골대를 넘어갔지만, 그 선배는 더 말을 걸지 않았다." },
      { label: "\"한 번만 더 해 주세요\" 하고 웃는다", fx: { s: { "mental.confidence": 1 }, morale: 2 },
        result: "선배가 어이없다는 듯 웃었다. 그 뒤로도 계속 넘어졌다. 훈련이 끝나고 그 선배가 물병을 던져 줬다. \"독하네.\"" },
      { label: "벤치로 가서 정강이를 문지른다", fx: { fatigue: -3, morale: -3, coach: -1 },
        result: "{assistant}님이 다가와 쭈그려 앉으셨다. \"아프냐, 아니면 자존심이 상했냐.\" 대답을 못 했다." },
    ] },
  { id: "o_ace_text", cond: is("ace"), once: true, priority: 1, trigger: weeks([5, 3], [5, 4], [5, 5], [6, 1], [6, 2]), when: { grades: [2] }, bg: "ev_night_phone", who: "narr",
    text: s => {
      const p = s.player.position;
      const recent = s.record.matches.filter(m => m.official).slice(-8).reduce((a, m) => a + (m.goals || 0), 0);
      const line = p !== "FW" ? `네가 ${POS[p]}를 한다며? 득점왕이 웬일이냐 ㅎㅎ` : recent >= 4 ? "요즘 기록 봤다. 골 꽤 넣더라? 자만하지 말고." : "요즘 기록 봤다. 골이 좀 안 나오더라?";
      return `초등학교 때 코치님에게서 문자가 왔다.\n\n"${line} 초등부 애들한테 아직도 네 얘기 한다. 힘내라."\n\n답장 칸에 손가락을 올려놓은 채 한참 앉아 있었다.`;
    },
    choices: [
      { mark: "ace_newme", label: "\"요즘은 다른 걸 배우고 있어요\"", fx: { s: { "mental.teamwork": 1 }, morale: 3 },
        result: "\"그래, 골만 넣는 선수는 고등학교 가면 금방 막힌다. 잘하고 있네.\" 생각보다 빨리 답이 왔다. 어깨가 조금 가벼워졌다." },
      { label: "\"곧 기사로 보여 드릴게요\"", fx: { s: { "mental.competitive": 1, "mental.confidence": 0.5 }, fatigue: 2 },
        result: "보내고 나서 바로 후회했다. 그날 밤 혼자 운동장에서 슈팅을 백 개 찼다. 말했으면 지켜야지." },
      { label: "읽고 답장하지 않는다", fx: { s: { "mental.focus": 0.5 }, morale: -2 },
        result: "휴대폰을 서랍에 넣었다. 득점왕 메달은 어디 뒀더라. 찾지 않기로 했다." },
    ] },
  { id: "o_ace_medal", cond: is("ace"), once: true, priority: 1, trigger: weeks([11, 2], [11, 3], [11, 4], [11, 5], [12, 2]), when: { grades: [3] }, bg: "ev_award", who: "narr",
    text: "모교 초등학교 축구 대회 시상식. 옛 코치님이 시상자로 나를 부르셨다. 올해 득점왕은 키가 내 가슴께밖에 안 오는 4학년이다. 메달을 걸어 주자 아이가 올려다보며 묻는다.\n\n\"형도 득점왕이었죠? 중학교 가면 어때요?\"",
    choices: [
      { label: "\"솔직히, 처음엔 엄청 넘어졌어\"", fx: { s: { "mental.teamwork": 1 }, morale: 5 },
        result: s => marked(s, "ace_newme")
          ? "\"골 말고도 할 줄 아는 게 많아야 해. 형도 그거 배우느라 3년 걸렸어.\" 아이가 고개를 갸웃했다. 나도 4학년 땐 몰랐으니까."
          : "\"넘어지면 일어나면 돼.\" 하나 마나 한 소리 같았는데, 아이가 진지하게 고개를 끄덕였다. 코치님이 뒤에서 웃으셨다." },
      { label: "\"계속 넣으면 돼\" 하고 머리를 쓰다듬는다", fx: { s: { "mental.confidence": 1.2 }, morale: 3 },
        result: "아이 눈이 반짝였다. 돌아오는 길에 생각했다. 나는 계속 넣고 있나." },
      { label: "서랍 속 내 메달을 꺼내 보여 준다", fx: { s: { "mental.competitive": 0.5 }, morale: 6 },
        result: "3년 동안 서랍에 있던 메달은 줄이 바래 있었다. 두 개를 나란히 들고 사진을 찍었다. 아이 메달이 더 반짝였다. 그래도 괜찮았다." },
    ] },

  // ── 초등 족구부 출신 ─────────────────────────
  // 학교에 족구부는 없음. 학교스포츠클럽 족구 대회에 나갈 사람을 체육 선생님이 찾고, 담임이 말을 전함
  { id: "o_jg_cup", cond: is("jokgu"), once: true, priority: 1, school: true, trigger: weeks([5, 2], [5, 3], [5, 5], [6, 1], [6, 2]), when: { grades: [1] }, bg: "ev_classroom", who: "teacher",
    text: "종례가 끝나고 {teacher}께서 나를 부르셨다.\n\n\"{given|아/야}, 체육 선생님이 그러시던데 너 초등학교 때 족구부였다며? 이번에 학교스포츠클럽 족구 대회가 있는데, 우리 학교는 네 명 채우기도 빠듯하대. 한번 나가 볼래?\"",
    choices: [
      { mark: "jg_cup", label: "감독님께 허락받고 나간다", fx: { s: { "tech.firstTouch": 0.6, "phys.jump": 0.4 }, coach: 1, fatigue: 4, morale: 4 },
        result: "감독님은 \"발목 조심해라\" 한마디만 하셨다. 군 대회 결승까지 갔다. 마지막 점수에서 내 서브가 네트 윗줄에 걸려 우리 쪽으로 떨어졌다. 준우승 메달을 받아 들고도 그 서브가 자꾸 떠올랐다." },
      { label: "\"축구에 집중하고 싶어요\" 하고 말씀드린다", fx: { s: { "mental.focus": 0.6 }, coach: 2, morale: -1 },
        result: "\"그래, 네가 정했으면 됐다. 체육 선생님께는 내가 말씀드릴게.\" 선생님은 서운한 기색 없이 웃으셨다. 그날 저녁 훈련, 높이 뜬 공이 오자 발등이 먼저 마중을 나갔다. 몸은 아직 족구를 기억하고 있었다." },
      { mark: "jg_lunch", label: "대회는 빠지고, 점심시간 연습 상대만 해 준다", fx: { s: { "mental.teamwork": 1 }, teacher: 2, fatigue: 2, rel: { friend: 3 } },
        result: "점심마다 운동장 구석에 네트를 치고 반 친구들과 공을 넘겼다. 발등 서브 하나를 일주일 내내 가르쳤다. 대회 날, 그 서브로 첫 점수가 났다는 문자가 왔다. 내가 넣은 것보다 좋았다." },
    ] },
  { id: "o_jg_volley", cond: is("jokgu"), once: true, priority: 1, trigger: win(4, 2, 4), when: { grades: [2] }, bg: "bg_field_day", who: "assistant",
    text: "크로스 훈련. 공이 생각보다 길게 넘어와 내 머리 뒤로 떨어진다. 생각할 틈도 없이 몸이 옆으로 누웠다. 족구에서 하던 그대로, 발등으로 공을 내리찍었다.\n\n공은 골대 옆 그물을 흔들었다. {assistant}님이 휘슬을 입에서 뗐다. \"방금 그거, 어디서 배웠냐?\"",
    choices: [
      { label: "\"족구요\" 하고 웃는다", fx: { s: { "tech.shoot": 1 }, morale: 4 },
        result: "\"족구?\" 코치님이 한참 웃으시더니 공 바구니를 끌고 오셨다. \"그 발등, 공 떨어지는 자리만 맞추면 무기다. 오늘은 발리 쉰 개.\"" },
      { label: "\"땅볼 받는 게 아직 더 어려워요\" 털어놓는다", fx: { s: { "tech.firstTouch": 0.6, "tech.dribble": 0.6 }, coach: 1 },
        result: "\"알고 있다. 공중에서는 편한데 땅에서는 공이 발에서 자꾸 튄다.\" 코치님은 다 보고 계셨다. 다음 날부터 훈련 끝에 땅볼 패스 받기 백 개가 붙었다." },
      { label: "이번엔 공을 죽이지 않고 바로 골문 구석으로", req: { "tech.firstTouch": 55 }, fx: { s: { "tech.shoot": 0.8, "mental.confidence": 0.6 }, morale: 5 },
        result: "두 번째 공. 무릎을 접고 발목을 고정했다. 퍽, 하는 소리와 함께 공이 골키퍼 손끝을 지나 구석에 꽂혔다. 동료들이 \"족구왕!\" 하며 달려들었다. 그날부터 별명이 생겼다." },
    ] },
  { id: "o_jg_net", cond: is("jokgu"), once: true, priority: 1, school: true, trigger: weeks([5, 2], [5, 3], [5, 5], [6, 1], [6, 2]), when: { grades: [3] }, bg: "ev_jokgu", who: "narr",
    text: s => `점심시간. 운동장 구석에 족구 네트가 쳐져 있다. 1학년 넷이 이번 학교스포츠클럽 대회에 나간다며 공을 넘기는데, 서브가 번번이 네트에 걸린다.${marked(s, "jg_cup") ? " 2년 전 결승, 네트 윗줄에 걸렸던 내 서브가 생각났다." : marked(s, "jg_lunch") ? " 1학년 때 반 친구들과 점심마다 공을 넘기던 그 자리다." : ""}\n\n한 아이가 나를 보더니 소리친다. "형! 족구부였다면서요!"`,
    choices: [
      { label: "서브부터 가르쳐 준다", fx: { s: { "mental.teamwork": 1 }, morale: 5, teacher: 1 },
        result: s => `"공 보지 말고 네트 윗줄 한 뼘 위를 봐." 열 번 만에 하나가 넘어갔다. 아이들이 소리를 질렀다.${marked(s, "jg_cup") ? " 그 한 뼘을 나는 2년 전에 몰랐다." : ""}` },
      { label: "상대편에 서서 공을 받아 준다", fx: { s: { "tech.firstTouch": 0.5, "phys.agility": 0.4 }, fatigue: 3, morale: 4 },
        result: "넘어오는 공은 전부 받아서 다시 넘겨 줬다. 종이 칠 때쯤 아이들 서브가 꽤 날카로워졌다. 대회 날 문자가 왔다. \"형 저희 4강 갔어요!!\"" },
      { label: "발등 트래핑 시범을 보여 준다", req: { "tech.firstTouch": 65 }, fx: { s: { "mental.confidence": 1 }, morale: 6 },
        result: "높이 띄운 공을 발등에 그대로 얹었다. 공이 멈췄다. 1학년들이 입을 벌렸다. 3년 동안 축구를 했는데, 이건 족구부 시절보다 더 잘 된다." },
    ] },

  // ── 클럽에서 떨어지고 온 아이 ────────────────
  { id: "o_cl_dm", cond: is("club"), once: true, priority: 1, trigger: weeks([5, 2], [5, 3], [5, 4], [5, 5], [6, 1]), when: { grades: [1] }, bg: "ev_night_phone", who: "narr",
    text: "밤 11시. 휴대폰이 울렸다. 광주 클럽에서 같이 뛰던 도윤재. 테스트에 붙은 그 녀석이다. 새 유니폼을 입고 인조 잔디 위에 서 있는 사진 한 장.\n\n\"우리 이번 주 리그 첫 경기 ㅎㅎ 너는 고흥 어때?\"",
    choices: [
      { mark: "cl_friend", label: "\"축하해. 나도 잘 지내\" 답장한다", fx: { s: { "mental.teamwork": 1 }, morale: -1 },
        result: "보내 놓고 한참 그 사진을 봤다. 축하한다는 말은 진심이었다. 반쯤은." },
      { label: "읽고 답장하지 않는다", fx: { s: { "mental.focus": 0.8 }, morale: -3 },
        result: "'읽음' 표시가 떴을 거다. 신경 쓰지 않기로 했다. 신경이 쓰였다." },
      { mark: "cl_friend", label: "휴대폰을 엎어 두고 운동장으로 나간다", fx: { s: { "phys.stamina": 0.8, "mental.competitive": 0.8 }, fatigue: 6 },
        result: "가로등 하나 켜진 운동장. 숨이 찰 때까지 왕복 달리기를 했다. 돌아와서 한 줄만 보냈다. \"여긴 운동장에서 바다 보여.\"" },
    ] },
  { id: "o_cl_scrim", cond: is("club"), once: true, priority: 1, trigger: weeks([4, 4], [4, 5], [5, 2], [5, 3], [5, 4]), when: { grades: [2] }, bg: "ev_lineup", who: "narr",
    text: s => `광주 한빛유나이티드 U-15가 고흥으로 전지훈련을 왔다. 기록에 남지 않는 연습경기 한 판. 상대 벤치에 낯익은 얼굴이 있다. 중학교 들어오기 전 겨울, 테스트에서 나를 떨어뜨린 코치님이다.${marked(s, "cl_friend") ? " 그 옆에서 도윤재가 손을 흔든다." : ""}\n\n전반 20분, 내 발밑으로 공이 왔다.`,
    choices: [
      { label: "클럽에서 배운 대로, 원터치로 침착하게", req: { "tech.firstTouch": 50 }, fx: { s: { "mental.confidence": 2, "tech.pass": 0.5 }, morale: 8, coach: 2 },
        result: "받고, 돌고, 내줬다. 터치 세 번. 공이 수비 두 명 사이를 지나 우리 공격수 발에 닿았다. 경기가 끝나고 그 코치님이 다가오셨다. \"많이 늘었네.\" 그 한마디를 1년 넘게 기다렸다." },
      { label: "보여 주고 싶어서 드리블로 밀고 들어간다", fx: { s: { "tech.dribble": 0.6, "mental.competitive": 0.8 }, morale: 2 },
        result: s => s.player.stats.tech.dribble >= 55
          ? "두 명을 제쳤다. 세 번째에게 걸렸지만 상대 벤치가 술렁였다. 하프타임에 {coach}님은 아무 말씀도 안 하셨다. 칭찬인지 아닌지 모르겠다."
          : "첫 번째 수비에게 공을 뺏겼다. 상대 역습, 실점. 하프타임에 {coach}님이 한마디 하셨다. \"누구한테 보여 주려고 뛰냐.\"" },
      { label: "평소처럼, 우리 팀 약속대로 짧게 돌린다", fx: { s: { "mental.teamwork": 1, "mental.focus": 0.5 }, coach: 2, morale: 3 },
        result: "특별한 건 없었다. 그냥 우리 축구를 했다. 2 대 2. 경기가 끝나고, 생각보다 아무렇지 않은 내가 신기했다." },
    ] },
  { id: "o_cl_call", cond: is("club"), once: true, priority: 1, trigger: weeks([11, 3], [11, 4], [11, 5], [12, 2], [12, 4]), when: { grades: [3] }, bg: "ev_night_call", who: "narr",
    text: s => `${marked(s, "cl_friend") ? "도윤재에게서 전화가 왔다. 문자가 아니라 전화." : "광주 클럽 시절 친구 도윤재에게서 전화가 왔다. 한참 연락이 없던 녀석이다."} 한동안 말이 없다가 겨우 꺼낸다.\n\n"나… U-18 테스트 떨어졌어."`,
    choices: [
      { label: "\"나도 떨어져 봤잖아. 그다음이 더 중요하더라\"", fx: { s: { "mental.teamwork": 1, "mental.confidence": 1 }, morale: 4 },
        result: "윤재가 웃는 건지 우는 건지 모를 소리를 냈다. \"너 그때 어떻게 버텼냐.\" 고흥 운동장 이야기를 한 시간 했다. 전화를 끊고 보니 내 3년도 꽤 괜찮았다." },
      { label: "\"고흥 한번 놀러 와\" 하고 바다 사진을 보낸다", fx: { morale: 5, s: { "mental.teamwork": 0.6 } },
        result: "주말에 윤재가 버스를 타고 왔다. 녹동항에서 회를 먹고, 해 질 녘 운동장에서 둘이 공을 찼다. 클럽 때처럼. 아니, 그때보다 재밌게." },
      { label: "아무 말 없이 끝까지 들어 준다", fx: { s: { "mental.focus": 0.6 }, morale: 2 },
        result: "할 말을 고르다가, 그냥 들었다. 윤재가 다 말하고 나서 \"고맙다\" 했다. 아무것도 안 했는데. 3년 전 아빠 차 뒷자리에서 나도 누가 그냥 들어 줬으면 했다." },
    ] },
];
