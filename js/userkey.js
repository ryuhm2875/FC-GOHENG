// 한 기기를 여러 학생이 쓸 수 있어서, 저장·도감·기록실을 학번별로 나눠 둡니다.
// 로그인 전(또는 선생님 계정)에는 예전과 같은 이름(gfc_auto 등)을 그대로 씁니다.
let NS = "";
export function setUserNS(sid) { NS = sid ? `u${String(sid).replace(/[^\w-]/g, "")}_` : ""; }
export const ukey = k => NS ? k.replace(/^gfc_/, `gfc_${NS}`) : k;
