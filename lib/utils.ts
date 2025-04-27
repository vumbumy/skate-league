// lib/utils.ts

// Firestore Timestamp 객체를 Date 객체 또는 undefined로 변환하는 헬퍼 함수
export const toDateOrUndefined = (timestamp: any): Date | undefined => {
  // 값이 존재하고, toDate 메소드가 함수 타입이라면 (Firestore Timestamp 객체라면)
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  // 그렇지 않다면 undefined 반환
  return undefined;
};
