import { americanWinProfit } from "../sports/betting-markets";
export { americanWinProfit, parseClosingMarkets } from "../sports/betting-markets";
export const NHL_TEAMS = {
  ANA: ["Anaheim Ducks", "West"],
  BOS: ["Boston Bruins", "East"],
  BUF: ["Buffalo Sabres", "East"],
  CAR: ["Carolina Hurricanes", "East"],
  CBJ: ["Columbus Blue Jackets", "East"],
  CGY: ["Calgary Flames", "West"],
  CHI: ["Chicago Blackhawks", "West"],
  COL: ["Colorado Avalanche", "West"],
  DAL: ["Dallas Stars", "West"],
  DET: ["Detroit Red Wings", "East"],
  EDM: ["Edmonton Oilers", "West"],
  FLA: ["Florida Panthers", "East"],
  LAK: ["Los Angeles Kings", "West"],
  MIN: ["Minnesota Wild", "West"],
  MTL: ["Montreal Canadiens", "East"],
  NJD: ["New Jersey Devils", "East"],
  NSH: ["Nashville Predators", "West"],
  NYI: ["New York Islanders", "East"],
  NYR: ["New York Rangers", "East"],
  OTT: ["Ottawa Senators", "East"],
  PHI: ["Philadelphia Flyers", "East"],
  PIT: ["Pittsburgh Penguins", "East"],
  SEA: ["Seattle Kraken", "West"],
  SJS: ["San Jose Sharks", "West"],
  STL: ["St. Louis Blues", "West"],
  TBL: ["Tampa Bay Lightning", "East"],
  TOR: ["Toronto Maple Leafs", "East"],
  UTA: ["Utah Mammoth", "West"],
  VAN: ["Vancouver Canucks", "West"],
  VGK: ["Vegas Golden Knights", "West"],
  WPG: ["Winnipeg Jets", "West"],
  WSH: ["Washington Capitals", "East"],
} as const;
export type NhlTeam = keyof typeof NHL_TEAMS;
export type TeamBettingGame = { id: string; date: string; home: NhlTeam; away: NhlTeam; homeScore: number; awayScore: number;
  homeSpread: number | null; total: number | null; homeMoneyline: number | null; awayMoneyline: number | null; sourceUrl: string; finish: "REG" | "OT" | "SO" };
export type TeamBettingDataset = { season: number; throughDate: string; retrievedAt: string; source: string; games: TeamBettingGame[] };
export type BettingSplit = "all" | "home" | "road";
export type TeamBettingRecord = { team: NhlTeam; name: string; conference: string; games: number; wins: number; losses: number; overtimeLosses: number;
  atsWins: number; atsLosses: number; atsPushes: number; atsGames: number; overs: number; unders: number; totalPushes: number; totalGames: number;
  moneylineGames: number; units: number | null; roi: number | null; coverRate: number | null; overRate: number | null };
export const normalizeNhlTeam=(team:string)=>({LA:"LAK",NJ:"NJD",SJ:"SJS",TB:"TBL",UTAH:"UTA",WAS:"WSH",MON:"MTL"} as Record<string,string>)[team]??team;
export function nhlFinish(status:{period?:number;type?:{name?:string;detail?:string;shortDetail?:string}}):"REG"|"OT"|"SO" {
  if(!status.type?.name?.startsWith("STATUS_FINAL"))throw new Error("NHL game is not final");
  const text=`${status.type.detail??""} ${status.type.shortDetail??""}`;
  if(/shootout|\bSO\b/i.test(text)||status.period===5)return "SO";
  if(/overtime|\bOT\b/i.test(text)||status.period===4)return "OT";
  if(status.period===3)return "REG";
  throw new Error("NHL regulation/overtime result is unavailable");
}
export function gameForTeam(g: TeamBettingGame, team: NhlTeam) {
  const home=g.home===team, score=home?g.homeScore:g.awayScore, against=home?g.awayScore:g.homeScore;
  const spread=g.homeSpread===null||!Number.isFinite(g.homeSpread)?null:home?g.homeSpread:-g.homeSpread;
  const total=g.total!==null&&Number.isFinite(g.total)&&g.total>0?g.total:null;
  const moneyline=home?g.homeMoneyline:g.awayMoneyline, profit=americanWinProfit(moneyline);
  return { home, score, against, opponent:home?g.away:g.home, won:score>against, overtimeLoss:score<against&&g.finish!=="REG", spread, moneyline,
    ats:spread===null?null:Math.sign(score+spread-against), total, ou:total===null?null:Math.sign(score+against-total),
    units:profit===null?null:score>against?profit:-1 };
}
export function aggregateTeamRecords(games: TeamBettingGame[], split: BettingSplit="all"): TeamBettingRecord[] {
  const unique=new Map<string,TeamBettingGame>();
  for(const g of games) {
    if(!Object.hasOwn(NHL_TEAMS,g.home)||!Object.hasOwn(NHL_TEAMS,g.away)||g.home===g.away||!Number.isInteger(g.homeScore)||!Number.isInteger(g.awayScore)||g.homeScore<0||g.awayScore<0||g.homeScore===g.awayScore) throw new Error("Invalid final NHL result");
    if(!["REG","OT","SO"].includes(g.finish)||(g.finish!=="REG"&&Math.abs(g.homeScore-g.awayScore)!==1))throw new Error("Invalid NHL overtime/shootout finish");
    const prior=unique.get(g.id); if(prior&&JSON.stringify(prior)!==JSON.stringify(g)) throw new Error("Conflicting duplicate NHL game");
    unique.set(g.id,g);
  }
  return (Object.keys(NHL_TEAMS) as NhlTeam[]).map(team=>{
    const rows=[...unique.values()].filter(g=>(g.home===team||g.away===team)&&(split==="all"||(split==="home"?g.home===team:g.away===team))).map(g=>gameForTeam(g,team));
    const ats=rows.filter(g=>g.ats!==null), totals=rows.filter(g=>g.ou!==null), ml=rows.filter(g=>g.units!==null);
    const atsWins=ats.filter(g=>g.ats===1).length, atsLosses=ats.filter(g=>g.ats===-1).length;
    const overs=totals.filter(g=>g.ou===1).length, unders=totals.filter(g=>g.ou===-1).length;
    const units=ml.length?ml.reduce((n,g)=>n+g.units!,0):null;
    return {team,name:NHL_TEAMS[team][0],conference:NHL_TEAMS[team][1],games:rows.length,wins:rows.filter(g=>g.won).length,losses:rows.filter(g=>!g.won).length,overtimeLosses:rows.filter(g=>g.overtimeLoss).length,
      atsWins,atsLosses,atsPushes:ats.length-atsWins-atsLosses,atsGames:ats.length,overs,unders,totalPushes:totals.length-overs-unders,totalGames:totals.length,
      moneylineGames:ml.length,units,roi:units===null?null:units/ml.length,coverRate:atsWins+atsLosses?atsWins/(atsWins+atsLosses):null,overRate:overs+unders?overs/(overs+unders):null};
  });
}
