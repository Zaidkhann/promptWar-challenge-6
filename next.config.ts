import type { NextConfig } from "next";

const backendUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL;

const nextConfig: NextConfig = {
  // If a separate backend URL is configured (e.g. Render backend for Vercel frontend),
  // transparently rewrite /api/* requests so the browser experiences zero CORS hurdles.
  async rewrites() {
    if (backendUrl && backendUrl.startsWith("http")) {
      const cleanTarget = backendUrl.replace(/\/$/, "");
      return [
        {
          source: "/api/:path*",
          destination: `${cleanTarget}/api/:path*`,
        },
      ];
    }
    return [];
  },

  // Defense-in-depth CORS headers for all API routes
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT,HEAD",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Origin, Cache-Control, Pragma, X-SaansAI-User",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
