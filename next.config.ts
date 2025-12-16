import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Force the root to this project to avoid picking ancestor lockfiles
    root: __dirname,
  },
  // Mark canvas-related packages as external to avoid build issues
  serverExternalPackages: ["@napi-rs/canvas", "canvas"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh4.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh5.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh6.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
