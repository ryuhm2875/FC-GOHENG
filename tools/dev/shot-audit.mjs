// 슈팅·재개 통계 점검 (§88): 경기당 슈팅·유효·골, 골/슈팅 비율, 우리 유효 슈팅이 전부 골인 경기 비율, 중거리 시도, 스로인·코너킥 수
// node tools/dev/shot-audit.mjs [경기 수]  PICK=auto|random  CAL="cu:5"  SIMK="potP:0"
import { setSeed, rand } from "../../js/rng.js";
import { rollPlayer, newGame } from "../../js/state.js";
import { beginWeek, endWeek } from "../../js/engine/week.js";
import { prepareMatch, next, resolve, autoChoice, finishMatch, CAL } from "../../js/engine/match.js";
import { setSimK } from "../../js/engine/sim.js";
if (process.env.SIMK) setSimK(Object.fromEntries(process.env.SIMK.split(",").map(kv => { const [k, v] = kv.split(":"); return [k, +v]; })));   // SIMK="potP:0,crossBlock:0"
if (process.env.CAL) for (const kv of process.env.CAL.split(",")) { const [k, v] = kv.split(":"); CAL[k] = +v; }
const R={}; const N=+process.argv[2]||150; let G=0; const A={us:{shots:0,on:0,g:0},them:{shots:0,on:0,g:0}}; const pot={n:0,g:0}, fk={n:0,g:0}; let hi=0, sameGS=0, lines=0, simShots={us:0,them:0}, simGoals={us:0,them:0};
const PICK=process.env.PICK||"auto";
for(let k=0;k<N;k++){ setSeed(40000+k);
 const s=newGame(rollPlayer({name:"테스트",face:"face_01",position:["FW","MF","DF"][k%3],foot:"R",growthType:"steady"})); s.relations.coach=95;
 const lv=45+(k%5)*8; for(const g of ["tech","phys","mental"]) for(const q in s.player.stats[g]) s.player.stats[g][q]=lv;
 let ctx; for(let i=0;i<60;i++){ctx=beginWeek(s); if(ctx.fx)break; endWeek(s,ctx,null);} if(!ctx?.fx)continue;
 const m=prepareMatch(s,ctx.info,ctx.fx); G++; let g=0;
 while(!m.done&&g++<4000){ if(m.pending){resolve(s,m,PICK==="auto"?autoChoice(m):Math.floor(rand()*Math.max(1,(m.pending.choices||[]).length)));continue;} lines+=next(s,m).lines.length; }
 for(const t of ["us","them"]){A[t].shots+=m.stats[t].shots; A[t].on+=m.stats[t].on;}
 A.us.g+=m.score[0]; A.them.g+=m.score[1];
 for(const x of m.sim.ev){ if(x.type==="restart") R[x.kind]=(R[x.kind]||0)+1; if(["crossBlock","foul","tackle"].includes(x.type)) R[x.type]=(R[x.type]||0)+1; } for(const x of m.sim.ev) if(x.type==="shot"){simShots[x.team]++; if(x.result==="goal")simGoals[x.team]++; if(x.pot){pot.n++; if(x.result==="goal")pot.g++; pot[x.result]=(pot[x.result]||0)+1;} if(x.kind==="fk"){fk.n++; if(x.result==="goal")fk.g++;}}
 if(m.stats.us.shots+m.stats.them.shots>0 && (m.score[0]+m.score[1])/(m.stats.us.shots+m.stats.them.shots)>=0.5) hi++;
 if(m.score[0]>=m.stats.us.on && m.score[0]>0) sameGS++;
}
const f=x=>(x/G).toFixed(2);
console.log(`경기 ${G} | 우리 슈팅 ${f(A.us.shots)} 유효 ${f(A.us.on)} 골 ${f(A.us.g)} | 상대 슈팅 ${f(A.them.shots)} 유효 ${f(A.them.on)} 골 ${f(A.them.g)} | 골/슈팅 ${((A.us.g+A.them.g)/(A.us.shots+A.them.shots)*100).toFixed(0)}% | 골/슈팅≥50% 경기 ${(hi/G*100).toFixed(0)}% | 우리 골=유효 ${(sameGS/G*100).toFixed(0)}% | 해설 ${f(lines)}줄`);
console.log(`경기장 슈팅 us ${f(simShots.us)} them ${f(simShots.them)} 골 ${f(simGoals.us)} ${f(simGoals.them)}`);
console.log(`중거리 시도 경기당 ${f(pot.n)} (골 ${pot.g}, ${JSON.stringify(pot)}) | 직접 프리킥 ${fk.n}개 골 ${fk.g}`);
console.log("재개·사건 경기당: "+Object.entries(R).map(([k,v])=>`${k} ${f(v)}`).join(" | "));
