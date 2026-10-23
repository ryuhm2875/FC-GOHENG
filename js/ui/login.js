// 학번 로그인 화면, 들어갈 수 없을 때 안내 화면
import { esc } from "./util.js";

const shell = inner => `<div class="gate">
    <img class="gate-logo" src="assets/img/logo.png" alt="">
    <span class="eyebrow">GOHEUNG FC · DREAM PROJECT</span>
    ${inner}
  </div>`;

// onLogin(id, pw) → Promise. 실패하면 오류 메시지를 보여 줌
export function renderLogin(root, { onLogin, notice = "" }) {
  root.innerHTML = shell(`
    <h1>고흥FC 드림 프로젝트</h1>
    <p class="mute">학번과 비밀번호로 들어가세요.</p>
    <form class="gate-form" autocomplete="off">
      <input class="gate-input gate-id" name="sid" type="text" inputmode="numeric" autocapitalize="off" spellcheck="false" aria-label="학번" placeholder="학번 (예: 20301)">
      <input class="gate-input" name="pw" type="password" autocapitalize="off" aria-label="비밀번호" placeholder="비밀번호">
      <button class="btn btn-kit btn-wide" type="submit">들어가기</button>
    </form>
    <p class="gate-msg" role="status" aria-live="polite">${esc(notice)}</p>
    <button class="linkbtn gate-teacher" type="button" data-teacher>선생님 로그인 (이메일)</button>
    <p class="gate-note">로그인하면 게임 진행 기록이 서버에 저장되어, 다른 기기에서도 이어서 할 수 있습니다.<br>비밀번호를 잊었으면 선생님께 말씀드리세요.</p>`);
  const form = root.querySelector(".gate-form"), msg = root.querySelector(".gate-msg"), btn = form.querySelector("button");
  form.sid.focus();
  // 학번 칸은 숫자 키패드라 이메일을 칠 수 없음 → 선생님은 이메일 칸으로 바꿔서
  root.querySelector("[data-teacher]").addEventListener("click", e => {
    const t = form.sid.type !== "email";
    form.sid.type = t ? "email" : "text";
    form.sid.inputMode = t ? "email" : "numeric";
    form.sid.placeholder = t ? "선생님 이메일" : "학번 (예: 20301)";
    form.sid.setAttribute("aria-label", t ? "이메일" : "학번");
    form.sid.value = "";
    e.target.textContent = t ? "학생 로그인 (학번)" : "선생님 로그인 (이메일)";
    form.sid.focus();
  });
  form.addEventListener("submit", async e => {
    e.preventDefault();
    btn.disabled = true; btn.textContent = "확인 중…"; msg.textContent = "";
    try { await onLogin(form.sid.value, form.pw.value); }
    catch (err) {
      msg.textContent = err.message || "로그인하지 못했습니다.";
      form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake");
      form.pw.select();
      btn.disabled = false; btn.textContent = "들어가기";
    }
  });
}

// 닫힘·차단·인터넷 없음
export function renderLock(root, r, { onRetry, onOther }) {
  const title = { closed: "지금은 쉬는 시간", blocked: "들어갈 수 없습니다", offline: "연결이 끊겼습니다" }[r.kind] || "잠시만요";
  root.innerHTML = shell(`
    <h1>${esc(title)}</h1>
    <p class="gate-lock">${esc(r.message || "")}</p>
    <div class="gate-form">
      <button class="btn btn-kit btn-wide" data-retry>다시 확인</button>
      <button class="btn btn-ghost btn-wide" data-other>다른 학번으로 로그인</button>
    </div>`);
  root.querySelector("[data-retry]").addEventListener("click", onRetry);
  root.querySelector("[data-other]").addEventListener("click", onOther);
}

export function renderLoading(root, text = "확인 중…") {
  root.innerHTML = shell(`<p class="mute" style="margin-top:12px">${esc(text)}</p>`);
}
