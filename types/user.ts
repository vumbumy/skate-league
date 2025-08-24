export interface UserData {
  uid: string; // Firebase Auth User의 UID (Firestore 문서 ID와 동일)
  email: string; // Firebase Auth User의 이메일
  createdAt?: Date; // Firestore에 저장된 생성 시각 (Timestamp 타입일 수도 있음)
  role?: string; // 사용자의 역할 (예: 'user', 'admin'). 필드가 없을 수도 있어 ? 사용.

  // ★ 스케이터 정보 보완 페이지에서 입력받는 필드들
  name?: string; // 이름
  dateOfBirth?: string; // 생년월일 (YYYY-MM-DD 형식 문자열로 저장할 경우) 또는 Date 타입
  stance?: string; // 스탠스
  sponsor?: string; // 스폰서
  phoneNumber?: string; // 전화번호
  otherNotes?: string; // 기타 전달사항
  profilePictureUrl?: string; // 프로필 사진 Storage URL

  instagram?: string;

  // TODO: 필요한 다른 스케이터/사용자 프로필 필드 추가
}
