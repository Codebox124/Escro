import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // The Express API (backend/) is loaded at runtime by pages/api/[...path].js,
  // so make sure its code and dependencies are shipped with that function.
  outputFileTracingIncludes: {
    "/api/[...path]": ["./backend/**/*"],
  },
  outputFileTracingExcludes: {
    "/api/[...path]": ["./backend/.env", "./backend/database/**", "./backend/*.md"],
  },
};

export default nextConfig;
