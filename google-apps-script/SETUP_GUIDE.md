# Google Apps Script 설정 가이드

Google Cloud Console **없이** Analytics/Search Console 데이터를 자동으로 가져오는 방법입니다.

---

## 준비물

- Google 계정 (Analytics/Search Console 권한 보유)
- 카드 정보 **불필요**

---

## 설정 단계

### 1. Google Apps Script 프로젝트 생성

1. [script.google.com](https://script.google.com) 접속
2. **새 프로젝트** 클릭
3. 프로젝트 이름: `KAFLIX SEO Dashboard`

### 2. 코드 복사

1. `Code.gs` 파일의 내용을 삭제하고
2. [google-apps-script/Code.gs](./Code.gs) 내용 전체를 붙여넣기
3. **저장** (Ctrl+S)

### 3. 설정 값 수정

`Code.gs` 상단의 `CONFIG` 부분을 수정:

```javascript
const CONFIG = {
  // GA4 Property ID (숫자만)
  GA4_PROPERTY_ID: '여기에_실제_GA4_ID',  // 예: '123456789'

  // Search Console Site URL
  SEARCH_CONSOLE_SITE_URL: 'https://www.kaflixcloud.co.jp/',
};
```

#### GA4 Property ID 찾는 방법:
1. [analytics.google.com](https://analytics.google.com) 접속
2. 관리(⚙️) > 속성 설정
3. **속성 ID** 확인 (숫자만)

### 4. 서비스 추가 (API 활성화)

1. 좌측 메뉴에서 **서비스** 클릭 (+ 아이콘)
2. 아래 서비스 추가:
   - **Google Analytics Data API** → 추가
   - **Google Search Console API** → 추가

### 5. 테스트 실행

1. `testSearchConsole` 함수 선택
2. **실행** 버튼 클릭
3. 권한 승인 (최초 1회)
   - "검토 필요" → "고급" → "안전하지 않은 페이지로 이동"
   - 권한 허용
4. 로그에서 데이터 확인

### 6. 웹 앱으로 배포

1. **배포** > **새 배포**
2. 톱니바퀴 아이콘 > **웹 앱** 선택
3. 설정:
   - 설명: `SEO Dashboard API`
   - 다음 사용자로 실행: **나**
   - 액세스 권한: **나만** (또는 모든 사용자)
4. **배포** 클릭
5. **URL 복사** (중요!)

URL 형식: `https://script.google.com/macros/s/xxx.../exec`

### 7. Next.js에 URL 설정

1. `seo-crm/.env` 파일 열기
2. Apps Script URL 입력:

```env
GOOGLE_APPS_SCRIPT_URL="https://script.google.com/macros/s/xxx.../exec"
```

3. Next.js 서버 재시작

---

## 완료!

이제 대시보드에서 실시간 데이터가 표시됩니다.

---

## 문제 해결

### "권한이 없습니다" 에러
- Analytics/Search Console에 로그인한 계정으로 Apps Script 사용
- 서비스 추가 확인 (Google Analytics Data API, Search Console API)

### 데이터가 0으로 표시
- GA4 Property ID가 올바른지 확인
- Search Console Site URL이 정확한지 확인 (끝에 `/` 포함)

### "정의되지 않은 함수" 에러
- 서비스가 올바르게 추가되었는지 확인
- 코드가 완전히 복사되었는지 확인

---

## 보안 참고

- Apps Script URL은 **비공개로 유지**
- `.env` 파일은 Git에 커밋하지 않음 (`.gitignore`에 포함)
- 배포 시 "나만" 옵션 사용 권장
