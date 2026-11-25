import test from "node:test";
import assert from "node:assert/strict";
import { assessNflInjury, parseInjuryCsv, type InjuryFeed } from "../../lib/nfl/injury-source";
const now=Date.parse("2026-11-25T14:00Z");
const target={playerId:"00-001",team:"NE",season:2026,week:12,kickoff:"2026-11-29T18:00Z"};
const row={season:"2026",week:"12",team:"NE",season_type:"REG",gsis_id:"00-001",report_status:"Out",practice_status:"Did Not Participate In Practice"};
const feed=(patch:Partial<InjuryFeed>={}):InjuryFeed=>({season:2026,rows:[row],available:true,fetchedAt:new Date(now).toISOString(),sourceUpdatedAt:"2026-11-25T07:00Z",...patch});
test("this week's exact GSIS/team match suppresses Out without an Under",()=>{
 const r=assessNflInjury(feed(),target,now);assert.equal(r.state,"out");assert.equal(r.suppressProjection,true);assert.match(r.note,/not an Under/);
});
test("prior-week injury, wrong team and wrong season cannot suppress this week's player",()=>{
 for(const patch of [{week:"11"},{team:"BUF"},{season:"2025"},{season_type:"POST"}]){
 const r=assessNflInjury(feed({rows:[{...row,...patch}]}),target,now);assert.equal(r.state,"unavailable");assert.equal(r.suppressProjection,false);
 }
});
test("fresh fetch never launders a stale, unknown or future source modification time",()=>{
 for(const patch of [{sourceUpdatedAt:"2026-11-20T07:00Z"},{sourceUpdatedAt:null},{sourceUpdatedAt:"2026-11-25T15:00Z"},{fetchedAt:"2026-11-25T13:00Z"},{available:false}]){
 const r=assessNflInjury(feed(patch),target,now);assert.equal(r.state,"unavailable");assert.equal(r.ratingWithheld,true);assert.equal(r.suppressProjection,false);
 }
});
test("practice absence is uncertainty, not Out or a numeric haircut",()=>{
 for(const practice_status of ["Limited Participation in Practice","Did Not Participate In Practice"]){
 const r=assessNflInjury(feed({rows:[{...row,report_status:"",practice_status}]}),target,now);
 assert.equal(r.state,"uncertain");assert.equal(r.suppressProjection,false);assert.equal(r.ratingWithheld,true);
 }
});
test("Questionable and Doubtful remain conditional rather than zero",()=>{
 for(const report_status of ["Questionable","Doubtful"]){const r=assessNflInjury(feed({rows:[{...row,report_status}]}),target,now);assert.equal(r.state,"uncertain");assert.equal(r.suppressProjection,false);}
});
test("full practice and no listing are not claims of health or confirmed starter status",()=>{
 const r=assessNflInjury(feed({rows:[{...row,report_status:"",practice_status:"Full Participation in Practice"}]}),target,now);assert.equal(r.state,"practice_full");assert.match(r.note,/does not confirm/);
 const other=assessNflInjury(feed({rows:[{...row,gsis_id:"other"}]}),target,now);assert.equal(other.state,"not_listed");assert.match(other.note,/not confirmation/);
});
test("duplicates and unknown designations fail closed for score eligibility",()=>{
 for(const rows of [[row,row],[{...row,report_status:"New status"}]]){const r=assessNflInjury(feed({rows}),target,now);assert.equal(r.state,"unavailable");assert.equal(r.ratingWithheld,true);}
});
test("started games and missing identity cannot receive a current pregame designation",()=>{
 assert.equal(assessNflInjury(feed(),{...target,kickoff:new Date(now).toISOString()},now).state,"unavailable");
 assert.equal(assessNflInjury(feed(),{...target,playerId:null},now).state,"unavailable");
});
test("CSV parser validates schema and preserves quoted commas",()=>{
 const csv='season,week,team,gsis_id,report_status,practice_status,season_type\n2026,12,NE,00-001,Out,"Limited, practice",REG\n';
 assert.equal(parseInjuryCsv(csv)[0].practice_status,"Limited, practice");assert.throws(()=>parseInjuryCsv('wrong,header\n1,2'));assert.throws(()=>parseInjuryCsv(''));
});

test("public feed uses a shared bounded fetch and outages return unavailable evidence", async () => {
  const { loadNflInjuryFeed } = await import("../../lib/nfl/injury-source");
  const original=globalThis.fetch;let calls=0;
  const csv='season,week,team,gsis_id,report_status,practice_status,season_type\n2098,12,NE,00-001,Out,,REG\n';
  try {
    globalThis.fetch=async()=>{calls++;return new Response(csv,{status:200,headers:{"last-modified":"Wed, 25 Nov 2026 07:00:00 GMT"}});};
    const [a,b]=await Promise.all([loadNflInjuryFeed(2098),loadNflInjuryFeed(2098)]);
    assert.equal(calls,1);assert.equal(a.available,true);assert.equal(a,b);
    globalThis.fetch=async()=>{throw Error("Source down");};
    const failed=await loadNflInjuryFeed(2099);assert.equal(failed.available,false);assert.deepEqual(failed.rows,[]);
  } finally {globalThis.fetch=original;}
});

test("public injury context hides source identity and only concerns produce callouts", async () => {
  const { publicInjuryContext, showInjuryCallout } = await import("../../lib/nfl/injury-context");
  const out=publicInjuryContext(assessNflInjury(feed(),target,now));
  assert.equal(showInjuryCallout(out),true);
  assert.ok(!JSON.stringify(out).includes("nflverse"));
  assert.ok(!("sourceUrl" in out));assert.ok(!("sourceUpdatedAt" in out));
  for(const state of ["not_listed","practice_full","unavailable"] as const) assert.equal(showInjuryCallout({...out,state}),false);
  assert.equal(showInjuryCallout({...out,state:"uncertain"}),true);
});
