import test from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { refreshStoredTeamRecords } from "../../lib/nba/team-betting-cache";
import { fetchTeamBettingDataset } from "../../lib/nba/refresh-team-betting-data";
import type { TeamBettingDataset, TeamBettingGame } from "../../lib/nba/team-betting-records";
const game:TeamBettingGame={id:"123",date:"2026-11-06",home:"BOS",away:"NYK",homeScore:110,awayScore:100,homeSpread:-5,total:215,homeMoneyline:-200,awayMoneyline:150,sourceUrl:"https://www.espn.com/nba/game/_/gameId/123"};
const dataset:TeamBettingDataset={season:2026,throughDate:"2026-11-08",retrievedAt:"2026-11-09T12:00:00Z",source:"ESPN close",games:[game]};
function mock(options:{empty?:boolean;conflict?:boolean}={}){
  const writes:unknown[]=[],filters:unknown[]=[];
  const client={from(){return {select(){return {order(){return this;},limit(){return this;},async maybeSingle(){return {data:options.empty?null:{season:2026,retrieved_at:dataset.retrievedAt,dataset},error:null};}};},update(payload:unknown){writes.push(payload);return {eq(k:string,v:unknown){filters.push([k,v]);return this;},async select(){return {data:options.conflict?[]:[{season:2026}],error:null};}};},async insert(payload:unknown){writes.push(payload);return {error:null};}};}} as unknown as SupabaseClient;
  return {client,writes,filters};
}
test("successful daily cache refresh uses an atomic compare-and-set and preserves coverage",async()=>{
  const m=mock();const r=await refreshStoredTeamRecords(m.client,dataset,async p=>({...p,retrievedAt:"2026-11-09T13:00:00Z"}));
  assert.equal(r.games,1);assert.equal(m.writes.length,1);assert.deepEqual(m.filters,[["season",2026],["retrieved_at",dataset.retrievedAt]]);
});
test("empty cache bootstraps from verified fallback without deleting historical records",async()=>{
  const m=mock({empty:true});await refreshStoredTeamRecords(m.client,dataset,async p=>p);assert.equal(m.writes.length,1);
});
test("source failures and coverage rollback never write a replacement",async()=>{
  for(const fetcher of [async()=>{throw Error("Provider down");},async()=>({...dataset,throughDate:"2026-11-01"})]){
    const m=mock();await assert.rejects(refreshStoredTeamRecords(m.client,dataset,fetcher));assert.equal(m.writes.length,0);
  }
});
test("concurrent refresh conflicts are reported rather than silently overwriting newer records",async()=>{
  const m=mock({conflict:true});await assert.rejects(refreshStoredTeamRecords(m.client,dataset,async p=>p),/another refresh/);
});
test("daily fetch checks only recent dates, retains history and keeps previously verified closing odds when temporarily absent",async()=>{
  const original=global.fetch,calls:string[]=[];
  const event={id:"123",date:"2026-11-07T00:00:00Z",season:{year:2027,type:2},status:{type:{name:"STATUS_FINAL"}},competitions:[{competitors:[{homeAway:"home",score:"111",team:{abbreviation:"BOS"}},{homeAway:"away",score:"100",team:{abbreviation:"NY"}}]}]};
  global.fetch=(async input=>{const url=String(input);calls.push(url);return new Response(JSON.stringify(url.includes("summary")?{header:{competitions:[{status:{type:{name:"STATUS_FINAL"}}}]},pickcenter:[]}: {events:url.includes("20261106")?[event]:[]}));}) as typeof fetch;
  try{const previous={...dataset,games:[{...game,id:"older",date:"2026-11-05"},game]};const r=await fetchTeamBettingDataset(previous,new Date("2026-11-09T16:00:00Z"));
    assert.equal(r.games.length,2);assert.equal(r.games.find(g=>g.id==="123")!.homeScore,111);assert.equal(r.games.find(g=>g.id==="123")!.homeMoneyline,-200);assert.equal(calls.filter(c=>c.includes("scoreboard")).length,3);
    global.fetch=(async()=>new Response(JSON.stringify({events:[]}))) as typeof fetch;
    await assert.rejects(fetchTeamBettingDataset(dataset,new Date("2026-11-09T16:00:00Z")),/previously verified/);
  }finally{global.fetch=original;}
});
