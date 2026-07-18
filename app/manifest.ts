import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
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
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
