// app/layout.tsx

import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import GnbRenderer from "@/components/GNBRenderer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "한국 스케이트보드 리그 - 공식 랭킹 및 대회 플랫폼 | KSL",
  description:
    "한국 스케이트보드 리그, 대회 일정, 선수 순위, 참가 신청 등 스케이트보드 정보를 제공하는 공식 플랫폼 - Korea Skateboarding League (KSL)",
  keywords: [
    "스케이트보드",
    "스케이트보드 대회",
    "스케이트보드 리그",
    "스케이트보드 순위",
    "스케이트보딩",
    "KSL",
    "Korea Skateboarding League",
    "스케이트보드 선수 등록",
    "스포츠 리그 플랫폼",
    "한국 스케이트보드",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "한국 스케이트보드 리그 - 공식 플랫폼 | KSL",
    description:
      "한국 스케이트보드 리그 및 선수 순위 정보를 제공하는 공식 플랫폼",
    url: "https://www.koreaskateboardingleague.com/",
    siteName: "KOREA SKATEBOARDING LEAGUE",
    images: [
      {
        url: "/main_banner.webp",
        width: 1200,
        height: 630,
        alt: "코리아 스케이트보딩 리그 대표 이미지",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "한국 스케이트보드 리그 - KSL",
    description: "한국 스케이트보드 리그 및 공식 선수 순위 제공 플랫폼",
    images: ["/main_banner.webp"],
    site: "@ksl_official",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="flex h-screen max-w-2xl mx-auto bg-gray-600">
        {/* body에 flex 및 min-h-screen 추가 (전체 높이 확보 및 flex 컨테이너화) */}
        {/* AuthProvider로 앱 전체를 감싸서 인증 정보를 전역적으로 제공 */}
        <AuthProvider>
          <div className="fixed top-0 left-0 w-full z-50">
            <div className="max-w-2xl mx-auto w-full">
              <GnbRenderer /> {/* GNB가 내부에서 숨김 여부 결정 */}
            </div>
          </div>

          <div className="flex w-full mx-auto bg-neutral-950 pt-14">
            <div className="mx-auto w-full p-4 flex-grow flex flex-col justify-center">
              {children}
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
