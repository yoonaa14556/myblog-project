# MyBlog - 블로그 프로젝트

React + Vite + TypeScript + Tailwind CSS + Supabase로 만든 블로그 애플리케이션입니다.

## 기능

- ✅ 사용자 인증 (회원가입, 로그인, 로그아웃)
- ✅ 게시글 작성, 읽기, 수정, 삭제 (CRUD)
- ✅ 반응형 네비게이션 바
- ✅ 사용자 프로필 페이지
- ✅ Supabase Row Level Security (RLS) 적용
- ✅ **마이페이지 탭 메뉴** (작성한 글 / 좋아요한 글)
- ✅ **카드 형식 글 목록** (제목, 날짜, 조회수, 좋아요, 댓글 수)
- ✅ **정렬 기능** (최신순, 인기순, 조회수순)
- ✅ **필터 기능** (전체, 공개, 비공개)
- ✅ **호버 시 수정/삭제 버튼**
- ✅ **공개/비공개 상태 표시**

## 페이지 구조

- `/` - 메인 페이지 (게시글 목록)
- `/post/:id` - 게시글 상세 페이지
- `/write` - 글쓰기 페이지
- `/login` - 로그인 페이지
- `/signup` - 회원가입 페이지
- `/mypage` - 마이 페이지 (프로필 정보, 작성한 글, 좋아요한 글)

## 마이페이지 기능

### 📝 작성한 글 탭
- 카드 형식으로 나열
- 각 카드에 제목, 작성 날짜, 조회수, 좋아요, 댓글 수 표시
- 공개/비공개 상태 표시
- 마우스 호버 시 "수정", "삭제" 버튼 표시
- 정렬: 최신순, 인기순, 조회수순
- 필터: 전체, 공개, 비공개

### ❤️ 좋아요한 글 탭
- 내가 좋아요한 글 목록
- 정렬 기능 지원
- 클릭 시 해당 글로 이동

## 기술 스택

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (인증, 데이터베이스)
- **Routing**: React Router v6
- **UI Components**: Radix UI

## 환경 설정

`.env` 파일에 다음 환경 변수가 설정되어 있습니다:

```env
VITE_SUPABASE_URL=https://eebuuiisaszcayfioccm.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 데이터베이스 구조

### posts 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | 기본 키 |
| title | TEXT | 게시글 제목 |
| content | TEXT | 게시글 내용 |
| author_id | UUID | 작성자 ID (auth.users 참조) |
| created_at | TIMESTAMPTZ | 생성 일시 |
| updated_at | TIMESTAMPTZ | 수정 일시 |

### RLS (Row Level Security) 정책

- 모든 사용자: 게시글 읽기 가능
- 로그인한 사용자: 게시글 작성 가능
- 작성자만: 자신의 게시글 수정/삭제 가능

## 개발 서버 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173/`을 열어주세요.

## 빌드

```bash
npm run build
```

## 주요 디렉토리 구조

```
src/
├── components/
│   ├── Navbar.tsx          # 네비게이션 바
│   └── ui/                 # Radix UI 컴포넌트
├── contexts/
│   └── AuthContext.tsx     # 인증 컨텍스트
├── lib/
│   └── supabase.ts         # Supabase 클라이언트
├── pages/
│   ├── MainPage.tsx        # 메인 페이지
│   ├── DetailPage.tsx      # 상세 페이지
│   ├── WritePage.tsx       # 글쓰기 페이지
│   ├── LoginPage.tsx       # 로그인 페이지
│   ├── SignupPage.tsx      # 회원가입 페이지
│   └── MyPage.tsx          # 마이 페이지
├── App.tsx                 # 라우팅 설정
└── main.tsx               # 엔트리 포인트
```

## 시작하기

1. Supabase 계정 생성 및 프로젝트 생성
2. `.env` 파일에 Supabase URL과 키 설정
3. `npm install` 실행
4. `npm run dev` 실행
5. 회원가입 후 로그인하여 게시글 작성!
