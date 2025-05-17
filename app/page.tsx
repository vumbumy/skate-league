import React from "react";

const Home = () => {
  return (
    <div className="flex flex-col items-center gap-10">
      <img src="/main_banner.webp" alt="logo" className="w-2/3" />
      <span className="text-xl text-white text-center">
        한국 스케이트보딩의 새로운 무대가 열립니다!
        <br />
        대회 소식과 랭킹 정보를 만나보세요.
        <br />
        <br />곧 공개됩니다!
      </span>
    </div>
  );
};

export default Home;
