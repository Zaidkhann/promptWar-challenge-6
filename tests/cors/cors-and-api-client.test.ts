import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { middleware } from "../../src/middleware";
import { apiUrl } from "../../src/lib/api-client";

describe("SaansAI CORS & Cross-Origin API Client Suite", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("apiUrl Helper", () => {
    it("returns relative path when no cross-origin backend is set", () => {
      delete process.env.NEXT_PUBLIC_API_URL;
      delete process.env.NEXT_PUBLIC_BACKEND_URL;

      assert.strictEqual(apiUrl("/api/chat"), "/api/chat");
      assert.strictEqual(apiUrl("api/aqi/live"), "/api/aqi/live");
    });

    it("prepends NEXT_PUBLIC_API_URL when set", () => {
      process.env.NEXT_PUBLIC_API_URL = "https://promptwar-challenge-6.onrender.com";

      assert.strictEqual(
        apiUrl("/api/chat"),
        "https://promptwar-challenge-6.onrender.com/api/chat"
      );
      assert.strictEqual(
        apiUrl("api/aqi/live"),
        "https://promptwar-challenge-6.onrender.com/api/aqi/live"
      );
    });

    it("handles trailing slash in backend URL correctly", () => {
      process.env.NEXT_PUBLIC_API_URL = "https://promptwar-challenge-6.onrender.com/";

      assert.strictEqual(
        apiUrl("/api/chat"),
        "https://promptwar-challenge-6.onrender.com/api/chat"
      );
    });
  });

  describe("CORS Middleware", () => {
    it("handles OPTIONS preflight for saanshealth.vercel.app with 204 No Content", () => {
      const request = new NextRequest("https://promptwar-challenge-6.onrender.com/api/chat", {
        method: "OPTIONS",
        headers: {
          origin: "https://saanshealth.vercel.app",
          "access-control-request-method": "POST",
          "access-control-request-headers": "Content-Type, Authorization",
        },
      });

      const response = middleware(request);

      assert.strictEqual(response.status, 204);
      assert.strictEqual(
        response.headers.get("access-control-allow-origin"),
        "https://saanshealth.vercel.app"
      );
      assert.strictEqual(response.headers.get("access-control-allow-credentials"), "true");
      assert.ok(response.headers.get("access-control-allow-methods")?.includes("POST"));
      assert.ok(response.headers.get("access-control-allow-headers")?.includes("Content-Type"));
    });

    it("handles OPTIONS preflight for Vercel preview branch domains", () => {
      const request = new NextRequest("https://promptwar-challenge-6.onrender.com/api/aqi/live", {
        method: "OPTIONS",
        headers: {
          origin: "https://saanshealth-preview-branch.vercel.app",
        },
      });

      const response = middleware(request);

      assert.strictEqual(response.status, 204);
      assert.strictEqual(
        response.headers.get("access-control-allow-origin"),
        "https://saanshealth-preview-branch.vercel.app"
      );
      assert.strictEqual(response.headers.get("access-control-allow-credentials"), "true");
    });

    it("handles OPTIONS preflight for local development", () => {
      const request = new NextRequest("http://localhost:3000/api/simulator/simulate", {
        method: "OPTIONS",
        headers: {
          origin: "http://localhost:3000",
        },
      });

      const response = middleware(request);

      assert.strictEqual(response.status, 204);
      assert.strictEqual(
        response.headers.get("access-control-allow-origin"),
        "http://localhost:3000"
      );
      assert.strictEqual(response.headers.get("access-control-allow-credentials"), "true");
    });

    it("appends CORS headers to standard API responses", () => {
      const request = new NextRequest("https://promptwar-challenge-6.onrender.com/api/aqi/live", {
        method: "GET",
        headers: {
          origin: "https://saanshealth.vercel.app",
        },
      });

      const response = middleware(request);

      assert.strictEqual(
        response.headers.get("access-control-allow-origin"),
        "https://saanshealth.vercel.app"
      );
      assert.strictEqual(response.headers.get("access-control-allow-credentials"), "true");
      assert.ok(response.headers.get("access-control-allow-methods")?.includes("GET"));
      assert.strictEqual(response.headers.get("x-ratelimit-limit"), "120");
      assert.ok(response.headers.has("x-ratelimit-remaining"));
    });

    it("blocks malicious path traversal sequences with 400 Bad Request", () => {
      const request = new NextRequest("https://promptwar-challenge-6.onrender.com/api/chat?file=../../etc/passwd", {
        method: "GET",
      });

      const response = middleware(request);

      assert.strictEqual(response.status, 400);
    });

    it("blocks null-byte injection attacks with 400 Bad Request", () => {
      const request = new NextRequest("https://promptwar-challenge-6.onrender.com/api/chat?scenario=%00evil", {
        method: "GET",
      });

      const response = middleware(request);

      assert.strictEqual(response.status, 400);
    });
  });
});
