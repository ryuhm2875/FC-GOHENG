// 선택 장면이 골고루 나오는지: 포지션별로 나온 장면 종류·쏠림, 상대 성향별 차이, 선택지 종류
// node tools/dev/variety-audit.mjs [경기 수(포지션마다)]   SEED=60000
import { setSeed } from "../../js/rng.js";
import { rollPlayer, newGame } from "../../js/state.js";
import { beginWeek, endWeek } from "../../js/engine/week.js";
import { prepareMatch, next, resolve, autoChoice, finishMatch } from "../../js/engine/match.js";
import { styleOf } from "../../js/engine/advice.js";
import { SITUATIONS } from "../../data/match.js";
import { DETAIL_POS } from "../../data/player.js";
const TASTE = { press: "df_build df_gk_triangle df_bait_press df_split_pass mf_drop_between mf_third_man mf_split fw_layoff_third fw_through fw_gk_out fw_chase", counter: "mf_lowblock mf_halfspace_turn mf_rest_defense mf_counter_delay mf_defend fw_box_turn fw_screen df_2v1 df_counter_2v2 df_slide_counter", keep: "mf_press_trigger mf_intercept mf_counterpress fw_press fw_press_curve fw_gk_short fw_press_fb dm_screen df_step_out df_line_step mf_backpass_steal", cross: "df_cross df_back_post df_cutback_guard df_keeper_call df_fullback_duel mf_shield_wing mf_track_runner fw_press_fb", long: "df_aerial_long df_target_man df_high_line_cover df_shield_out df_keeper_call mf_second fw_flick_on target_hold" };
const N = +process.argv[2] || 60, SEED = +(process.env.SEED || 60000);
const eff = cnt => { const v = Object.values(cnt), T = v.reduce((a, b) => a + b, 0); return T ? Math.exp(-v.reduce((a, c) => a + (c / T) * Math.log(c / T), 0)) : 0; };
for (const pos of ["FW", "MF", "DF"]) {
  const cnt = {}, ch = {}, bySt = {}, wantN = {}, gotW = {}, why = {}; let moments = 0, games = 0;
  for (let k = 0; k < N; k++) {
    setSeed(SEED + k * 7 + pos.length);
    const s = newGame(rollPlayer({ name: "테스트", face: "face_01", position: pos, foot: "R", growthType: "rookie" }));
    const ks = Object.keys(DETAIL_POS).filter(x => DETAIL_POS[x].pos === pos); if (ks.length) s.player.detailPos = ks[k % ks.length];   // 세부 포지션도 돌아가며
    const lv = 45 + (k % 5) * 8; for (const g of ["tech", "phys", "mental"]) for (const q in s.player.stats[g]) s.player.stats[g][q] = lv;
    s.relations.coach = 95;
    let ctx; for (let i = 0; i < 60; i++) { ctx = beginWeek(s); if (ctx.fx) break; endWeek(s, ctx, null); }
    if (!ctx?.fx) continue;
    const m = prepareMatch(s, ctx.info, ctx.fx), st = styleOf(ctx.fx.opponent.name).key || "?";
    const b = bySt[st] ||= { g: 0, n: 0, ids: {} }; b.g++; games++;
    m.dbgWant = process.env.WHYX ? "x" : !!process.env.WHY; let g = 0;
    while (!m.done && g++ < 4000) {
      const wid = m.want?.sit.id; if (wid && m.want !== m._lastWant) { m._lastWant = m.want; wantN[wid] = (wantN[wid] || 0) + 1; m._wid = wid; }
      if (m.pending) { const id = m.pending.sit.id; if (id === m._wid) gotW[id] = (gotW[id] || 0) + 1; cnt[id] = (cnt[id] || 0) + 1; b.n++; b.ids[id] = (b.ids[id] || 0) + 1; moments++;
        for (const c of m.pending.choices) ch[c.win || c.label] = (ch[c.win || c.label] || 0) + 1;
        resolve(s, m, autoChoice(m)); continue; }
      next(s, m);
    }
    for (const [id, d] of Object.entries(m.wdbg || {})) { const w = why[id] ||= {}; for (const k in d) w[k] = (w[k] || 0) + d[k]; }
    finishMatch(s, m);
  }
  const elig = SITUATIONS.filter(x => x.pos.includes(pos) && !x.chainOnly).length;
  const sorted = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
  const top5 = sorted.slice(0, 5).reduce((a, [, c]) => a + c, 0);
  console.log(`\n■ ${pos}: ${games}경기, 장면 ${moments}번(경기당 ${(moments / games).toFixed(1)}) | 나온 장면 ${sorted.length}/${elig}종 | 실질 가짓수 ${eff(cnt).toFixed(1)} | 상위 5개 ${(100 * top5 / moments).toFixed(0)}% | 선택지 종류 실질 ${eff(ch).toFixed(1)}`);
  console.log("  많이: " + sorted.slice(0, 6).map(([id, c]) => `${id} ${(100 * c / moments).toFixed(1)}%`).join(", "));
  const miss = SITUATIONS.filter(x => x.pos.includes(pos) && !x.chainOnly && !cnt[x.id]).map(x => x.id + "[" + ["requires", "wx", "detail", "late", "leading", "trailing", "flowUp", "flowDown", "once", "zone", "poss"].filter(k => x[k]).map(k => k === "zone" || k === "poss" ? x[k] : k === "detail" ? "d:" + x.detail.join("/") : k === "wx" ? "wx:" + x.wx.join("/") : k).join(",") + " w" + x.weight + "]");
  if (process.env.WANT) console.log("  기다렸지만 못 나온 비율(기다린 횟수 10↑): " + Object.entries(wantN).filter(([, n]) => n >= 10).map(([id, n]) => [id, n, 1 - (gotW[id] || 0) / n]).sort((a, b) => b[2] - a[2]).slice(0, 14).map(([id, n, r]) => `${id} ${n}번 ${(100 * r).toFixed(0)}%`).join(", "));
  if (process.env.IDS) console.log("  기다림→나옴: " + process.env.IDS.split(",").filter(id => SITUATIONS.find(x => x.id === id)?.pos.includes(pos)).map(id => `${id} ${wantN[id] || 0}→${gotW[id] || 0} (전체 ${cnt[id] || 0})`).join(", "));
  if (process.env.WHY) for (const id of (process.env.WHY === "1" ? Object.keys(why) : process.env.WHY.split(","))) if (why[id] && SITUATIONS.find(x => x.id === id)?.pos.includes(pos)) { const T = Object.values(why[id]).reduce((a, b) => a + b, 0); console.log(`  ${id} 막힌 곳: ` + Object.entries(why[id]).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} ${(100 * v / T).toFixed(0)}%`).join(", ")); }
  if (process.env.MISS) console.log("  안 나온 장면: " + miss.join(" "));
  const rare = sorted.filter(([, c]) => c / moments < 0.004).map(([id]) => id); if (process.env.MISS) console.log("  아주 드묾(0.4% 미만): " + rare.join(" "));
  if (process.env.TASTE) console.log("  그 성향 장면 비율: " + Object.entries(bySt).filter(([k]) => TASTE[k]).map(([k, v]) => { const set = TASTE[k].split(" "), n = set.reduce((a, id) => a + (v.ids[id] || 0), 0); return `${k} ${(100 * n / Math.max(1, v.n)).toFixed(1)}%`; }).join(" | "));
  console.log("  성향별 경기당 장면·실질 가짓수: " + Object.entries(bySt).map(([k, v]) => `${k} ${v.g}경기 ${(v.n / v.g).toFixed(1)}번 ${eff(v.ids).toFixed(1)}`).join(" | "));
}
