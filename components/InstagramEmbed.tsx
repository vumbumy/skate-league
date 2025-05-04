// components/InstagramEmbed.tsx
"use client"; // 클라이언트 컴포넌트임을 명시

import React, { useEffect, useRef } from "react";

interface InstagramEmbedProps {
  permalink: string; // 임베드하려는 인스타그램 게시물의 영구 링크 URL
  captioned?: boolean; // 게시물 캡션을 포함할지 여부 (data-instgrm-captioned 속성에 해당)
  version?: string; // 인스타그램 임베드 버전 (data-instgrm-version 속성에 해당)
  // 필요하다면 다른 data-* 속성들을 props으로 추가할 수 있습니다.
  // 예: data-instgrm-hidecaption, data-instgrm-lazyloading 등
}

const InstagramEmbed: React.FC<InstagramEmbedProps> = ({
  permalink,
  captioned = false, // 기본값 true
  version = "14", // 기본값 14
}) => {
  const blockquoteRef = useRef<HTMLQuoteElement>(null); // blockquote 요소에 접근하기 위한 Ref

  useEffect(() => {
    // 인스타그램 임베드 스크립트를 로드하고 처리하는 함수
    const loadAndProcessEmbed = () => {
      // window.instgrm 객체가 이미 존재하면 (스크립트가 로드되었으면)
      if (window.instgrm) {
        // DOM에 새로 추가된 임베드 요소를 찾아서 처리합니다.
        window.instgrm.Embeds.process();
      } else {
        // window.instgrm 객체가 없으면 스크립트가 아직 로드되지 않은 것이므로, 스크립트를 동적으로 생성하여 추가합니다.
        const script = document.createElement("script");
        script.src = "//www.instagram.com/embed.js"; // 인스타그램 임베드 스크립트 URL
        script.async = true; // 비동기 로딩 설정
        script.onload = () => {
          // 스크립트 로드가 완료되면 다시 process 함수를 호출하여 임베드를 처리합니다.
          if (window.instgrm) {
            window.instgrm.Embeds.process();
          }
        };
        // 스크립트를 문서의 body에 추가합니다.
        document.body.appendChild(script);
      }
    };

    // 컴포넌트가 마운트되거나 permalink 등의 props가 변경될 때 스크립트 로딩 및 처리 함수를 실행합니다.
    loadAndProcessEmbed();

    // 이펙트 클린업 함수 (필요시 사용 - 여기서는 단순 로딩/처리라 필수는 아님)
    // return () => {
    //   // 컴포넌트 언마운트 시 필요한 클린업 작업 (예: 동적으로 추가한 스크립트 제거 등)
    // };
  }, [permalink, captioned, version]); // permalink 등 props가 변경될 때마다 useEffect 재실행

  return (
    // 인스타그램 임베드 코드를 나타내는 정적 blockquote 요소를 렌더링합니다.
    // 인스타그램 임베드 스크립트가 이 요소를 찾아서 실제 임베드 UI로 변환합니다.
    <blockquote
      ref={blockquoteRef} // Ref를 blockquote 요소에 연결
      className="instagram-media" // 인스타그램 임베드 스크립트가 찾는 클래스명
      data-instgrm-permalink={permalink} // 게시물 링크 data 속성
      data-instgrm-version={version} // 버전 data 속성
      // captioned prop이 true일 경우 data-instgrm-captioned 속성 추가
      {...(captioned ? { "data-instgrm-captioned": "" } : {})} // boolean prop은 빈 문자열이나 true로 설정
      // 필요하다면 다른 data-* 속성들을 여기에 추가
    >
      {/* 스크립트 로딩 전 표시될 대체 콘텐츠 또는 로딩 스피너 등을 여기에 넣을 수 있습니다. */}
      {/* 인스타그램 임베드 스크립트가 이 내부를 조작하여 실제 임베드 내용을 넣습니다. */}
      <div style={{ padding: "16px" }}>
        <a href={permalink} target="_blank" rel="noopener noreferrer">
          View this post on Instagram
        </a>
        {/* 원래 임베드 코드의 다른 내부 구조도 여기에 일부 포함하여 스크립트 로딩 실패 시 대체 표시 가능 */}
      </div>
    </blockquote>
  );
};

export default InstagramEmbed;
