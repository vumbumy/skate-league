// app/league/page.tsx
"use client"; // 클라이언트 컴포넌트임을 명시

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {collection, getDocs} from 'firebase/firestore'; // Firestore 데이터 가져오기 함수
import {db} from '@/firebase/config'; // db import
import {TailSpin} from 'react-loader-spinner';
import {League} from "@/types/firebase";
import {toDateOrUndefined} from "@/lib/utils"; // 로딩 스피너

const LeagueSchedulePage = () => {
  const [leagues, setLeagues] = useState<League[]>([]); // 리그 데이터 상태
  const [loading, setLoading] = useState(true); // 데이터 로딩 상태
  const [error, setError] = useState<string | null>(null); // 에러 상태

  // 컴포넌트 마운트 시 리그 목록 가져오기
  useEffect(() => {
    const fetchLeagues = async () => {
      setLoading(true);
      setError(null);
      try {
        const leaguesCollection = collection(db, 'leagues');
        const leaguesSnapshot = await getDocs(leaguesCollection);
        const leaguesList: League[] = leaguesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            location: data.location,
            date: toDateOrUndefined(data.date),
            bannerImageUrl: data.bannerImageUrl, // 배너 이미지 URL 로딩
            // TODO: 필요한 다른 필드 매핑
          } as League;
        });
        setLeagues(leaguesList);
      } catch (err: unknown) { // 에러 타입
        console.error("Failed to fetch leagues:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("리그 목록을 불러오는데 실패했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLeagues();
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // --- UI 렌더링 ---

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <TailSpin color="#00BFFF" height={80} width={80}/>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-600">
        오류: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">리그 일정</h1>

      {leagues.length === 0 ? (
        <p className="p-4 bg-white rounded shadow">등록된 리그 일정이 없습니다.</p>
      ) : (
        <ul className="space-y-6"> {/* 리그 항목 간 간격 추가 */}
          {leagues.map((league) => (
            <li key={league.id} className="bg-white p-6 rounded-lg shadow-md">
              {/* 배너 이미지 (있을 경우) */}
              {league.bannerImageUrl && (
                <div className="mb-4">
                  <img src={league.bannerImageUrl} alt={`${league.name} 배너`}
                       className="w-full h-48 object-cover rounded-md"/> {/* 적절한 크기/스타일 적용 */}
                </div>
              )}
              <h2 className="text-2xl font-semibold mb-2">{league.name}</h2>
              <p className="text-gray-600 ">날짜: {league.date ? league.date.toLocaleDateString() : '미정'}</p>
              <p className="text-gray-600 mb-4">장소: {league.location || '미정'}</p>
              {/* TODO: 리그 장소, 설명 등 추가 정보 표시 */}
              {/* <p>{league.description}</p> */}


              {/* ★ 등록 페이지로 이동하는 링크 추가 */}
              {/* /league/[leagueId]/register 경로로 이동 */}
              <Link href={`/league/${league.id}/register`}
                    className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4">
                등록 신청
              </Link>

              {/* TODO: 리그 상세 정보만 보여주는 페이지로 이동하는 링크도 추가 가능 */}
              {/* <Link href={`/league/${league.id}`} className="inline-block bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mt-4 ml-2">
                 자세히 보기
              </Link> */}

            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LeagueSchedulePage;
