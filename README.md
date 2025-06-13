# IBPI React Application

IBPI (한국대인관계균형심리검사) React 애플리케이션입니다.

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn

### 설치

1. 의존성 설치:
```bash
npm install
```

2. 환경 변수 설정:
```bash
cp .env.example .env
```

`.env` 파일을 열어 Supabase 설정을 입력하세요:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:5173 으로 접속하세요.

### SMS 프록시 서버와 함께 실행 (선택사항)

```bash
npm run dev:all
```

### 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

## 프로젝트 구조

```
src/
├── assets/          # 정적 자산
├── components/      # 재사용 가능한 컴포넌트
├── core/           # 핵심 기능 (서비스, 훅, 레이아웃)
├── data/           # 정적 데이터 (질문 목록 등)
├── modules/        # 기능별 모듈
├── pages/          # 페이지 컴포넌트
├── router/         # 라우팅 설정
├── shared/         # 공통 유틸리티
├── store/          # 상태 관리 (Zustand)
└── test/           # 테스트 파일
```

## 주요 기능

- 검사기관 관리
- 검사 코드 생성 및 발송
- 온라인 검사 진행
- 검사 채점 및 결과 확인
- PDF 보고서 생성
- 사용자 및 기관 정보 관리
- 데이터 관리 및 내보내기

## 테스트

```bash
# 모든 테스트 실행
npm test

# 테스트 커버리지 확인
npm run test:coverage

# UI 모드로 테스트 실행
npm run test:ui
```

## 기술 스택

- React 19
- Vite
- React Router v7
- Supabase
- Zustand (상태 관리)
- React Query (서버 상태 관리)
- Vitest (테스트)

## 라이선스

This project is proprietary software.# ibpitest-react
