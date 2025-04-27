// app/league/[leagueId]/register/page.tsx
"use client"; // 클라이언트 컴포넌트임을 명시

import {useEffect, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
// useAuth 훅은 context/AuthContext에서 가져옵니다.
import {useAuth} from '@/context/AuthContext';
// Firebase 및 Firestore 관련 함수들
import {addDoc, collection, doc, DocumentSnapshot, getDoc, getDocs, query, where} from 'firebase/firestore';
import {db} from '@/firebase/config'; // db import 유지
// 로딩 스피너
import {TailSpin} from 'react-loader-spinner';
import Link from 'next/link';
import {League} from "@/types/firebase";
import {State, States} from "@/types";
import {toDateOrUndefined} from "@/lib/utils"; // 링크 이동을 위해 Link 컴포넌트 import

// 필요한 인터페이스 import (types/index.ts 파일에서 import)
// import { League, UserData } from '@/types'; // Assuming these are in '@/types'

// 리그 등록 정보 인터페이스 (Firestore 'registrations' 컬렉션에 저장될 데이터 구조)
interface RegistrationData {
  id?: string; // Firestore 문서 ID (auto-generated)
  leagueId: string; // Which league
  userId: string;   // Who registered (User UID)
  registeredAt: Date; // Registration time
  status: 'pending' | 'approved' | 'rejected'; // Registration status (admin approval needed)
  // TODO: Add additional registration form fields data if not part of UserData
  // Example: category?: string; notes?: string;
}

// --- End Interfaces ---


const LeagueRegistrationPage = () => {
  // useAuth hook provides user, authLoading, isAdmin, role, userData
  const {user, loading: authLoading, userData} = useAuth(); // userData도 가져옵니다.
  const router = useRouter();
  const params = useParams();
  const leagueId = params.leagueId as string; // [leagueId] from URL

  // 페이지 상태
  const [league, setLeague] = useState<League | null>(null); // Data for the league being registered for
  // pageLoading 상태를 세분화하여 각 단계 로딩을 표시합니다.
  const [loadingState, setLoadingState] = useState<State>(States.AUTH);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // 페이지 로딩 중 에러 메시지

  // 등록 처리 상태
  const [registrationProcessState, setRegistrationProcessState] = useState<State>(States.IDLE);
  const [registrationError, setRegistrationError] = useState<string | null>(null); // Error from registration process

  // 등록 전 확인 상태
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState<boolean>(false); // Already registered for THIS league? (true, false)
  // isProfileComplete 상태는 userData 존재 여부 및 필수 필드 확인으로 대체합니다.

  // TODO: State for additional registration form fields (e.g., category, notes)
  // const [registrationFormData, setRegistrationFormData] = useState({ category: '', notes: '' });


  // ★ Central useEffect to manage sequential checks and data loading
  useEffect(() => {
    // 1. 인증 상태 확인
    if (authLoading) {
      setLoadingState(States.AUTH); // 인증 로딩 중
      return; // 로딩 완료 대기
    }

    if (!user) {
      // User is NOT authenticated -> Redirect to signup
      console.warn("User not authenticated. Redirecting to signup page.");
      router.push('/signup');
      return; // 중단
    }

    // User IS authenticated -> Proceed with profile/registration checks
    console.log("User authenticated:", user.uid);

    // 2. 스케이터 정보 보완 여부 확인 (userData는 AuthProvider에서 이미 로드됨)
    // 필수 필드 존재 여부로 판단 (UserData 인터페이스의 name, dateOfBirth 예시)
    const isProfileComplete = !!userData?.name && !!userData?.dateOfBirth; // ★ 실제 필수 필드에 맞게 수정 (UserData가 null이면 false)
    if (!isProfileComplete) {
      // Profile is INCOMPLETE -> Redirect to complete profile page
      console.warn("Skater profile incomplete. Redirecting to complete profile page.");
      // 리다이렉트 시 원래 등록하려던 리그 ID를 쿼리 파라미터로 넘겨주면 보완 후 다시 돌아오기 용이
      router.push(`/complete-profile?redirect=${leagueId}`); // ★ 정보 보완 페이지 경로
      return; // 중단
    }

    // User is Authenticated AND Profile is Complete -> Proceed with league-specific checks
    console.log("User authenticated and profile complete. Proceeding to league checks.");

    // 3. 리그 데이터 로딩 및 해당 리그 기 등록 여부 확인
    if (!leagueId) {
      console.error("League ID is missing in URL.");
      setLoadingState(States.ERROR);
      setErrorMessage("리그 정보를 불러오는데 실패했습니다.");
      // router.push('/league'); // 잘못된 경로면 리다이렉트
      return; // 중단
    }

    // 리그 데이터가 아직 로드되지 않았거나, 기 등록 여부가 아직 확인되지 않은 경우 로딩 및 확인 시작
    if (loadingState !== States.LEAGUE && !isAlreadyRegistered) { // isAlreadyRegistered가 false인 경우 (확인 필요 상태)
      setLoadingState(States.LEAGUE); // 리그 데이터 로딩 중
      fetchLeagueData(leagueId, user.uid); // ★ 리그 데이터 로딩 및 기 등록 여부 확인 함수 호출
      return; // 로딩 완료 대기
    }

    // 모든 확인 완료 및 데이터 로드 완료
    setLoadingState(States.IDLE); // 페이지 로딩 완료


    // Dependencies for the effect
    // userData를 의존성 배열에 추가하여 AuthProvider에서 userData 로드 후 로직 실행되도록 함
  }, [user, authLoading, userData, leagueId, league, isAlreadyRegistered]); // router 제거

  // --- Functions ---

  // 해당 리그 데이터 로딩 및 사용자 기 등록 여부 확인 함수 통합
  const fetchLeagueData = async (id: string, userId: string) => {
    setLoadingState(States.LEAGUE); // 로딩 상태 설정
    try {
      // 1. 리그 문서 가져오기
      const leagueDocRef = doc(db, 'leagues', id);
      const leagueDocSnap: DocumentSnapshot<League> = await getDoc(leagueDocRef) as DocumentSnapshot<League>;

      if (!leagueDocSnap.exists()) {
        console.warn(`League document not found for ID: ${id}.`);
        setLeague(null);
        setLoadingState(States.ERROR);
        setErrorMessage("리그 정보를 불러오는데 실패했습니다.");
        // router.push('/league'); // 잘못된 리그 ID면 리다이렉트
        return; // 중단
      }

      const data = leagueDocSnap.data();
      const formattedLeagueData: League = {
        id: leagueDocSnap.id,
        name: data.name,
        date: toDateOrUndefined(data.date),
        createdAt: toDateOrUndefined(data.createdAt),
        bannerImageUrl: data.bannerImageUrl,
        description: data.description,
        // TODO: Add other fields
      };
      setLeague(formattedLeagueData);


      // 2. 해당 리그에 사용자 기 등록 여부 확인
      const registrationsRef = collection(db, 'registrations');
      const q = query(
        registrationsRef,
        where('leagueId', '==', id),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);

      setIsAlreadyRegistered(!querySnapshot.empty); // 문서가 하나라도 있으면 이미 등록된 것임
      console.log(`User ${userId} already registered for league ${id}:`, !querySnapshot.empty);


    } catch (error: unknown) {
      console.error("리그 데이터 또는 등록 여부 확인 실패:", error);
      setLeague(null); // 에러 발생 시 리그 데이터 초기화
      setIsAlreadyRegistered(false); // 에러 발생 시 등록 안 된 것으로 간주 (안전)
      setLoadingState(States.ERROR);
      setErrorMessage("데이터를 불러오는데 실패했습니다.");
    } finally {
      // 로딩 상태 종료는 각 성공/실패 경로에서 명시적으로 설정
      // setPageLoading(false); // 이제 loadingState 사용
    }
  };

  // 스케이터 정보 보완 여부 확인 함수 (useEffect에서 호출됨)
  // 이 함수는 이제 isProfileComplete 상태를 업데이트하는 대신, 필요시 리다이렉트만 수행
  // useAuth 훅의 userData를 사용하여 필수 필드 존재 여부 확인
  // const checkProfileCompleteness = (userId: string) => {
  //   // userData는 useAuth 훅에서 로드됩니다.
  //   // useAuth의 loading이 false이고 user가 있을 때 userData를 사용합니다.
  //   // 이 함수는 !authLoading && user 조건이 충족될 때만 호출됩니다.
  //
  //   // userData가 아직 로드되지 않았다면 기다립니다. (useEffect 의존성으로 처리)
  //   // if (!userData) return; // userData가 로드될 때까지 기다립니다.
  //
  //   // ★ 스케이터 정보 보완 여부 판단 로직 (TalkMedia 이미지 기반 필드 예시)
  //   // name, dateOfBirth, stance, sponsor, phoneNumber 등의 필수 필드를 확인
  //   const isComplete = userData?.name && userData?.dateOfBirth && userData?.stance && userData?.sponsor && userData?.phoneNumber; // ★ 실제 필수 필드에 맞게 수정
  //
  //   if (!isComplete) {
  //     // Profile is incomplete - Redirect to complete profile page
  //     console.warn("Skater profile incomplete. Redirecting to complete profile page.");
  //     router.push(`/complete-profile?redirect=${leagueId}`); // Pass leagueId to redirect back
  //     // 이 시점에서 컴포넌트는 리다이렉트되므로 더 이상 렌더링하지 않습니다.
  //     return false; // 정보가 미비하여 리다이렉트 수행
  //   }
  //
  //   console.log("Skater profile is complete.");
  //   return true; // 정보 보완 완료
  // };


  // 리그 등록 처리 핸들러
  const handleRegisterForLeague = async () => {
    // 모든 확인 완료 상태에서만 실행 (UI에서 버튼 비활성화로 제어)
    if (!user || !league || isAlreadyRegistered || loadingState !== States.IDLE || registrationProcessState !== States.IDLE) return;

    setRegistrationProcessState(States.SUBMITTING); // 등록 처리 상태 변경
    setRegistrationError(null); // 에러 초기화

    try {
      // Firestore 'registrations' 컬렉션에 문서 추가
      const registrationData: RegistrationData = {
        leagueId: league.id, // 현재 리그 ID
        userId: user.uid,     // 현재 로그인된 사용자 UID
        registeredAt: new Date(), // 현재 시각
        status: 'pending', // 기본 상태 (관리자 승인 필요 시)
        // TODO: 추가 등록 정보 필드 값 (예: 폼에서 가져온 스케이터 이름 등)
        // userData에서 필요한 정보 가져와 추가 가능
        // Example: skaterName: userData?.name,
      };

      const docRef = await addDoc(collection(db, 'registrations'), registrationData); // 문서 자동 ID 생성

      console.log("리그 등록 정보 Firestore 저장 성공:", docRef.id);
      setRegistrationProcessState(States.SUCCESS); // 등록 성공 상태 변경
      // 등록 성공했으니 기 등록 상태를 true로 업데이트하여 버튼 비활성화
      setIsAlreadyRegistered(true);
      // TODO: 사용자에게 등록 성공 메시지 표시 (Toast 등)
      // TODO: 등록 완료 후 페이지 이동 (선택 사항)
      // router.push('/league');

    } catch (error: unknown) {
      console.error("리그 등록 Firestore 저장 실패:", error);
      setRegistrationProcessState(States.ERROR); // 등록 실패 상태 변경
      if (error instanceof Error) {
        setRegistrationError(error.message);
      } else {
        setRegistrationError("Registration failed with an unknown error.");
      }
      // TODO: 사용자에게 등록 실패 메시지 표시
    }
  };

  // --- UI 렌더링 ---

  // 페이지 로딩 상태에 따른 UI 표시
  if (loadingState !== States.IDLE || registrationProcessState === States.SUBMITTING) { // 등록 처리 중일 때도 로딩 표시
    const loadingMessage = loadingState === States.AUTH ? '인증 정보 로딩 중...'
      : loadingState === States.PROFILE ? '프로필 정보 확인 중...'
        : loadingState === States.LEAGUE ? '리그 데이터 로딩 중...'
          : loadingState === States.REGISTRATION_CHECK ? '등록 상태 확인 중...'
            : registrationProcessState === States.SUBMITTING ? '등록 처리 중...'
              : '로딩 중...'; // Fallback

    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <TailSpin color="#00BFFF" height={80} width={80}/>
        <p className="mt-4 text-gray-600">{loadingMessage}</p>
      </div>
    );
  }

  // 로딩 완료 후 에러 상태 처리
  // if (loadingState === States.ERROR) {
  //   return (
  //     <div className="flex flex-col justify-center items-center min-h-screen text-red-600">
  //       <h1 className="text-2xl font-bold">오류 발생</h1>
  //       <p className="mt-4">{errorMessage || "페이지를 불러오는데 실패했습니다."}</p>
  //       {/* TODO: 에러 상세 정보 표시 또는 재시도 버튼 */}
  //       <Link href="/league" className="mt-6 text-blue-600 hover:underline">리그 일정 목록으로 돌아가기</Link>
  //     </div>
  //   );
  // }

  // 리그 데이터가 없는 경우 (잘못된 leagueId 또는 삭제된 리그)
  if (!league && loadingState === States.IDLE) { // 로딩 중이 아닐 때 리그 데이터가 없으면 오류
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-600">오류: 리그 정보를 찾을 수 없습니다.</h1>
        <p className="mt-4 text-gray-600">요청하신 리그 정보가 없거나 삭제되었습니다.</p>
        <Link href="/league" className="mt-6 text-blue-600 hover:underline">리그 일정 목록으로 돌아가기</Link>
      </div>
    );
  }

  // 모든 로딩 및 확인 완료 상태에서 UI 렌더링
  // user는 존재하고, isProfileComplete는 true이며, league 데이터가 있습니다.
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">
        {league?.name} 리그 등록 {/* league는 null이 아님 */}
      </h1>

      {/* 리그 정보 간략 표시 (league는 null이 아님) */}
      <div className="mb-8 bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">리그 상세 정보</h2>
        <p><strong>날짜:</strong> {league?.date ? league.date.toLocaleDateString() : '미지정'}</p>
        <p><strong>설명:</strong> {league?.description || '설명 없음'}</p>
        {league?.bannerImageUrl && (
          <div className="mt-4">
            <strong>배너 이미지:</strong>
            <img src={league.bannerImageUrl} alt={`${league.name} 배너`} className="mt-2 max-h-40 object-cover rounded"/>
          </div>
        )}
        {/* TODO: 필요한 다른 정보 표시 */}
      </div>

      {/* 등록 フォーム 또는 등록 버튼 */}
      <div className="mb-8 bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">등록 신청</h2>

        {/* TODO: 추가 등록 정보 입력 필드 (예: 참가 부문 선택 등) */}
        {/* 이 페이지에서 추가 정보를 받을 필요가 있다면 여기에 폼 필드를 추가하고 registrationData에 포함 */}
        {/* <form>
             <div className="mb-4">
                 <label>참가 부문</label>
                 <input type="text" value={registrationFormData.category} onChange={...} />
             </div>
         </form> */}


        {/* 등록 버튼 또는 상태 메시지 */}
        {isAlreadyRegistered ? ( // 이미 등록된 경우 메시지 표시
          <p className="text-yellow-600 font-semibold">이미 이 리그에 등록하셨습니다.</p>
        ) : ( // 등록되지 않은 경우 버튼 표시 또는 처리 상태 메시지 표시
          registrationProcessState === States.IDLE ? ( // 등록 처리 전 상태
              <button
                onClick={handleRegisterForLeague} // 버튼 클릭 시 등록 함수 호출
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                // 버튼은 user, league가 있고, profile complete이고, 기 등록 안됐고, 등록 처리 중이 아닐 때 활성화
                disabled={!user || !league || !(userData?.name && userData?.dateOfBirth) || isAlreadyRegistered || registrationProcessState !== States.IDLE}
              >
                리그 등록 신청
              </button>
            )
            : ( // 등록 처리 중 또는 결과 표시
              // registrationProcessState === States.SUBMITTING ? (
              //   <p className="text-blue-600">등록 처리 중...</p>
              // ) :
                registrationProcessState === States.SUCCESS ? (
                <p className="text-green-600 font-semibold">등록 신청이 완료되었습니다!</p>
              ) : ( // registrationProcessState === States.ERROR
                <p className="text-red-600">등록 중 오류가 발생했습니다: {registrationError}</p>
              )
            )
        )}
      </div>

      {/* TODO: 관련 규칙, 안내 사항 등 추가 */}

    </div>
  );
};

export default LeagueRegistrationPage;
