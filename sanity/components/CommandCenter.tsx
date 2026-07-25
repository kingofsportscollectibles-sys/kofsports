"use client";

import { useEffect, useState } from "react";
import { useClient } from "sanity";

type CommandCenterStats = {
  articles: number;
  drafts: number;
  premium: number;
  featured: number;
};

const initialStats: CommandCenterStats = {
  articles: 0,
  drafts: 0,
  premium: 0,
  featured: 0,
};

const STATS_QUERY = `{
  "articles": count(*[
    _type == "article" &&
    !(_id in path("drafts.**"))
  ]),

  "drafts": count(*[
    _type == "article" &&
    _id in path("drafts.**")
  ]),

  "premium": count(*[
    _type == "article" &&
    isPremium == true &&
    !(_id in path("drafts.**"))
  ]),

  "featured": count(*[
    _type == "article" &&
    featured == true &&
    !(_id in path("drafts.**"))
  ])
}`;

export default function CommandCenter() {
  const client = useClient({
    apiVersion: "2026-07-01",
  });

  const [stats, setStats] =
    useState<CommandCenterStats>(initialStats);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        setIsLoading(true);
        setError(null);

        const result =
          await client.fetch<CommandCenterStats>(
            STATS_QUERY,
          );

        if (isMounted) {
          setStats(result);
        }
      } catch (err) {
        console.error(
          "Failed to load Command Center statistics:",
          err,
        );

        if (isMounted) {
          setError(
            "The dashboard statistics could not be loaded.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [client]);

  const statCards = [
    {
      label: "Articles",
      value: stats.articles,
    },
    {
      label: "Drafts",
      value: stats.drafts,
    },
    {
      label: "Premium",
      value: stats.premium,
    },
    {
      label: "Featured",
      value: stats.featured,
    },
  ];

  const pipeline = [
    "Write your next article",
    "Review drafts",
    "Publish today's pick",
  ];

  return (
    <div
      style={{
        padding: 32,
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          fontSize: 36,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        🏠 KofSports Content Command Center
      </h1>

      <p
        style={{
          color: "#666",
          marginBottom: 32,
        }}
      >
        Manage your content, monitor SEO health, and
        publish faster.
      </p>

      {error && (
        <div
          role="alert"
          style={{
            marginBottom: 24,
            padding: 16,
            border: "1px solid #ef4444",
            borderRadius: 12,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 20,
          marginBottom: 40,
        }}
      >
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 12,
              padding: 20,
              background: "#fff",
            }}
          >
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
              }}
            >
              {isLoading ? "—" : card.value}
            </div>

            <div
              style={{
                color: "#666",
                marginTop: 8,
              }}
            >
              {card.label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 2fr) minmax(280px, 1fr)",
          gap: 24,
        }}
      >
        <div
          style={{
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            🔥 Publishing Pipeline
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {pipeline.map((item) => (
              <div key={item}>{item}</div>
            ))}
          </div>
        </div>

        <div
          style={{
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            🚀 Quick Actions
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <a href="/studio/content/article;new">
              ➕ New Article
            </a>

            <a href="/studio/content/article">
              📰 View Articles
            </a>

            <a href="/studio">
              🖼 Media Library
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
