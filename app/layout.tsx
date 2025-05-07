// app/layout.tsx
"use client";

import { usePathname } from "next/navigation";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import GnbRenderer from "@/components/GNBRenderer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // '/login'과 '/signup' 경로를 모두 포함
  const pathsWithoutGnb = ["/login", "/signup"];

  // 현재 경로가 GNB를 숨길 경로 목록에 포함되는지 확인
  const hideGnb = pathsWithoutGnb.includes(pathname);

  return (
    <html lang="ko">
      <body className="flex h-screen max-w-2xl mx-auto bg-gray-600">
        {/* body에 flex 및 min-h-screen 추가 (전체 높이 확보 및 flex 컨테이너화) */}
        {/* AuthProvider로 앱 전체를 감싸서 인증 정보를 전역적으로 제공 */}
        <AuthProvider>
          {/* GNB를 감싸는 고정 컨테이너 - 이 div는 전체 너비를 차지 */}
          <div className="fixed top-0 left-0 w-full z-50 ">
            {/* GNB 배경색도 여기에 주는 것이 좋습니다 */}
            {/* ★ GNB 내용을 담고 최대 너비 768px로 중앙에 정렬할 내부 컨테이너 */}
            {/* max-w-2xl: 최대 너비 768px */}
            {/* mx-auto: 블록 요소를 가로 중앙 정렬 */}
            {/* w-full: 부모 너비 (여기서는 max-w-2xl까지)를 채우도록 함 */}
            {/* p-4: 내부 콘텐츠 (GNB)의 상하좌우 패딩 추가 (GNB 컴포넌트 자체 패딩과 중복될 수 있으니 조정 필요) */}
            <div className="max-w-2xl mx-auto w-full ">
              {/* GnbRenderer는 이 내부 컨테이너 안에서 렌더링될지 말지를 결정 */}
              {/* GnbRenderer 자체가 GNB 컴포넌트를 렌더링하고, GNB 컴포넌트 자체에 패딩이 있을 수 있습니다. */}
              {/* GNB 컴포넌트 (GNB.tsx, AdminGlobalNavigationBar.tsx)의 가장 바깥 요소에 있는 패딩(예: p-4)과 여기서 주는 p-4가 중복될 수 있으니 둘 중 한 곳에서만 주는 것이 좋습니다. */}
              <GnbRenderer />
            </div>
          </div>

          <div
            className={`flex w-full mx-auto bg-neutral-950 ${hideGnb || "pt-14"}`}
          >
            {/* Outer div handles vertical space and conditional padding */}
            {/* ★ 실제 페이지 콘텐츠를 담고 GNB와 동일한 너비/중앙 정렬을 수행할 내부 컨테이너 */}
            {/* max-w-2xl: 최대 너비 768px */}
            {/* mx-auto: 블록 요소를 가로 중앙 정렬 */}
            {/* w-full: 부모 너비 (여기서는 flex-grow outer div의 너비) 내에서 max-w-2xl까지 채움 */}
            {/* p-4: 내부 콘텐츠 (children)의 상하좌우 패딩 추가 */}
            {/* flex-grow flex flex-col justify-center: 이 div를 세로로 확장시키고 내부 children을 세로 중앙 정렬 */}
            <div className="mx-auto w-full p-4 flex-grow flex flex-col justify-center">
              {children}
              {/* children은 이제 이 내부 컨테이너의 자식으로 렌더링되며, 세로 중앙 정렬됩니다. */}
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
