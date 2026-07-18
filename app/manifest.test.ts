import { describe, expect, it } from "vitest";

import manifest from "@/app/manifest";

describe("PWA manifest", () => {
  it("uses the installable BOGUNON identity and protected start route", () => {
    expect(manifest()).toMatchObject({
      name: "BOGUNON",
      short_name: "BOGUNON",
      description: "Personal workflow and schedule workspace",
      start_url: "/briefing",
      scope: "/",
      display: "standalone",
      orientation: "portrait-primary",
      lang: "ko-KR",
      theme_color: "#5CCFBE",
      background_color: "#F4FBF9",
    });
  });

  it("declares standard and maskable icons", () => {
    expect(manifest().icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ src: "/icon-192.png", sizes: "192x192", purpose: "any" }),
      expect.objectContaining({ src: "/icon-512.png", sizes: "512x512", purpose: "any" }),
      expect.objectContaining({ src: "/icon-maskable-192.png", sizes: "192x192", purpose: "maskable" }),
      expect.objectContaining({ src: "/icon-maskable-512.png", sizes: "512x512", purpose: "maskable" }),
    ]));
  });
});
