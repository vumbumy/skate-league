// components/Avatar.tsx
import { Menu } from "@headlessui/react";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/config";
import Link from "next/link";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Bars3Icon } from "@heroicons/react/24/outline"; // heroicons 사용을 위한 import

interface AvatarProps {
  size?: number; // optional, default to 40
}

const Avatar = ({ size = 40 }: AvatarProps) => {
  const { isAdmin, userData } = useAuth(); // authLoading으로 이름 변경
  // const initial = email?.charAt(0).toUpperCase();

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="hover:text-gray-300">
        <Bars3Icon className="h-6 w-6" />
      </Menu.Button>
      <Menu.Items className="absolute right-0 mt-2 w-24 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
        <Menu.Item
          as="button"
          className="w-full px-4 py-2 text-sm text-gray-700 ui-active:bg-gray-100 text-center"
        >
          <Link href="/">홈</Link>
        </Menu.Item>
        {userData ? (
          <>
            <Menu.Item
              as="button"
              className="w-full px-4 py-2 text-sm text-gray-700 ui-active:bg-gray-100 text-center"
            >
              <Link href="/profile">내 정보</Link>
            </Menu.Item>
            {isAdmin && (
              <Menu.Item
                as="button"
                className="w-full px-4 py-2 text-sm text-gray-700 ui-active:bg-gray-100 text-center"
              >
                <Link href="/admin">리그 관리</Link>
              </Menu.Item>
            )}
            <Menu.Item
              as="button"
              onClick={() => signOut(auth)}
              className="w-full px-4 py-2 text-sm text-gray-700 ui-active:bg-gray-100 text-center"
            >
              로그아웃
            </Menu.Item>
          </>
        ) : (
          <>
            <Menu.Item
              as="button"
              className="w-full px-4 py-2 text-sm text-gray-700 ui-active:bg-gray-100 text-center"
            >
              <Link href="/league">리그 일정</Link>
            </Menu.Item>
            <Menu.Item
              as="button"
              className="w-full px-4 py-2 text-sm text-gray-700 ui-active:bg-gray-100 text-center"
            >
              <Link href="/more">선수 목록</Link>
            </Menu.Item>
            <Menu.Item
              as="button"
              className="w-full px-4 py-2 text-sm text-gray-700 ui-active:bg-gray-100 text-center"
            >
              <Link href="/login">로그인</Link>
            </Menu.Item>
          </>
        )}
      </Menu.Items>
    </Menu>
  );
};

export default Avatar;
