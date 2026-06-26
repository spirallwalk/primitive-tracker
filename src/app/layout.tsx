import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "./components/bottom-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: '원시의 피라미드로 돌아가라',
  description: '매일 가장 인간적인 15가지 습관을 기록한다',
  openGraph: {
    title: '원시의 피라미드로 돌아가라',
    description: '매일 가장 인간적인 15가지 습관을 기록한다',
    url: siteUrl,
    siteName: 'Primitive Tracker',
    images: [
      {
        url: '/UI/de27f0ea126c4005314c4cec9db84cd6.webp',
        alt: '원시의 피라미드 — 동굴 벽화',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '원시의 피라미드로 돌아가라',
    description: '매일 가장 인간적인 15가지 습관을 기록한다',
    images: ['/UI/de27f0ea126c4005314c4cec9db84cd6.webp'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
