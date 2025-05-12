// components/Avatar.tsx
import { Menu } from "@headlessui/react";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/config";
import Link from "next/link";
import React from "react";
import { useAuth } from "@/context/AuthContext";

interface AvatarProps {
  email: string;
  size?: number; // optional, default to 40
}

const Avatar = ({ email, size = 40 }: AvatarProps) => {
  const { isAdmin } = useAuth(); // authLoading으로 이름 변경
  const initial = email?.charAt(0).toUpperCase();

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button
        className="flex items-center justify-center rounded-full bg-black text-white border border-white font-semibold"
        style={{ width: size, height: size }}
      >
        {initial}
      </Menu.Button>

      <Menu.Items className="absolute right-0 mt-2 w-24 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
        <Menu.Item
          as="button"
          onClick={() => (window.location.href = "/profile")}
          className="w-full px-4 py-2 text-sm text-gray-700 ui-active:bg-gray-100 text-center"
        >
          내 정보
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
      </Menu.Items>
    </Menu>
  );
};

export default Avatar;
