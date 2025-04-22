import React from 'react';
import Link from 'next/link';
import {usePathname} from "next/navigation";

const GlobalNavigationBar = () => {
  const pathname = usePathname();

  const isAdminArea = pathname.startsWith('/admin');
  return (
    isAdminArea ? <nav className="bg-blue-800 p-4 text-white">
        <div className="container mx-auto flex justify-between items-center">
          <div className="font-bold text-lg">스케이터 리그 관리</div>
          <div>
            {/* TODO: 관리자 메뉴 항목 (링크) */}
            <a href="/admin" className="mr-4 hover:underline">대시보드</a>
            {/* 예시: 다른 관리 페이지 링크 */}
            {/* <a href="/admin/leagues" className="mr-4 hover:underline">리그 관리</a> */}
            {/* <a href="/admin/skaters" className="hover:underline">스케이터 관리</a> */}
            {/* TODO: 로그아웃 버튼 (클라이언트 컴포넌트에서 인증 로직 사용) */}
            {/* {user && <button onClick={handleLogout}>로그아웃</button>} */}
          </div>
        </div>
      </nav> :
      <header
        className="bg-black text-white"
        style={{
          padding: '10px 0',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            maxWidth: '800px',
            margin: '0 auto',
          }}
        >
          <Link href="/">홈</Link>
          <Link href="/league">리그 일정</Link>
          <Link href="/results">경기 결과</Link>
          <Link href="/more">더보기</Link>
        </div>
      </header>
  );
};

export default GlobalNavigationBar;
