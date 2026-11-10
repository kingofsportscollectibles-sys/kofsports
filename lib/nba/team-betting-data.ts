import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import fallback from "@/data/nba/team-betting-records.json";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateTeamDataset } from "./team-betting-cache";
import type { TeamBettingDataset } from "./team-betting-records";
// A shared public sports-data read; no user/session state is cached.
const readStored=unstable_cache(async()=>{
  const {data,error}=await createAdminClient().from("nba_team_betting_datasets").select("dataset").order("season",{ascending:false}).limit(1).maybeSingle();
  if(error||!data)throw new Error("NBA records refresh unavailable");
  return validateTeamDataset(data.dataset);
},["nba-team-records-v1"],{revalidate:300,tags:["nba-team-records"]});
export const getTeamBettingDataset=cache(async():Promise<{dataset:TeamBettingDataset;fallback:boolean}>=>{
  try{return {dataset:await readStored(),fallback:false};}
  catch{return {dataset:fallback as TeamBettingDataset,fallback:true};}
});
