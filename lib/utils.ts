// lib/utils.ts

// Firestore Timestamp 객체를 Date 객체 또는 undefined로 변환하는 헬퍼 함수
export const toDateOrUndefined = (timestamp: any): Date | undefined => {
  // 값이 존재하고, toDate 메소드가 함수 타입이라면 (Firestore Timestamp 객체라면)
  if (timestamp && typeof timestamp.toDate === "function") {
    return timestamp.toDate();
  }
  // 그렇지 않다면 undefined 반환
  return undefined;
};

// ★ 전화번호 문자열을 일반적인 한국 형식으로 포매팅하는 헬퍼 함수
export const formatPhoneNumber = (
  phoneNumberString: string | null | undefined,
): string => {
  // 입력값이 없으면 빈 문자열 반환
  if (!phoneNumberString) {
    return "";
  }

  // 숫자 이외의 문자 모두 제거
  const cleaned = phoneNumberString.replace(/\D/g, "");

  // cleaned 문자열 길이와 시작 숫자에 따라 포매팅 적용
  // 한국 전화번호 주요 형식에 맞춰 포매팅
  const len = cleaned.length;

  // 010으로 시작하는 11자리 번호 (가장 흔함)
  if (len === 11 && cleaned.startsWith("010")) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  }
  // 01x로 시작하는 10자리 번호 (예: 011, 016 등) 또는 0xx로 시작하는 10자리 (주요 지역 번호 제외)
  else if (len === 10 && cleaned.startsWith("01")) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  }
  // 서울 지역 번호 (02) - 9자리 또는 10자리
  else if (len === 9 && cleaned.startsWith("02")) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{4})/, "$1-$2-$3");
  } else if (len === 10 && cleaned.startsWith("02")) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "$1-$2-$3");
  }
  // 그 외 0xx 지역 번호 (3자리) - 10자리 또는 11자리 (ex: 031, 051, 062 등)
  // 여기서는 단순화하여 앞 3자리-중간-끝 패턴 적용
  else if (len > 7 && cleaned.startsWith("0") && !cleaned.startsWith("02")) {
    if (len === 10) {
      // 0xx-xxx-xxxx
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
    } else if (len === 11) {
      // 0xx-xxxx-xxxx
      return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
    }
    // Note: 이 부분은 모든 지역 번호 패턴을 완벽하게 커버하지 않습니다. 필요시 정교한 로직 추가.
  }

  // 위 패턴에 해당되지 않으면, 숫자만 남은 문자열 그대로 반환
  // 또는 사용자에게 오류 메시지를 반환하거나 다른 기본 형식을 적용할 수 있습니다.
  return cleaned;
};

export function capitalizeFirstLetter(val?: string) {
  if (!val) return "??";
  return val.charAt(0).toUpperCase() + String(val).slice(1);
}
