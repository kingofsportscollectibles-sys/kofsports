import type { Metadata } from "next";
import Link from "next/link";
import NbaTeamBettingRecords from "@/components/nba/NbaTeamBettingRecords";
import { getTeamBettingDataset } from "@/lib/nba/team-betting-data";
const url="https://www.kofsports.com/nba/team-betting-records";
const description="Compare all 30 NBA teams by win-loss record, moneyline units, against-the-spread record and over/under results. Filter home and road records and inspect game logs.";
export async function generateMetadata(): Promise<Metadata> {
  const {dataset}=await getTeamBettingDataset();
  const season=`${dataset.season}–${String((dataset.season+1)%100).padStart(2,"0")}`;
  const title=`NBA Team Betting Records ${season}: ATS & Moneyline Units`;
  return {title:{absolute:`${title} | KofSports`},description,alternates:{canonical:url},
    openGraph:{title,description,url,type:"website"},twitter:{card:"summary_large_image",title,description}};
}
const faqs=[
  {q:"What is an NBA ATS record?",a:"An against-the-spread (ATS) record shows covers, non-covers and pushes against the listed closing spread. A team can win a game outright and still fail to cover. ATS cover percentage is covers divided by covers plus non-covers; pushes are excluded."},
  {q:"How are NBA moneyline units calculated?",a:"This page risks a flat one unit on a team in each game with a usable archived closing moneyline. A win at +150 earns 1.50 units; a win at −200 earns 0.50 units; a loss costs 1.00 unit. Net units are profit, excluding returned stake. ROI is net units divided by units risked. It is not a strategy that risks enough to win one unit on every favorite."},
  {q:"What does an NBA over/under record mean?",a:"The over–under–push record compares the combined final score of both teams, including overtime, with the archived closing game total. A final score exactly equal to the total is a push. Over percentage excludes pushes. A team's over/under record is a full-game total record, not a team-total market."},
  {q:"Why can betting records differ from a team's win-loss record?",a:"Win-loss records include all final regular-season games in this dataset. Betting records only include games with usable closing odds for that market. Different sportsbooks, line timestamps and missing odds can produce different ATS and total records. Each team shows the graded count beside its completed-game count."},
  {q:"Which games and sportsbook are included?",a:"The table covers the selected NBA regular season using ESPN final scores and DraftKings odds explicitly labeled close in ESPN game summaries. Preseason, play-in, playoffs and the NBA Cup championship are excluded; Cup games that count toward the regular season remain included. This is an archived-source summary, not a timestamped independent closing-line feed. Missing odds are never replaced with opening prices, assumed −110 odds or a zero-unit result."},
];
export default async function NbaTeamBettingRecordsPage(){
  const {dataset,fallback:usingFallback}=await getTeamBettingDataset();
  const season=`${dataset.season}–${String((dataset.season+1)%100).padStart(2,"0")}`;
  const title=`NBA Team Betting Records ${season}: ATS & Moneyline Units`;
  const through=new Intl.DateTimeFormat("en-US",{month:"long",day:"numeric",year:"numeric",timeZone:"UTC"}).format(new Date(dataset.throughDate+"T12:00:00Z"));
  const coverage={spread:dataset.games.filter(g=>g.homeSpread!==null).length,total:dataset.games.filter(g=>g.total!==null).length,ml:dataset.games.reduce((n,g)=>n+Number(g.homeMoneyline!==null)+Number(g.awayMoneyline!==null),0)};
  const jsonLd={"@context":"https://schema.org","@graph":[{"@type":"WebPage","@id":url,url,name:title,description,dateModified:dataset.retrievedAt,about:{"@type":"SportsOrganization",name:"National Basketball Association"}},{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:"https://www.kofsports.com"},{"@type":"ListItem",position:2,name:"NBA Team Betting Records",item:url}]}]};
  return <main className="min-h-screen bg-slate-950 text-slate-200">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\u003c")}} />
    <section className="border-b border-slate-800 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.12),transparent_60%)]"><div className="mx-auto max-w-7xl px-4 py-7 md:px-6 md:py-16">
      <nav aria-label="Breadcrumb" className="text-xs text-slate-400"><Link href="/" className="hover:text-white">Home</Link><span aria-hidden="true"> / </span><span>NBA Team Betting Records</span></nav>
      <p className="mt-4 text-xs md:mt-7 font-bold uppercase tracking-[0.25em] text-emerald-400">KofSports NBA Research · Free</p>
      <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight tracking-tight text-white md:text-6xl">NBA Team Betting Records</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 md:mt-5 md:text-base md:leading-7 text-slate-300">A winning record and a profitable betting record tell different stories. Compare NBA team records, moneyline units, ATS cover rates and over/under results in one place.</p>
      <div className="mt-4 flex flex-wrap gap-2 md:mt-6 text-xs font-semibold"><span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-300">{season} Regular Season</span><span className="rounded-full border border-slate-700 px-3 py-2">Results through <time dateTime={dataset.throughDate}>{through}</time></span><span className="rounded-full border border-slate-700 px-3 py-2">30 teams · {dataset.games.length} final games</span></div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 md:mt-6 md:gap-y-3 text-sm text-emerald-400"><a href="#nba-ats-records" className="underline underline-offset-4">NBA ATS & moneyline standings ↓</a><a href="#methodology" className="underline underline-offset-4">How records are graded ↓</a></div>
    </div></section>
    <section id="nba-ats-records" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-6 md:px-6 md:py-10"><h2 className="text-xl font-bold text-white md:text-2xl">NBA ATS records, moneyline units & over/under standings</h2><p className="mb-4 mt-2 max-w-4xl text-sm leading-6 md:mb-6 md:mt-3 text-slate-400">Sort the table to compare betting performance, or narrow the sample to home and road games. Moneyline units assume a flat 1u risk per game. These are betting records, not official conference standings.</p>
      {usingFallback&&<p role="status" className="mb-5 text-sm text-amber-200">Latest refresh unavailable. Showing the verified snapshot through {through}.</p>}
      <NbaTeamBettingRecords data={dataset} />
    </section>
    <section id="methodology" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-8 md:px-6 md:pb-12"><div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 md:p-8"><p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Know the sample</p><h2 className="mt-3 text-2xl font-bold text-white">Data coverage & grading methodology</h2><p className="mt-4 max-w-4xl text-sm leading-7 text-slate-400">Source: ESPN final game summaries and their DraftKings closing fields. Spread coverage: {coverage.spread}/{dataset.games.length} games. Total coverage: {coverage.total}/{dataset.games.length} games. Moneyline coverage: {coverage.ml}/{dataset.games.length*2} team-games. Overtime is included. Unavailable prices or lines are omitted only from the affected market.</p><p className="mt-3 text-sm leading-7 text-slate-400">This is a dated research snapshot through {through}. The through-date shows the latest included results; the table does not display live odds. Percentages exclude pushes. A dash means no graded sample, while 0.00u means an actual break-even sample.</p><p className="mt-3 text-sm leading-7 text-slate-400">Each game contributes to both teams’ records, so team totals are not independent observations. Historical profit does not establish future performance. Game-log links open the original ESPN game page.</p></div>
      <div className="mt-10 max-w-4xl"><h2 className="text-2xl font-bold text-white">Understanding NBA betting records</h2><div className="mt-5 divide-y divide-slate-800">{faqs.map(f=><details key={f.q} className="py-5"><summary className="cursor-pointer font-semibold text-white">{f.q}</summary><p className="mt-3 text-sm leading-7 text-slate-400">{f.a}</p></details>)}</div></div>
      <div className="mt-10 grid gap-4 md:grid-cols-2">{[{href:"/nba/player-prop-trends",title:"NBA Player Prop Trends",text:"Research points, rebounds, assists and threes using player game logs."},{href:"/nba/defense-vs-position",title:"NBA Defense vs Position",text:"Compare opponent allowances for guards, forwards and centers."}].map(l=><Link key={l.href} href={l.href} className="rounded-2xl border border-slate-800 p-6 hover:border-emerald-500/50"><h3 className="font-bold text-emerald-400">{l.title} →</h3><p className="mt-2 text-sm leading-6 text-slate-400">{l.text}</p></Link>)}</div>
    </section>
  </main>;
}
