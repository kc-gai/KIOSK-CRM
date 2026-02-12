/**
 * KAFLIX CLOUD SEO Dashboard - Google Apps Script
 *
 * 이 스크립트는 Google Analytics 4와 Search Console 데이터를 가져와
 * JSON 형태로 반환합니다.
 *
 * 설정 방법:
 * 1. script.google.com 에서 새 프로젝트 생성
 * 2. 이 코드를 붙여넣기
 * 3. 서비스 추가: Google Analytics Data API
 * 4. 배포 > 새 배포 > 웹 앱으로 배포
 */

// ==================== 설정 ====================
const CONFIG = {
  // GA4 Property ID (숫자만)
  GA4_PROPERTY_ID: '403809122',

  // Search Console Site URL
  SEARCH_CONSOLE_SITE_URL: 'https://www.kaflixcloud.co.jp/',
};

// ==================== 웹 앱 엔드포인트 ====================

/**
 * GET 요청 처리 - 웹 앱으로 배포 시 이 함수가 호출됨
 */
function doGet(e) {
  try {
    const params = e ? e.parameter : {};
    const action = params.action || 'all';
    const period = params.period || '3m';
    const startDate = params.startDate;
    const endDate = params.endDate;

    let result;

    // 날짜 범위 계산
    const dateRange = startDate && endDate
      ? calculateCustomDateRange(startDate, endDate)
      : calculateDateRange(period);

    switch (action) {
      case 'gsc':
        result = { gsc: getSearchConsoleData(dateRange) };
        break;
      case 'ga4':
        result = { ga4: getGA4Data(dateRange) };
        break;
      case 'all':
      default:
        result = getAllData(dateRange);
        break;
    }

    return createJsonResponse({
      success: true,
      timestamp: new Date().toISOString(),
      period: dateRange,
      data: result
    });

  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * POST 요청도 동일하게 처리
 */
function doPost(e) {
  return doGet(e);
}

// ==================== Search Console API (OAuth 방식) ====================

/**
 * Search Console 데이터 가져오기
 */
function getSearchConsoleData(dateRange) {
  // 현재 기간 데이터
  const currentData = querySearchConsole(dateRange.startDate, dateRange.endDate);

  // 이전 기간 데이터
  const previousData = querySearchConsole(dateRange.prevStartDate, dateRange.prevEndDate);

  return {
    impressions: currentData.impressions,
    impressionsTrend: calculateTrend(currentData.impressions, previousData.impressions),
    clicks: currentData.clicks,
    clicksTrend: calculateTrend(currentData.clicks, previousData.clicks),
    ctr: currentData.ctr,
    ctrTrend: calculateTrend(currentData.ctr, previousData.ctr),
    position: currentData.position,
    positionTrend: calculateTrend(currentData.position, previousData.position)
  };
}

/**
 * Search Console API 직접 호출 (OAuth2 사용)
 */
function querySearchConsole(startDate, endDate) {
  try {
    const siteUrl = CONFIG.SEARCH_CONSOLE_SITE_URL;
    const encodedSiteUrl = encodeURIComponent(siteUrl);

    const apiUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`;

    const payload = {
      startDate: startDate,
      endDate: endDate,
      dimensions: [],
      type: 'web'
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      console.error('Search Console API Error:', response.getContentText());
      return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    }

    const data = JSON.parse(response.getContentText());

    if (data.rows && data.rows.length > 0) {
      const row = data.rows[0];
      return {
        clicks: Math.round(row.clicks || 0),
        impressions: Math.round(row.impressions || 0),
        ctr: Number(((row.ctr || 0) * 100).toFixed(2)),
        position: Number((row.position || 0).toFixed(1))
      };
    }

    return { clicks: 0, impressions: 0, ctr: 0, position: 0 };

  } catch (error) {
    console.error('Search Console Error:', error);
    return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  }
}

// ==================== GA4 Analytics API ====================

/**
 * GA4 데이터 가져오기
 */
function getGA4Data(dateRange) {
  const propertyId = CONFIG.GA4_PROPERTY_ID;

  // 현재 기간 데이터
  const currentData = queryGA4(propertyId, dateRange.startDate, dateRange.endDate);

  // 이전 기간 데이터
  const previousData = queryGA4(propertyId, dateRange.prevStartDate, dateRange.prevEndDate);

  return {
    users: currentData.users,
    usersTrend: calculateTrend(currentData.users, previousData.users),
    pageviews: currentData.pageviews,
    pageviewsTrend: calculateTrend(currentData.pageviews, previousData.pageviews)
  };
}

/**
 * GA4 Analytics Data API 쿼리 실행
 */
function queryGA4(propertyId, startDate, endDate) {
  try {
    const request = AnalyticsData.newRunReportRequest();
    request.dateRanges = [{ startDate: startDate, endDate: endDate }];
    request.metrics = [
      { name: 'activeUsers' },
      { name: 'screenPageViews' }
    ];

    const response = AnalyticsData.Properties.runReport(request, 'properties/' + propertyId);

    if (response.rows && response.rows.length > 0) {
      const row = response.rows[0];
      return {
        users: parseInt(row.metricValues[0].value || '0', 10),
        pageviews: parseInt(row.metricValues[1].value || '0', 10)
      };
    }

    return { users: 0, pageviews: 0 };

  } catch (error) {
    console.error('GA4 Error:', error);
    return { users: 0, pageviews: 0 };
  }
}

// ==================== 통합 데이터 ====================

/**
 * 모든 데이터 가져오기
 */
function getAllData(dateRange) {
  const gscData = getSearchConsoleData(dateRange);
  const ga4Data = getGA4Data(dateRange);

  return {
    gsc: gscData,
    ga4: ga4Data
  };
}

// ==================== 유틸리티 함수 ====================

/**
 * 기간별 날짜 범위 계산
 */
function calculateDateRange(period) {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() - 1); // 어제 (데이터 지연)

  let startDate = new Date(endDate);

  switch (period) {
    case '7d':
      startDate.setDate(startDate.getDate() - 6);
      break;
    case '28d':
      startDate.setDate(startDate.getDate() - 27);
      break;
    case '3m':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case '6m':
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case '12m':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 3);
  }

  // 이전 기간 계산
  const duration = endDate.getTime() - startDate.getTime();
  const prevEndDate = new Date(startDate);
  prevEndDate.setDate(prevEndDate.getDate() - 1);
  const prevStartDate = new Date(prevEndDate.getTime() - duration);

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    prevStartDate: formatDate(prevStartDate),
    prevEndDate: formatDate(prevEndDate)
  };
}

/**
 * 커스텀 날짜 범위 계산
 */
function calculateCustomDateRange(startDateStr, endDateStr) {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  const duration = endDate.getTime() - startDate.getTime();
  const prevEndDate = new Date(startDate);
  prevEndDate.setDate(prevEndDate.getDate() - 1);
  const prevStartDate = new Date(prevEndDate.getTime() - duration);

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    prevStartDate: formatDate(prevStartDate),
    prevEndDate: formatDate(prevEndDate)
  };
}

/**
 * 날짜 포맷팅 (YYYY-MM-DD)
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 트렌드 계산 (퍼센트)
 */
function calculateTrend(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

/**
 * JSON 응답 생성 (CORS 헤더 포함)
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================== 테스트 함수 ====================

/**
 * 테스트용 - 에디터에서 직접 실행 가능
 */
function testGetAllData() {
  const dateRange = calculateDateRange('3m');
  const result = getAllData(dateRange);
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Search Console 연결 테스트
 */
function testSearchConsole() {
  const dateRange = calculateDateRange('7d');
  const result = getSearchConsoleData(dateRange);
  console.log('Search Console Result:', JSON.stringify(result, null, 2));
}

/**
 * GA4 연결 테스트
 */
function testGA4() {
  const dateRange = calculateDateRange('7d');
  const result = getGA4Data(dateRange);
  console.log('GA4 Result:', JSON.stringify(result, null, 2));
}
