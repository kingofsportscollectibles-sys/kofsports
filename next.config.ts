import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
  },

  async redirects() {
    return [
      {
  source: "/free-picks",
  destination: "/blog",
  permanent: true,
},
    ];
  },
};

export default nextConfig;