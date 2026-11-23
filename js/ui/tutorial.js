// 첫 주 튜토리얼: 환영 → 청백전(연습 경기, 기록에 안 남음) → 홈에서 칸·상태·진행 짚어 주기
// 새로 시작한 판에서 한 번만 (state.flags.tutDone). 어느 단계에서든 '건너뛰기'
import { openModal } from "./modals.js";

const COACH = "assets/img/npc_assistant.webp";
const head = t => `<div class="tb-h"><img src="${COACH}" alt="정 코치"><b>${t}</b></div>`;
const root = () => document.getElementById("modal-root");

// 밝게 남길 곳(sel)과 말풍선. block: 뒤를 못 누르게(홈 안내) / false: 경기 화면처럼 뒤를 눌러야 할 때
export function coach(sel, html, { block = true, btn = "다음", n = "", onNext, onSkip, skip = true } = {}) {
  const t = typeof sel === "string" ? document.querySelector(sel) : sel;
  const layer = document.createElement("div");
  layer.className = `tut-layer ${block ? "block" : ""}`;
  if (block) layer.style.background = "transparent";
  layer.innerHTML = `<div class="tut-hole"></div><section class="tut-bub" role="dialog" aria-label="안내">${html}
    <div class="tb-f"><span class="tb-n">${n}</span>${skip ? `<button class="btn btn-ghost" data-skip>건너뛰기</button>` : ""}${btn ? `<button class="btn btn-kit" data-ok>${btn}</button>` : ""}</div></section>`;
  root().appendChild(layer);
  const hole = layer.querySelector(".tut-hole"), bub = layer.querySelector(".tut-bub");
  const place = () => {
    if (!t || !t.isConnected) { hole.style.display = "none"; bub.style.top = "30%"; return; }
    const r = t.getBoundingClientRect(), pad = 6;
    Object.assign(hole.style, { display: "", left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px` });
    const bh = bub.offsetHeight, below = innerHeight - r.bottom, above = r.top;
    bub.style.top = below >= bh + 24 ? `${r.bottom + 16}px` : above >= bh + 24 ? `${r.top - bh - 16}px` : `${Math.max(12, innerHeight - bh - 12)}px`;
  };
  if (t && t.isConnected && block) {                       // 홈: 아래에 떠 있는 '이번 주 진행' 버튼에 가리지 않게, 위쪽(70px)에 맞춤
    const r = t.getBoundingClientRect(), fixedBottom = document.querySelector(".advance")?.getBoundingClientRect().top || innerHeight;
    if (r.top < 60 || r.bottom > fixedBottom - 8) window.scrollBy(0, r.top - 70);
  }
  requestAnimationFrame(place); setTimeout(place, 350);
  addEventListener("resize", place); addEventListener("scroll", place, true);
  const close = () => { layer.remove(); removeEventListener("resize", place); removeEventListener("scroll", place, true); };
  layer.querySelector("[data-ok]")?.addEventListener("click", () => { close(); onNext?.(); });
  layer.querySelector("[data-skip]")?.addEventListener("click", () => { close(); onSkip?.(); });
  return { close, place };
}

function finish(app) {
  app.state.flags.tutDone = true;
  app.saveTo("auto");
  app.render();
  window.scrollTo(0, 0);                                     // 안내하느라 내려간 화면을 맨 위로
}

// 새 판 시작 직후 (main.js startGame)
export function startTutorial(app) {
  const s = app.state;
  if (!s || s.flags.tutDone) return;
  const html = `${head("고흥FC에 온 걸 환영한다.<br>한 주는 이렇게 흘러간다.")}
    <ol class="tb-steps">
      <li><i>1</i><span>칸 세 개에 할 일을 넣는다<small>훈련, 휴식, 공부 가운데서 고른다</small></span></li>
      <li><i>2</i><span>이번 주 진행을 누른다<small>일주일이 지나고, 주말엔 경기가 있다</small></span></li>
      <li><i>3</i><span>경기 중 중요한 순간엔 내가 정한다<small>공이 오면 패스할지, 슈팅할지 고른다</small></span></li>
    </ol>
    <p>실전 전에 A조·B조로 나눠 청백전부터 한 판 하자. 연습이라 기록에는 안 남는다.</p>
    <div class="tb-f"><button class="btn btn-ghost" data-skip>건너뛰기</button><button class="btn btn-kit" data-ok style="flex:1">청백전 하러 가기</button></div>`;
  openModal(`<div class="tut-bub tut-welcome">${html}</div>`, (el, close) => {
    el.querySelector("[data-skip]").addEventListener("click", () => { close(); finish(app); });
    el.querySelector("[data-ok]").addEventListener("click", () => { close(); app.practice(() => homeTour(app)); });
  }, { dismissable: false });
}

// 청백전 화면 안내: 킥오프 전·첫 선택·첫 타이밍·경기 끝 (showMatch가 m.fx.practice일 때 부름)
export function practiceGuide(ctl, pitchSel) {
  const seen = {};
  let cur = null;
  const show = (key, sel, html, opt = {}) => { if (seen[key]) return; seen[key] = true; cur?.close(); cur = coach(sel, html, { block: false, skip: false, ...opt }); cur.key = key; };
  const check = () => {
    if (ctl.querySelector("[data-start]") && !seen.kick) {
      show("kick", pitchSel, `${head("경기장 보는 법부터.")}
        <p><b>주황</b>이 우리 A조, <b>흰색</b>이 B조, <b>노란 고리</b>가 너다. 공 가진 선수 위엔 이름이 뜬다.</p>
        <p>아래로 해설이 한 줄씩 올라온다. 끝까지 안 봐도 되면 <b>결과만 보기</b>를 눌러라.</p>`, { btn: "알겠어요", n: "1 / 4" });
    } else if (ctl.querySelector(".moment .mo-choices") && !seen.pick) {
      show("pick", ctl.querySelector(".moment"), `${head("공이 오면 경기가 멈춘다.<br>하나를 골라라.")}
        <p>오른쪽 <b>높음·보통·낮음</b>은 성공 가능성이다. 성공하면 평점이 오르고, 실패하면 내려간다. <b>★ 특기</b>는 네 장점이 살아나는 선택지고, 고민되면 <b>알아서 하기</b>.</p>`, { btn: "", n: "2 / 4" });
    } else if (ctl.querySelector(".timing") && !seen.timing) {
      show("timing", ctl.querySelector(".timing"), `${head("⏱ 표시를 고르면 바늘이 나온다.")}
        <p>초록 칸에 왔을 때 눌러라. 가운데 진한 초록이면 완벽이다. 능력치가 좋아질수록 초록 칸이 넓어지고 바늘도 느려진다.</p>`, { btn: "", n: "3 / 4" });
    } else if (ctl.querySelector(".postmatch .pm-me") && !seen.end) {
      show("end", ctl.querySelector(".pm-me"), `${head("수고했다.")}
        <p>평점은 네 선택이 얼마나 잘 됐는지, 팀이 이겼는지로 매겨진다. 공식 경기에서 평점이 좋으면 감독님 신뢰가 오르고, 그게 선발로 이어진다.</p>
        <p>오늘은 연습이라 기록에는 안 남는다. 이제 진짜 한 주를 시작하자.</p>`, { btn: "알겠어요", n: "4 / 4" });
    } else if (cur && ((cur.key === "pick" && !ctl.querySelector(".moment")) || (cur.key === "timing" && !ctl.querySelector(".timing")))) { cur.close(); cur = null; }   // 고르고 나면 말풍선도 닫힘
  };
  const mo = new MutationObserver(check);
  mo.observe(ctl, { childList: true, subtree: true });
  check();
  return () => { mo.disconnect(); cur?.close(); };
}

// 청백전이 끝나고 홈으로 돌아온 뒤: 칸 → 상태와 지시 → 진행
function homeTour(app) {
  const steps = [
    ["[data-tut=week]", `${head("빈칸을 누르면 할 일을 고를 수 있다.<br>훈련, 휴식, 공부 중에 하나.")}
      <p>칸 아래 <b style="color:var(--turf)">초록 글씨</b>는 이번 주에 오르는 능력치, <b style="color:var(--kit-2)">주황 글씨</b>는 쌓이는 피로다.</p>`],
    ["[data-tut=cond]", `${head("막대가 노랗거나 빨갛게 바뀌면 조심해라.")}
      <p>피로가 쌓이면 다치기 쉽고, 감독님도 선발로 안 쓰신다. 피로는 <b>수면</b>이나 <b>가족 시간</b>이 제일 많이 풀어 준다.</p>
      <p>이번 주 칸 위의 감독님 지시도 꼭 봐라. 지시대로 한 칸이라도 넣으면 신뢰가 오른다.</p>`],
    ["[data-tut=advance]", `${head("칸을 다 채웠으면 여기를 누른다.")}
      <p>일주일이 지나가고, 주말에 경기가 있으면 경기장으로 간다. 다음 주부터는 <b>지난주처럼</b>을 눌러 계획을 그대로 써도 된다.</p>`],
  ];
  let i = 0;
  const step = () => {
    if (i >= steps.length) return finish(app);
    const [sel, html] = steps[i];
    coach(sel, html, { n: `${i + 1} / ${steps.length}`, btn: i === steps.length - 1 ? "시작하기" : "다음", onNext: () => { i++; step(); }, onSkip: () => finish(app) });
  };
  app.render(); window.scrollTo(0, 0);
  setTimeout(step, 200);
}
