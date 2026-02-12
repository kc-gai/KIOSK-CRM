# Claude Code 작업 규칙

> 상위 설정 상속: `D:\99_개인\website\.claude\` 참조

## 빌드 체크 (필수!)
커밋 전 항상 실행:
```bash
npx next build
```

## 테스트 계정
- ID: test
- Password: admin1234

---

## 프로젝트 개요
- **프로젝트명**: Kiosk Asset CRM
- **기술 스택**: Next.js 16 + React 19 + TypeScript, SQLite + Prisma, Tabler UI (CDN), next-intl (ko/ja)
- **목적**: AntiGravity 키오스크 자산 관리 시스템

## Orders/Reports 시스템

### 📋 Orders (작업 요청서)
- 위치: `Orders/` 폴더
- 형식: JSON 파일
- 네이밍: `order_YYYYMMDD_HHmm_[task-name].json`

**Order 파일 구조:**
```json
{
  "order_id": "ORD-20241218-001",
  "created_at": "2024-12-18T14:30:00",
  "task_name": "작업명",
  "priority": "high|medium|low",
  "instructions": [
    "구체적인 지시사항 1",
    "구체적인 지시사항 2"
  ],
  "expected_files": [
    "예상 생성/수정 파일 경로"
  ],
  "dependencies": [
    "선행 작업 ID (있는 경우)"
  ],
  "notes": "추가 참고사항"
}
```

### 📊 Reports (작업 결과 보고서)
- 위치: `Reports/` 폴더
- 형식: JSON 파일
- 네이밍: `report_YYYYMMDD_HHmm_[task-name].json`

**Report 파일 구조:**
```json
{
  "report_id": "RPT-20241218-001",
  "order_id": "ORD-20241218-001",
  "created_at": "2024-12-18T15:00:00",
  "status": "completed|in_progress|blocked",
  "task_summary": "작업 요약",
  "completed_tasks": [
    "완료된 작업 1",
    "완료된 작업 2"
  ],
  "created_files": [
    "생성된 파일 경로"
  ],
  "modified_files": [
    "수정된 파일 경로"
  ],
  "test_results": {
    "passed": true,
    "notes": "테스트 관련 메모"
  },
  "next_steps": [
    "다음에 해야 할 작업"
  ],
  "blockers": [
    "작업 중 발생한 이슈 (있는 경우)"
  ],
  "context_for_next_session": "다음 세션에서 알아야 할 컨텍스트"
}
```

## 작업 규칙

### 새 세션 시작 시 (필수!)
1. `Reports/` 폴더의 최신 Report 파일 확인
2. 미완료 작업이나 next_steps 확인
3. 사용자에게 "이전 세션에서 [작업내용] 작업이 진행 중이었습니다. 이어서 진행할까요?" 제안
4. 컨텍스트 파악 후 작업 이어서 진행

### 작업 요청 받았을 때
1. `Orders/` 폴더에 Order JSON 있는지 확인
2. Order가 있으면 해당 내용대로 작업 진행
3. Order가 없으면 사용자 요청에 따라 작업

### 작업 완료 시 (필수!)
1. `Reports/` 폴더에 Report JSON 저장
2. 생성/수정한 파일 목록 기록
3. 다음 작업 사항 기록
4. 세션 이어갈 수 있도록 컨텍스트 기록
5. 사용자에게 작업 결과 요약 보고

## 코딩 컨벤션

### 파일 구조
```
kiosk-crm/
├── app/
│   ├── api/           # API 라우트
│   ├── dashboard/     # 대시보드 페이지들
│   └── layout.tsx     # 루트 레이아웃
├── components/        # 공용 컴포넌트
├── lib/              # 유틸리티 (prisma 등)
├── messages/         # i18n (ko.json, ja.json)
├── prisma/           # 스키마
├── Orders/           # 작업 요청서
└── Reports/          # 작업 결과 보고서
```

### 스타일링
- Tabler UI 클래스 사용 (Bootstrap 기반)
- 테이블: `table table-vcenter card-table table-sm`
- 버튼: `btn btn-sm`, `btn-primary`, `btn-outline-secondary`
- 뱃지: 어두운 배경 → `text-white`, 밝은 배경 → `text-dark`
- 폼: `form-control-sm`, `form-select-sm`

### API 패턴
- GET: 목록 조회 (include 관계 포함)
- POST: 생성
- PUT: 수정 (params는 Promise로 await)
- DELETE: 삭제

### 번역
- `useTranslations('namespace')` 사용
- ko.json, ja.json 양쪽에 키 추가

## 현재 구현된 주요 기능

### 데이터 모델
- User, Partner, Kiosk, Order, Delivery, KioskSale
- Region, Area (관할지역/사무실)
- FC, Corporation, Branch (FC > 법인 > 지점 구조) - **code 필드로 고유 식별**
- Process, Manual, Notification 등

### 코드 체계 (2024-12-24 추가)
```
FC 코드:     SKY, NPR, TYT (대문자 3자리)
법인 코드:   SKY-KYU, SKY-SHK, GRW (FC코드-지역약어)
지점 코드:   SKY-KYU-FKA, GRW-FCR (법인코드-지점약어)
```
- 한국어/일본어 이름이 달라도 같은 코드면 같은 엔티티
- 독립법인: FC 없이 법인 등록 가능 (fcId = null)

### 페이지
- `/dashboard` - 대시보드
- `/dashboard/ai-search` - AI 검색 (통합 검색)
- `/dashboard/assets` - 자산 관리
- `/dashboard/orders` - 발주 관리
- `/dashboard/deliveries` - 납품 현황
- `/dashboard/sales` - 판매 현황
- `/dashboard/partners` - 거래처 관리
- `/dashboard/clients` - **법인/지점 관리 (코드 기반)**
- `/dashboard/fc` - FC 관리
- `/dashboard/regions` - 관할지역/사무실 관리
- `/dashboard/accounts` - 계정 관리
- `/dashboard/manuals` - 매뉴얼
- `/dashboard/processes` - 프로세스 관리
- `/dashboard/history` - 이동 이력
- `/dashboard/dev-tasks` - **개발 작업 관리 (체크리스트)**

### 특수 기능
- 주소 기반 Region/Area 자동 매핑 (`/api/areas/match`)
- AI 통합 검색 (`/api/ai-search`) - 키오스크, 거래처, FC, 법인, 지점, 납품, 지역 검색
- CSV 가져오기/내보내기
- 다국어 지원 (한국어/일본어)
- 독립법인 지원 (`/api/corporations?independent=true`)

## 개발 진척 현황 (자동 업데이트)

| 영역 | 진척도 | 최근 변경 |
|------|--------|-----------|
| 거래처/지점 관리 | 80% | 코드 기반 관리 구현 완료 |
| 발주 프로세스 | 60% | UI 완료, 워크플로우 진행중 |
| 납품 프로세스 | 50% | UI 완료, ERP 연동 필요 |
| API 연동 | 30% | Google Calendar 구조만 |
| 다국어 지원 | 95% | 대부분 완료 |

### 다음 우선순위 작업
1. CSV 일괄 등록 - 코드 형식 지원
2. Google Calendar 연동 완성
3. 발주 프로세스 PDF 생성
