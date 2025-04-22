// app/admin/page.tsx
"use client"; // 클라이언트 컴포넌트임을 명시

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {auth, db} from '@/firebase/config'; // Firebase 초기화 파일 경로 (경로 확인 필요)
import {onAuthStateChanged, signOut, User} from 'firebase/auth';
import {addDoc, collection, deleteDoc, doc, getDoc, getDocs} from 'firebase/firestore';
import {TailSpin} from 'react-loader-spinner'; // 설치 필요: npm install react-loader-spinner

// AdminDashboard 컴포넌트 (실제 /admin 페이지의 내용)
const AdminDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [leagues, setLeagues] = useState<League[]>([]); // 리그 데이터 상태
  const [skaters, setSkaters] = useState<Skater[]>([]); // 스케이터 데이터 상태
  const router = useRouter();

  // 인증 상태 변화 감지 및 보호된 경로 접근 제어
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid); // ★ 사용자 정보가 저장된 컬렉션 경로 확인 ('users' 또는 다른 이름)
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          // 역할 필드가 있고 'admin'인지 확인
          if (userData && userData.role === 'admin') {
            // 관리자 권한 확인 완료
            setUser(currentUser); // user 상태는 auth user로 설정 유지
            // TODO: 필요하다면 userData도 상태로 관리
            setLoading(false);
          } else {
            // 로그인되었지만 관리자가 아닌 경우
            console.warn(`User ${currentUser.uid} is not an admin. Redirecting to home.`);
            router.push('/'); // 관리자가 아니면 홈 페이지로 리다이렉트
          }
        } else {
          // 로그인되었지만 Firestore에 사용자 문서가 없는 경우 (가입 절차 미완료 등)
          console.warn(`User document not found for UID: ${currentUser.uid}. Redirecting to home.`);
          setLoading(false);
          router.push('/'); // 문서가 없으면 홈 페이지로 리다이렉트
          // TODO: 필요시 로그아웃 시키거나 다른 페이지로 리다이렉트
        }
        // 사용자가 로그인됨
        setUser(currentUser);
        // TODO: 실제 운영 시에는 여기서 Firestore 등에서 관리자 권한 추가 확인
        fetchData(); // 로그인된 사용자라면 데이터 로딩
      } else {
        // 사용자가 로그아웃됨 또는 로그인되지 않음
        // 관리자 페이지 접근 시 로그인되지 않았다면 로그인 페이지로 리다이렉트
        router.push('/login'); // ★ 로그인 페이지 경로를 '/admin/login'으로 수정
      }
    });

    return () => unsubscribe(); // 컴포넌트 언마운트 시 구독 해제
  }, [router]); // router가 변경될 때 useEffect를 다시 실행

  // Firestore에서 데이터 가져오기
  const fetchData = async () => {
    // user 객체가 null이 아닌 경우에만 데이터를 가져옵니다.
    if (!user) return;

    try {
      console.log("Fetching data for user:", user.email); // 디버깅용 로그
      const leaguesCollection = collection(db, 'leagues');
      const leaguesSnapshot = await getDocs(leaguesCollection);
      const leaguesList: League[] = leaguesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<League, 'id'> // id 필드를 제외한 나머지 데이터를 UserData 타입으로 단언
        // Timestamp 필드를 Date 객체로 변환하는 로직 필요시 추가
        // 예: date: (doc.data().date as firebase.firestore.Timestamp)?.toDate()
      }));
      setLeagues(leaguesList);

      const skatersCollection = collection(db, 'skaters');
      const skatersSnapshot = await getDocs(skatersCollection);
      const skatersList: Skater[] = skatersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Skater, 'id'> // id 필드를 제외한 나머지 데이터를 Skater 타입으로 단언
        // TODO: 필요한 다른 필드 변환
      }));
      setSkaters(skatersList);

      // TODO: 심사 결과 등 필요한 다른 데이터도 가져오기
    } catch (error) {
      console.error("데이터 가져오기 실패:", error);
      // 에러 처리 로직 추가
    }
  };

  // 로그아웃 함수
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // 로그아웃 후 리다이렉트는 onAuthStateChanged 콜백에서 처리됩니다.
    } catch (error) {
      console.error("로그아웃 실패:", error);
      // 에러 처리 로직 추가
    }
  };

  // --- 데이터 관리 함수 예시 (Firestore) ---

  // 새 리그 추가
  const addLeague = async (leagueData: any) => {
    if (!user) { // 로그인 상태가 아니면 실행하지 않음
      console.warn("로그인되지 않은 사용자는 리그를 추가할 수 없습니다.");
      return;
    }
    try {
      const docRef = await addDoc(collection(db, 'leagues'), leagueData);
      console.log("새 리그 추가됨 with ID: ", docRef.id);
      fetchData(); // 데이터 새로고침
    } catch (e) {
      console.error("리그 추가 에러: ", e);
      // 에러 처리 로직 추가
    }
  };

  // 스케이터 정보 업데이트
  // const updateSkaters = async (skaterId: string, updatedData: any) => {
  //   if (!user) { // 로그인 상태가 아니면 실행하지 않음
  //     console.warn("로그인되지 않은 사용자는 스케이터를 업데이트할 수 없습니다.");
  //     return;
  //   }
  //   try {
  //     const skaterRef = doc(db, 'skaters', skaterId);
  //     await updateDoc(skaterRef, updatedData);
  //     console.log("스케이터 업데이트 성공:", skaterId);
  //     fetchData(); // 데이터 새로고침
  //   } catch (e) {
  //     console.error("스케이터 업데이트 에러:", e);
  //     // 에러 처리 로직 추가
  //   }
  // };

  // 리그 삭제
  const deleteLeague = async (leagueId: string) => {
    if (!user) { // 로그인 상태가 아니면 실행하지 않음
      console.warn("로그인되지 않은 사용자는 리그를 삭제할 수 없습니다.");
      return;
    }
    try {
      await deleteDoc(doc(db, 'leagues', leagueId));
      console.log("리그 삭제 성공:", leagueId);
      fetchData(); // 데이터 새로고침
    } catch (e) {
      console.error("리그 삭제 에러:", e);
      // 에러 처리 로직 추가
    }
  };


  // 로딩 중... (인증 상태 확인 또는 데이터 로딩 중)
  if (loading || !user) { // user가 없으면 로딩 중 상태로 간주하여 리다이렉트 기다림
    return (
      <div className="flex justify-center items-center min-h-screen">
        <TailSpin color="#00BFFF" height={80} width={80}/> {/* 로딩 스피너 */}
        {/* 로딩 메시지 */}
        {loading ? <p className="ml-4">인증 확인 중...</p> : <p className="ml-4">로그인 상태 확인 중...</p>}
      </div>
    );
  }

  // 인증 확인 완료 및 로그인된 사용자에게만 대시보드 UI 렌더링
  return (
    <div className='w-full p-4'>
      {/*<h1 className="text-3xl font-bold mb-6">관리자 대시보드</h1>*/}
      {/*<p>안녕하세요, {user.email}님!</p>*/}

      {/* 로그아웃 버튼 */}
      <button
        onClick={handleLogout}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mb-6"
      >
        로그아웃
      </button>

      {/* 리그 관리 섹션 */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">리그 관리</h2>
        {/* 새 리그 추가 폼 (예시) */}
        <form onSubmit={(e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const name = (form.elements.namedItem('leagueName') as HTMLInputElement).value;
          const date = (form.elements.namedItem('leagueDate') as HTMLInputElement).value;
          addLeague({name, date, createdAt: new Date()}); // 예시 데이터
          form.reset();
        }} className="mb-4 p-4 border rounded shadow">
          <div className="mb-4">
            <label htmlFor="leagueName" className="block text-gray-700 text-sm font-bold mb-2">리그 이름</label>
            <input type="text" id="leagueName" placeholder="리그 이름" required
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
          </div>
          <div className="mb-4">
            <label htmlFor="leagueDate" className="block text-gray-700 text-sm font-bold mb-2">날짜</label>
            <input type="date" id="leagueDate" required
                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
          </div>
          <button type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            리그 추가
          </button>
        </form>

        {/* 리그 목록 */}
        <h3 className="text-xl font-medium mb-2">등록된 리그</h3>
        {leagues.length === 0 ? (
          <p>등록된 리그가 없습니다.</p>
        ) : (
          <ul className="list-disc pl-5">
            {leagues.map((league) => (
              <li key={league.id} className="mb-2 flex justify-between items-center bg-white p-2 rounded shadow-sm">
                <span>
                  {league.name} ({league.date?.toLocaleDateString() || '날짜 미지정'})
                </span>
                <div>
                  {/* TODO: 리그 상세 페이지 링크 또는 수정 버튼 추가 */}
                  <button
                    onClick={() => deleteLeague(league.id)}
                    className="ml-4 text-red-600 hover:text-red-800 text-sm"
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 스케이터 관리 섹션 */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">스케이터 관리</h2>
        {/* TODO: 새 스케이터 추가 폼 */}
        {/* 스케이터 목록 */}
        <h3 className="text-xl font-medium mb-2">등록된 스케이터</h3>
        {skaters.length === 0 ? (
          <p>등록된 스케이터가 없습니다.</p>
        ) : (
          <ul className="list-disc pl-5">
            {skaters.map((skater) => (
              <li key={skater.id} className="mb-2 flex justify-between items-center bg-white p-2 rounded shadow-sm">
                <span>{skater.name}</span>
                {/* TODO: 스케이터 상세 페이지 링크 또는 수정/삭제 버튼 추가 */}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* TODO: 심사 결과 관리 섹션 */}
      {/* TODO: 전체 랭킹 조회/재계산 트리거 섹션 (Firebase Functions 호출 등) */}

    </div>
  );
};

export default AdminDashboard;
