import { createClient } from "@supabase/supabase-js";
import fallback from "../../data/nhl/team-betting-records.json";
import type { TeamBettingDataset } from "../../lib/nhl/team-betting-records";
import { fetchTeamBettingRange } from "../../lib/nhl/refresh-team-betting-data";
import { refreshStoredTeamRecords } from "../../lib/nhl/team-betting-cache";
async function main(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)throw new Error("Missing NHL refresh configuration");
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  console.log(await refreshStoredTeamRecords(client,fallback as TeamBettingDataset,process.argv.includes("--full")?p=>fetchTeamBettingRange(fallback.season,`${fallback.season}-09-01`,fallback.throughDate,p):undefined));
}
void main().catch(e=>{console.error(e instanceof Error?e.message:"NHL refresh failed");process.exitCode=1;});
