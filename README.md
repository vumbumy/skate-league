# 스케이터 리그 관리 웹사이트

이 프로젝트는 Next.js App Router, Firebase, Tailwind CSS를 활용하여 구축된 스케이터 리그 관리 및 정보 제공 웹사이트입니다. 일반 사용자에게 리그 일정, 경기 결과 등을 제공하고, 관리자에게는 리그, 스케이터, 심사 결과 등을 관리할 수 있는 강력한 관리자 기능을 제공하는 것을 목표로 합니다.

개발 과정은 Google Gemini 모델과 함께 대화하며 진행되었습니다.

### 주요 기능 및 개발 현황

현재까지 구현되었거나 구조가 논의된 주요 기능은 다음과 같습니다.

1.  **기술 스택:** Next.js (App Router), React, Tailwind CSS, Firebase (Authentication, Firestore, Storage)를 핵심 기술 스택으로 사용합니다.
2.  **사용자 인증 (Firebase Authentication):**

- 이메일/비밀번호 기반 회원가입 (`/signup`) 및 로그인 (`/login`) 기능을 구현했습니다.
- 회원가입 시 Firebase Authentication에 사용자 계정을 생성하고, Firestore `users` 컬렉션에 사용자의 UID를 문서 ID로 하는 기본 정보 (`role: 'user'`)를 저장합니다.
- 로그인 시 Firebase Authentication으로 인증 후, Firestore `users` 문서에서 사용자의 역할(`role`) 정보를 가져와 활용합니다.

3.  **권한 관리:** Firestore `users` 문서의 `role` 필드를 사용하여 사용자의 권한 (예: `'user'`, `'admin'`)을 관리합니다.
4.  **전역 인증 상태 관리:** React Context API (`AuthProvider`, `useAuth` 훅)를 사용하여 애플리케이션 전역에서 현재 로그인된 사용자의 인증 정보 (`user`, `authLoading`), Firestore에서 로드된 사용자 데이터 (`userData`), 역할 (`role`, `isAdmin`)에 쉽게 접근할 수 있도록 했습니다.
5.  **레이아웃 및 GNB (Global Navigation Bar):**

- 최상위 레이아웃 (`app/layout.tsx`)에서 `usePathname` 및 `isMounted` 패턴을 사용하여 하이드레이션 문제를 방지합니다.
- `/login` 및 `/signup` 페이지에서는 GNB를 숨깁니다.
- 그 외 페이지에서는 경로가 `/admin`으로 시작하는 관리자 영역인 경우 관리자 전용 GNB를, 아니면 일반 GNB를 표시합니다. GNB는 상단에 고정(`position: fixed`)되며, 페이지 콘텐츠는 GNB 높이만큼 아래에 배치되고 중앙에 정렬됩니다.

6.  **관리자 대시보드 (`/admin`):**

- 관리자(`isAdmin`이 true)만 접근 가능하도록 보호되며, 미승인 사용자는 로그인 페이지로 리다이렉트됩니다.
- 간단한 리그 목록을 표시하고, 각 리그의 상세 관리 페이지로 이동하는 링크를 제공합니다.
- 관리자 대시보드에서 새로운 리그를 추가하거나 기존 리그를 삭제하는 간략한 기능을 제공합니다.
- **스케이터 목록 표시:** 해당 리그에 등록된 스케이터 목록을 Firestore `registrations` 컬렉션과 `users` 컬렉션 데이터를 결합하여 가져와 표시하는 로직을 구현했습니다. (Firestore 데이터 모델에 따라 쿼리 로직이 다르게 구현될 수 있습니다.)

7.  **리그 상세 관리 페이지 (`/admin/leagues/[leagueId]`):**

- 특정 리그의 ID를 URL에서 가져와 해당 리그의 상세 정보를 표시하고 수정하는 폼을 제공합니다.
- 리그 배너 이미지를 업로드하고 관리하는 기능 (`Firebase Storage 연동`) 및 간단한 리그 설명 내용을 입력하는 필드를 포함합니다.
- 해당 리그에 등록된 스케이터 목록을 확인하고 관리하는 UI 섹션을 포함합니다.

8.  **일반 사용자 리그 등록 페이지 (`/league/[leagueId]/register`):**

- 특정 리그 ID를 URL에서 가져와 해당 리그의 정보를 표시합니다.
- **사용자 플로우:**
  - **미로그인 사용자:** 가입 페이지 (`/signup`)로 자동 리다이렉트됩니다.
  - **로그인 사용자:**
    - Firestore `users` 문서에서 스케이터 필수 정보(이름, 생년월일 등) 보완 여부를 확인합니다.
    - **정보 미비 시:** 별도의 '스케이터 정보 보완' 페이지 (`/profile`)로 리다이렉트됩니다.
    - **정보 완료 시:** 해당 리그에 이미 등록했는지 확인합니다 (Firestore `registrations` 컬렉션 검색).
    - **기 등록 시:** "이미 등록되었습니다" 메시지 표시 및 등록 버튼 비활성화.
    - **미등록 시:** 등록 버튼 활성화 및 등록 처리 (`registrations` 컬렉션에 문서 추가).

9.  **스케이터 정보 보완 페이지 (`/profile`):**

- 로그인 상태이나 스케이터 정보가 미비한 사용자가 리다이렉트되는 페이지입니다.
- 이름, 생년월일, 스탠스, 스폰서, 전화번호, 기타 전달사항, 프로필 사진 등 스케이터 필수 정보를 입력받는 폼을 제공합니다.
- 입력받은 정보와 프로필 사진을 Firebase Storage에 업로드하고 Firestore `users` 문서에 저장합니다.
- 저장 완료 후, 원래 시도하려던 리그 등록 페이지 등으로 리다이렉트됩니다.

### 시작하기

프로젝트를 로컬 환경에서 설정하고 실행하는 방법입니다.

1.  **프로젝트 클론:**
    ```bash
    git clone [프로젝트 Git 레포지토리 URL]
    cd [프로젝트 디렉토리 이름]
    ```
2.  **종속성 설치:**
    ```bash
    npm install
    # 또는 yarn install
    # 또는 pnpm install
    ```
3.  **환경 변수 설정:**

- 프로젝트 루트 디렉토리에 `.env.local` 파일을 생성합니다.
- Firebase 프로젝트 설정에서 웹 앱의 구성 정보를 복사하여 다음 형식으로 붙여넣고 값을 채웁니다.
  ```env
  NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
  NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID # 선택 사항
  ```
- `.env.local` 파일은 Git에 커밋되지 않도록 `.gitignore`에 추가되어 있어야 합니다. (`.gitignore` 파일 확인)

4.  **Firebase 설정 및 규칙:**

- Firebase 프로젝트를 생성하고 Authentication (이메일/비밀번호), Firestore, Storage를 활성화합니다.
- Firestore 및 Storage 보안 규칙을 설정합니다. 개발 중에는 느슨한 규칙을 사용할 수 있지만, 프로덕션 배포 시에는 반드시 안전한 규칙으로 업데이트해야 합니다. (`firestore.rules`, `storage.rules` 파일 확인 및 배포)

5.  **개발 서버 실행:**
    ```bash
    npm run dev
    # 또는 yarn dev
    # 또는 pnpm dev
    ```
    브라우저에서 `http://localhost:3000`으로 접속하여 개발 환경을 확인합니다.

### 배포

이 프로젝트는 Firebase Hosting과 Firebase Functions를 사용하여 배포할 수 있습니다.

1.  Firebase CLI 설치 및 초기화 (`firebase init`).
2.  `npm run build`로 애플리케이션 빌드.
3.  `firebase deploy`로 배포.
    (자세한 내용은 Firebase 공식 문서를 참고하세요.)

### 향후 계획 (TODO)

- 리그 데이터 관리 (CRUD 기능 완성).
- 스케이터 데이터 관리 페이지 구현.
- 심사 점수 입력 기능 구현.
- 랭킹 계산 및 표시 로직 구현 (Firebase Functions 활용).
- UI/UX 개선 및 추가 디자인 적용.
- Firestore 및 Storage 보안 규칙 세분화 (프로덕션용).
- 에러 핸들링 및 사용자 피드백 (로딩, 성공/실패 메시지) 강화.

### 기여

이 프로젝트는 [프로젝트 Git 레포지토리 URL]에서 확인할 수 있습니다. 버그 보고나 기능 제안 등 기여를 환영합니다.
