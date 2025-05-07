// app/signup/page.tsx
"use client"; // 클라이언트 컴포넌트임을 명시

import { useState } from "react";
import { auth, db } from "@/firebase/config"; // Firebase 초기화 파일 경로 (경로 확인 필요)
import { createUserWithEmailAndPassword } from "firebase/auth"; // Firebase Auth 가입 함수
import { doc, setDoc } from "firebase/firestore"; // Firestore 데이터 추가 함수
import { useRouter } from "next/navigation";
import Link from "next/link"; // Link 컴포넌트 import

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // 로딩 상태
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // 에러 초기화
    setLoading(true); // 로딩 시작

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    try {
      // Firebase Authentication으로 사용자 가입
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // Firestore에 사용자 정보 추가 (일반 권한으로)
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        createdAt: new Date(),
        role: "user", // 기본 권한: 'user'
        // TODO: 추가적인 사용자 정보 필드 (이름 등) 필요시 추가
      });

      console.log("사용자 가입 및 Firestore 저장 성공:", user.uid);

      router.push(`/complete-profile`); // ★ 정보 보완 페이지 경로

      // 가입 성공 후 리다이렉트 (예: 홈 페이지 또는 로그인 페이지)
      // router.push("/login"); // 가입 후 로그인 페이지로 이동 유도
    } catch (err: any) {
      console.error("가입 에러:", err);
      // Firebase Authentication 에러 코드에 따라 사용자 친화적인 메시지 표시 가능
      // 예: err.code === 'auth/email-already-in-use' ? '이미 사용 중인 이메일입니다.' : '가입 오류';
      setError(err.message);
    } finally {
      setLoading(false); // 로딩 종료
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">회원가입</h1>
        <form onSubmit={handleSignup}>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="email"
            >
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
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="password"
            >
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6} // Firebase Auth 최소 비밀번호 길이
            />
          </div>
          <div className="mb-6">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="confirm-password"
            >
              비밀번호 확인
            </label>
            <input
              type="password"
              id="confirm-password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={loading} // 로딩 중 버튼 비활성화
            >
              {loading ? "가입 중..." : "가입하기"}
            </button>
          </div>
        </form>
        {/* 이미 계정이 있다면 로그인 페이지로 이동하는 링크 */}
        <div className="text-center mt-4">
          <Link
            href="/login"
            className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
          >
            이미 계정이 있으신가요? 로그인
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
