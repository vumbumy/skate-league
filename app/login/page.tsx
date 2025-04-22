// app/login/page.tsx
"use client";

import { useState } from 'react';
import { auth } from '@/firebase/config'; // Firebase 초기화 파일 (경로 확인 필요)
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from "next/link";
// TODO: 관리자인지 아닌지 판단하는 추가 로직 필요 (예: Firestore에서 사용자 정보 조회)

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // 에러 초기화

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // TODO: 로그인 성공 후 이 사용자가 관리자인지 확인하는 로직 추가
      // 예: Firestore 'admins' 컬렉션에서 user.uid를 찾거나, user custom claims 확인

      // 임시로 모든 로그인 사용자를 관리자로 간주하고 /admin으로 리다이렉트
      // 실제로는 여기서 관리자 여부를 판단하여 다른 페이지로 보낼 수 있습니다.
      router.push('/admin'); // 관리자는 관리자 대시보드로 이동
      // 또는 관리자가 아니면 router.push('/'); 등 다른 페이지로 이동

    } catch (err: any) {
      console.error("로그인 에러:", err);
      // Firebase Authentication 에러 코드에 따라 사용자 친화적인 메시지 표시 가능
      setError(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">로그인</h1> {/* 일반 로그인 페이지 */}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              이메일
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              로그인
            </button>
          </div>
        </form>
        {/* ★ 가입 페이지로 이동하는 링크 추가 */}
        <div className="text-center mt-4">
          <Link href="/signup" className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
            계정이 없으신가요? 가입하기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
