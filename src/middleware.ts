import { NextResponse, type NextRequest } from "next/server";

// Allowed origins and pattern matchers for cross-origin requests
const ALLOWED_ORIGIN_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/saanshealth\.vercel\.app$/,
  /^https:\/\/.*saanshealth.*\.vercel\.app$/,
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/.*\.onrender\.com$/,
];

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  // Custom environment override
  const envAllowed = process.env.CORS_ALLOWED_ORIGINS;
  if (envAllowed) {
    const list = envAllowed.split(",").map((s) => s.trim().toLowerCase());
    if (list.includes("*") || list.includes(origin.toLowerCase())) {
      return true;
    }
  }

  return ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = isOriginAllowed(origin);
  // If origin is in allowed list, reflect origin to allow credentials
  // Otherwise, fallback to request origin if provided, or wildcard
  const allowOrigin = origin && isAllowed ? origin : (origin || "*");

  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD",
    "Access-Control-Allow-Headers":
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Origin, Cache-Control, Pragma, X-SaansAI-User",
    "Access-Control-Max-Age": "86400",
  };

  if (allowOrigin !== "*") {
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const corsHeaders = buildCorsHeaders(origin);

  // 1. Handle Preflight OPTIONS Request
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // 2. Handle Standard API Requests
  const response = NextResponse.next();

  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
