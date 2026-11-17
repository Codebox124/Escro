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
  // (Keys are globs over route paths, so "[...path]" can't be written literally.)
  outputFileTracingIncludes: {
    "/api/**": ["./backend/**/*"],
  },
};

export default nextConfig;
