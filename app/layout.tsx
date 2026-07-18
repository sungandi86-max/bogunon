import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";

import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";

import "./globals.css";

export const metadata: Metadata = {
  title: "BOGUNON",
  applicationName: "BOGUNON",
  description: "Personal workflow and schedule workspace",
  metadataBase: new URL("https://bogunon.vercel.app"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "BOGUNON",
    description: "교사를 위한 개인 일정·업무 관리 공간",
    url: "/",
    siteName: "BOGUNON",
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "BOGUNON" }],
  },
  twitter: {
    card: "summary",
    title: "BOGUNON",
    description: "교사를 위한 개인 일정·업무 관리 공간",
    images: ["/icon-512.png"],
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/icon-512.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "BOGUNON" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#5CCFBE",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  await headers();
  return (
    <html lang="ko-KR">
      <body>{children}<ServiceWorkerRegistration /></body>
    </html>
  );
}
