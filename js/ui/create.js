// 입단: 감독님과 대화하며 선수를 만듭니다 (비주얼 노벨 방식)
import { POSITIONS, GROWTH_TYPES, FACES, TRAITS } from "../../data/player.js";
import { TALK, TRAIT_REMARK, MEASURES } from "../../data/story.js";
import { ROSTER, STAFF } from "../../data/roster.js";
import { rollPlayer } from "../state.js";
import { ovr } from "../engine/team.js";
import { getPath, pick } from "../rng.js";
import { esc, img, stars, fillText } from "./util.js";
import { bgLayer } from "./intro.js";

const MAX_REROLL = 3;
const TYPE_MS = 26;

const PORTRAIT = { coach: "npc_coach", assistant: "npc_assistant" };
const NAME_TAG = { coach: () => STAFF.coach, assistant: () => STAFF.assistant };

export function renderCreate(app) {
  const d = { name: "", face: null, position: null, foot: null, growthType: null, rolled: null, rerolls: 0, number: 0 };
  app.root.innerHTML = `<div class="vn" id="vn">
      <div class="vn-stage" id="vbg">${bgLayer("bg_locker", "night", "on")}</div>
      <div class="vn-portrait" id="por" aria-hidden="true"></div>
      <div class="vn-box" id="box">
        <div class="vn-name" id="who"></div>
        <p class="vn-text" id="txt"></p>
        <div class="vn-ui" id="ui"></div>
        <span class="vn-more" id="more" aria-hidden="true">화면을 누르면 다음 ▼</span>
      </div>
      <button class="vn-exit linkbtn" id="exit">처음으로</button>
    </div>`;
  const $ = id => app.root.querySelector(`#${id}`);
  const box = $("box"), txt = $("txt"), who = $("who"), ui = $("ui"), more = $("more"), por = $("por"), stageEl = $("vn");
  // 선택지·입력칸이 나타나면 상자 안에서 보이도록 스크롤 (낮은 화면 대비)
  new MutationObserver(() => { if (ui.childElementCount) requestAnimationFrame(() => box.scrollTo({ top: box.scrollHeight, behavior: "smooth" })); })
    .observe(ui, { childList: true });
  let alive = true;
  $("exit").addEventListener("click", () => { alive = false; app.go("title"); });

  const vars = () => ({ name: d.name, coach: STAFF.coach, assistant: STAFF.assistant });

  function setSpeaker(w) {
    who.textContent = w === "narr" ? "" : w === "me" ? d.name || "나" : NAME_TAG[w]();
    who.hidden = w === "narr";
    box.classList.toggle("narr", w === "narr");
    const face = w === "me" ? (d.face ? `${d.face}_g1` : null) : PORTRAIT[w];
    if (face) {
      if (por.dataset.face !== face) { por.innerHTML = img(face, ""); por.dataset.face = face; }
      por.className = `vn-portrait on ${w === "me" ? "right" : ""}`;
    } else por.className = "vn-portrait";
  }

  // 한 줄 말하기: 글자가 다 나오면 클릭으로 넘어감
  function say(w, text) {
    return new Promise(resolve => {
      if (!alive) return;
      setSpeaker(w);
      ui.innerHTML = "";
      const full = fillText(text, vars());
      let n = 0, typing = true;
      more.hidden = true;
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const t = setInterval(() => {
        n += 1; txt.textContent = full.slice(0, n);
        if (n >= full.length) finish();
      }, reduce ? 0 : TYPE_MS);
      function finish() { clearInterval(t); typing = false; txt.textContent = full; more.hidden = false; }
      // 화면 어디를 눌러도 넘어감 (버튼·입력칸·측정표 제외)
      const onClick = e => {
        if (e.target.closest?.("button, input, form, .vn-report")) return;
        if (typing) { finish(); return; }
        stageEl.removeEventListener("click", onClick);
        document.removeEventListener("keydown", onKey);
        resolve();
      };
      const onKey = e => {
        if (!(e.key === "Enter" || e.key === " ")) return;
        if (e.target.closest?.("button, input")) return;      // 버튼에 초점이 있으면 버튼이 처리
        e.preventDefault(); onClick({ target: box });
      };
      stageEl.addEventListener("click", onClick);
      document.addEventListener("keydown", onKey);
    });
  }
  async function lines(list) { for (const l of list) await say(l.who, l.text); }

  // 선택지: 마지막 대사를 띄운 채로 버튼을 보여 줌
  function choose(options) {
    return new Promise(resolve => {
      more.hidden = true;
      ui.innerHTML = `<div class="vn-choices">${options.map((o, i) =>
        `<button class="vn-choice" data-i="${i}">${o.html || esc(o.label)}</button>`).join("")}</div>`;
      ui.querySelectorAll("[data-i]").forEach(b => b.addEventListener("click", () => resolve(options[+b.dataset.i])));
      ui.querySelector("button")?.focus({ preventScroll: true });
    });
  }

  function askName() {
    return new Promise(resolve => {
      more.hidden = true;
      ui.innerHTML = `<form class="vn-form" id="nf"><input id="nm" maxlength="5" placeholder="이름 (2~5글자)" autocomplete="off" aria-label="선수 이름">
        <button class="btn btn-kit" type="submit">말하기</button></form>`;
      const input = ui.querySelector("#nm");
      input.focus();
      ui.querySelector("#nf").addEventListener("submit", e => {
        e.preventDefault();
        const v = input.value.trim();
        if (v.length < 2) { input.focus(); input.placeholder = "두 글자 이상 적어 주세요"; return; }
        resolve(v);
      });
    });
  }

  function askFace() {
    return new Promise(resolve => {
      more.hidden = true;
      ui.innerHTML = `<div class="vn-faces">${FACES.map((f, i) =>
        `<button data-face="${f}" aria-label="얼굴 ${i + 1}">${img(`${f}_g1`, `얼굴 ${i + 1}`)}</button>`).join("")}</div>`;
      ui.querySelectorAll("[data-face]").forEach(b => b.addEventListener("click", () => resolve(b.dataset.face)));
    });
  }

  function setBg(name, tone) {
    const stage = $("vbg");
    const w = document.createElement("div");
    w.innerHTML = bgLayer(name, tone);
    const el = w.firstElementChild;
    stage.appendChild(el);
    requestAnimationFrame(() => el.classList.add("on"));
    setTimeout(() => [...stage.children].slice(0, -1).forEach(c => c.remove()), 900);
  }

  // 측정 결과로 감독님 한마디 만들기
  function verdict(p) {
    const keys = Object.keys(POSITIONS[p.position].weights);
    const all = ["tech.dribble", "tech.pass", "tech.shoot", "tech.firstTouch", "tech.defense", "phys.speed", "phys.stamina", "phys.strength", "phys.jump"];
    const label = { "tech.dribble": "드리블", "tech.pass": "패스", "tech.shoot": "슈팅", "tech.firstTouch": "볼 터치", "tech.defense": "수비",
      "phys.speed": "스피드", "phys.stamina": "체력", "phys.strength": "몸싸움", "phys.jump": "점프" };
    const best = all.slice().sort((a, b) => getPath(p.stats, b) - getPath(p.stats, a))[0];
    const worst = keys.slice().sort((a, b) => getPath(p.stats, a) - getPath(p.stats, b))[0];
    return fillText("{b|은/는} 쓸 만하다. 그런데 {p|이/가} {w|이/가} 이래서는 곤란해. 거기부터 채워라.",
      { b: label[best], p: POSITIONS[p.position].label, w: label[worst] });
  }

  function reportCard(p) {
    return `<div class="vn-report">
      <div class="vr-head">기초 체력 측정표 <span class="mute">${esc(d.name)}, 1학년</span></div>
      <dl class="vr-list">
        <dt>키 / 몸무게</dt><dd class="num">${p.body.height.toFixed(1)}cm / ${p.body.weight.toFixed(1)}kg</dd>
        ${MEASURES.map(m => `<dt>${m.label}</dt><dd class="num">${m.fmt(getPath(p.stats, m.stat))}</dd>`).join("")}
        <dt>종합 능력치</dt><dd class="num">${Math.floor(ovr(p))}</dd>
        <dt>코치 평가</dt><dd>${stars(p.coachStars)}</dd>
      </dl>
      <div>${p.traits.map(t => `<span class="trait ${TRAITS[t].good ? "good" : "bad"}">${TRAITS[t].label}</span>`).join("")}</div>
    </div>`;
  }

  function freeNumber() {
    const used = new Set(ROSTER.filter(r => ["3학년선배", "2학년선배", "동기"].includes(r.cohort)).map(r => r.number));
    const free = []; for (let n = 30; n <= 99; n++) if (!used.has(n)) free.push(n);
    return pick(free);
  }

  // ── 대본 ──
  (async () => {
    await lines(TALK.greet);
    d.name = await askName();
    await say("me", "{name}입니다!");
    await lines(TALK.nameAck);
    await say("assistant", "얼굴은 어떤 느낌으로 찍을래?");
    d.face = await askFace();
    await say("narr", "찰칵. 명단 맨 아래에 사진 한 장이 붙었다.");

    setBg("bg_field_day", "field");
    await lines(TALK.position);
    const pos = await choose(Object.entries(TALK.positionAnswers).map(([k, v]) =>
      ({ k, html: `${esc(v.say)}<small>${POSITIONS[k].label} (${k})</small>` })));
    d.position = pos.k;
    await say("me", TALK.positionAnswers[d.position].say);
    await say("coach", TALK.positionAnswers[d.position].react);

    await lines(TALK.foot);
    const ft = await choose(Object.entries(TALK.footAnswers).map(([k, v]) => ({ k, html: `${esc(v.say)}<small>${k === "R" ? "오른발잡이" : "왼발잡이"}</small>` })));
    d.foot = ft.k;
    await say("me", TALK.footAnswers[d.foot].say);
    await say("coach", TALK.footAnswers[d.foot].react);

    await lines(TALK.growth);
    const gr = await choose(Object.entries(TALK.growthAnswers).map(([k, v]) => ({ k, html: `${esc(v.say)}<small>${GROWTH_TYPES[k].label}: ${GROWTH_TYPES[k].desc}</small>` })));
    d.growthType = gr.k;
    await say("me", TALK.growthAnswers[d.growthType].say);
    await say("coach", TALK.growthAnswers[d.growthType].react);

    await lines(TALK.testIntro);
    while (alive) {
      d.rolled = rollPlayer(d);
      const p = d.rolled;
      await say("assistant", `키 ${p.body.height.toFixed(1)}cm, 몸무게 ${p.body.weight.toFixed(1)}kg.`);
      await say("assistant", `50미터 ${MEASURES[0].fmt(p.stats.phys.speed)}, 리프팅 ${MEASURES[3].fmt(p.stats.tech.firstTouch)}.`);
      await lines(TALK.testOutro);
      await say("coach", verdict(p));
      for (const t of p.traits) await say("coach", TRAIT_REMARK[t]);
      setSpeaker("coach");
      txt.textContent = "측정표 봐라. 이게 지금 너다.";
      ui.innerHTML = reportCard(p);
      const left = MAX_REROLL - d.rerolls;
      const opts = [{ k: "ok", label: "열심히 하겠습니다!" }];
      if (left > 0) opts.push({ k: "again", label: `한 번만 다시 뛰어 볼게요 (${left}번 남음)` });
      more.hidden = true;
      const wrap = document.createElement("div");
      wrap.className = "vn-choices";
      wrap.innerHTML = opts.map((o, i) => `<button class="vn-choice" data-i="${i}">${esc(o.label)}</button>`).join("");
      ui.appendChild(wrap);
      const pickd = await new Promise(r => wrap.querySelectorAll("[data-i]").forEach(b => b.addEventListener("click", () => r(opts[+b.dataset.i]))));
      if (pickd.k === "ok") break;
      d.rerolls++;
      await say("coach", "그래. 한 번만 더 해 봐라. 이번엔 제대로.");
    }

    setBg("bg_locker", "night");
    await lines(TALK.numberIntro);
    d.number = freeNumber();
    await say("coach", `넌 ${d.number}번이다.`);
    await say("narr", `${d.number}번. 아직 이름도 안 박힌 주황색 유니폼을 받았다.`);
    await lines(TALK.farewell);
    if (alive) app.startGame({ ...d.rolled, name: d.name, number: d.number });
  })();
}
