// context/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config'; // Firebase 초기화 파일 경로 (경로 확인 필요)
import { TailSpin } from 'react-loader-spinner'; // 로딩 스피너 (설치 필요)

interface AuthContextType {
  user: User | null;
  role: string | null; // Firestore에서 가져온 사용자 역할 ('user', 'admin' 등)
  loading: boolean; // 초기 인증 상태 확인 중인지 여부
  isAdmin: boolean; // 관리자 여부 편의 속성
}

// Context 생성 (기본값은 초기 상태)
const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  isAdmin: false,
});

interface AuthProviderProps {
  children: ReactNode;
}

// Context Provider 컴포넌트
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase 인증 상태 변화 감지 구독
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // 사용자가 로그인됨
        setUser(currentUser);

        // Firestore에서 사용자 역할(role) 확인
        try {
          const userDocRef = doc(db, 'users', currentUser.uid); // ★ 사용자 정보가 저장된 컬렉션 경로 확인 ('users' 또는 다른 이름)
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setRole(userData?.role || null); // 역할 필드가 없으면 null
          } else {
            // Firestore에 사용자 문서가 없는 경우 (가입 절차 미완료 등)
            console.warn(`User document not found for UID: ${currentUser.uid}`);
            setRole(null); // 역할 없으면 null
          }
        } catch (error) {
          console.error("Firestore에서 사용자 역할 확인 실패:", error);
          setRole(null); // 에러 발생 시 역할 null
        } finally {
          setLoading(false); // 역할 확인까지 완료 후 로딩 종료
        }

      } else {
        // 사용자가 로그아웃됨 또는 로그인되지 않음
        setUser(null);
        setRole(null);
        setLoading(false); // 로딩 종료
      }
    });

    // 컴포넌트 언마운트 시 구독 해제
    return () => unsubscribe();
  }, []); // 빈 배열: 컴포넌트가 마운트될 때 딱 한 번만 실행

  // isAdmin 편의 속성 계산
  const isAdmin = role === 'admin';

  // Context 값
  const contextValue: AuthContextType = {
    user,
    role,
    loading,
    isAdmin,
  };

  // 로딩 중일 때 로딩 스피너 표시 (옵션)
  // 레이아웃에서 Provider를 감쌀 것이므로, 레이아웃 로딩 상태를 여기서 처리해도 됩니다.
  // 또는 Provider를 사용하는 페이지/컴포넌트에서 contextValue.loading을 보고 처리할 수도 있습니다.
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <TailSpin color="#00BFFF" height={80} width={80} />
        <p className="mt-4 text-gray-600">인증 정보 로딩 중...</p>
      </div>
    );
  }


  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Context를 쉽게 사용하기 위한 커스텀 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Provider 내부에서 사용되지 않으면 에러 발생
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
