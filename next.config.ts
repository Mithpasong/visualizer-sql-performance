import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev resources when opening the app from another LAN address (e.g. http://192.168.0.4:4080)
  allowedDevOrigins: ["192.168.0.4"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
