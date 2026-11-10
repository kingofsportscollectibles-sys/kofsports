import { createClient } from "@supabase/supabase-js";
import fallback from "../../data/nba/team-betting-records.json";
import type { TeamBettingDataset } from "../../lib/nba/team-betting-records";
import { refreshStoredTeamRecords } from "../../lib/nba/team-betting-cache";
async function main(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)throw new Error("Missing NBA refresh configuration");
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  console.log(await refreshStoredTeamRecords(client,fallback as TeamBettingDataset));
}
void main().catch(e=>{console.error(e instanceof Error?e.message:"NBA refresh failed");process.exitCode=1;});
