// types/global.d.ts

// Window 인터페이스에 선택적 'instgrm' 속성이 있음을 선언
// 인스타그램 임베드 스크립트가 window.instgrm 객체에 추가하는 형태에 맞춰 선언합니다.
interface Window {
  instgrm?: {
    // 'instgrm' 속성은 존재할 수도, 안 할 수도 있으므로 ?를 붙입니다.
    Embeds: {
      // instgrm 객체는 Embeds 속성을 가집니다.
      process: () => void; // Embeds 객체는 process 함수를 가집니다 (인자 없고 반환값 없음).
    };
  };
}
