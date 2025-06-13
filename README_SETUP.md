# IBPI React 애플리케이션 설정 가이드

## 환경 설정

1. **의존성 설치**
   ```bash
   cd ibpi-react
   npm install
   ```

2. **환경 변수 설정**
   `.env` 파일을 생성하고 다음 내용을 추가하세요:
   ```
   VITE_SUPABASE_URL=https://ojwknqceiqzgutyhefwc.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qd2tucWNlaXF6Z3V0eWhlZndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0ODQ3MjEsImV4cCI6MjA0NzA2MDcyMX0.HUBv8KIGgd1IH3B6Z1NhE_hP0pOqfKYhGQN5bgCBPu0
   ```

3. **개발 서버 실행**
   ```bash
   npm run dev
   ```

## 기능 체크리스트

### 구현된 기능
- ✅ 기관 로그인 (`/login`)
- ✅ 대시보드 (`/dashboard`)
- ✅ 기관 정보 표시 (기관명, 보유코드수)
- ✅ 통계 표시 (전체 검사, 완료된 검사, 진행 중, 검사 코드)
- ✅ 최근 활동 표시
- ✅ 타이머 기능
- ✅ Organization Context를 통한 상태 관리
- ✅ 로그인 후 기관 정보 자동 로드

### 누락된 기능 (구현 필요)
- ❌ 코드 생성 기능
- ❌ 코드 발송 기능 (SMS)
- ❌ 채점 기능
- ❌ 결과 보기 기능
- ❌ 단체 검사 기능
- ❌ 마이페이지 기능
- ❌ 고객 정보 관리
- ❌ 데이터 관리 기능
- ❌ 공지사항 기능
- ❌ PDF 보고서 생성

## 디버깅

개발 환경에서는 화면 우측 하단에 디버그 정보가 표시됩니다:
- 현재 로그인 상태
- 기관 정보 로드 상태
- LocalStorage 데이터

## 문제 해결

### 기관 정보가 표시되지 않는 경우
1. 브라우저 개발자 도구 콘솔에서 에러 확인
2. 디버그 정보에서 organization 데이터 확인
3. Supabase 대시보드에서 organizations 테이블 확인
4. 로그인한 이메일이 organizations 테이블에 존재하는지 확인

### 테스트 계정
기관 로그인 테스트를 위해 Supabase organizations 테이블에 다음 데이터를 추가하세요:
```sql
INSERT INTO organizations (org_number, name, email, codes_available) 
VALUES ('ORG001', '테스트 기관', 'test@example.com', 100);
```

## 다음 단계

1. 누락된 기능들을 하나씩 구현
2. 기존 HTML/JS 코드에서 로직 이식
3. React 컴포넌트로 리팩토링
4. 테스트 작성
5. 성능 최적화