import test from "node:test";
import assert from "node:assert/strict";
import { americanWinProfit, aggregateTeamRecords, gameForTeam, parseClosingMarkets, type TeamBettingGame } from "../../lib/nba/team-betting-records";
const fixture=():TeamBettingGame=>({id:"one",date:"2026-11-08",home:"BOS",away:"NYK",homeScore:110,awayScore:100,homeSpread:-5.5,total:215.5,homeMoneyline:-200,awayMoneyline:150,sourceUrl:"https://www.espn.com/nba/game/_/gameId/1"});
test("flat one-unit risk uses American odds for favorite and underdog wins and never includes returned stake",()=>{
  assert.equal(americanWinProfit(-200),.5);assert.equal(americanWinProfit(150),1.5);
  assert.equal(gameForTeam(fixture(),"BOS").units,.5);assert.equal(gameForTeam(fixture(),"NYK").units,-1);
  const g={...fixture(),homeScore:95};assert.equal(gameForTeam(g,"NYK").units,1.5);assert.equal(gameForTeam(g,"BOS").units,-1);
  for(const n of [null,0,50,-99,NaN,Infinity])assert.equal(americanWinProfit(n),null);
});
test("home and away spread signs produce complementary ATS records and identical game-total records",()=>{
  const rows=aggregateTeamRecords([fixture()]);const b=rows.find(r=>r.team==="BOS")!,n=rows.find(r=>r.team==="NYK")!;
  assert.equal(b.atsWins,1);assert.equal(n.atsLosses,1);assert.equal(b.unders,1);assert.equal(n.unders,1);assert.equal(b.roi,.5);
});
test("pushes are counted but excluded from percentage denominators",()=>{
  const g={...fixture(),homeSpread:-10,total:210};const b=aggregateTeamRecords([g]).find(r=>r.team==="BOS")!;
  assert.equal(b.atsPushes,1);assert.equal(b.totalPushes,1);assert.equal(b.coverRate,null);assert.equal(b.overRate,null);
});
test("missing market data does not erase straight-up records or masquerade as break-even units",()=>{
  const g={...fixture(),homeSpread:null,total:null,homeMoneyline:null,awayMoneyline:null};const b=aggregateTeamRecords([g]).find(r=>r.team==="BOS")!;
  assert.equal(b.wins,1);assert.equal(b.units,null);assert.equal(b.moneylineGames,0);assert.equal(b.atsGames,0);assert.equal(b.totalGames,0);
  const invalid={...g,homeSpread:NaN,total:Infinity};assert.equal(gameForTeam(invalid,"BOS").ats,null);assert.equal(gameForTeam(invalid,"BOS").ou,null);
});
test("all 30 teams are present; home and road splits reconcile; duplicate games do not inflate samples",()=>{
  const g=fixture(),all=aggregateTeamRecords([g,g]);assert.equal(all.length,30);assert.equal(all.reduce((s,r)=>s+r.games,0),2);
  assert.equal(aggregateTeamRecords([g],"home").find(r=>r.team==="NYK")!.games,0);
  assert.equal(aggregateTeamRecords([g],"road").find(r=>r.team==="NYK")!.games,1);
  assert.throws(()=>aggregateTeamRecords([g,{...g,homeScore:120}]));assert.throws(()=>aggregateTeamRecords([{...g,homeScore:g.awayScore}]));
});
test("actual break-even remains numeric zero with a graded denominator",()=>{
  const b=aggregateTeamRecords([{...fixture(),homeMoneyline:100},{...fixture(),id:"two",homeScore:90,homeMoneyline:100}]).find(r=>r.team==="BOS")!;
  assert.equal(b.units,0);assert.equal(b.roi,0);assert.equal(b.moneylineGames,2);
});
test("only coherent explicitly labeled closing fields are used, including away favorites",()=>{
  const x={moneyline:{home:{close:{odds:"+331"}},away:{close:{odds:"-423"}}},pointSpread:{home:{close:{line:"+9.5"}},away:{close:{line:"-9.5"}}},total:{over:{close:{line:"o238.5"}},under:{close:{line:"u238.5"}}}};
  assert.deepEqual(parseClosingMarkets(x),{homeSpread:9.5,total:238.5,homeMoneyline:331,awayMoneyline:-423});
  assert.equal(parseClosingMarkets({...x,pointSpread:{home:{close:{line:"-9.5"}},away:{close:{line:"-9.5"}}}}).homeSpread,null);
  assert.equal(parseClosingMarkets({pointSpread:{home:{open:{line:"-5"}}},spread:-5,overUnder:200}).total,null);
  assert.equal(parseClosingMarkets({moneyline:{home:{close:{odds:""}}}}).homeMoneyline,null);
});
