export interface League {
  id: string; // Firestore 문서 ID
  name: string;
  date?: Date; // Firestore Timestamp
  location?: string;
  createdAt?: Date; // Firestore Timestamp
  bannerImageUrl?: string;
  description?: string;
  // TODO: Add other league fields
}

export interface Skater {
  id: string; // Firestore 문서 ID
  name: string;
  // TODO: 필요한 다른 스케이터 필드 추가
}
