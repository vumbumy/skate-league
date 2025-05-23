// app/layout.tsx

import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import GnbRenderer from "@/components/GNBRenderer";
import { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "black",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <title>한국 스케이트보딩 리그 - 공식 랭킹 및 대회 플랫폼 | KSL</title>
        <meta
          name="description"
          content="한국 스케이트보딩 리그, 대회 일정, 선수 순위, 참가 신청 등 스케이트보딩 정보를 제공하는 공식 플랫폼 - Korea Skateboarding League (KSL)"
        />
        <meta
          name="keywords"
          content="스케이트보딩, 스케이트보딩 대회, 스케이트보딩 리그, 스케이트보딩 순위, 스케이트보딩, KSL, Korea Skateboarding League, 스케이트보딩 선수 등록, 스포츠 리그 플랫폼, 한국 스케이트보딩"
        />

        <link rel="icon" href="/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Open Graph */}
        <meta
          property="og:title"
          content="한국 스케이트보딩 리그 - 공식 플랫폼 | KSL"
        />
        <meta
          property="og:description"
          content="한국 스케이트보딩 리그 및 선수 순위 정보를 제공하는 공식 플랫폼"
        />
        <meta
          property="og:url"
          content="https://www.koreaskateboardingleague.com/"
        />
        <meta property="og:site_name" content="KOREA SKATEBOARDING LEAGUE" />
        <meta property="og:image" content="/main_banner.webp" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="코리아 스케이트보딩 리그 대표 이미지"
        />
        <meta property="og:locale" content="ko_KR" />
        <meta property="og:type" content="website" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="한국 스케이트보딩 리그 - KSL" />
        <meta
          name="twitter:description"
          content="한국 스케이트보딩 리그 및 공식 선수 순위 제공 플랫폼"
        />
        <meta name="twitter:image" content="/main_banner.webp" />
        <meta name="twitter:site" content="@ksl_official" />
      </head>
      <body className="flex h-svh max-w-2xl mx-auto bg-black">
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
