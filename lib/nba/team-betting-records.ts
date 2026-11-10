import { americanWinProfit } from "../sports/betting-markets";
export { americanWinProfit, parseClosingMarkets } from "../sports/betting-markets";
export const NBA_TEAMS = {
  ATL: ["Atlanta Hawks", "East"], BOS: ["Boston Celtics", "East"], BKN: ["Brooklyn Nets", "East"], CHA: ["Charlotte Hornets", "East"], CHI: ["Chicago Bulls", "East"], CLE: ["Cleveland Cavaliers", "East"], DAL: ["Dallas Mavericks", "West"], DEN: ["Denver Nuggets", "West"], DET: ["Detroit Pistons", "East"], GSW: ["Golden State Warriors", "West"], HOU: ["Houston Rockets", "West"], IND: ["Indiana Pacers", "East"], LAC: ["Los Angeles Clippers", "West"], LAL: ["Los Angeles Lakers", "West"], MEM: ["Memphis Grizzlies", "West"], MIA: ["Miami Heat", "East"], MIL: ["Milwaukee Bucks", "East"], MIN: ["Minnesota Timberwolves", "West"], NOP: ["New Orleans Pelicans", "West"], NYK: ["New York Knicks", "East"], OKC: ["Oklahoma City Thunder", "West"], ORL: ["Orlando Magic", "East"], PHI: ["Philadelphia 76ers", "East"], PHX: ["Phoenix Suns", "West"], POR: ["Portland Trail Blazers", "West"], SAC: ["Sacramento Kings", "West"], SAS: ["San Antonio Spurs", "West"], TOR: ["Toronto Raptors", "East"], UTA: ["Utah Jazz", "West"], WAS: ["Washington Wizards", "East"],
} as const;
export type NbaTeam = keyof typeof NBA_TEAMS;
export type TeamBettingGame = { id: string; date: string; home: NbaTeam; away: NbaTeam; homeScore: number; awayScore: number;
  homeSpread: number | null; total: number | null; homeMoneyline: number | null; awayMoneyline: number | null; sourceUrl: string };
export type TeamBettingDataset = { season: number; throughDate: string; retrievedAt: string; source: string; games: TeamBettingGame[] };
export type BettingSplit = "all" | "home" | "road";
export type TeamBettingRecord = { team: NbaTeam; name: string; conference: string; games: number; wins: number; losses: number;
  atsWins: number; atsLosses: number; atsPushes: number; atsGames: number; overs: number; unders: number; totalPushes: number; totalGames: number;
  moneylineGames: number; units: number | null; roi: number | null; coverRate: number | null; overRate: number | null };
export const normalizeNbaTeam = (team: string) => (({ GS: "GSW", NO: "NOP", UTAH: "UTA", NY: "NYK", SA: "SAS", WSH: "WAS" } as Record<string,string>)[team] ?? team);
export function gameForTeam(g: TeamBettingGame, team: NbaTeam) {
  const home=g.home===team, score=home?g.homeScore:g.awayScore, against=home?g.awayScore:g.homeScore;
  const spread=g.homeSpread===null||!Number.isFinite(g.homeSpread)?null:home?g.homeSpread:-g.homeSpread;
  const total=g.total!==null&&Number.isFinite(g.total)&&g.total>0?g.total:null;
  const moneyline=home?g.homeMoneyline:g.awayMoneyline, profit=americanWinProfit(moneyline);
  return { home, score, against, opponent:home?g.away:g.home, won:score>against, spread, moneyline,
    ats:spread===null?null:Math.sign(score+spread-against), total, ou:total===null?null:Math.sign(score+against-total),
    units:profit===null?null:score>against?profit:-1 };
}
export function aggregateTeamRecords(games: TeamBettingGame[], split: BettingSplit="all"): TeamBettingRecord[] {
  const unique=new Map<string,TeamBettingGame>();
  for(const g of games) {
    if(!Object.hasOwn(NBA_TEAMS,g.home)||!Object.hasOwn(NBA_TEAMS,g.away)||g.home===g.away||!Number.isInteger(g.homeScore)||!Number.isInteger(g.awayScore)||g.homeScore<0||g.awayScore<0||g.homeScore===g.awayScore) throw new Error("Invalid final NBA result");
    const prior=unique.get(g.id); if(prior&&JSON.stringify(prior)!==JSON.stringify(g)) throw new Error("Conflicting duplicate NBA game");
    unique.set(g.id,g);
  }
  return (Object.keys(NBA_TEAMS) as NbaTeam[]).map(team=>{
    const rows=[...unique.values()].filter(g=>(g.home===team||g.away===team)&&(split==="all"||(split==="home"?g.home===team:g.away===team))).map(g=>gameForTeam(g,team));
    const ats=rows.filter(g=>g.ats!==null), totals=rows.filter(g=>g.ou!==null), ml=rows.filter(g=>g.units!==null);
    const atsWins=ats.filter(g=>g.ats===1).length, atsLosses=ats.filter(g=>g.ats===-1).length;
    const overs=totals.filter(g=>g.ou===1).length, unders=totals.filter(g=>g.ou===-1).length;
    const units=ml.length?ml.reduce((n,g)=>n+g.units!,0):null;
    return {team,name:NBA_TEAMS[team][0],conference:NBA_TEAMS[team][1],games:rows.length,wins:rows.filter(g=>g.won).length,losses:rows.filter(g=>!g.won).length,
      atsWins,atsLosses,atsPushes:ats.length-atsWins-atsLosses,atsGames:ats.length,overs,unders,totalPushes:totals.length-overs-unders,totalGames:totals.length,
      moneylineGames:ml.length,units,roi:units===null?null:units/ml.length,coverRate:atsWins+atsLosses?atsWins/(atsWins+atsLosses):null,overRate:overs+unders?overs/(overs+unders):null};
  });
}
