"use client";

import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/firebase/config";
import { UserData } from "@/types/firebase";
import SkaterProfileCard from "@/components/SkaterProfileCard";
import { toDateOrUndefined } from "@/lib/utils";

// 만 나이 계산
function getAgeFromDate(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

type AgeGroup =
  | "Mini Groms"
  | "Young Rippers"
  | "Future Pros"
  | "Uncategorized";

function getAgeGroup(dateOfBirth?: Date): AgeGroup {
  if (!dateOfBirth) return "Uncategorized";
  const age = getAgeFromDate(dateOfBirth);
  if (age >= 8 && age <= 9) return "Mini Groms";
  if (age >= 10 && age <= 11) return "Young Rippers";
  if (age >= 12) return "Future Pros";
  return "Uncategorized";
}

const MorePage = () => {
  const [groupedUsers, setGroupedUsers] = useState<
    Record<AgeGroup, UserData[]>
  >({
    "Mini Groms": [],
    "Young Rippers": [],
    "Future Pros": [],
    Uncategorized: [],
  });

  const [selectedGroup, setSelectedGroup] = useState<AgeGroup>("Mini Groms");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersQuery = query(
          collection(db, "users"),
          where("role", "==", "user"),
        );
        const snapshot = await getDocs(usersQuery);

        const grouped: Record<AgeGroup, UserData[]> = {
          "Mini Groms": [],
          "Young Rippers": [],
          "Future Pros": [],
          Uncategorized: [],
        };

        snapshot.docs.forEach((doc) => {
          const user = doc.data() as UserData;
          const dob = toDateOrUndefined(user.dateOfBirth);
          const group = getAgeGroup(dob);
          grouped[group].push(user);
        });

        setGroupedUsers(grouped);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const ageGroups: AgeGroup[] = [
    "Mini Groms",
    "Young Rippers",
    "Future Pros",
    "Uncategorized",
  ];

  return (
    <div className="w-full h-full flex flex-col items-center">
      {/* 탭 UI */}
      <div className="w-4/5 flex justify-around mt-4 mb-6">
        {ageGroups.map((group) => (
          <button
            key={group}
            onClick={() => setSelectedGroup(group)}
            className={`px-4 py-2 text-sm font-medium rounded-full border transition-all duration-200
              ${selectedGroup === group ? "bg-white text-black" : "bg-transparent border-white text-white"}`}
          >
            {group}
          </button>
        ))}
      </div>

      {/* 스케이터 목록 */}
      <div className="w-4/5 space-y-12" style={{ paddingBottom: "80px" }}>
        <ul className="space-y-6">
          {groupedUsers[selectedGroup].map((skater) => (
            <li key={skater.uid}>
              <SkaterProfileCard skater={skater} />
            </li>
          ))}
        </ul>
      </div>

      {/* 고정된 선수 등록 버튼 */}
      <div className="fixed bottom-0 left-0 w-full z-50 text-white">
        <a
          href="/signup"
          className="flex max-w-2xl mx-auto w-full justify-center items-center bg-neutral-700 py-4 px-8 h-full"
        >
          <span className="text-2xl">선수 등록</span>
        </a>
      </div>
    </div>
  );
};

export default MorePage;
