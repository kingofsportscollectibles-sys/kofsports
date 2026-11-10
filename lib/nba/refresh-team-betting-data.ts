import { NBA_TEAMS, normalizeNbaTeam, parseClosingMarkets, aggregateTeamRecords, type NbaTeam, type TeamBettingGame, type TeamBettingDataset } from "./team-betting-records";
type Competitor={homeAway:string;score:string;team:{abbreviation:string}};
type Event={id:string;date:string;season:{year:number;type:number};status:{type:{name:string}};competitions:{competitors:Competitor[]}[]};
type Summary={pickcenter?:{provider?:{id?:string;name?:string}}[];header?:{competitions?:{status?:{type?:{name?:string}}}[]}};
async function get<T>(url:string):Promise<T>{const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error(`NBA source returned ${r.status}: ${url}`);return r.json();}
export async function fetchTeamBettingDataset(previous: TeamBettingDataset, now=new Date()): Promise<TeamBettingDataset> {
  const et=new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"});
  const today=et.format(now), yesterday=new Date(`${today}T12:00:00Z`);yesterday.setUTCDate(yesterday.getUTCDate()-1);
  const season=Number(today.slice(0,4))-(Number(today.slice(5,7))<10?1:0);
  // Offseason refresh stays within this season's regular-season/calendar window.
  const through=Math.min(yesterday.getTime(),Date.parse(`${season+1}-06-30T12:00:00Z`));
  const throughDate=new Date(through).toISOString().slice(0,10);
  const first=new Date(previous.season===season ? `${previous.throughDate}T12:00:00Z` : `${season}-10-01T12:00:00Z`);
  if(previous.season===season)first.setUTCDate(first.getUTCDate()-2);
  const from=first.toISOString().slice(0,10)<`${season}-10-01`?`${season}-10-01`:first.toISOString().slice(0,10);
  if(throughDate<from)return previous;
  return fetchTeamBettingRange(season,from,throughDate,previous);
}
export async function fetchTeamBettingRange(season: number, from: string, through: string, previous?: TeamBettingDataset): Promise<TeamBettingDataset> {
  const et=new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"});
  const events=new Map<string,Event>();
  const dates:string[]=[];
  for(const d=new Date(`${from}T12:00:00Z`);d.toISOString().slice(0,10)<=through;d.setUTCDate(d.getUTCDate()+1))dates.push(d.toISOString().slice(0,10));
  for(let i=0;i<dates.length;i+=4){
    const pages=await Promise.all(dates.slice(i,i+4).map(date=>get<{events?:Event[]}>(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${date.replaceAll("-","")}`)));
    for(const data of pages){
      if(!Array.isArray(data.events))throw new Error("Missing source scoreboard events");
      for(const e of data.events)if(e.season?.year===season+1&&e.season?.type===2&&e.status?.type?.name==="STATUS_FINAL")events.set(e.id,e);
    }
  }

  if(previous?.season===season&&previous.games.some(g=>g.date>=from&&g.date<=through&&!events.has(g.id)))throw new Error("Source omitted a previously verified final game; retaining existing data");
  const list=[...events.values()].sort((a,b)=>a.date.localeCompare(b.date)),games:TeamBettingGame[]=[];
  // Bounded offline refresh: no per-game HTTP calls occur during page requests.
  for(let i=0;i<list.length;i+=4){
    const batch=await Promise.all(list.slice(i,i+4).map(async e=>{
      if(!/^\d+$/.test(e.id))throw new Error("Invalid source event identity");
      const sourceUrl=`https://www.espn.com/nba/game/_/gameId/${e.id}`;
      const summary=await get<Summary>(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${e.id}`);
      if(summary.header?.competitions?.[0]?.status?.type?.name!=="STATUS_FINAL")throw new Error(`Final status mismatch: ${e.id}`);
      const competitors=e.competitions[0].competitors,h=competitors.find(c=>c.homeAway==="home"),a=competitors.find(c=>c.homeAway==="away");
      if(!h||!a)throw new Error("Missing source teams");
      const home=normalizeNbaTeam(h.team.abbreviation),away=normalizeNbaTeam(a.team.abbreviation),homeScore=Number(h.score),awayScore=Number(a.score);
      if(!Object.hasOwn(NBA_TEAMS,home)||!Object.hasOwn(NBA_TEAMS,away)||!Number.isInteger(homeScore)||!Number.isInteger(awayScore)||homeScore<=0||awayScore<=0||homeScore===awayScore)throw new Error("Invalid final result");
      const matches=(summary.pickcenter??[]).filter(o=>o.provider?.name==="DraftKings"&&o.provider?.id==="100");
      const markets=parseClosingMarkets(matches.length===1?matches[0]:null);
      const known=previous?.season===season?previous.games.find(g=>g.id===e.id):undefined;
      for(const field of ["homeSpread","total","homeMoneyline","awayMoneyline"] as const)if(markets[field]===null&&known&&known.home===home&&known.away===away)markets[field]=known[field];
      return {id:e.id,date:et.format(new Date(e.date)),home:home as NbaTeam,away:away as NbaTeam,homeScore,awayScore,...markets,sourceUrl};
    }));games.push(...batch);
  }
  const refreshedIds=new Set(games.map(g=>g.id));
  const retained=previous?.season===season?previous.games.filter(g=>g.date<from&&!refreshedIds.has(g.id)):[];
  games.push(...retained);games.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
  const records=aggregateTeamRecords(games);
  if(records.reduce((s,r)=>s+r.games,0)!==games.length*2)throw new Error("Team-game reconciliation failed");
  return {season,throughDate:through,retrievedAt:new Date().toISOString(),source:"ESPN final game summaries; DraftKings fields explicitly labeled close",games};
}
