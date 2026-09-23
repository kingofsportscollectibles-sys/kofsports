export type ToolNavigationItem = {
  name: string;
  description: string;
  href: string;
};

export type ToolNavigationGroup = {
  sport: "NFL" | "NHL" | "NBA" | "MLB";
  tools: ToolNavigationItem[];
};

export const toolNavigationGroups: ToolNavigationGroup[] = [
  {
    sport: "NFL",
    tools: [
      {
        name: "Player Prop Trends",
        description: "L5, L10, season and matchup trends",
        href: "/nfl-player-prop-trends",
      },
      {
        name: "Player Prop Records",
        description: "Historical cover rates vs actual pregame lines",
        href: "/nfl-player-prop-records",
      },
      {
        name: "Anytime TD Rankings",
        description: "KOF Score, odds and touchdown research",
        href: "/nfl-anytime-touchdown-rankings",
      },
      {
        name: "Snap Counts",
        description: "Player snap shares and recent usage trends",
        href: "/nfl-snap-counts",
      },
      {
        name: "Red Zone Targets",
        description: "Red zone carries, targets and scoring opportunities",
        href: "/nfl-red-zone-targets",
      },
      {
        name: "Defense vs Position",
        description: "QB, RB, WR and TE matchup rankings",
        href: "/nfl-defense-vs-position",
      },
    ],
  },
  {
    sport: "NHL",
    tools: [
      {
        name: "Player Prop Trends",
        description: "Shots, points, assists and goalie save trends",
        href: "/nhl/player-prop-trends",
      },
      {
        name: "Starting Goalies",
        description: "Confirmed and projected starters with sources",
        href: "/nhl/starting-goalies",
      },
    ],
  },
];
