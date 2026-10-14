// 내 장면(경기 중 선택 상황)마다 경기장에서 보여 줄 움직임
// 좌표는 엔진 기준(우리 팀이 오른쪽으로 공격, 105×68). 공 위치 B는 장면 공 자리(at, 없으면 data/match.js의 spot 또는 구역)
// 상대 좌표 [dx, dy]: dx는 B에서 앞(+x, 상대 골문 쪽)으로, dy는 공에 가까운 터치라인 쪽이 +
//
// at     : 공이 놓일 자리 [[x 최소, x 최대], [y 최소, y 최대]] (엔진이 이 범위에서 고름)
// from   : 공이 오는 방식
//          우리 공 — pass(뒤에서 패스) back(앞에서 내려 줌) long(뒤에서 길게) through(뒷공간 스루패스) cross(측면 크로스) lowcross(땅볼 크로스)
//                    save(골키퍼가 쳐 낸 공) loose(흘러나온 공) carry(몰고 옴) gk(우리 골키퍼가 줌) turn(상대 공을 끊음)
//                    corner(코너킥이 날아옴) kicker(공 앞에 섬) fk(프리킥, 상대 벽) throw(스로인) pk(페널티킥) hold(그대로)
//          상대 공 — oppCarry(몰고 옴) oppPass oppLong oppCross oppCorner oppThrow oppGk(상대 골키퍼가 굴려 줌) oppHold backpass(짧은 백패스)
// src    : 공이 출발하는 자리 [dx, dy] (없으면 방식마다 정한 자리)
// giver  : 공을 주는 선수 (mate·fw·mf·df·fb·wing, 상대는 앞에 opp. fb·wing은 공 쪽 측면 선수, far를 붙이면 반대편)
// holder : 장면 끝에 공을 가진 선수 (기본은 우리 공이면 나, 상대 공이면 {opp}). mate·me
// pre    : 장면 전에 미리 서 있는 자리 [[누구, dx, dy], ...]
// runs   : 공이 오는 동안 뛰어 들어가는 선수 [[누구, dx, dy, 속도], ...]
// press  : 공 가진 선수에게 붙는 수비 수 (기본: 우리 공 1, 상대 공 0 + 내가 붙음)
// pressGap: 붙는 거리 (m)
// mePress: 상대 공일 때 내가 붙지 않으면 false. meGap: 내가 붙는 거리
// block  : 수비 팀 블록 높이 low·mid·high (또는 { us, them })
// pack   : 박스 안 몸싸움 (true 또는 "us": 우리가 공격, "them": 상대가 공격)
// gk     : 상대 골키퍼 자리 [dx, dy]. gkAt: 절대 좌표. gkNear: 가까운 포스트
// line   : 수비 팀 마지막 라인의 x를 B.x + line 으로 (엔진 좌표. 우리가 공격하다 이미 뚫린 장면은 음수)
// hold   : 장면이 다 준비된 뒤 선택지가 뜨기 전 잠깐 멈추는 시간(초)

export const SCENES = {
  // ── 공격수 ──
  fw_1v1: { at: [[80, 86], [26, 42]], from: "pass", giver: "mf", runs: [["fw", 9, -9, 7.6]], press: 1, pressGap: 3 },
  fw_through: { at: [[86, 93], [26, 42]], line: -4, from: "through", giver: "mf", src: [-24, -4], runs: [["oppdf", -1, -2.5, 8.4]], press: 0 },
  fw_cross: { at: [[92, 97], [28, 40]], from: "cross", runs: [["fw", 2, -7, 7.6]], press: 1, pressGap: 1.2, pack: true },
  fw_hold: { at: [[74, 82], [26, 42]], from: "pass", giver: "df", src: [-24, -6], press: 1, pressGap: 1.4 },
  mf_open_lane: { at: [[46, 62], [18, 50]], from: "pass", press: 0, clear: true },
  fw_press_cb: { at: [[66, 80], [22, 46]], from: "oppHold", meGap: 5 },
  fw_press_fb: { at: [[64, 82], [3, 12]], from: "oppHold", meGap: 3 },
  fw_counterpress: { at: [[64, 80], [16, 52]], from: "oppHold", meGap: 2.5 },
  fw_press: { at: [[86, 94], [20, 48]], from: "oppPass", giver: "oppdf", src: [3, -16], meGap: 6, block: { us: "high" } },
  fw_rebound: { at: [[92, 97], [28, 40]], from: "save", runs: [["oppdf", -1, 2, 8]], press: 0 },
  fw_counter: { at: [[70, 78], [24, 44]], from: "carry", src: [-18, 0], v: 7.6,
    pre: [["oppdf", -18, -10], ["oppdf", -22, 8], ["oppmf", -16, 14], ["oppmf", -20, -16], ["oppmf", -12, 4], ["oppmf", -14, -6]], runs: [["mate", 6, -13, 8.4]], press: 1, pressGap: 6 },
  fw_offside: { at: [[60, 68], [24, 44]], from: "pass", holder: "mate", giver: "df",
    pre: [["me", 21, 2], ["oppdf", 21.5, -14], ["oppdf", 21.5, -5], ["oppdf", 21.5, 4], ["oppdf", 21.5, 13]], press: 1, pressGap: 4 },
  fw_volley: { at: [[80, 86], [28, 40]], from: "loose", src: [12, -2], press: 0 },
  fw_last: { at: [[80, 86], [26, 42]], from: "pass", giver: "mf", press: 2, block: { them: "low" } },
  fw_gk_out: { line: -5, from: "long", giver: "df", gk: [6, 0], runs: [["oppdf", -4, 3, 8.4]], press: 0 },
  fw_near_post: { from: "lowcross", src: [3, 26], runs: [["oppdf", 1, -3, 8]], press: 0, pack: true },
  fw_far_post: { from: "cross", src: [2, -38], press: 1, pressGap: 1.4, pack: true },
  fw_tight_angle: { from: "carry", src: [-12, 3], v: 6.6, press: 1, pressGap: 1.4, gkNear: true },
  fw_corner_flag: { from: "carry", src: [-14, -3], v: 6.4, press: 1, pressGap: 1.2 },
  fw_chase: { at: [[62, 70], [24, 44]], from: "loose", src: [-42, 0], pre: [["me", -9, 1.5], ["opp", -8.5, -1.5]], runs: [["opp", -0.5, -1.2, 8.2]], press: 0 },
  fw_keeper_1v1: { line: -7, from: "carry", src: [-15, 0], v: 8, gk: [7, 0], runs: [["oppdf", -6, 2, 8.4]], press: 0 },
  fw_drop_deep: { at: [[50, 58], [26, 42]], from: "pass", giver: "df", src: [-20, -5], press: 1, pressGap: 1.2 },
  fw_solo_run: { at: [[46, 54], [24, 44]], from: "turn", block: { them: "high" }, press: 0, clear: true },
  fw_gk_short: { from: "oppGk", meGap: 5, block: { us: "high" } },
  fw_mindgame: { at: [[84, 92], [24, 44]], from: "oppHold", meGap: 1.1 },
  fw_slide_finish: { from: "lowcross", src: [-5, -36], press: 1, pressGap: 1.6, pack: true },
  fw_near_run: { at: [[96, 101], [6, 12]], from: "carry", holder: "mate", src: [-14, -3], pre: [["me", -14, -16]], runs: [["me", 1, -19, 8.4]], press: 1, pressGap: 1.4 },
  fw_flow_storm: { at: [[78, 85], [26, 42]], from: "pass", giver: "mf", block: { them: "low" }, press: 1, pressGap: 3 },
  fw_after_concede: { at: [[50, 58], [24, 44]], from: "pass", giver: "df", press: 1, pressGap: 3 },
  fw_decoy: { at: [[78, 86], [8, 15]], from: "carry", holder: "mate", src: [-14, 2], pre: [["me", 15, -21], ["oppdf", 16.5, -19], ["oppdf", 16, -24]], press: 1, pressGap: 2.4 },
  keeper_rush: { at: [[84, 90], [28, 40]], line: -4, from: "long", giver: "df", gk: [4, 0], press: 0 },
  rebound_box: { at: [[90, 96], [28, 40]], from: "save", pack: true, press: 0 },
  elder_shout: { at: [[84, 88], [15, 21]], from: "pass", giver: "mf", press: 1, pressGap: 3 },
  fw_cutback_arrive: { at: [[98, 101], [8, 14]], from: "carry", holder: "mate", src: [-13, -3], pre: [["me", -17, -17]], press: 1, pressGap: 1.4, pack: true },
  fw_press_curve: { at: [[86, 94], [18, 28]], from: "oppGk", meGap: 7, block: { us: "high" } },
  fw_false_nine: { at: [[50, 58], [26, 42]], from: "pass", giver: "df", src: [-18, -4], pre: [["oppdf", 1.6, 0]], runs: [["wing", 30, 4, 8.4]], press: 0 },

  // ── 미드필더 ──
  mf_press: { at: [[48, 60], [20, 48]], from: "pass", giver: "df", press: 2, pressGap: 1.6 },
  mf_space: { from: "pass", giver: "df", runs: [["fw", 26, -6, 8.2], ["fw", 24, 8, 8.2]], press: 0 },
  mf_switch: { from: "pass", giver: "df", pre: [["oppmf", 4, 6], ["oppmf", 6, -2], ["oppdf", 18, 4]], runs: [["farwing", 18, -60, 8]], press: 1, pressGap: 4, side: 9, shift: true },
  mf_defend: { at: [[46, 56], [22, 46]], from: "oppCarry", src: [16, 0], v: 7.8, runs: [["oppfw", -18, -8, 8.4]], meGap: 3 },
  mf_second: { at: [[48, 58], [24, 44]], from: "loose", src: [46, 0], runs: [["oppmf", 1, 1.5, 8]], press: 0 },
  mf_intercept: { from: "oppPass", src: [14, -9], meGap: 3.2 },
  mf_foul: { from: "pass", giver: "df", press: 1, pressGap: 1 },
  mf_lead: { from: "pass", giver: "df", block: { them: "high" }, press: 2, pressGap: 2.6 },
  mf_onetwo: { at: [[76, 83], [24, 44]], from: "pass", giver: "df", pre: [["mate", 6, -8]], press: 1, pressGap: 2.4 },
  mf_corner: { at: [[103.6, 103.6], [0.9, 1.1]], from: "kicker", pack: true },
  mf_heel: { at: [[80, 86], [28, 40]], from: "pass", giver: "mf", src: [-14, 6], pre: [["mate", -8, 3]], runs: [["mate", 6, -3, 8.2]], press: 1, pressGap: 1.2 },
  mf_lowblock: { at: [[72, 78], [24, 44]], from: "pass", giver: "df", block: { them: "low" }, press: 1, pressGap: 4 },
  mf_cover: { at: [[30, 40], [4, 10]], from: "oppPass", src: [14, -15], runs: [["me", 1, -3, 8.4]], mePress: false },
  mf_halfway_shot: { from: "pass", giver: "df", gkAt: [86, 34], press: 0 },
  mf_tempo: { from: "pass", giver: "df", press: 0 },
  mf_third_man: { from: "pass", giver: "df", runs: [["mate", 9, -5, 7], ["fw", 26, 4, 8.4]], press: 1, pressGap: 3 },
  mf_throwin: { from: "throw", runs: [["mate", 4, 6, 7]], press: 0 },
  mf_backpass_steal: { from: "backpass", src: [-10, 0], runs: [["me", 0, 0, 8.6]], gk: [7, 0], mePress: false },
  mf_split: { from: "pass", giver: "df", press: 2, pressGap: 4 },
  mf_quick_fk: { from: "kicker", runs: [["fw", 22, 4, 7.6]], press: 0 },
  mf_switch_receive: { at: [[70, 80], [5, 12]], from: "long", giver: "df", src: [-40, -42], press: 1, pressGap: 3 },
  mf_late_run: { at: [[78, 84], [28, 40]], from: "lowcross", giver: "mate", src: [20, 30], press: 0 },
  mf_rally: { from: "pass", giver: "df", press: 1, pressGap: 3.4 },
  mf_shield_wing: { at: [[48, 60], [4, 10]], from: "oppCarry", src: [15, 0], meGap: 3 },
  mf_hold_lead: { at: [[44, 56], [24, 44]], from: "pass", giver: "df", block: { them: "high" }, press: 3, pressGap: 2.2 },
  mf_injury_time: { at: [[52, 58], [24, 44]], from: "pass", giver: "df", block: { them: "low" }, press: 1, pressGap: 5 },
  mf_switch_wind: { from: "pass", giver: "df", gkAt: [90, 34], press: 0 },
  mf_calm_storm: { at: [[34, 44], [24, 44]], from: "turn", block: { them: "high" }, press: 2, pressGap: 2 },
  mf_counterpress: { at: [[56, 66], [22, 46]], from: "oppHold", meGap: 2.4, press: 1 },
  mf_advantage: { at: [[74, 82], [24, 44]], from: "carry", src: [-10, 0], v: 6, pre: [["opp", -2, 2]], press: 1, pressGap: 3 },
  mf_halfspace_turn: { at: [[64, 72], [14, 22]], from: "pass", giver: "fb", src: [-10, 8], runs: [["mate", 14, 10, 8.4], ["fw", 18, -6, 7.6]], press: 1, pressGap: 2.6, block: { them: "mid" } },
  mf_rest_defense: { at: [[80, 88], [24, 44]], from: "pass", holder: "mate", giver: "mf", pre: [["me", -26, -6], ["oppfw", -28, -10]], block: { them: "low" }, press: 1, pressGap: 3 },
  mf_drop_between: { at: [[18, 24], [26, 42]], from: "gk", holder: "df", pre: [["me", 12, 1]], press: 2, pressGap: 3, mark2: true, block: { them: "high" } },

  // ── 수비수 ──
  df_1v1: { at: [[26, 36], [22, 46]], from: "oppCarry", src: [15, 0], v: 7.8, meGap: 3 },
  df_cross: { at: [[8, 14], [28, 40]], from: "oppCross", meGap: 1, pack: "them" },
  df_build: { at: [[10, 16], [18, 50]], from: "gk", press: 1, pressGap: 4, block: { them: "high" } },
  df_through: { at: [[34, 42], [24, 44]], from: "oppPass", src: [14, -6], runs: [["oppfw", -16, 2, 8.6]], mePress: false },
  df_corner: { at: [[94, 99], [28, 40]], from: "corner", pack: true },
  df_longshot: { at: [[80, 85], [26, 42]], from: "loose", src: [10, -3], pack: true, press: 1, pressGap: 4 },
  att_corner_head: { at: [[94, 99], [29, 39]], from: "corner", pack: true },
  skill_wing: { at: [[72, 84], [5, 11]], from: "pass", giver: "fb", src: [-14, 0], press: 1, pressGap: 3.4 },
  df_slide_counter: { at: [[42, 52], [22, 46]], from: "oppCarry", src: [16, 0], v: 7.8, meGap: 3.6 },
  freekick: { at: [[76, 82], [26, 42]], from: "fk" },
  penalty: { at: [[94, 94], [34, 34]], from: "pk" },
  df_2v1: { at: [[36, 44], [24, 44]], from: "oppCarry", src: [16, 0], v: 8, runs: [["oppfw", -6, -12, 8.4]], pre: [["df", 18, 12], ["df", 20, -12]], meGap: 5 },
  df_box: { at: [[8, 14], [26, 42]], from: "loose", holder: "me", src: [3, -2], runs: [["opp", 1.5, 1.5, 8]], pack: "them" },
  df_overlap: { at: [[70, 80], [4, 10]], from: "through", giver: "mate", src: [-8, -10], press: 0 },
  df_boxdribble: { at: [[12, 18], [24, 44]], from: "oppCarry", src: [10, 4], v: 6, meGap: 2 },
  df_last: { at: [[8, 14], [28, 40]], from: "oppLong", pack: "them", meGap: 1 },
  df_offside_trap: { from: "oppHold", pre: [["oppfw", -12, -6], ["oppfw", -12.5, 6]], mePress: false },
  df_scramble: { from: "loose", src: [4, 3], pack: "them", meGap: 1 },
  df_target_man: { at: [[24, 32], [26, 42]], from: "oppLong", meGap: 0.9 },
  df_back_to_goal: { at: [[18, 26], [24, 44]], from: "loose", holder: "me", src: [12, 0], pre: [["opp", 13, 2]], runs: [["opp", 4, 1, 8.2]] },
  df_cover: { at: [[22, 30], [16, 52]], from: "oppCarry", src: [11, 6], v: 7.6, pre: [["mate", 9, 4]], meGap: 3 },
  df_long_throw: { from: "oppThrow", pack: "them", meGap: 1 },
  df_launch: { at: [[24, 32], [24, 44]], from: "turn", runs: [["fw", 40, -6, 8.6], ["fw", 38, 8, 8.6]], press: 0 },
  df_block: { from: "oppCarry", src: [8, -2], v: 6, meGap: 1.6 },
  df_dive: { from: "oppCarry", src: [6, 1], v: 5, meGap: 0.8 },
  df_last_man: { from: "oppCarry", src: [15, 0], v: 8.2, pre: [["df", 20, -10], ["df", 22, 10], ["df", 18, 16]], meGap: 3 },
  df_corner_choice: { from: "oppCorner", pack: "them", meGap: 1 },
  df_split_pass: { at: [[14, 22], [20, 48]], from: "gk", press: 2, pressGap: 5, block: { them: "high" } },
  df_keeper_call: { from: "oppLong", runs: [["gk", -1, 0, 8]], meGap: 1 },
  df_fullback_duel: { at: [[30, 42], [4, 10]], from: "oppCarry", src: [14, 0], v: 8, meGap: 3 },
  df_aerial_long: { from: "oppLong", src: [70, 0], meGap: 0.8 },
  df_line_step: { from: "oppHold", pre: [["oppfw", -12, -7], ["oppfw", -12.5, 5]], mePress: false },
  df_ace_mark: { at: [[28, 38], [22, 46]], from: "oppCarry", src: [9, 0], v: 5, meGap: 3.4 },
  df_storm_hold: { from: "oppCross", pack: "them", meGap: 1 },
  df_launch_counter: { at: [[24, 32], [24, 44]], from: "pass", giver: "df", src: [-4, 9], runs: [["fw", 38, -6, 8.6], ["fw", 36, 8, 8.6]], press: 0 },
  df_player_down: { at: [[24, 32], [24, 44]], from: "turn", pre: [["opp", 2, 2.5]], press: 0 },
  df_gk_triangle: { at: [[10, 16], [18, 26]], from: "gk", press: 1, pressGap: 5, block: { them: "high" } },
  df_high_line_cover: { at: [[24, 32], [24, 44]], line: 20, from: "oppLong", src: [48, 0], pre: [["me", 20, 2], ["opp", 19, -2]], runs: [["me", 0.5, 1.4, 8.3]], mePress: false, block: { us: "high" } },
  df_step_out: { at: [[30, 38], [26, 42]], from: "oppPass", src: [14, -4], meGap: 2 },

  // ── 여러 포지션 ──
  wx_rain_shot: { at: [[76, 82], [26, 42]], from: "pass", giver: "mf", press: 1, pressGap: 4 },
  wx_rain_back: { holder: "me", from: "loose", src: [6, 0], runs: [["opp", 3, 1.5, 8]] },
  wx_wind_cross: { at: [[86, 96], [4, 10]], from: "pass", giver: "fb", press: 1, pressGap: 3, pack: true },
  wx_hot_late: { from: "pass", giver: "df", press: 1, pressGap: 3.4 },
  wx_cold_touch: { from: "loose", src: [-30, 0], press: 1, pressGap: 2.4 },
  crowd_boo: { at: [[72, 82], [4, 10]], from: "pass", giver: "fb", press: 1, pressGap: 3 },
  opp_coach_shout: { from: "oppCarry", src: [12, 0], v: 6, meGap: 3 },
  mate_yellow: { from: "oppCarry", src: [12, 0], v: 6, runs: [["mate", 1.8, 1.5, 8]], meGap: 4 },
  parents_cheer: { from: "pass", giver: "df", press: 1, pressGap: 3 },
  bench_signal: { from: "pass", giver: "df", press: 1, pressGap: 4 },
  counter_3v2: { at: [[64, 72], [30, 38]], from: "carry", src: [-16, 0], v: 8,
    pre: [["oppdf", 14, -6], ["oppdf", 14, 6], ["oppdf", -14, 12], ["oppdf", -16, -12], ["oppmf", -16, 0], ["oppmf", -18, 12], ["oppmf", -15, -12], ["oppmf", -20, 20]], runs: [["fw", 8, -13, 8.6], ["mf", 6, 13, 8.6]], press: 0 },
  throw_in_trick: { at: [[44, 60], [1, 3]], from: "throw", press: 0, runs: [["mate", 3, 6, 6]] },
};
