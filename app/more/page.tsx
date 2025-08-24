"use client";

import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { UserData } from "@/types/user";
import SkaterProfileCard from "@/components/SkaterProfileCard";
import { toDateOrUndefined } from "@/lib/utils";
import Link from "next/link";

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

enum AgeGroup {
  MiniGroms = "Mini Groms",
  YoungRippers = "Young Rippers",
  FuturePros = "Future Pros",
  Uncategorized = "Uncategorized",
}

const AgeGroupMap: Record<AgeGroup, string> = {
  [AgeGroup.MiniGroms]: "8-9",
  [AgeGroup.YoungRippers]: "10-11",
  [AgeGroup.FuturePros]: "12+",
  [AgeGroup.Uncategorized]: "",
};

function getAgeGroup(dateOfBirth?: Date): AgeGroup {
  if (!dateOfBirth) return AgeGroup.Uncategorized;
  const age = getAgeFromDate(dateOfBirth);
  if (age >= 8 && age <= 9) return AgeGroup.MiniGroms;
  if (age >= 10 && age <= 11) return AgeGroup.YoungRippers;
  if (age >= 12) return AgeGroup.FuturePros;
  return AgeGroup.Uncategorized;
}

const MorePage = () => {
  const [groupedUsers, setGroupedUsers] = useState<
    Record<AgeGroup, UserData[]>
  >({
    [AgeGroup.MiniGroms]: [],
    [AgeGroup.YoungRippers]: [],
    [AgeGroup.FuturePros]: [],
    [AgeGroup.Uncategorized]: [],
  });

  const [selectedGroup, setSelectedGroup] = useState<AgeGroup>(
    AgeGroup.MiniGroms,
  );

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersQuery = query(
          collection(db, "users"),
          where("role", "==", "user"),
        );
        const snapshot = await getDocs(usersQuery);

        const grouped: Record<AgeGroup, UserData[]> = {
          [AgeGroup.MiniGroms]: [],
          [AgeGroup.YoungRippers]: [],
          [AgeGroup.FuturePros]: [],
          [AgeGroup.Uncategorized]: [],
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

  return (
    <div className="w-full h-full flex flex-col">
      {/* 탭 UI */}
      <div className="relative w-full max-w-3xl mb-6">
        <div
          id="age-group-scroll"
          className="flex gap-2 overflow-x-auto scrollbar-hide"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {Object.values(AgeGroup).map((group) => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`shrink-0 px-4 py-2 text-sm font-medium rounded-full border whitespace-nowrap transition-all duration-200
          ${selectedGroup === group ? "bg-white text-black" : "bg-transparent border-white text-white"}`}
              style={{ scrollSnapAlign: "start" }}
            >
              {group}
              <br />
              {AgeGroupMap[group]}
            </button>
          ))}
        </div>
      </div>

      {/* 스케이터 목록 */}
      <div
        className="space-y-6 overflow-y-auto"
        style={{ marginBottom: "80px" }}
      >
        {groupedUsers[selectedGroup].map((skater) => (
          <SkaterProfileCard key={skater.uid} skater={skater} />
        ))}
      </div>

      {/* 고정된 선수 등록 버튼 */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-md">
        <Link
          href="/signup"
          className="inline-flex items-center justify-center w-full px-8 py-3 text-lg font-medium
           border border-white text-white bg-transparent rounded-full
           backdrop-blur-sm transition-colors
           hover:bg-white hover:text-black"
        >
          REGISTER
        </Link>
      </div>
    </div>
  );
};

export default MorePage;
