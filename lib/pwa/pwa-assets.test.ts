import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const requiredAssets = [
  "public/icon-192.png",
  "public/icon-512.png",
  "public/icon-maskable-192.png",
  "public/icon-maskable-512.png",
  "public/apple-touch-icon.png",
  "public/brand/bogunon-symbol.png",
  "public/brand/bogunon-wordmark.png",
  "public/brand/bogunon-logo.png",
  "app/icon.png",
  "app/apple-icon.png",
  "app/favicon.ico",
] as const;

describe("PWA static assets", () => {
  it.each(requiredAssets)("includes %s", (asset) => {
    expect(existsSync(join(root, asset))).toBe(true);
  });

  it("caches only explicit same-origin static assets", () => {
    const source = readFileSync(join(root, "public/sw.js"), "utf8");
    expect(source).toContain("request.method !== \"GET\"");
    expect(source).toContain("url.origin !== self.location.origin");
    expect(source).toContain("/_next/static/");
    expect(source).toContain("/brand/");
    expect(source).not.toContain("/api/");
    expect(source).not.toContain("supabase");
  });

  it("provides a branded offline retry without cached user content", () => {
    const source = readFileSync(join(root, "public/offline.html"), "utf8");
    expect(source).toContain("BOGUNON");
    expect(source).toContain("인터넷 연결을 확인해주세요.");
    expect(source).toContain("다시 시도");
    expect(source).not.toContain("업무 내용");
  });
});
