import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchTeamBettingRange } from "../../lib/nba/refresh-team-betting-data";
async function main(){
  const args=process.argv.slice(2),opt=(key:string,fallback:string)=>{const i=args.indexOf(key);return i<0?fallback:args[i+1];};
  const today=new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  const d=new Date(`${today}T12:00:00Z`);d.setUTCDate(d.getUTCDate()-1);
  const through=opt("--through",d.toISOString().slice(0,10)),season=Number(opt("--season",String(Number(today.slice(0,4))-(Number(today.slice(5,7))<10?1:0))));
  if(!/^\d{4}-\d{2}-\d{2}$/.test(through)||through>=today||through<`${season}-10-01`||through>`${season+1}-06-30`)throw new Error("Invalid completed season/date");
  const dataset=await fetchTeamBettingRange(season,`${season}-10-01`,through);
  const file=path.resolve(opt("--out","data/nba/team-betting-records.json"));await mkdir(path.dirname(file),{recursive:true});
  const tmp=`${file}.refresh-${process.pid}`;await writeFile(tmp,JSON.stringify(dataset,null,2)+"\n");await rename(tmp,file);
  console.log(JSON.stringify({file,games:dataset.games.length,through}));
}
void main().catch(e=>{console.error(e instanceof Error?e.message:"NBA refresh failed");process.exitCode=1;});
