// 공통적으로 사용될 인터페이스 (필요에 따라 필드 추가)

// 리그 데이터 인터페이스
interface League {
  id: string; // Firestore 문서 ID는 보통 별도로 관리
  name: string;
  date?: Date; // Firestore Timestamp는 JS Date 객체로 변환하여 사용할 수 있습니다.
  createdAt?: Date;
  // TODO: 필요한 다른 리그 필드 추가
}

// 스케이터 데이터 인터페이스
interface Skater {
  id: string; // Firestore 문서 ID
  name: string;
  // TODO: 필요한 다른 스케이터 필드 추가
}

// Firestore에 저장된 사용자 데이터 인터페이스
interface UserData {
  uid: string;
  email: string | null; // Firebase Auth User의 email 필드
  createdAt?: Date; // Firestore Timestamp
  role?: string; // 'user', 'admin' 등 (필드가 없을 수도 있으므로 optional로)
  // TODO: 필요한 다른 사용자 프로필 필드 추가
}
