import React from 'react';
import Link from 'next/link';

const GNB = () => {
  return (
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

export default GNB;
