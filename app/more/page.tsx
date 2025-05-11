"use client";

import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/firebase/config";
import { UserData } from "@/types/firebase";
import SkaterProfileCard from "@/components/SkaterProfileCard";

const MorePage = () => {
  const [userList, setUserList] = useState<UserData[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersQuery = query(
          collection(db, "users"),
          where("role", "==", "user"),
        );
        const snapshot = await getDocs(usersQuery);
        const users = snapshot.docs.map((doc) => doc.data() as UserData);
        setUserList(users);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

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
