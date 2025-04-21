import React from 'react';

const Home = () => {
  return (
    <div className="flex flex-col items-center">
      <img
        src="/next.svg"
        alt="VSL"
        className="max-w-md h-auto"
      />
      <p className="text-center mb-5">
        VSL은 유소년과 아마추어 스케이터를 위한 리그입니다. <br/>
        누구나 실력을 증명하고 성장할 수 있는 무대를 제공합니다. <br/>
        당신의 있는 그대로를 보여주세요.
      </p>
      <div className="text-center">
        <a href="/intro" className="text-xl">
          더보기 &gt; VSL 소개 페이지
        </a>
      </div>
    </div>
  );
};

export default Home;
