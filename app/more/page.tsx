import {
  collection,
  getDocs,
  query,
  QuerySnapshot,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { UserData } from "@/types/firebase";
import SkaterProfileCard from "@/components/SkaterProfileCard";

const MorePage = async () => {
  const usersCollection = collection(db, "users");

  let userList: UserData[] = [];

  try {
    const usersQuery = query(usersCollection, where("role", "==", "user"));

    // Firestore에서 데이터를 가져오는 비동기 작업
    const usersSnapshot: QuerySnapshot<UserData> = (await getDocs(
      usersQuery,
    )) as QuerySnapshot<UserData>; // 타입 단언

    usersSnapshot.forEach((userDoc) => {
      userList.push(userDoc.data() as UserData);
    });
    // TODO: 데이터 로딩 상태 종료 처리
  } catch (error) {
    console.error("Error fetching users:", error);
    // TODO: 에러 상태 처리
  }

  // TODO: 상태에 저장된 사용자 데이터를 사용하여 UI 렌더링
  return (
    <div className="w-full h-full flex justify-center">
      <ul className="space-y-8 w-4/5 overflow-y-scroll">
        {userList.map((skater) => (
          <li key={skater.uid}>
            <SkaterProfileCard skater={skater} />
          </li>
        ))}
      </ul>
      <div className="fixed bottom-0 left-0 w-full z-50 text-white">
        <a
          href="/signup"
          className="flex max-w-2xl mx-auto w-full justify-center items-center bg-neutral-700 py-4 px-8"
        >
          <span className="text-2xl">선수 등록</span>
        </a>
      </div>
    </div>
  );
};

export default MorePage;
