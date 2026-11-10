import type { SupabaseClient } from "@supabase/supabase-js";
import { aggregateTeamRecords, type TeamBettingDataset } from "./team-betting-records";
import { fetchTeamBettingDataset } from "./refresh-team-betting-data";
export function validateTeamDataset(value: unknown): TeamBettingDataset {
  const d=value as TeamBettingDataset;
  if(!d||!Number.isInteger(d.season)||!/^\d{4}-\d{2}-\d{2}$/.test(d.throughDate)||!Number.isFinite(Date.parse(d.retrievedAt))||!Array.isArray(d.games))throw new Error("Invalid NHL records dataset");
  aggregateTeamRecords(d.games);
  if(d.games.some(g=>g.date>d.throughDate))throw new Error("NHL records exceed through date");
  return d;
}
export async function refreshStoredTeamRecords(client: SupabaseClient, fallback:TeamBettingDataset, fetchDataset=fetchTeamBettingDataset) {
  const {data,error}=await client.from("nhl_team_betting_datasets").select("season,retrieved_at,dataset").order("season",{ascending:false}).limit(1).maybeSingle();
  if(error)throw new Error(`NHL cache read failed (${error.code})`);
  const previous=data?validateTeamDataset(data.dataset):fallback;
  const next=validateTeamDataset(await fetchDataset(previous));
  const payload={season:next.season,through_date:next.throughDate,retrieved_at:next.retrievedAt,dataset:next};
  if(data&&next.season===data.season){
    if(next.throughDate<previous.throughDate)throw new Error("Refusing to roll back NHL coverage");
    const result=await client.from("nhl_team_betting_datasets").update(payload).eq("season",data.season).eq("retrieved_at",data.retrieved_at).select("season");
    if(result.error||result.data?.length!==1)throw new Error("NHL cache update failed or another refresh won; existing data preserved");
  }else{
    const result=await client.from("nhl_team_betting_datasets").insert(payload);
    if(result.error)throw new Error(`NHL cache insert failed (${result.error.code})`);
  }
  return {season:next.season,throughDate:next.throughDate,games:next.games.length};
}
