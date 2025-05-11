// app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // useSearchParams import
import { useAuth } from "@/context/AuthContext"; // useAuth hook
import { doc, DocumentSnapshot, getDoc, updateDoc } from "firebase/firestore"; // Firestore functions
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage"; // Storage functions
import { db, storage } from "@/firebase/config"; // db, storage import
import { TailSpin } from "react-loader-spinner"; // Loading spinner
// 필요한 인터페이스 import (types/index.ts 파일에서 import)
import { UserData } from "@/types/firebase";

const CompleteProfilePage = () => {
  // useAuth hook provides user, authLoading, isAdmin, role, userData (initial load from AuthProvider)
  const { user, loading: authLoading, userData: initialUserData } = useAuth(); // initialUserData는 AuthProvider가 처음에 로드한 사용자 문서 데이터
  const router = useRouter();
  const searchParams = useSearchParams(); // URL 쿼리 파라미터 가져오기
  const redirectLeagueId = searchParams.get("redirect"); // 'redirect' 쿼리 파라미터 값 (리그 ID)

  // 페이지 상태
  const [profileData, setProfileData] = useState<Partial<UserData>>({}); // 스케이터 정보 폼 데이터
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null,
  ); // 프로필 사진 파일
  const [pageLoading, setPageLoading] = useState(true); // 페이지 전체 로딩 (인증 + 데이터 로딩)
  const [savingProfile, setSavingProfile] = useState(false); // 프로필 저장 중 로딩
  const [uploadingPicture, setUploadingPicture] = useState(false); // 프로필 사진 업로드 중 로딩
  const [error, setError] = useState<string | null>(null); // 페이지 로딩 중 또는 저장 중 에러

  // Context에 로드된 초기 데이터 외에 새로 불러온 사용자 데이터 상태
  const [fetchedUserData, setFetchedUserData] = useState<UserData | null>(null);

  // 1. 인증 상태 확인 및 비로그인 시 리다이렉트
  useEffect(() => {
    if (!authLoading) {
      // AuthProvider 로딩 완료 후
      if (!user) {
        console.warn("User not authenticated. Redirecting to login page.");
        // 스케이터 정보 보완 페이지는 로그인 상태여야 하므로 로그인 페이지로 리다이렉트
        router.push("/login"); // ★ 로그인 페이지 경로
      } else {
        // 로그인 상태이면 기존 프로필 데이터 가져오기
        fetchProfileData(user.uid);
      }
    }
    // 이펙트 재실행 조건: user, authLoading 상태 변경 시
  }, [user, authLoading]); // router 제거

  // 2. 기존 프로필 데이터 가져오기 및 폼 초기화
  const fetchProfileData = async (userId: string) => {
    setPageLoading(true); // 페이지 로딩 시작 (데이터 로딩)
    setError(null); // 에러 초기화
    try {
      const userDocRef = doc(db, "users", userId);
      const userDocSnap: DocumentSnapshot<UserData> = (await getDoc(
        userDocRef,
      )) as DocumentSnapshot<UserData>;

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setFetchedUserData(userData); // 가져온 데이터 상태에 저장
        // 폼 초기화: 가져온 데이터 또는 Context의 초기 데이터 사용 (Context 데이터가 더 최신일 수 있음)
        // AuthProvider가 항상 최신 데이터를 가져온다고 가정하고 initialUserData 사용
        setProfileData(initialUserData || userData); // Context 데이터 우선, 없으면 새로 가져온 데이터 사용
        console.log(
          "Existing user profile data loaded:",
          initialUserData || userData,
        );
      } else {
        console.warn(
          `User document not found for UID: ${userId}. Starting with empty form.`,
        );
        // 사용자 문서가 없으면 빈 폼으로 시작 (회원가입 후 바로 온 경우)
        setFetchedUserData(null);
        setProfileData({});
      }
    } catch (error: unknown) {
      console.error("Failed to fetch existing profile data:", error);
      setError("기존 프로필 정보를 불러오는데 실패했습니다.");
      // TODO: 에러 처리 및 사용자 알림
      setFetchedUserData(null); // 에러 발생해도 상태는 업데이트
      setProfileData({}); // 에러 발생해도 폼은 보이도록 빈 객체 설정
    } finally {
      setPageLoading(false); // 페이지 로딩 종료
    }
  };

  // 폼 입력 변경 핸들러
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    // 생년월일 필드는 Date 객체로 저장하거나 YYYY-MM-DD 문자열로 저장 (Firestore에 Date 객체 권장)
    if (name === "dateOfBirth") {
      // input type="date"는 value가 YYYY-MM-DD 문자열입니다.
      setProfileData({ ...profileData, [name]: value }); // YYYY-MM-DD 문자열 그대로 저장 예시
      // Firestore에 Date 객체로 저장하려면 저장 시점에 new Date(value) 변환
      // setProfileData({ ...profileData, [name]: value ? new Date(value) : undefined }); // Date 객체로 상태 저장 예시
    } else {
      setProfileData({ ...profileData, [name]: value });
    }
  };

  // 프로필 사진 파일 입력 변경 핸들러
  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePictureFile(e.target.files[0]); // 선택된 파일 상태 저장
      // 파일 선택 시 기존 이미지 미리보기 URL 초기화 (선택 사항)
      setProfileData({ ...profileData, profilePictureUrl: undefined });
    } else {
      setProfilePictureFile(null); // 파일 선택 취소 시
      // 파일 선택 취소 시 기존 이미지 URL을 다시 보여주려면 profileData.profilePictureUrl 복원 로직 필요
      setProfileData({
        ...profileData,
        profilePictureUrl: fetchedUserData?.profilePictureUrl,
      }); // 데이터 다시 불러온 initialUserData 사용 가능
    }
  };

  // 기존 프로필 사진 삭제 핸들러 (선택 사항)
  const handleDeleteProfilePicture = async () => {
    if (!user || savingProfile || uploadingPicture) return;

    const confirmDelete = confirm("기존 프로필 사진을 삭제하시겠습니까?");
    if (!confirmDelete) return;

    setSavingProfile(true); // 저장 로딩 시작 (삭제 작업도 쓰기 작업에 해당)
    setError(null);

    try {
      // Storage에서 이미지 삭제 로직 (기존 URL 사용)
      if (profileData.profilePictureUrl) {
        const imageRef = ref(storage, profileData.profilePictureUrl); // URL로부터 Storage 참조 생성
        await deleteObject(imageRef); // Storage에서 이미지 삭제
        console.log("Previous profile picture deleted from Storage.");
      }

      // Firestore에서 이미지 URL 필드 제거 로직
      const userDocRef = doc(db, "users", user.uid);
      // import { deleteField } from 'firebase/firestore'; 필요
      // await updateDoc(userDocRef, { profilePictureUrl: deleteField() });

      // 필드 삭제 대신 null로 업데이트하여 명시적으로 필드 비우기
      await updateDoc(userDocRef, { profilePictureUrl: null });
      console.log("Profile picture URL field set to null in Firestore.");

      // UI 상태 업데이트
      setProfileData({ ...profileData, profilePictureUrl: undefined }); // 폼 상태에서 이미지 URL 제거
      setProfilePictureFile(null); // 선택된 파일도 초기화
      // Context의 initialUserData도 업데이트 (Auth Context에서 다시 불러오거나 수동 업데이트)
      // useAuth() 훅의 userData 상태를 수동으로 업데이트하는 로직 추가 필요 (Context 구현에 따라 다름)

      console.log("Profile picture deleted.");
      // TODO: 사용자에게 성공 메시지 표시
    } catch (error: unknown) {
      console.error("Failed to delete profile picture:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("프로필 사진 삭제 중 알 수 없는 오류가 발생했습니다.");
      }
      // TODO: 에러 처리
    } finally {
      setSavingProfile(false); // 로딩 종료
    }
  };

  // 3. 스케이터 정보 저장 핸들러
  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    // user가 없거나 저장 중이면 실행 안 함
    if (!user || savingProfile || uploadingPicture || pageLoading) return; // 페이지 로딩 중에도 비활성화

    setSavingProfile(true); // 저장 로딩 시작
    setError(null); // 에러 초기화

    try {
      let profilePictureUrl = profileData.profilePictureUrl; // 기존 이미지 URL 또는 null

      // 프로필 사진 파일이 새로 선택된 경우 Storage에 업로드
      if (profilePictureFile) {
        setUploadingPicture(true); // 업로드 로딩 시작
        // Storage 경로 설정 (예: `profile_pictures/{user.uid}/[timestamp]_[originalFileName]`)
        const fileName = `${Date.now()}_${profilePictureFile.name}`;
        const storageRef = ref(
          storage,
          `profile_pictures/${user.uid}/${fileName}`,
        );
        const uploadResult = await uploadBytes(storageRef, profilePictureFile); // 파일 업로드
        profilePictureUrl = await getDownloadURL(uploadResult.ref); // 업로드된 이미지 URL 가져오기
        console.log("Profile picture uploaded. URL:", profilePictureUrl);
        // 기존 이미지 삭제 로직 추가 (선택 사항, 필요시 구현)
        // TODO: 기존 profileData.profilePictureUrl이 있다면 해당 Storage 파일 삭제
      } else if (profileData.profilePictureUrl === null) {
        // 기존 이미지를 명시적으로 제거한 경우 (UI에 제거 버튼을 통해 profileData.profilePictureUrl을 null로 설정)
        // 이 경우는 handleDeleteProfilePicture 함수에서 이미 처리됨.
        // 여기서는 profilePictureUrl 변수에 null이 할당된 상태일 것임.
      }
      // 만약 profilePictureFile이 null이고 profileData.profilePictureUrl에 값이 있다면, URL 변경 없음

      const userDocRef = doc(db, "users", user.uid);

      // Firestore에 저장할 데이터 객체 (기존 데이터에 덮어쓰기)
      const dataToSave: Partial<
        Omit<UserData, "uid" | "email" | "createdAt" | "role">
      > = {
        ...profileData, // 현재 폼 상태의 데이터
        profilePictureUrl: profilePictureUrl, // 업로드된 URL 또는 기존 URL 또는 null
        // uid, email, createdAt, role 필드는 사용자가 변경할 수 없으므로 업데이트 데이터에 포함하지 않음
        // Context의 initialUserData에서 가져온 값으로 덮어쓰는 것을 방지
      };

      // Firestore에 저장할 최종 데이터에서 undefined 값 제거
      const finalDataToSave: { [key: string]: any } = {};
      Object.keys(dataToSave).forEach((key) => {
        // dateOfBirth가 string일 경우 Date 객체로 변환하여 저장 (선택 사항)
        if (
          key === "dateOfBirth" &&
          typeof dataToSave[key] === "string" &&
          dataToSave[key]
        ) {
          finalDataToSave[key] = new Date(dataToSave[key] as string);
        } else {
          const value = dataToSave[key as keyof typeof dataToSave];
          if (value !== undefined) {
            // undefined 값은 제외
            finalDataToSave[key] = value;
          }
        }
      });

      await updateDoc(userDocRef, finalDataToSave); // 사용자 문서 업데이트

      console.log(`User profile ${user.uid} updated successfully.`);
      // Context의 userData 상태를 업데이트 (AuthProvider에서 다시 불러오거나 수동 업데이트)
      // useAuth() 훅의 userData 상태를 수동으로 업데이트하는 로직 추가 필요 (Context 구현에 따라 다름)

      // TODO: 사용자에게 성공 메시지 표시

      // 저장 완료 후 리다이렉트
      if (redirectLeagueId) {
        // 원래 등록하려던 리그 등록 페이지로 이동
        router.push(`/league/${redirectLeagueId}/register`);
      } else {
        // 리다이렉트 정보가 없으면 기본 페이지로 이동 (예: 마이페이지, 홈)
        router.push("/login"); // 또는 '/' 등 마이페이지 경로
      }
    } catch (error: unknown) {
      console.error("Failed to save user profile:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("프로필 정보 저장 중 알 수 없는 오류가 발생했습니다.");
      }
      // TODO: 사용자에게 실패 메시지 표시
    } finally {
      setSavingProfile(false); // 저장 로딩 종료
      setUploadingPicture(false); // 혹시 업로드 에러로 인해 finally에 도달했을 때 로딩 종료
    }
  };

  // 폼 초기값 설정을 위한 useEffect (initialUserData 로드 시)
  useEffect(() => {
    // AuthProvider에서 initialUserData 로드가 완료되고, 아직 폼 데이터가 설정되지 않았을 때
    // fetchedUserData 상태가 null이 아닐 때 (데이터 로딩이 완료되었을 때) 폼 초기화
    if (
      !authLoading &&
      user &&
      fetchedUserData !== undefined &&
      Object.keys(profileData).length === 0
    ) {
      // fetchedUserData가 null이 아니면 그 데이터로, null이면 빈 객체로 초기화
      setProfileData(fetchedUserData || {});
      console.log("Form initialized with fetchedUserData:", fetchedUserData);
    } else if (
      !authLoading &&
      user &&
      fetchedUserData === undefined &&
      Object.keys(profileData).length === 0
    ) {
      // AuthProvider 로드 완료, user 있음, fetchedUserData 상태가 아직 설정 안된 경우 (데이터 fetch 대기)
      // 이 경우는 fetchProfileData가 pageLoading을 true로 설정하며 데이터를 가져올 것입니다.
      console.log("Waiting for profile data to be fetched.");
    } else if (
      !authLoading &&
      user &&
      fetchedUserData === null &&
      Object.keys(profileData).length === 0
    ) {
      // fetchProfileData 결과 사용자 문서가 없는 경우
      console.log("No fetchedUserData found. Starting with empty form.");
      setProfileData({});
    }

    // user, authLoading, fetchedUserData 상태가 변경될 때마다 실행
  }, [user, authLoading, fetchedUserData]); // profileData는 여기서 변경하므로 의존성 배열에서 제외

  // --- UI 렌더링 ---

  // 페이지 로딩 상태에 따른 UI 표시
  if (authLoading || pageLoading || savingProfile || uploadingPicture) {
    const loadingMessage = authLoading
      ? "인증 정보 로딩 중..."
      : pageLoading
        ? "기존 프로필 정보 불러오는 중..."
        : savingProfile
          ? "프로필 정보 저장 중..."
          : uploadingPicture
            ? "프로필 사진 업로드 중..."
            : "로딩 중..."; // Fallback

    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <TailSpin color="#00BFFF" height={80} width={80} />
        <p className="mt-4 text-gray-600">{loadingMessage}</p>
      </div>
    );
  }

  // 에러 상태 처리
  // if (error) {
  //   return (
  //     <div className="flex flex-col justify-center items-center min-h-screen text-red-600">
  //       <h1 className="text-2xl font-bold">오류 발생</h1>
  //       <p className="mt-4">{error || "페이지를 불러오거나 저장하는 중 실패했습니다."}</p>
  //       {/* TODO: 에러 상세 정보 표시 또는 재시도 버튼 */}
  //       {/* <button onClick={() => {/* 재시도 로직 */}}>재시도</button> */}
  //       <Link href="/" className="mt-6 text-blue-600 hover:underline">홈으로 돌아가기</Link>
  //     </div>
  //   );
  // }

  // 로그인되지 않은 상태에서 로딩이 끝난 경우 (useEffect에서 리다이렉트됨)
  // 이 부분은 실제로 렌더링되지 않아야 합니다.
  if (!user && !authLoading) {
    return null;
  }

  // 로딩 완료 및 로그인 사용자 상태에서 폼 렌더링
  return (
    <>
      {/* TODO: 필요시 안내 메시지 */}
      {/* <p className="mb-6 text-gray-600">리그 등록을 위해 스케이터 정보를 입력해주세요.</p> */}
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md mx-auto">
        {/* 중앙 정렬 및 max-width */}
        <form onSubmit={handleSubmitProfile}>
          {/* 이름 필드 */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="name"
            >
              이름
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={profileData.name || ""}
              onChange={handleInputChange}
              required // 필수 입력 필드
              disabled={savingProfile || uploadingPicture} // 저장/업로드 중 비활성화
            />
          </div>

          {/* 생년월일 필드 */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="dateOfBirth"
            >
              생년월일
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={profileData.dateOfBirth || ""} // YYYY-MM-DD 문자열
              onChange={handleInputChange}
              required // 필수 입력 필드
              disabled={savingProfile || uploadingPicture} // 저장/업로드 중 비활성화
            />
          </div>

          {/* 스탠스 필드 */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="stance"
            >
              스탠스
            </label>
            <input
              type="text"
              id="stance"
              name="stance"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={profileData.stance || ""}
              onChange={handleInputChange}
              // required // 필수 여부는 요구사항에 따라 다름
              disabled={savingProfile || uploadingPicture} // 저장/업로드 중 비활성화
            />
          </div>

          {/* 스폰서 필드 */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="sponsor"
            >
              스폰서
            </label>
            <input
              type="text"
              id="sponsor"
              name="sponsor"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={profileData.sponsor || ""}
              onChange={handleInputChange}
              // required // 필수 여부는 요구사항에 따라 다름
              disabled={savingProfile || uploadingPicture} // 저장/업로드 중 비활성화
            />
          </div>

          {/* 전화번호 필드 */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="phoneNumber"
            >
              전화번호
            </label>
            <input
              type="tel" // 'tel' 타입 사용
              id="phoneNumber"
              name="phoneNumber"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={profileData.phoneNumber || ""}
              onChange={handleInputChange}
              // required // 필수 여부는 요구사항에 따라 다름
              disabled={savingProfile || uploadingPicture} // 저장/업로드 중 비활성화
            />
          </div>

          {/* 이메일 필드 (읽기 전용 - Auth에서 가져옴) */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="email"
            >
              이메일
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100 cursor-not-allowed"
              value={user?.email || ""} // Auth user에서 이메일 가져옴
              disabled // 수정 불가
            />
          </div>

          {/* 기타 전달사항 필드 */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="otherNotes"
            >
              기타 전달사항
            </label>
            <textarea
              id="otherNotes"
              name="otherNotes"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={profileData.otherNotes || ""}
              onChange={handleInputChange}
              rows={4}
              disabled={savingProfile || uploadingPicture} // 저장/업로드 중 비활성화
            />
          </div>

          {/* 프로필 사진 업로드 필드 */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="profilePicture"
            >
              프로필 사진
            </label>
            <input
              type="file"
              id="profilePicture"
              name="profilePicture"
              accept="image/*" // 이미지 파일만 허용
              onChange={handleProfilePictureChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              disabled={savingProfile || uploadingPicture} // 저장/업로드 중 비활성화
            />
            {/* 현재 이미지 미리보기 또는 선택된 새 파일 이름 표시 */}
            {(profileData.profilePictureUrl || profilePictureFile) && (
              <div className="mt-2 text-sm text-gray-500">
                {profilePictureFile ? (
                  <p>선택된 파일: {profilePictureFile.name}</p>
                ) : (
                  <p>
                    현재 이미지:{" "}
                    <a
                      href={profileData.profilePictureUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      보기
                    </a>
                  </p>
                )}
                {/* TODO: 이미지 제거 버튼 */}
                {/* {profileData.profilePictureUrl && !profilePictureFile && (
                                <button type="button" onClick={handleDeleteProfilePicture} className="ml-2 text-red-600 hover:text-red-800">삭제</button>
                           )} */}
              </div>
            )}
            {uploadingPicture && (
              <p className="text-blue-500 mt-1">업로드 중...</p>
            )}{" "}
            {/* 업로드 로딩 표시 */}
          </div>

          {/* 스폰서 필드 */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="instagram"
            >
              인스타
            </label>
            <input
              type="text"
              id="instagram"
              name="instagram"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={profileData.instagram || ""}
              onChange={handleInputChange}
              // required // 필수 여부는 요구사항에 따라 다름
              disabled={savingProfile || uploadingPicture} // 저장/업로드 중 비활성화
            />
          </div>

          {/* 저장 버튼 */}
          <div className="flex items-center justify-between mt-6">
            <button
              type="submit"
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full ${savingProfile || uploadingPicture || pageLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={savingProfile || uploadingPicture || pageLoading} // 저장/업로드/페이지 로딩 중 비활성화
            >
              {savingProfile
                ? "저장 중..."
                : uploadingPicture
                  ? "사진 업로드 중..."
                  : "저장하기"}
            </button>
          </div>

          {/* 에러 메시지 */}
          {error && <p className="text-red-500 text-xs italic mt-4">{error}</p>}
        </form>
        {/* TODO: 나중에 스킵하거나 취소하는 버튼 추가 */}
        {/* <div className="text-center mt-4">
               <Link href={redirectLeagueId ? `/league/${redirectLeagueId}/register` : '/'}>
                   나중에 할래요
               </Link>
           </div> */}
      </div>
    </>
  );
};

export default CompleteProfilePage;
