import type { MetadataRoute } from "next";

import { getArticleSlugs } from "@/sanity/lib/articles";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.kofsports.com";

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/free-picks`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/premium-picks`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/results`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/responsible-betting`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/nba/player-prop-trends`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/nba/defense-vs-position`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/nfl-player-prop-trends`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/nfl-anytime-touchdown-rankings`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/nfl-snap-counts`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/nfl-red-zone-targets`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/nfl-defense-vs-position`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/nfl-defense-vs-qb`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/nfl-defense-vs-rb`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/nfl-defense-vs-wr`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/nfl-defense-vs-te`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const articleSlugs = await getArticleSlugs();

  const articleRoutes: MetadataRoute.Sitemap = articleSlugs.map(
    ({ slug }) => ({
      url: `${baseUrl}/blog/${slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    })
  );

  const supabase = createAdminClient();

  const [
    { data: nflPlayers, error: nflPlayersError },
    { data: nbaPlayers, error: nbaPlayersError },
  ] = await Promise.all([
    supabase
      .from("nfl_player_pages")
      .select("slug")
      .order("slug", { ascending: true }),
    supabase
      .from("nba_player_pages")
      .select("slug")
      .order("slug", { ascending: true }),
  ]);

  if (nflPlayersError) {
    throw new Error(
      `Failed to load NFL player pages for sitemap: ${nflPlayersError.message}`,
    );
  }

  if (nbaPlayersError) {
    throw new Error(
      `Failed to load NBA player pages for sitemap: ${nbaPlayersError.message}`,
    );
  }

  const nflPlayerRoutes: MetadataRoute.Sitemap = (nflPlayers ?? []).map(
    ({ slug }) => ({
      url: `${baseUrl}/nfl/players/${slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    }),
  );

  const nbaPlayerRoutes: MetadataRoute.Sitemap = (nbaPlayers ?? []).map(
    ({ slug }) => ({
      url: `${baseUrl}/nba/players/${slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    }),
  );

  return [
    ...staticRoutes,
    ...articleRoutes,
    ...nflPlayerRoutes,
    ...nbaPlayerRoutes,
  ];
}
