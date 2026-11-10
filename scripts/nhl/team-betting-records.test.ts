import test from "node:test";
import assert from "node:assert/strict";
import { aggregateTeamRecords, gameForTeam, nhlFinish, normalizeNhlTeam, parseClosingMarkets, type TeamBettingGame } from "../../lib/nhl/team-betting-records";
const game=():TeamBettingGame=>({id:"1",date:"2026-11-08",home:"BOS",away:"NYR",homeScore:4,awayScore:2,homeSpread:-1.5,total:6.5,homeMoneyline:-200,awayMoneyline:150,sourceUrl:"https://www.espn.com/nhl/game/_/gameId/1",finish:"REG"});
test("moneyline wins use 1u risk and puck-line outcomes are complementary",()=>{
 const g=game();assert.equal(gameForTeam(g,"BOS").units,.5);assert.equal(gameForTeam(g,"NYR").units,-1);assert.equal(gameForTeam(g,"BOS").ats,1);assert.equal(gameForTeam(g,"NYR").ats,-1);
});
test("OT and shootout defeats earn standings OTL but remain full moneyline losses",()=>{
 const gs=[game(),{...game(),id:"2",homeScore:1,awayScore:2},{...game(),id:"3",homeScore:2,awayScore:3,finish:"OT" as const},{...game(),id:"4",homeScore:0,awayScore:1,finish:"SO" as const}];
 const b=aggregateTeamRecords(gs).find(r=>r.team==="BOS")!;assert.equal(b.wins,1);assert.equal(b.losses,3);assert.equal(b.overtimeLosses,2);assert.equal(b.losses-b.overtimeLosses,1);assert.equal(b.units,-2.5);
});
test("official shootout score is used once for puck line and total; no extra deciding goal is invented",()=>{
 const g={...game(),finish:"SO" as const,homeScore:3,awayScore:2,total:5};const r=gameForTeam(g,"BOS");assert.equal(r.ats,-1);assert.equal(r.ou,0);assert.equal(r.units,.5);
});
test("a shutout is a genuine final result, while impossible OT margins and tied finals are rejected",()=>{
 assert.equal(aggregateTeamRecords([{...game(),homeScore:0}]).find(r=>r.team==="BOS")!.losses,1);
 assert.throws(()=>aggregateTeamRecords([{...game(),finish:"OT"}]));assert.throws(()=>aggregateTeamRecords([{...game(),homeScore:2}]));
});
test("all 32 current teams and conferences are present, split totals reconcile and duplicates are not new games",()=>{
 const rows=aggregateTeamRecords([game(),game()]);assert.equal(rows.length,32);assert.equal(rows.filter(r=>r.conference==="West").length,16);assert.ok(rows.some(r=>r.name==="Utah Mammoth"));assert.equal(rows.reduce((s,r)=>s+r.games,0),2);
 assert.equal(aggregateTeamRecords([game()],"road").find(r=>r.team==="NYR")!.games,1);assert.equal(aggregateTeamRecords([game()],"home").find(r=>r.team==="NYR")!.games,0);
});
test("missing markets remain unavailable and total pushes do not enter over percentages",()=>{
 const r=aggregateTeamRecords([{...game(),homeMoneyline:null,homeSpread:null,total:6}]).find(r=>r.team==="BOS")!;assert.equal(r.units,null);assert.equal(r.moneylineGames,0);assert.equal(r.atsGames,0);assert.equal(r.totalPushes,1);assert.equal(r.overRate,null);
});
test("finish metadata and canonical team aliases are resolved explicitly",()=>{
 assert.equal(nhlFinish({period:3,type:{name:"STATUS_FINAL"}}),"REG");assert.equal(nhlFinish({period:4,type:{name:"STATUS_FINAL",shortDetail:"Final/OT"}}),"OT");assert.equal(nhlFinish({period:4,type:{name:"STATUS_FINAL",shortDetail:"Final/SO"}}),"SO");assert.throws(()=>nhlFinish({type:{name:"STATUS_FINAL"}}));assert.throws(()=>nhlFinish({period:3,type:{name:"STATUS_IN_PROGRESS"}}));
 for(const [a,b] of [["UTAH","UTA"],["NJ","NJD"],["LA","LAK"],["SJ","SJS"],["TB","TBL"]])assert.equal(normalizeNhlTeam(a),b);
});
test("only explicit coherent closing puck lines are accepted",()=>{
 assert.equal(parseClosingMarkets({pointSpread:{home:{close:{line:"-1.5"}},away:{close:{line:"+1.5"}}}}).homeSpread,-1.5);assert.equal(parseClosingMarkets({spread:-1.5}).homeSpread,null);
});
