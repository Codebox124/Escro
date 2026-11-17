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
  // The Express API (backend/) runs inside Next via pages/api/[...path].js.
  // Its dependencies are loaded from node_modules at runtime instead of being
  // bundled (Express uses dynamic requires bundlers can't follow); Next still
  // traces them so they ship with the API function on Vercel.
  serverExternalPackages: [
    "express",
    "cors",
    "helmet",
    "morgan",
    "compression",
    "express-rate-limit",
    "express-validator",
    "dotenv",
    "multer",
    "@supabase/supabase-js",
    "jsonwebtoken",
    "bcryptjs",
    "stripe",
    "nodemailer",
  ],
};

export default nextConfig;
