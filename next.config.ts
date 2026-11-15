import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "a.espncdn.com",
        pathname: "/i/teamlogos/nfl/**",
      },
    ],
  },

  async redirects() {
    return [
      {
        source: "/:l([a-z0-9])",
        destination: "/?utm_source=heycatch&utm_campaign=:l",
        permanent: false,
      },
      {
        source: "/free-picks",
        destination: "/blog",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
