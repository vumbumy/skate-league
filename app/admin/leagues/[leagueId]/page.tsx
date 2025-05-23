// app/admin/leagues/[leagueId]/page.tsx
"use client"; // 클라이언트 컴포넌트임을 명시

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
// useAuth 훅은 context/AuthContext에서 가져옵니다.
import { useAuth } from "@/context/AuthContext";
// Firebase 및 Firestore 관련 함수들
import {
  collection,
  doc,
  DocumentSnapshot,
  getDoc,
  getDocs,
  query,
  QuerySnapshot,
  updateDoc,
  where,
} from "firebase/firestore"; // 필요한 함수 import
// Firebase Storage (배너 이미지 업로드 시 필요)
import { db, storage } from "@/firebase/config"; // db import 유지 // config 파일에 storage 초기화 추가 필요
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage"; // deleteObject는 이미지 삭제 시 필요
// 로딩 스피너
import { TailSpin } from "react-loader-spinner";
import Link from "next/link";
import { League, UserData } from "@/types/firebase";
import { formatPhoneNumber, toDateOrUndefined } from "@/lib/utils"; // 링크 이동을 위해 Link 컴포넌트 import

// 필요한 인터페이스 import (types/index.ts 파일에서 import)

// 리그 등록 정보 인터페이스 (Firestore 'registrations' 컬렉션에 저장된 데이터 구조)
interface RegistrationData {
  id?: string; // Firestore 문서 ID (자동 생성될 수 있음)
  leagueId: string; // 어떤 리그인지
  userId: string; // 누가 등록했는지
  registeredAt: Date; // 등록 시각
  status: "pending" | "approved" | "rejected"; // 등록 상태 (관리자 승인 필요 시)
  // TODO: 추가 등록 정보 필드 (예: 폼에서 가져온 스케이터 이름 등 - UserData에 없을 경우)
}

// 리그에 참여하는 스케이터 데이터 인터페이스 (등록된 사용자를 나타냄)
interface LeagueSkater {
  // 필수 필드 (등록 정보에서 옴)
  registrationId: string; // 해당 등록 문서의 ID (registrations 컬렉션 문서 ID)
  userId: string; // 등록한 사용자(스케이터)의 UID (users 컬렉션 문서 ID) - JSON의 "uid"와 동일

  // 등록 상태 (registrations 컬렉션에서 옴)
  status: "pending" | "approved" | "rejected"; // JSON의 "status"와 동일
  registeredAt?: Date; // 등록 시각 (Firestore Timestamp -> Date 변환 후)

  // 사용자/스케이터 정보 필드 (users 컬렉션에서 옴)
  // JSON의 필드 이름을 사용하며, 필요시 optional (?) 표시
  name?: string; // JSON의 "name"
  email: string | null; // JSON의 "email"
  role?: string; // JSON의 "role"
  profilePictureUrl?: string; // JSON의 "profilePictureUrl"
  dateOfBirth?: Date; // JSON의 "dateOfBirth" (Firestore Timestamp -> Date 변환 후)
  stance?: string; // JSON의 "stance"
  sponsor?: string; // JSON의 "sponsor"
  phoneNumber?: string; // JSON의 "phoneNumber"
  otherNotes?: string; // JSON의 "otherNotes"
  createdAt?: Date; // JSON의 "createdAt" (Firestore Timestamp -> Date 변환 후) - 사용자 계정 생성 시각

  // TODO: 필요한 다른 스케이터/사용자 정보 필드 추가
}

const LeagueDetailPage = () => {
  // useAuth 훅을 사용하여 전역 인증 정보 가져오기
  const { user, userData, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const leagueId = params.leagueId as string; // [leagueId] 값을 string으로 가져옴

  // 페이지 상태
  const [league, setLeague] = useState<League | null>(null); // 해당 리그 데이터
  const [skatersInLeague, setSkatersInLeague] = useState<LeagueSkater[]>([]); // 해당 리그 스케이터 목록
  const [pageLoading, setPageLoading] = useState(true); // 페이지 전체 로딩 (인증 + 데이터)
  const [isEditing, setIsEditing] = useState(false); // 수정 모드 여부
  const [editFormData, setEditFormData] = useState<Partial<League>>({}); // 수정 폼 데이터
  // 배너 이미지 파일 상태 추가
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  // 배너 이미지 업로드 로딩 상태 추가
  const [bannerUploading, setBannerUploading] = useState(false);

  // 인증 로딩 및 권한 확인 후 리다이렉트
  useEffect(() => {
    // AuthProvider 로딩 중이 아니면서 user가 없거나 관리자가 아니면 리다이렉트
    if (!authLoading && (!user || !isAdmin)) {
      console.warn(
        `User ${user?.uid} is not authorized for admin leagues page. Role: ${userData?.role}. Redirecting to home.`,
      );
      router.push("/"); // 관리자가 아니면 홈 페이지로 리다이렉트
    } else if (!authLoading && user && isAdmin) {
      // 인증 로딩이 끝났고 관리자로 확인되면 데이터 로딩 시작
      if (leagueId) {
        // leagueId가 있을 때만 데이터 로딩
        fetchLeagueData(leagueId);
      } else {
        console.error("League ID is missing in URL.");
        setPageLoading(false);
        router.push("/admin"); // 또는 다른 에러 페이지
      }
    }
    // 이펙트 재실행 조건: user, isAdmin, authLoading, leagueId 상태가 변경될 때
    // router는 useEffect의 의존성 배열에 포함시키지 않는 것이 일반적으로 권장됩니다.
  }, [user, isAdmin, authLoading, leagueId]);

  // 해당 리그 데이터 및 스케이터 목록 가져오기 (등록 데이터 형태 기반)
  const fetchLeagueData = async (id: string) => {
    setPageLoading(true); // 페이지 로딩 시작 (리그 데이터 + 스케이터 로딩)
    try {
      // 1. 리그 문서 가져오기 (기존 로직 유지)
      const leagueDocRef = doc(db, "leagues", id);
      const leagueDocSnap: DocumentSnapshot<League> = (await getDoc(
        leagueDocRef,
      )) as DocumentSnapshot<League>;

      if (leagueDocSnap.exists()) {
        const data = leagueDocSnap.data();
        const formattedLeagueData: League = {
          id: leagueDocSnap.id,
          name: data.name,
          location: data.location,
          // Firestore Timestamp를 Date 객체로 변환, 없으면 undefined
          date: toDateOrUndefined(data.date),
          createdAt: toDateOrUndefined(data.createdAt),
          bannerImageUrl: data.bannerImageUrl,
          description: data.description,
          // TODO: 필요한 다른 필드 매핑
        };

        setLeague(formattedLeagueData);
        // 수정 폼 초기값 설정 시 date는 YYYY-MM-DD 형식의 문자열로 저장
        setEditFormData({
          ...formattedLeagueData,
          date: formattedLeagueData.date
            ? (formattedLeagueData.date.toISOString().split("T")[0] as any)
            : "", // input type="date"에 맞게 string으로 변환
        });

        // 2. 해당 리그에 등록한 사용자(스케이터) 목록 가져오기 (등록 데이터 형태 기반)
        const registrationsRef = collection(db, "registrations");
        // 해당 리그 ID와 일치하는 등록 문서 쿼리
        const registrationsQuery = query(
          registrationsRef,
          where("leagueId", "==", id),
        );
        const registrationsSnapshot: QuerySnapshot<RegistrationData> =
          (await getDocs(
            registrationsQuery,
          )) as QuerySnapshot<RegistrationData>; // 타입 단언

        const registeredUserIds: string[] = [];
        const registrationDetails: {
          [userId: string]: {
            registrationId: string;
            status: "pending" | "approved" | "rejected";
            registeredAt?: Date;
          };
        } = {};

        registrationsSnapshot.forEach((regDoc) => {
          const regData = regDoc.data();
          if (regData.userId) {
            // userId 필드가 존재하는 경우만 처리
            registeredUserIds.push(regData.userId);
            registrationDetails[regData.userId] = {
              registrationId: regDoc.id,
              status: regData.status,
              registeredAt: toDateOrUndefined(regData.registeredAt),
            };
          }
        });

        const skatersList: LeagueSkater[] = [];

        if (registeredUserIds.length > 0) {
          // 3. 등록된 사용자들의 상세 정보 가져오기 ('users' 컬렉션에서)
          const usersRef = collection(db, "users");
          // userIds 배열을 사용하여 문서 가져오기
          // TODO: where('uid', 'in', ...) 쿼리는 최대 10개 ID 제한이 있습니다!
          // 등록자가 10명 이상일 경우 여러 번 쿼리하거나 배치 읽기 사용 로직 추가 필요
          const userIdsToQuery = registeredUserIds.slice(0, 10); // 최대 10개 ID 제한 예시
          const usersQuery = query(
            usersRef,
            where("uid", "in", userIdsToQuery),
          );
          const usersSnapshot: QuerySnapshot<UserData> = (await getDocs(
            usersQuery,
          )) as QuerySnapshot<UserData>; // 타입 단언

          const usersMap: { [uid: string]: UserData } = {};
          usersSnapshot.forEach((userDoc) => {
            usersMap[userDoc.id] = userDoc.data(); // UserData 타입
          });

          // 등록 정보와 사용자 정보를 결합하여 LeagueSkater 목록 생성
          registeredUserIds.forEach((userId) => {
            const userData = usersMap[userId];
            const registrationInfo = registrationDetails[userId];

            // userData와 registrationInfo 모두 존재할 때만 유효한 스케이터로 처리
            if (userData && registrationInfo) {
              // ★ 명시적으로 LeagueSkater 인터페이스 형태에 맞춰 필드 매핑
              skatersList.push({
                // --- 식별자 ---
                userId: userId, // 사용자의 UID (registeredUserIds 배열의 값)
                registrationId: registrationInfo.registrationId, // 해당 등록 문서의 ID

                // --- 등록 정보 필드 (registrationInfo에서 옴) ---
                status: registrationInfo.status, // 등록 상태
                registeredAt: registrationInfo.registeredAt, // 등록 시각 (Timestamp -> Date 변환 완료 상태)

                // --- 사용자 정보 필드 (userData에서 옴) ---
                // UserData 필드를 LeagueSkater 필드에 매핑
                name: userData.name || userData.email || "이름 미정", // users 문서의 이름 필드 사용, 없으면 이메일, 그것도 없으면 '이름 미정'
                email: userData.email,
                role: userData.role,
                profilePictureUrl: userData.profilePictureUrl,
                // dateOfBirth 필드는 Timestamp -> Date 변환 필요 (fetchLeagueData 초반에 UserData 매핑 시 이미 처리될 수도 있음)
                // UserData 정의에 Date 타입이라면 그냥 사용, Timestamp라면 여기서 다시 toDateOrUndefined 호출
                dateOfBirth: toDateOrUndefined(userData.dateOfBirth), // UserData의 dateOfBirth가 Timestamp일 경우 변환
                stance: userData.stance,
                sponsor: userData.sponsor,
                phoneNumber: userData.phoneNumber,
                otherNotes: userData.otherNotes,
                createdAt: toDateOrUndefined(userData.createdAt), // UserData의 createdAt이 Timestamp일 경우 변환

                // TODO: UserData에서 LeagueSkater에 필요한 다른 필드 매핑
              });
            } else {
              // users 문서가 없거나 해당 리그에 대한 등록 정보가 없는 경우 (데이터 불일치)
              console.warn(
                `Data mismatch for user ${userId}. User doc or registration info missing.`,
              );
              // 데이터 불일치 시 목록에 placeholder 항목 추가 (옵션)
              // 이 경우에도 LeagueSkater 인터페이스 형태를 맞춰야 합니다.
              skatersList.push({
                userId: userId, // UID는 registeredUserIds에서 가져옴
                registrationId: registrationInfo?.registrationId || "N/A", // 등록 정보 없으면 N/A
                status: registrationInfo?.status || "unknown", // 등록 상태 없으면 unknown
                name: "데이터 오류", // 이름 Placeholder
                email: userData?.email || "N/A", // 이메일 가져올 수 있다면 표시
                profilePictureUrl: userData?.profilePictureUrl, // 사진 가져올 수 있다면 표시
                // 나머지 필드는 undefined 또는 기본값으로 설정
              } as LeagueSkater); // LeagueSkater 타입으로 단언
            }
          });

          // TODO: 만약 registeredUserIds.length > 10 이라면, 남은 사용자들에 대해 추가 쿼리 실행 및 결과 병합
        }

        console.log(skatersList);

        setSkatersInLeague(skatersList);
      } else {
        // 해당 리그 문서가 없는 경우
        console.warn(`League document not found for ID: ${id}.`);
        setLeague(null);
        setEditFormData({});
        setSkatersInLeague([]);
      }
    } catch (error: unknown) {
      // 에러 타입
      console.error("리그 데이터 로딩 실패:", error);
      setLeague(null);
      setEditFormData({});
      setSkatersInLeague([]);
    } finally {
      setPageLoading(false); // 페이지 로딩 종료
    }
  };

  // 수정 폼 입력 변경 핸들러 (간단한 내용 필드 핸들링 포함)
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    // TextAreaElement 타입 추가
    const { name, value } = e.target;
    // 날짜 입력 필드의 경우 Date 객체로 변환하여 저장할 수 있습니다.
    if (name === "date") {
      setEditFormData({
        ...editFormData,
        date: value ? new Date(value) : undefined,
      }); // input value (string) -> Date 객체 또는 빈 문자열
    } else {
      setEditFormData({ ...editFormData, [name]: value });
    }
  };

  // 배너 이미지 파일 입력 변경 핸들러
  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBannerImageFile(e.target.files[0]); // 선택된 파일 상태 저장
    } else {
      setBannerImageFile(null); // 파일 선택 취소 시
    }
  };

  // 기존 배너 이미지 삭제 핸들러 (선택 사항)
  const handleDeleteBannerImage = async () => {
    if (!user || !isAdmin || !leagueId || !league?.bannerImageUrl) return;
    setPageLoading(true);
    try {
      // Storage에서 이미지 삭제 로직
      const imageRef = ref(storage, league.bannerImageUrl);
      await deleteObject(imageRef);

      // Firestore에서 이미지 URL 필드 제거 로직
      const leagueDocRef = doc(db, "leagues", leagueId);
      // import { deleteField } from 'firebase/firestore'; 필요
      // await updateDoc(leagueDocRef, { bannerImageUrl: deleteField() });

      console.log("Banner image deleted.");
      // UI 상태 업데이트 및 데이터 새로고침
      setEditFormData({ ...editFormData, bannerImageUrl: undefined }); // 폼 상태에서 이미지 URL 제거
      setLeague({ ...league, bannerImageUrl: undefined }); // 리그 상태에서도 이미지 URL 제거
      // fetchLeagueData(leagueId); // 데이터 새로고침 (필요시)
    } catch (error: unknown) {
      console.error("Failed to delete banner image:", error);
      // TODO: 에러 처리
    } finally {
      setPageLoading(false);
    }
  };

  // 리그 정보 업데이트 핸들러 (배너 이미지 업로드 로직 포함)
  const handleUpdateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin || !leagueId) return;

    setPageLoading(true); // 페이지 로딩 시작 (데이터 업데이트 중)
    // setBannerUploading(false); // 배너 업로드 로딩은 파일이 있을 때만 시작

    try {
      const leagueDocRef = doc(db, "leagues", leagueId);
      // Firestore에 업데이트할 데이터 객체 생성 (editFormData 사용)
      // id, createdAt 필드는 업데이트하지 않으므로 객체에 포함시키지 않습니다.
      const dataToUpdate: Partial<Omit<League, "id" | "createdAt">> = {
        name: editFormData.name, // 이름 필드
        description: editFormData.description, // 설명 필드
        location: editFormData.location, // 설명 필드

        // date 필드 처리: Date 객체이거나 string이면 Date 객체로 변환 후 null 또는 Timestamp 변환
        date: toDateOrUndefined(editFormData.date),

        // bannerImageUrl 필드:
        // 새로 선택된 파일이 없거나, 명시적으로 null로 설정한 경우 (이미지 삭제 시) 처리
        // bannerImageFile이 있으면 아래 업로드 로직에서 덮어씁니다.
        // editFormData.bannerImageUrl가 undefined이면 null로 저장, 아니면 값 그대로
        bannerImageUrl: editFormData?.bannerImageUrl,

        // TODO: 필요한 다른 업데이트 필드 추가 (editFormData에서 가져옴)
      };

      // ★ 배너 이미지 파일이 새로 선택된 경우 Firebase Storage에 업로드
      if (bannerImageFile) {
        setBannerUploading(true); // 배너 업로드 로딩 시작
        const storageRef = ref(
          storage,
          `league_banners/${leagueId}/${bannerImageFile.name}`,
        ); // Storage 경로 설정
        const uploadResult = await uploadBytes(storageRef, bannerImageFile); // 파일 업로드
        const imageUrl = await getDownloadURL(uploadResult.ref); // 업로드된 이미지 URL 가져오기
        dataToUpdate.bannerImageUrl = imageUrl; // 업데이트 데이터에 새로운 이미지 URL 추가
        console.log("Banner image uploaded. URL:", imageUrl);
        // setBannerUploading(false); // 업로드 후 로딩 상태는 finally에서 한 번에 처리
        // setBannerImageFile(null); // 업로드 후 파일 상태는 fetchLeagueData 이후 자연스럽게 초기화
      }
      // else if (editFormData.bannerImageUrl === null && league?.bannerImageUrl) {
      //      // 기존 이미지를 명시적으로 제거하려고 한 경우 (UI에 제거 버튼 추가 필요)
      //      // dataToUpdate.bannerImageUrl = deleteField(); // Firestore 필드 삭제
      //      // TODO: Storage에서도 해당 이미지 파일 삭제 로직 추가
      // }
      // 만약 bannerImageFile이 null이고 editFormData.bannerImageUrl에 값이 그대로 있다면, URL 변경 없음

      // null 값은 Firestore가 허용하므로 그대로 보냅니다.
      // undefined 값만 필터링하거나 제거해야 합니다.
      // editFormData에서 가져온 다른 필드 중 undefined가 있다면 문제가 될 수 있습니다.
      const finalDataToUpdate: { [key: string]: any } = {};
      Object.keys(dataToUpdate).forEach((key) => {
        const value = dataToUpdate[key as keyof typeof dataToUpdate];
        if (value !== undefined) {
          // undefined 값은 제외하고 객체 생성
          finalDataToUpdate[key] = value;
        }
      });

      await updateDoc(leagueDocRef, finalDataToUpdate); // 수정된 데이터 객체 사용

      console.log(`League ${leagueId} updated successfully.`);
      setIsEditing(false); // 수정 모드 종료
      fetchLeagueData(leagueId); // 데이터 새로고침 (업로드된 이미지 URL 반영 등)
      // TODO: 사용자에게 성공 메시지 표시 (Toast 등)
    } catch (error: unknown) {
      console.error("리그 정보 업데이트 실패:", error);
      // 에러 처리 로직 추가
      // TODO: 사용자에게 실패 메시지 표시
    } finally {
      setPageLoading(false); // 페이지 로딩 종료 (배너 업로드 로딩과 별개)
      setBannerUploading(false); // 배너 업로드 로딩 종료
    }
  };

  // TODO: 스케이터를 리그에 추가하는 함수 (검색된 스케이터를 바탕으로 registrations 문서 생성)
  // const addSkaterToLeague = async (userId: string, leagueId: string) => { ... }

  // TODO: 리그에서 스케이터를 제거하는 함수 (registrations 문서 삭제)
  // const removeRegistration = async (registrationId: string) => { ... }

  // Context 로딩 중 또는 권한 없는 사용자
  if (authLoading || !user || !isAdmin) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <TailSpin color="#00BFFF" height={80} width={80} />
        <p className="mt-4 text-gray-600">
          {authLoading ? "인증 정보 로딩 중..." : "관리자 권한 확인 중..."}
        </p>
      </div>
    );
  }

  // 페이지 데이터 로딩 중
  if (pageLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <TailSpin color="#00BFFF" height={80} width={80} />
        <p className="mt-4 text-gray-600">리그 데이터 로딩 중...</p>
      </div>
    );
  }

  // 리그 데이터가 없는 경우 (404 또는 삭제된 리그)
  if (!league) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-600">
          오류: 리그를 찾을 수 없습니다.
        </h1>
        <p className="mt-4 text-gray-600">
          요청하신 리그 정보가 없거나 삭제되었습니다.
        </p>
        <Link href="/admin" className="mt-6 text-blue-600 hover:underline">
          관리자 대시보드로 돌아가기
        </Link>
      </div>
    );
  }

  // 데이터 로딩 완료 및 관리자로 확인된 경우 UI 렌더링
  return (
    <>
      <h1 className="text-3xl font-bold mb-6">
        {isEditing ? "리그 정보 수정" : `${league.name} 리그 관리`}
      </h1>

      {/* 수정/조회 모드 전환 버튼 */}
      {!isEditing ? (
        <button
          onClick={() => setIsEditing(true)}
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mb-6"
        >
          정보 수정
        </button>
      ) : (
        <button
          onClick={() => setIsEditing(false)}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mb-6 mr-2"
        >
          수정 취소
        </button>
      )}

      {/* 리그 정보 표시 또는 수정 폼 */}
      <div className="mb-8 bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">리그 정보</h2>
        {!isEditing ? (
          // 리그 정보 표시 모드
          <div>
            {/* 배너 이미지 표시 */}
            {league.bannerImageUrl && (
              <div className="mb-4">
                <img
                  src={league.bannerImageUrl}
                  alt={`${league.name} 배너`}
                  className="mt-2 object-cover rounded"
                />
              </div>
            )}
            <p>
              <strong>이름:</strong> {league.name}
            </p>
            <p>
              <strong>날짜: </strong>
              {league.date ? league.date.toLocaleDateString() : "미지정"}
            </p>
            <p>
              <strong>장소:</strong> {league.location}
            </p>
            {/* 간단한 내용 표시 */}
            <p>
              <strong>설명:</strong> {league.description || "설명 없음"}
            </p>
            {/* TODO: 필요한 다른 정보 표시 */}
          </div>
        ) : (
          // 리그 정보 수정 폼
          <form onSubmit={handleUpdateLeague}>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="name"
              >
                리그 이름
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={editFormData.name || ""}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="date"
              >
                날짜
              </label>
              <input
                type="date"
                id="date"
                name="date"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                // Date 객체를 ISO 날짜 형식으로 변환하여 input type="date"에 설정 (string 형식)
                value={
                  editFormData.date instanceof Date
                    ? editFormData.date.toISOString().split("T")[0]
                    : editFormData.date || ""
                }
                onChange={handleInputChange}
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="name"
              >
                장소
              </label>
              <input
                type="text"
                id="location"
                name="location"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={editFormData.location}
                onChange={handleInputChange}
                required
              />
            </div>
            {/* 배너 이미지 파일 업로드 필드 */}
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="bannerImage"
              >
                배너 이미지
              </label>
              <input
                type="file"
                id="bannerImage"
                name="bannerImage"
                accept="image/*" // 이미지 파일만 허용
                onChange={handleBannerImageChange} // 파일 변경 핸들러
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              {/* 현재 이미지 미리보기 또는 선택된 새 파일 이름 표시 */}
              {(editFormData.bannerImageUrl || bannerImageFile) && (
                <div className="mt-2 text-sm text-gray-500">
                  {bannerImageFile ? (
                    <p>선택된 파일: {bannerImageFile.name}</p>
                  ) : (
                    <p>
                      현재 이미지:
                      <a
                        href={editFormData.bannerImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        보기
                      </a>
                    </p>
                  )}
                  {/* TODO: 이미지 제거 버튼 (handleDeleteBannerImage 함수와 연결) */}
                  {/* {editFormData.bannerImageUrl && !bannerImageFile && (
                                <button type="button" onClick={handleDeleteBannerImage} className="ml-2 text-red-600 hover:text-red-800">삭제</button>
                           )} */}
                </div>
              )}
              {bannerUploading && (
                <p className="text-blue-500 mt-1">업로드 중...</p>
              )}
              {/* 업로드 로딩 표시 */}
            </div>
            {/* 간단한 내용 입력 필드 */}
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="description"
              >
                간단한 내용
              </label>
              <textarea
                id="description"
                name="description"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={editFormData.description || ""}
                onChange={handleInputChange}
                rows={4} // 텍스트 에어리어 높이 설정
              />
            </div>

            {/* TODO: 필요한 다른 필드 입력 */}

            <button
              type="submit"
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4 ${bannerUploading ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={bannerUploading} // 배너 업로드 중 저장 버튼 비활성화
            >
              {bannerUploading
                ? "저장 중 (이미지 업로드)..."
                : "변경 사항 저장"}
            </button>
          </form>
        )}
      </div>

      {/* 해당 리그의 스케이터 관리 섹션 */}
      <div className="mb-8 bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">참여 스케이터 관리</h2>
        {/* TODO: 스케이터 검색 및 추가 폼 */}
        {/* <form onSubmit={handleAddSkater}> ... </form> */}
        {/* 해당 리그의 스케이터 목록 */}
        <h3 className="text-xl font-medium mb-2">
          등록된 스케이터 목록 ({skatersInLeague.length}명)
        </h3>
        {/* 스케이터 수 표시 */}
        {skatersInLeague.length === 0 ? (
          <p className="p-4 bg-gray-100 rounded">
            이 리그에 등록된 스케이터가 없습니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {skatersInLeague.map((skater) => (
              // LeagueSkater 인터페이스 및 샘플 JSON 데이터를 바탕으로 정보 표시
              // key prop은 <li>에 있어야 합니다.
              <li
                key={skater.registrationId} // 등록 문서 ID를 key로 사용
                className="flex flex-col md:flex-row md:justify-between items-start md:items-center bg-gray-100 p-4 rounded-lg shadow-sm" // 스타일 개선 (배경색, 패딩, 모서리 둥글게, 그림자, Flexbox 레이아웃)
              >
                {/* 프로필 사진 */}
                <img
                  src={skater.profilePictureUrl || "/placeholder-profile.webp"} // TODO: 기본 이미지 경로 설정 (profilePictureUrl 필드 사용)
                  alt={`${skater.name || "스케이터"} 프로필 사진`}
                  className="w-18 object-cover mr-4 flex-shrink-0" // 크기, 모양, 간격, 축소 방지
                />
                {/* 중앙: 스케이터 상세 정보 및 등록 상태 - Grid layout */}
                {/* 작은 화면에서는 1열, 중간 화면부터 2열 그리드 */}
                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700 w-full md:w-1/2 mt-4 md:mt-0">
                  {/* 이름 표시 (name 필드 사용) */}
                  <p className="font-semibold text-gray-900">
                    {skater.name || "미입력"}
                  </p>
                  {/* 생년월일 (dateOfBirth 필드 사용) */}
                  {skater.dateOfBirth instanceof Date && (
                    <p className="text-sm text-gray-600">
                      <strong>생년월일: </strong>
                      {skater.dateOfBirth.toLocaleDateString()}
                    </p>
                  )}
                  {/* 이메일 표시 (email 필드 사용) */}
                  {skater.email && (
                    <p className="text-sm text-gray-600 truncate">
                      <strong>이메일: </strong>
                      {skater.email}
                    </p>
                  )}
                  {/* 전화번호 (phoneNumber 필드 사용) */}
                  {skater.phoneNumber && (
                    <p>
                      <strong>전화번호: </strong>
                      {formatPhoneNumber(skater.phoneNumber)}
                    </p>
                  )}
                  {/* truncate 클래스 추가로 긴 이메일 처리 */}
                  {/* 스탠스 (stance 필드 사용) */}
                  {skater.stance && (
                    <p>
                      <strong>스탠스: </strong>
                      {skater.stance}
                    </p>
                  )}
                  {/* 스폰서 (sponsor 필드 사용) */}
                  {skater.sponsor && (
                    <p>
                      <strong>스폰서: </strong>
                      {skater.sponsor}
                    </p>
                  )}
                  {/* ★ 포매터 함수 사용 */}
                  {/* 등록 시각 (registeredAt 필드 사용) */}
                  {skater.registeredAt instanceof Date && (
                    <p>
                      <strong>등록 시각: </strong>
                      {skater.registeredAt.toLocaleString()}
                    </p>
                  )}
                  {/* 등록 시각 표시 */}
                  {/* 등록 상태 (status 필드 사용) */}
                  {skater.status && (
                    <p>
                      <strong>등록 상태: </strong>
                      {skater.status}
                    </p>
                  )}
                  {/* 기타 전달사항 (otherNotes 필드 사용) - 필요시 전체 너비 사용 */}
                  {skater.otherNotes && (
                    <p className="col-span-1 sm:col-span-2">
                      <strong>기타: </strong>
                      {skater.otherNotes}
                    </p>
                  )}
                  {/* col-span-2로 두 칸 차지 */}
                  {/* TODO: 스케이터 계정 생성 시각 (createdAt 필드 사용) 등 필요한 다른 정보 표시 */}
                  {/* {skater.createdAt instanceof Date && <p><strong>계정 생성:</strong> {skater.createdAt.toLocaleDateString()}</p>} */}
                </div>

                {/* 우측: 관리 버튼 - 세로 중앙 정렬을 위해 items-center */}
                <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-start md:items-center md:justify-end w-full md:w-1/4">
                  {/* 너비 설정, 상단 여백, 정렬 */}
                  {/* TODO: 해당 리그에서의 스케이터 점수 입력/수정 버튼 */}
                  {/* <button className="text-blue-600 hover:underline text-sm mb-2 md:mb-0 md:mr-2">점수 관리</button> */}
                  {/* TODO: 이 리그에서 스케이터 제거 버튼 (등록 문서 삭제) */}
                  {/* <button onClick={() => removeRegistration(skater.registrationId)} className="text-red-600 hover:underline text-sm">등록 취소</button> */}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default LeagueDetailPage;
