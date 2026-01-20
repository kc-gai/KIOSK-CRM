# Kiosk Asset Management System (CRM)

Next.js 기반의 키오스크 자산 관리 시스템입니다.

## 기능

- **대시보드**: 자산 현황, 발주 추이, 지역별 분포 차트
- **자산 관리**: 키오스크 등록/수정/삭제, CSV 일괄 등록
- **발주 관리**: 발주 생성, 출하 정보 입력, 상태 추적
- **거래처 관리**: 클라이언트/공급처/배송업체 관리
- **이동 이력**: 자산 위치 변경 이력 조회
- **매뉴얼 관리**: 운영 매뉴얼 작성 및 관리
- **사용자 관리**: 관리자/일반 사용자 권한 관리
- **다국어 지원**: 일본어/한국어

## 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **Charts**: Recharts
- **i18n**: next-intl

---

## 로컬 개발 환경 설정

### 1. 의존성 설치

```bash
cd kiosk-crm
npm install
```

### 2. 환경 변수 설정

`.env.example`을 복사하여 `.env` 파일을 생성하고 값을 설정합니다.

```bash
cp .env.example .env
```

### 3. 데이터베이스 설정 (Supabase 무료 사용)

1. [Supabase](https://supabase.com)에서 무료 계정 생성
2. 새 프로젝트 생성
3. **Settings > Database > Connection string** 에서 연결 정보 복사
4. `.env` 파일에 설정:

```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

### 4. 데이터베이스 스키마 적용

```bash
npm run db:push
```

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

### 6. 초기 관리자 계정 생성

브라우저에서 `/api/setup` 접속하면 초기 관리자 계정이 생성됩니다.
- Email: `admin@example.com`
- Password: `password123`

---

## 무료 배포 (Vercel + Supabase)

### Step 1: Supabase 설정

1. [Supabase](https://supabase.com) 가입 (GitHub 계정으로 가능)
2. "New Project" 클릭하여 프로젝트 생성
3. Region은 가까운 곳 선택 (Tokyo 추천)
4. Database Password 설정 (저장해두세요!)
5. 프로젝트 생성 후 **Settings > Database** 이동
6. Connection string 섹션에서:
   - **URI** 복사 → `DATABASE_URL`로 사용
   - **Direct connection** 복사 → `DIRECT_URL`로 사용

### Step 2: GitHub 저장소 생성

```bash
cd kiosk-crm
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/kiosk-crm.git
git push -u origin main
```

### Step 3: Vercel 배포

1. [Vercel](https://vercel.com) 가입 (GitHub 계정으로 가능)
2. "Import Project" 클릭
3. GitHub 저장소 선택
4. **Environment Variables** 설정:
   - `DATABASE_URL`: Supabase 연결 문자열 (pgbouncer)
   - `DIRECT_URL`: Supabase 직접 연결 문자열
   - `NEXTAUTH_SECRET`: 임의의 긴 문자열 (32자 이상)
   - `NEXTAUTH_URL`: Vercel에서 제공하는 도메인 (예: https://your-app.vercel.app)
5. "Deploy" 클릭

### Step 4: 데이터베이스 초기화

배포 후 Vercel 터미널에서 또는 로컬에서:

```bash
# 환경 변수를 프로덕션 DB로 설정한 후
npm run db:push
```

### Step 5: 초기 관리자 생성

배포된 URL에서 `/api/setup` 접속

---

## 환경 변수

| 변수 | 설명 |
|------|------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 (Pooler) |
| `DIRECT_URL` | PostgreSQL 직접 연결 문자열 |
| `NEXTAUTH_SECRET` | NextAuth 암호화 키 |
| `NEXTAUTH_URL` | 앱 URL (프로덕션에서는 배포된 URL) |

---

## 스크립트

```bash
npm run dev        # 개발 서버 실행
npm run build      # 프로덕션 빌드
npm run start      # 프로덕션 서버 실행
npm run db:push    # Prisma 스키마를 DB에 적용
npm run db:studio  # Prisma Studio (DB 관리 UI)
```

---

## 기본 계정

| 역할 | Email | Password |
|------|-------|----------|
| 관리자 | admin@example.com | password123 |

**주의**: 배포 후 반드시 비밀번호를 변경하세요!
