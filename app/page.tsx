import React from "react";

const Home = () => {
  return (
    <div className="flex flex-col items-center gap-5">
      <img
        src="https://firebasestorage.googleapis.com/v0/b/vento-skate-league.firebasestorage.app/o/logo.webp?alt=media&token=32189714-0d2c-4268-b116-3f18e82e5698"
        alt="VSL"
        className="w-xs h-auto"
      />
      <p className="text-center mb-5">
        유소년과 아마추어 스케이터를 위한 스케이트보딩 리그입니다. <br />
        누구나 실력을 증명하고 성장할 수 있는 무대를 제공합니다. <br />
        당신의 있는 그대로를 보여주세요.
      </p>
    </div>
  );
};

export default Home;
