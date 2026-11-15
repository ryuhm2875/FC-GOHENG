// 랭킹 화면: 엔딩을 본 모든 선수의 기록을 부문별로 (서버, 로그인한 사람만)
import { RANK_TABS, rankList, fmtVal } from "../engine/rank.js";
import { GRADE_INFO } from "../../data/endings.js";
import { loadRank, session } from "../net/online.js";
import { openModal } from "./modals.js";
import { esc } from "./util.js";

const TOP = 10;
let tabId = "fw", catKey = "goals";          // 이번에 열었던 부문을 다음에도
const MEDAL = ["🥇", "🥈", "🥉"];

export function rankModal() {
  let data = null, err = "";
  const tab = () => RANK_TABS.find(t => t.id === tabId) || RANK_TABS[0];
  const cat = () => tab().cats.find(c => c.key === catKey) || tab().cats[0];

  const row = (x, mine) => {
    const r = x.row, g = GRADE_INFO[r.grade] || {};
    return `<li class="rk-row${mine ? " mine" : ""}${x.place <= 3 ? ` p${x.place}` : ""}">
      <span class="rk-place num">${x.place <= 3 ? MEDAL[x.place - 1] : x.place}</span>
      <span class="rk-who">
        <span class="rk-name"><b>${esc(r.name)}</b>${r.pos ? `<span class="pos-tag ${esc(r.pos)}">${esc(r.pos)}</span>` : ""}${mine ? `<span class="rk-me">내 선수</span>` : ""}</span>
        <span class="rk-end mute">${r.grade ? `<span class="gal-grade ${g.cls || ""}">${esc(g.label || r.grade)}</span>` : ""}${esc(r.ending || "")}</span>
      </span>
      <span class="rk-val num">${esc(fmtVal(cat(), x.value))}</span>
    </li>`;
  };

  const board = () => {
    if (err) return `<p class="rk-empty">${esc(err)}</p>`;
    if (!data) return `<p class="rk-empty mute">불러오는 중…</p>`;
    const list = rankList(data.rows, cat().key);
    if (!list.length) return `<p class="rk-empty mute">아직 이 부문에 오른 선수가 없습니다.<br>3년을 마치고 엔딩을 보면 기록이 올라갑니다.</p>`;
    const top = list.slice(0, TOP);
    const best = list.find(x => data.mine.has(x.row.id));
    const myLine = best
      ? (best.place <= TOP && top.includes(best) ? "" : `<div class="rk-mybest"><span class="mute">내 최고 순위</span>${row(best, true).replace("<li", "<div").replace("</li>", "</div>")}</div>`)
      : `<p class="rk-mybest none mute">아직 이 부문에 내 선수가 없습니다.</p>`;
    return `<ol class="rk-list">${top.map(x => row(x, data.mine.has(x.row.id))).join("")}</ol>${myLine}
      <p class="rk-count mute">이 부문 ${list.length}명 중 상위 ${Math.min(TOP, list.length)}명</p>`;
  };

  const body = () => `<button class="close" data-close aria-label="닫기">×</button>
    <span class="eyebrow">RANKING</span><h2>랭킹</h2>
    <div class="tabs rk-tabs" role="tablist">${RANK_TABS.map(t => `<button role="tab" data-tab="${t.id}" aria-selected="${t.id === tab().id}"><span aria-hidden="true">${t.icon}</span> ${esc(t.label)}</button>`).join("")}</div>
    <div class="rk-cats">${tab().cats.map(c => `<button class="rk-cat" data-cat="${c.key}" aria-pressed="${c.key === cat().key}">${esc(c.label)}</button>`).join("")}</div>
    <p class="rk-desc mute">${esc(cat().desc)}</p>
    <div class="rk-board">${board()}</div>
    <p class="mute rk-foot">엔딩을 본 선수마다 기록이 한 장씩 올라갑니다. 랭킹에는 게임 속 선수 이름만 보입니다.${data?.waiting ? ` · 아직 못 보낸 내 기록 ${data.waiting}장 (인터넷이 되면 자동으로)` : ""}</p>`;

  openModal(body(), (el, close) => {
    const draw = () => {
      const sheet = el.querySelector(".sheet");
      if (!sheet) return;                                   // 그새 닫혔으면
      sheet.innerHTML = body();
      wire();
    };
    const wire = () => {
      el.querySelectorAll("[data-close]").forEach(x => x.addEventListener("click", close));
      el.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => {
        tabId = b.dataset.tab; catKey = tab().cats[0].key; draw();
        el.querySelector(`[data-tab="${tabId}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
      }));
      el.querySelectorAll("[data-cat]").forEach(b => b.addEventListener("click", () => { catKey = b.dataset.cat; draw(); }));
    };
    wire();
    if (!session()) { err = "로그인하면 랭킹을 볼 수 있습니다."; draw(); return; }
    loadRank().then(d => { data = d; draw(); }).catch(e => {
      err = e?.code === "NETWORK" ? "인터넷에 연결되어 있지 않습니다." : /PERMISSION|403/.test(e?.code || "") ? "랭킹을 아직 열 수 없습니다. 선생님께 말씀드려 주세요." : "랭킹을 불러오지 못했습니다.";
      draw();
    });
  }, { cls: "rank-modal" });
}
