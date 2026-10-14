# 인수인계 문서 — 고흥FC 드림 프로젝트

새 대화에서 이어 작업할 사람(Claude)을 위한 문서입니다. 먼저 끝까지 읽고 시작해 주세요.

- 저장소: https://github.com/ryuhm2875/fc-goheng (공개, GitHub Pages로 서비스)
- 첫 작업: `git clone https://github.com/ryuhm2875/fc-goheng` → 이 문서와 README.md 읽기
- 이번에 할 일: **경기 엔진 2안** — 경기장 시뮬레이션이 경기를 주도하도록 다시 짜기 (아래 4장)

---

## 1. 사용자와 작업 규칙

사용자는 전남 고흥 고흥대서중학교 국어 교사입니다. 학생들이 하는 축구 진로 육성 웹 게임을 만들고 있습니다.

꼭 지킬 것:

1. **무조건 존댓말.** 보고는 짧게, 과정 설명은 구체적으로.
2. **맞춤법·띄어쓰기는 절대 틀리면 안 됨.** 게임 속 문장, 해설, 메일 모두 해당.
3. 명령 없이 먼저 만들지 말 것. 큰 걸 만들기 전엔 예시나 시안을 먼저 보여 주고 확인받기.
4. 질문을 잘 모르겠으면 확인하기.
5. 글투: 사람이 직접 쓴 것처럼. 다음 표현은 피하기 — "이유는 단순하다", "결론적으로", "핵심은 다음과 같다", "중요한 것은", "~라고 할 수 있습니다", "~하는 것이 중요합니다".
6. **고칠 때마다 `node tools/bundle.mjs` 실행.** (js/game.bundle.js, offline-files.js, sw.js의 BUILD 값이 갱신됨)
7. **깃허브 업로드는 사용자가 직접** 합니다. 웹에서 드래그로 올리며 한 번에 100개까지. 그래서 작업이 끝나면 **바뀐 파일만 폴더 구조 그대로 zip**으로 묶어 보내 주세요. (예: `고흥FC_엔진2안_N개.zip`)
8. 실제 학생 사진은 쓰지 않음. 저장소가 공개이므로 개인정보 금지.
9. 입장 코드 '류봉두'는 해시 `"2edu84"`로만 저장 (js/main.js의 GATE, localStorage 키 `gfc_gate`). 원문을 코드에 넣지 말 것.
10. "오류가 안 생기게." 고친 뒤엔 시뮬레이션과 브라우저로 꼭 확인하고 결과를 보고.

## 2. 구조

바닐라 ES 모듈, 빌드 도구 없음. `tools/bundle.mjs`가 모듈을 하나로 묶습니다 (한 줄 import, `export const|function`만 지원 — 여러 줄 import나 `export {}` 쓰면 안 됨).

| 폴더 | 내용 |
|---|---|
| `data/` | 문장·수치 데이터. `match.js`(경기 상황 116개, 선택지 287개, 해설 문장), `scenes.js`(상황별 경기장 장면 116개), `player.js`(능력치, STAT_INFO) 등 |
| `js/engine/` | 게임 규칙. `match.js`(경기), `week.js`(주간 진행), `growth.js`, `orders.js`(감독 주간 지시) 등 |
| `js/ui/` | 화면. `match.js`(경기 화면), `pitch.js`(경기장 시뮬레이션), `views.js`, `modals.js` |
| `css/` | style, fc, polish |
| `tools/bundle.mjs` | 번들러. `css js data assets`만 오프라인 목록에 넣음 (tools/는 안 들어감) |
| `tools/dev/` | 테스트 도구 (6장) |

## 3. 지금 경기 엔진의 흐름

### 3-1. 엔진 (js/engine/match.js) — 글이 먼저

- `prepareMatch(state, info, fx)`: 경기 전에 **결과 뼈대를 미리 정함.**
  - 우리 골 수 `nOur = poisson(6.8·exp((ours−theirs)/14))`, 상대도 대칭
  - 분위기 줄(ambient) 4~6개
  - 내 순간(moment) 수: 선발이면 `int(6,7) + round(star×1.5)`
  - LENGTH 70, HALF 35 (중등부 전후반 35분)
- `next(state, m)`: 다음 줄 하나를 꺼냄. 줄 형식:
  `{t, k, minute, ball, poss, actor, fast, silent, toMe, meHold, press, score, set, amb, subIn, outNo, injuredOff, half2}`
- `prob(state, m, c)`: `0.45 + (능력치평균 − (theirs + diff))/70` + 보정 (주간 지시 +3%p 등)
- `resolve(state, m, ci, timing)`: 선택 결과. 결과 종류:
  win, keep, miss, turnover, danger, shot, chip, head, assist, keyPass, killPass, tapIn, pk, matePk, setPiece, offside, pkAgainst, longShot, acro, card, decoy
- `autoPlay(state, m)`: 화면 없이 끝까지 진행 (week.js에서 결장·자동 경기 때 사용)
- `finishMatch(state, m)`: 평점
  - `r = 6.1 + m.my.delta×0.66 + (승 +0.3 / 패 −0.3) + normal(0, 0.2)`
  - DF 무실점 +0.3, 출전 25분 미만은 완화, 4~10으로 자름
  - 평점 8 이상이고 지지 않았으면 MOM

### 3-2. 화면 (js/ui/match.js)

- 줄을 하나씩 재생하면서 `pitch.line(l, ms)`를 부름. pitch가 필요한 시간을 돌려주면 단계 시간은 `max(base, min(need, silent ? ms : ms×1.35))`.
- 내 순간은 `stage()`: `pitch.scene(SCENES[id], {ball, poss, zone, names:{mate, opp}}, done)`로 장면을 만든 뒤 `showMoment()`로 선택지를 띄움.
- 배속은 `pitch.setSpeed`, 후반 진영 교체는 `pitch.setFlip`.

### 3-3. 경기장 (js/ui/pitch.js)

`createPitch({svg, players, dotEls, ballEl, shadowEl, calm, blocks})`가 돌려주는 것:
`line, scene, kickoff, setSpeed, setFlip, setBlocks, clearRuns, finish, ball, _state`

이미 들어 있는 것:
- 4-4-2 공격/수비 대형, 블록 높이 low/mid/high (상대 성향으로 정함)
- 오프사이드 라인 = max(최종 수비수, 공), 공이 80m 넘으면 박스 안 밀집
- 압박(가장 가까운 선수 + 커버), 장면용 추격자, noPress/focus/forceLine
- 가속 제한 이동(16 m/s²), 대기 중 흔들림, 공격수 침투, 보유자 드리블
- 공 비행(최소 비행시간 d/32~36, 슛 제외, 높이 z 연속), 보유자 따라가기 최대 42 m/s
- recvPoint/carryPoint: 목적지를 엔진 좌표가 아니라 **선수 위치 기준**으로 정함
- 세트피스(코너/프리킥/페널티), 킥오프, 하프타임 뒤집기 페이드
- 루프는 경기 중 계속 돌고 화면이 숨으면 멈춤. 조용히 모드(reduced-motion)는 snap()
- dt는 `clamp((now−last)/1000, 0, 0.1)` (음수 dt로 NaN 났던 버그 방지)

측정 결과: 순간이동 0, 멈춤 0, 6배 느린 기기에서도 59fps. 공이 혼자 노는 시간 6.7초 → 0.8초.

### 3-4. 남은 어색함 (2안을 하는 이유)

엔진이 **글을 먼저 정하고 경기장이 따라 그리는** 구조라서 생기는 한계입니다.
- 엔진이 "슛!"이라고 하면 공이 어디 있든 슛 → **중앙선 근처에서 갑자기 슛**
- 팀 움직임에 판단이 없음. 대형만 유지하다 줄이 오면 끌려감
- 사용자 표현: "풋볼매니저처럼 자연스럽게", "우리 팀, 상대 팀 움직임도 어색해"

## 4. 2안 설계 — 경기장이 경기를 만든다

방향: **경기장 시뮬레이션이 실제로 경기를 굴리고, 해설은 그 사건을 받아 적는다.**

### 4-1. 시뮬레이션 (새 모듈 권장: `js/engine/sim.js`)

- 화면과 무관한 순수 모듈로. 같은 코드가 화면(실시간)과 autoPlay/결장(고속, 화면 없음) 둘 다에서 돌아야 함.
- 보유자가 몇 틱마다 판단: **패스 / 드리블 / 슛 / 걷어내기**
  - 판단은 위치 기반 — 골까지 거리·각도, 주변 압박, 앞쪽 동료의 열린 정도
  - 성공 확률은 팀 전력(ours/theirs)과 선수 능력치로. 상대 성향(styleOf)은 블록·압박에 반영
- **슛은 공격 3분의 1 지역에서만.** 중거리는 longShot 성향이 있을 때만 가끔.
- 지금 pitch.js의 대형·압박·이동·공 비행 코드는 최대한 재사용 (렌더링과 물리는 분리).
- 시드 RNG(js/rng.js) 사용 → 같은 시드면 같은 경기. 테스트에 필수.

### 4-2. 해설

- 시뮬레이션 사건(패스 성공, 가로채기, 슛, 선방, 골, 코너, 파울…)을 받아서 **기존 data/match.js 문장 풀**로 줄을 만듦. 문장이 모자라면 추가하되 맞춤법 검수 필수.
- 줄 형식은 3-1과 같게 유지하면 ui/match.js 수정이 적음.
- 해설 빈도 조절: 모든 패스를 글로 쓰면 지루함. 의미 있는 사건만.

### 4-3. 내 순간

- **공이나 상황이 실제로 나에게 왔을 때** 발동. 그때의 위치·압박 상태와 가장 맞는 SITUATION(116개)을 고름.
  - SCENES의 `at`, `holder`, `press` 등이 상황 고르기 기준으로 쓸 수 있음
- 선택 결과(resolve)는 시뮬레이션에 되먹임. 예: 슛 성공 → 실제로 골, 턴오버 → 상대 공으로 이어서 진행
- 경기당 6~7번 정도가 되도록 발동 조건을 조절 (너무 적으면 할 게 없고 너무 많으면 피곤)

### 4-4. 결과 수치 맞추기

미리 정하던 골 수를 없애는 대신, **시뮬레이션 결과가 아래 기준선과 비슷하게** 나오도록 계수를 맞춰야 합니다. 이게 안 맞으면 엔딩·성장 밸런스가 다 흔들립니다.

### 4-5. 진행 순서 제안

1. sim.js 헤드리스 버전 → baseline.mjs로 수치 맞추기
2. 해설 생성 연결
3. 내 순간 발동·되먹임
4. ui/match.js·pitch.js를 sim 결과를 그리기만 하게 정리
5. 3년 자동 플레이, 저사양, 조용히 모드, file:// 확인
6. 사용자에게 GIF나 스크린샷 시안 보여 주고 확인받기 → zip 전달

중간중간 시안을 보여 주세요. 사용자는 화면을 직접 보고 판단하는 걸 좋아합니다.

## 5. 지켜야 할 기준선

`node tools/dev/baseline.mjs 120` (경력 120개, 경기 10443개) — 2안 전 수치:

| 항목 | 값 |
|---|---|
| 경기당 득점 | 2.48 |
| 경기당 실점 | 1.11 |
| 승/무/패 | 62% / 16% / 23% |
| 경기당 내 순간 | 6.37 |
| 엔딩 등급 | A 44, H 43, S 30, L 3 |

| 포지션 | 평점 | 골 | 도움 | MOM |
|---|---|---|---|---|
| FW | 7.72 | 1.58 | 0.11 | 43.9% |
| MF | 7.08 | 0.07 | 0.87 | 20.2% |
| DF | 6.95 | 0.01 | 0.15 | 15.0% |

±10% 안이면 괜찮고, 더 벗어나면 이유를 사용자에게 설명하고 확인받기. 평점 공식과 MOM 기준(8 이상)은 그대로 둡니다.

그 밖에 건드리지 말 것: 세이브 데이터 형식(기존 플레이어 저장 파일이 깨지면 안 됨), 감독 지시 보상, 능력치 설명(STAT_INFO)과 실제 효과의 일치.

## 6. 테스트 도구 (tools/dev/)

Playwright는 `createRequire("/usr/lib/node_modules/")`로 불러옵니다. 브라우저 테스트 전에 저장소 폴더에서 `python3 -m http.server 8765`를 띄워 두세요. 입장 코드는 localStorage `gfc_gate = "2edu84"`로 넘깁니다 (도구에 이미 들어 있음).

| 도구 | 쓰는 법 | 하는 일 |
|---|---|---|
| `baseline.mjs` | `node tools/dev/baseline.mjs 120` | 경력 N개 자동 진행, 5장 표 출력 |
| `probe.mjs` | `node tools/dev/probe.mjs MF 60` (THROTTLE=6, FAST=1 환경변수 가능) | 경기 화면 움직임 측정: 순간이동, 멈춤, fps, 공 혼자 노는 시간. `/tmp/probe-rec.json` 기록 |
| `uiplay.mjs` | `node tools/dev/uiplay.mjs FW 김민준` | 화면으로 3년 자동 플레이, 오류 검사. `/tmp/uiplay-shots/` |
| `scene-test.html` + `scene-shots.mjs` | `node tools/dev/scene-shots.mjs fw_cross,df_build` (인자 없으면 전체) | 장면을 하나씩 띄워 `/tmp/scene-shots/`에 저장 |

주의: `pkill -f 패턴`이 자기 셸까지 죽인 적이 있음. 서버는 PID로 끄세요.

## 7. 미뤄 둔 일 (사용자가 시키기 전엔 하지 않음)

- 성장 유형 밸런스 (대기만성형이 너무 셈)
- 튜토리얼
- 오프라인 준비 완료 알림, 정사각 아이콘

## 8. 최근 업로드 상태

2026-10-14 기준, 경기장 수정 2차(pitch.js, engine/match.js, 번들, offline-files.js, sw.js)까지 저장소에 올라가 있습니다. 이 문서와 tools/dev/가 그다음 업로드입니다.
