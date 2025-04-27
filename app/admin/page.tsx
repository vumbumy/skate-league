// app/admin/page.tsx
"use client"; // 클라이언트 컴포넌트임을 명시

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// useAuth 훅은 context/AuthContext에서 가져옵니다.
import { useAuth } from '@/context/AuthContext';
// Firebase 및 Firestore 관련 함수들
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth'; // 로그아웃 함수 필요시 사용
import { auth, db } from '@/firebase/config'; // auth, db import 유지
// 로딩 스피너
import { TailSpin } from 'react-loader-spinner';
import Link from 'next/link';
import {toDateOrUndefined} from "@/lib/utils"; // 링크 이동을 위해 Link 컴포넌트 import

// 필요한 인터페이스 import 또는 정의 (types/index.ts 파일에 정의되어 있어야 합니다)
// import { League, Skater, UserData } from '@/types'; // Skater, UserData는 이 파일에서 직접 사용 안 함

// 리그 데이터 인터페이스 (types/index.ts에서 import 권장)
interface League {
  id: string; // Firestore 문서 ID
  name: string;
  date?: Date; // Firestore Timestamp는 JS Date 객체로 변환하여 사용할 수 있습니다.
  createdAt?: Date;
  // TODO: 필요한 다른 리그 필드 추가 (예: skaterCount 등 요약 정보)
}


// AdminDashboard 컴포넌트 (실제 /admin 페이지의 내용)
const AdminDashboard = () => {
  // useAuth 훅을 사용하여 전역 인증 정보 가져오기
  const { user, userData, loading: authLoading, isAdmin } = useAuth(); // authLoading으로 이름 변경
  const router = useRouter();

  // 관리자 데이터 (리그 목록만)
  const [leagues, setLeagues] = useState<League[]>([]); // League[] 타입 지정
  // 스케이터 데이터는 이 페이지에서 전체 목록을 보여주지 않으므로 상태 제거
  // const [skaters, setSkaters] = useState<Skater[]>([]);
  // 데이터 로딩 상태 추가 (fetchData 또는 데이터 변경 시)
  const [dataLoading, setDataLoading] = useState(false);

  // Context 로딩 및 권한 확인 후 리다이렉트
  useEffect(() => {
    // AuthProvider에서 로딩 중이 아니면서, 로딩 완료 후 user가 없거나 관리자가 아니면 리다이렉트
    if (!authLoading && (!user || !isAdmin)) {
      console.warn(`User ${user?.uid} is not authorized for admin page. Role: ${userData?.role}. Redirecting to home.`);
      router.push('/'); // 관리자가 아니면 홈 페이지로 리다이렉트
    }
    // user, isAdmin, authLoading 상태가 변경될 때마다 이 훅 실행
    // router는 의존성 배열에서 제거하는 것이 좋습니다.
  }, [user, isAdmin, authLoading]); // router 제거

  // user 또는 isAdmin 상태가 유효해지면 데이터 가져오기 실행 (인증 완료 후)
  useEffect(() => {
    // 인증 로딩이 끝나고 user가 있고 관리자 권한이 있을 때만 데이터 로딩
    if (!authLoading && user && isAdmin) {
      fetchData(); // 관리자 데이터 (리그 목록) 로딩 시작
    }
  }, [user, isAdmin, authLoading]); // user, isAdmin, authLoading 변경 시 실행


  // Firestore에서 관리자 데이터 가져오기 함수 (리그 목록만)
  const fetchData = async () => {
    setDataLoading(true); // 데이터 로딩 시작
    try {
      console.log("Fetching admin dashboard data for user:", user?.email);

      // 리그 목록 가져오기
      const leaguesCollection = collection(db, 'leagues');
      const leaguesSnapshot = await getDocs(leaguesCollection);
      const leaguesList: League[] = leaguesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          // Firestore Timestamp를 Date 객체로 변환, 없으면 undefined
          date: toDateOrUndefined(data.date),
          createdAt: toDateOrUndefined(data.createdAt),
          // TODO: 필요한 다른 필드 매핑
        } as League; // League 타입으로 단언
      });
      setLeagues(leaguesList);

      // 스케이터 목록은 이 페이지에서 전체를 보여주지 않으므로 가져오는 코드 제거

    } catch (error: unknown) { // 에러 타입을 unknown으로 변경
      console.error("관리자 대시보드 데이터 가져오기 실패:", error);
      // 에러 처리 로직 추가
      // TODO: 사용자에게 데이터 로딩 실패 알림
    } finally {
      setDataLoading(false); // 데이터 로딩 종료
    }
  };

  // 로그아웃 함수 (Context 또는 GNB 등에서 처리할 수도 있음)
  const handleLogout = async () => {
    try {
      await signOut(auth); // Firebase auth에서 로그아웃
      // Context 상태는 onAuthStateChanged 리스너에 의해 자동으로 업데이트됨
      // 로그아웃 후 리다이렉트는 useEffect에서 처리됨 (/ 로 이동)
    } catch (error: unknown) { // 에러 타입을 unknown으로 변경
      console.error("로그아웃 실패:", error);
      // 에러 처리 로직 추가
    }
  };

  // --- 데이터 관리 함수 예시 (Firestore) ---

  // 새 리그 추가 (대시보드에서도 간단히 추가할 수 있도록 유지)
  const addLeague = async (leagueData: Omit<League, 'id'>) => { // id는 자동 생성되므로 Omit 사용
    if (!user || !isAdmin) { // 안전장치: Context 상태로 권한 확인
      console.warn("관리자만 리그를 추가할 수 있습니다.");
      // TODO: 사용자에게 권한 없음을 알림
      return;
    }
    setDataLoading(true); // 데이터 변경 로딩 시작
    try {
      // Firestore에 저장할 데이터 객체 생성
      const dataToSave = {
        ...leagueData,
        // date 필드가 Date 객체라면 Firestore Timestamp로 변환
        date: leagueData.date ? new Date(leagueData.date) : null, // Date 객체로 변환 후 저장 또는 null
        createdAt: new Date(), // 생성 시각 추가
        // TODO: 필요한 다른 필드 추가
      };
      const docRef = await addDoc(collection(db, 'leagues'), dataToSave);
      console.log("새 리그 추가됨 with ID: ", docRef.id);
      // 성공 후 폼 초기화 또는 메시지 표시
      fetchData(); // 데이터 새로고침
    } catch (error: unknown) { // 에러 타입
      console.error("리그 추가 에러: ", error);
      // 에러 처리 로직 추가
    } finally {
      setDataLoading(false); // 데이터 변경 로딩 종료
    }
  };

  // 리그 삭제 (대시보드에서도 가능하도록 유지)
  const deleteLeague = async (leagueId: string) => {
    if (!user || !isAdmin) { // 안전장치: Context 상태로 권한 확인
      console.warn("관리자만 리그를 삭제할 수 있습니다.");
      // TODO: 사용자에게 권한 없음을 알림
      return;
    }
    setDataLoading(true); // 데이터 변경 로딩 시작
    try {
      await deleteDoc(doc(db, 'leagues', leagueId));
      console.log("리그 삭제 성공:", leagueId);
      fetchData(); // 데이터 새로고침
    } catch (error: unknown) { // 에러 타입
      console.error("리그 삭제 에러:", error);
      // 에러 처리 로직 추가
    } finally {
      setDataLoading(false); // 데이터 변경 로딩 종료
    }
  };


  // AuthProvider에서 초기 인증 로딩 중...
  if (authLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <TailSpin color="#00BFFF" height={80} width={80} />
        <p className="mt-4 text-gray-600">인증 정보 로딩 중...</p>
      </div>
    );
  }

  // user가 없거나 관리자가 아닌 경우 (useEffect에서 리다이렉트 처리됨)
  // 리다이렉트 중에는 이 컴포넌트의 실제 내용은 렌더링되지 않아야 합니다.
  if (!user || !isAdmin) {
    return null; // 리다이렉트 중이므로 아무것도 렌더링하지 않음
  }

  // 관리자로 확인된 경우 대시보드 UI 렌더링
  // 데이터 로딩 중 상태도 별도로 처리
  if (dataLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <TailSpin color="#00BFFF" height={80} width={80} />
        <p className="mt-4 text-gray-600">데이터 로딩 중...</p>
      </div>
    );
  }

  return (
    // 이전 레이아웃에서 pt-14와 flex-grow 등이 적용된 컨테이너 내부에 렌더링됩니다.
    // 이 div는 내부 패딩과 너비만 담당하도록 변경
    <div className="w-full p-4"> {/* width: full, padding: 4 */}
      <h1 className="text-3xl font-bold mb-6">관리자 대시보드</h1>
      {/* user 객체는 useAuth에서 오므로 null이 아님 */}
      <p>안녕하세요, 관리자 {user.email}님!</p>

      {/* 로그아웃 버튼 - 필요시 여기에 두거나 GNB에 배치 */}
      {/* GNB에 배치하는 것이 일관성 있을 수 있습니다 */}
      {/* <button
        onClick={handleLogout}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mb-6"
      >
        로그아웃
      </button> */}

      {/* 리그 관리 섹션 (대시보드용 간략 버전) */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">리그 목록</h2> {/* 제목 변경 */}
        {/* 새 리그 추가 폼 (간단한 추가 기능 유지) */}
        <form onSubmit={(e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const nameInput = (form.elements.namedItem('leagueName') as HTMLInputElement);
          const dateInput = (form.elements.namedItem('leagueDate') as HTMLInputElement);

          const name = nameInput.value;
          const dateValue = dateInput.value;
          const leagueDate = dateValue ? new Date(dateValue) : undefined; // date는 optional

          // addLeague 함수는 user와 isAdmin 체크를 내부에서 하거나 (수정된 함수 사용시),
          // 이 컴포넌트 자체가 관리자일 때만 렌더링되므로 바로 호출 가능.
          addLeague({ name, date: leagueDate }); // createdAt은 함수 내에서 추가

          // 폼 필드 초기화
          nameInput.value = '';
          dateInput.value = '';

        }} className="mb-4 p-4 border rounded shadow bg-white">
          <h3 className="text-xl font-medium mb-2">새 리그 추가</h3> {/* 부제목 추가 */}
          <div className="mb-4">
            <label htmlFor="leagueName" className="block text-gray-700 text-sm font-bold mb-2">리그 이름</label>
            <input type="text" id="leagueName" placeholder="리그 이름" required
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
          </div>
          <div className="mb-4">
            <label htmlFor="leagueDate" className="block text-gray-700 text-sm font-bold mb-2">날짜 (선택 사항)</label>
            <input type="date" id="leagueDate"
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
          </div>
          <button type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            리그 추가
          </button>
        </form>

        {/* 리그 목록 (간략 정보 및 링크 포함) */}
        {leagues.length === 0 && !dataLoading ? ( // 데이터 로딩 중이 아닐 때만 "없음" 메시지 표시
          <p className="p-4 bg-white rounded shadow-sm">등록된 리그가 없습니다.</p>
        ) : (
          // 데이터 로딩 중이거나 리그 목록이 있을 때 목록 또는 로딩 스피너 표시 (선택 사항)
          // 여기서는 데이터 로딩 중에는 목록 대신 로딩 스피너가 대시보드 전체에 표시됨
          // 목록 자체 로딩 스피너가 필요하면 leagues.length === 0 && dataLoading 조건 추가
          <ul className="space-y-2">
            {leagues.map((league) => (
              <li key={league.id} className="flex justify-between items-center bg-white p-3 rounded shadow-sm border">
                <span>
                  <span className="font-semibold">{league.name}</span>
                  {league.date && ` (${new Date(league.date).toLocaleDateString()})`} {/* 날짜 표시 */}
                  {/* TODO: 해당 리그의 스케이터 수 (리그 문서에 필드 추가 필요) */}
                  {/* 예: {league.skaterCount !== undefined && ` 스케이터: ${league.skaterCount}명`} */}
                </span>
                <div>
                  {/* ★ 리그 상세 관리 페이지로 이동 링크 */}
                  {/* /admin/leagues/[leagueId] 경로에 해당하는 page.tsx 컴포넌트를 만들어야 합니다. */}
                  <Link href={`/admin/leagues/${league.id}`} className="ml-4 text-blue-600 hover:text-blue-800 text-sm font-semibold">
                    관리
                  </Link>
                  {/* 리그 삭제 버튼 */}
                  <button
                    onClick={() => deleteLeague(league.id)}
                    className="ml-4 text-red-600 hover:text-red-800 text-sm font-semibold"
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 스케이터 관리 섹션 제거 (별도 페이지로 이동) */}
      {/* <div className="mb-8"> ... </div> */}

      {/* TODO: 심사 결과 요약 등 대시보드에 필요한 다른 정보 섹션 */}
      {/* TODO: 전체 랭킹 조회/재계산 트리거 섹션 */}

    </div>
  );
};

export default AdminDashboard;
