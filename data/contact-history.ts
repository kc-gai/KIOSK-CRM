// =======================================
// 연락 이력 데이터 (스프레드시트에서 수집)
// 마지막 업데이트: 2026-02-05
// =======================================

export type ContactType = 'mail' | 'inquiry' | 'phone' | 'unknown'

export type ImportedContactRecord = {
  companyName: string
  contactDate: string  // YYYY-MM-DD
  contactType: ContactType
  year: number
  month: number
  day: number
}

// 계약완료 업체 목록 (컨택리스트에서 분리)
export const CONTRACTED_COMPANIES = [
  'EAREA Rent-a-Car',
  'EAREAレンタカー',
  'AXCELIA Rent-a-Car',
  'AXCELIAレンタカー',
  'Suzuki Rental Car Fukuoka Airport',
  'スズキレンタカー福岡空港',
  'Fukutaro Rental Car',
  'フクタローレンタカー',
  'Halbare Rental Car',
  'ハルバレレンタカー',
  'M7 Rental Car',
  'M7レンタカー',
  'Apple Rental Car',
  'アップルレンタカー',
  '385 Rental Car',
  '385レンタカー',
]

// 날짜 문자열 파싱 헬퍼
function parseDate(dateStr: string): { year: number; month: number; day: number } | null {
  // YYYY/MM/DD or YYYY-MM-DD format
  const match = dateStr.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
  if (match) {
    return {
      year: parseInt(match[1]),
      month: parseInt(match[2]),
      day: parseInt(match[3]),
    }
  }
  return null
}

// 연락 기록 생성 헬퍼
function createContactRecord(
  companyName: string,
  dateStr: string,
  contactType: ContactType
): ImportedContactRecord | null {
  const parsed = parseDate(dateStr)
  if (!parsed) return null

  const formattedDate = `${parsed.year}-${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`

  return {
    companyName,
    contactDate: formattedDate,
    contactType,
    year: parsed.year,
    month: parsed.month,
    day: parsed.day,
  }
}

// =======================================
// 北海道 (Hokkaido) - 2024年 연락 이력
// =======================================
const HOKKAIDO_CONTACTS: ImportedContactRecord[] = [
  // 99レンタカー北海道
  { companyName: '99レンタカー北海道', contactDate: '2024-06-10', contactType: 'inquiry', year: 2024, month: 6, day: 10 },
  { companyName: '99レンタカー北海道', contactDate: '2024-07-22', contactType: 'inquiry', year: 2024, month: 7, day: 22 },
  { companyName: '99レンタカー北海道', contactDate: '2024-09-05', contactType: 'inquiry', year: 2024, month: 9, day: 5 },
  { companyName: '99レンタカー北海道', contactDate: '2024-12-02', contactType: 'inquiry', year: 2024, month: 12, day: 2 },
  { companyName: '99レンタカー北海道', contactDate: '2025-02-04', contactType: 'inquiry', year: 2025, month: 2, day: 4 },
  // ファミリーレンタカー新千歳
  { companyName: 'ファミリーレンタカー新千歳', contactDate: '2024-06-10', contactType: 'inquiry', year: 2024, month: 6, day: 10 },
  { companyName: 'ファミリーレンタカー新千歳', contactDate: '2024-07-26', contactType: 'inquiry', year: 2024, month: 7, day: 26 },
  { companyName: 'ファミリーレンタカー新千歳', contactDate: '2024-09-05', contactType: 'inquiry', year: 2024, month: 9, day: 5 },
  { companyName: 'ファミリーレンタカー新千歳', contactDate: '2024-10-29', contactType: 'inquiry', year: 2024, month: 10, day: 29 },
]

// =======================================
// 東北 (Tohoku) - 2024-2025年 연락 이력
// =======================================
const TOHOKU_CONTACTS: ImportedContactRecord[] = [
  // エコカーレンタカー仙台空港
  { companyName: 'エコカーレンタカー仙台空港', contactDate: '2024-09-02', contactType: 'mail', year: 2024, month: 9, day: 2 },
  { companyName: 'エコカーレンタカー仙台空港', contactDate: '2024-10-03', contactType: 'mail', year: 2024, month: 10, day: 3 },
  { companyName: 'エコカーレンタカー仙台空港', contactDate: '2024-11-18', contactType: 'mail', year: 2024, month: 11, day: 18 },
  // エコカーレンタカー仙台駅前
  { companyName: 'エコカーレンタカー仙台駅前', contactDate: '2024-09-02', contactType: 'mail', year: 2024, month: 9, day: 2 },
  { companyName: 'エコカーレンタカー仙台駅前', contactDate: '2024-10-03', contactType: 'mail', year: 2024, month: 10, day: 3 },
  { companyName: 'エコカーレンタカー仙台駅前', contactDate: '2024-11-18', contactType: 'mail', year: 2024, month: 11, day: 18 },
  // アートレンタカー仙台空港
  { companyName: 'アートレンタカー仙台空港', contactDate: '2024-08-14', contactType: 'inquiry', year: 2024, month: 8, day: 14 },
  { companyName: 'アートレンタカー仙台空港', contactDate: '2024-09-05', contactType: 'inquiry', year: 2024, month: 9, day: 5 },
  { companyName: 'アートレンタカー仙台空港', contactDate: '2024-11-01', contactType: 'inquiry', year: 2024, month: 11, day: 1 },
  // 花形レンタカー
  { companyName: '花形レンタカー', contactDate: '2024-08-16', contactType: 'inquiry', year: 2024, month: 8, day: 16 },
  { companyName: '花形レンタカー', contactDate: '2024-10-09', contactType: 'inquiry', year: 2024, month: 10, day: 9 },
  // 仙台レンタカーサービス
  { companyName: '仙台レンタカーサービス', contactDate: '2024-08-16', contactType: 'inquiry', year: 2024, month: 8, day: 16 },
  { companyName: '仙台レンタカーサービス', contactDate: '2024-11-21', contactType: 'inquiry', year: 2024, month: 11, day: 21 },
  // JBレンタカー
  { companyName: 'JBレンタカー', contactDate: '2024-08-16', contactType: 'inquiry', year: 2024, month: 8, day: 16 },
  { companyName: 'JBレンタカー', contactDate: '2024-11-01', contactType: 'inquiry', year: 2024, month: 11, day: 1 },
  // くまちゃんレンタカー
  { companyName: 'くまちゃんレンタカー', contactDate: '2024-09-16', contactType: 'inquiry', year: 2024, month: 9, day: 16 },
  // can-doレンタカー仙台駅前店
  { companyName: 'can-doレンタカー仙台駅前店', contactDate: '2024-09-16', contactType: 'inquiry', year: 2024, month: 9, day: 16 },
  { companyName: 'can-doレンタカー仙台駅前店', contactDate: '2024-10-07', contactType: 'inquiry', year: 2024, month: 10, day: 7 },
  { companyName: 'can-doレンタカー仙台駅前店', contactDate: '2024-12-25', contactType: 'inquiry', year: 2024, month: 12, day: 25 },
  // いしのまきレンタカー
  { companyName: 'いしのまきレンタカー', contactDate: '2024-09-02', contactType: 'mail', year: 2024, month: 9, day: 2 },
  { companyName: 'いしのまきレンタカー', contactDate: '2024-10-03', contactType: 'mail', year: 2024, month: 10, day: 3 },
  { companyName: 'いしのまきレンタカー', contactDate: '2024-11-18', contactType: 'mail', year: 2024, month: 11, day: 18 },
  // 株式会社オーシャンコネクト
  { companyName: '株式会社オーシャンコネクト', contactDate: '2024-09-16', contactType: 'mail', year: 2024, month: 9, day: 16 },
  { companyName: '株式会社オーシャンコネクト', contactDate: '2024-11-21', contactType: 'mail', year: 2024, month: 11, day: 21 },
  // トラウム株式会社
  { companyName: 'トラウム株式会社', contactDate: '2024-09-16', contactType: 'mail', year: 2024, month: 9, day: 16 },
  // レンタルオート
  { companyName: 'レンタルオート', contactDate: '2024-09-02', contactType: 'mail', year: 2024, month: 9, day: 2 },
  { companyName: 'レンタルオート', contactDate: '2024-10-03', contactType: 'mail', year: 2024, month: 10, day: 3 },
  { companyName: 'レンタルオート', contactDate: '2024-12-02', contactType: 'mail', year: 2024, month: 12, day: 2 },
  // マイクスレンタカー
  { companyName: 'マイクスレンタカー', contactDate: '2024-08-16', contactType: 'mail', year: 2024, month: 8, day: 16 },
  { companyName: 'マイクスレンタカー', contactDate: '2024-10-03', contactType: 'mail', year: 2024, month: 10, day: 3 },
  { companyName: 'マイクスレンタカー', contactDate: '2024-11-01', contactType: 'mail', year: 2024, month: 11, day: 1 },
  // ラクレンタカー
  { companyName: 'ラクレンタカー', contactDate: '2024-08-16', contactType: 'mail', year: 2024, month: 8, day: 16 },
  { companyName: 'ラクレンタカー', contactDate: '2024-11-01', contactType: 'mail', year: 2024, month: 11, day: 1 },
  // KAZレンタカー
  { companyName: 'KAZレンタカー', contactDate: '2024-08-16', contactType: 'mail', year: 2024, month: 8, day: 16 },
  { companyName: 'KAZレンタカー', contactDate: '2024-11-01', contactType: 'mail', year: 2024, month: 11, day: 1 },
  // 会津レンタカー
  { companyName: '会津レンタカー', contactDate: '2024-08-16', contactType: 'inquiry', year: 2024, month: 8, day: 16 },
  { companyName: '会津レンタカー', contactDate: '2024-11-01', contactType: 'inquiry', year: 2024, month: 11, day: 1 },
  // AQUAレンタカー
  { companyName: 'AQUAレンタカー', contactDate: '2024-08-16', contactType: 'mail', year: 2024, month: 8, day: 16 },
  { companyName: 'AQUAレンタカー', contactDate: '2024-11-18', contactType: 'mail', year: 2024, month: 11, day: 18 },
  // 郡山中央レンタカー
  { companyName: '郡山中央レンタカー', contactDate: '2024-08-16', contactType: 'inquiry', year: 2024, month: 8, day: 16 },
  { companyName: '郡山中央レンタカー', contactDate: '2024-11-01', contactType: 'inquiry', year: 2024, month: 11, day: 1 },
  // 福島Kレンタカー
  { companyName: '福島Kレンタカー', contactDate: '2024-10-03', contactType: 'inquiry', year: 2024, month: 10, day: 3 },
  { companyName: '福島Kレンタカー', contactDate: '2024-12-02', contactType: 'inquiry', year: 2024, month: 12, day: 2 },
  // オートガード八戸
  { companyName: 'オートガード八戸', contactDate: '2024-08-16', contactType: 'inquiry', year: 2024, month: 8, day: 16 },
  { companyName: 'オートガード八戸', contactDate: '2024-10-09', contactType: 'inquiry', year: 2024, month: 10, day: 9 },
  // 三八五レンタカー
  { companyName: '三八五レンタカー', contactDate: '2024-08-16', contactType: 'mail', year: 2024, month: 8, day: 16 },
  { companyName: '三八五レンタカー', contactDate: '2024-11-01', contactType: 'mail', year: 2024, month: 11, day: 1 },
  // トラフィックレンタリース
  { companyName: 'トラフィックレンタリース', contactDate: '2024-08-16', contactType: 'inquiry', year: 2024, month: 8, day: 16 },
  { companyName: 'トラフィックレンタリース', contactDate: '2024-11-01', contactType: 'inquiry', year: 2024, month: 11, day: 1 },
  // ニーフィスレンタカー
  { companyName: 'ニーフィスレンタカー', contactDate: '2024-08-09', contactType: 'inquiry', year: 2024, month: 8, day: 9 },
  { companyName: 'ニーフィスレンタカー', contactDate: '2024-11-19', contactType: 'inquiry', year: 2024, month: 11, day: 19 },
  // ドラゴンレンタカー医療
  { companyName: 'ドラゴンレンタカー医療', contactDate: '2024-08-09', contactType: 'mail', year: 2024, month: 8, day: 9 },
  { companyName: 'ドラゴンレンタカー医療', contactDate: '2024-11-19', contactType: 'mail', year: 2024, month: 11, day: 19 },
  // AASレンタリース
  { companyName: 'AASレンタリース', contactDate: '2024-09-03', contactType: 'inquiry', year: 2024, month: 9, day: 3 },
  { companyName: 'AASレンタリース', contactDate: '2024-11-01', contactType: 'inquiry', year: 2024, month: 11, day: 1 },
  // 一関レンタカーサービス
  { companyName: '一関レンタカーサービス', contactDate: '2024-08-16', contactType: 'mail', year: 2024, month: 8, day: 16 },
  { companyName: '一関レンタカーサービス', contactDate: '2024-11-01', contactType: 'mail', year: 2024, month: 11, day: 1 },
  // リボーン・レンタカー
  { companyName: 'リボーン・レンタカー', contactDate: '2024-08-16', contactType: 'mail', year: 2024, month: 8, day: 16 },
  { companyName: 'リボーン・レンタカー', contactDate: '2024-11-18', contactType: 'mail', year: 2024, month: 11, day: 18 },
  // パンテックレンタカー山形
  { companyName: 'パンテックレンタカー山形', contactDate: '2024-09-03', contactType: 'inquiry', year: 2024, month: 9, day: 3 },
  { companyName: 'パンテックレンタカー山形', contactDate: '2024-10-03', contactType: 'inquiry', year: 2024, month: 10, day: 3 },
  { companyName: 'パンテックレンタカー山形', contactDate: '2024-12-02', contactType: 'inquiry', year: 2024, month: 12, day: 2 },
  // エコカーレンタカー秋田
  { companyName: 'エコカーレンタカー秋田', contactDate: '2024-09-02', contactType: 'mail', year: 2024, month: 9, day: 2 },
  { companyName: 'エコカーレンタカー秋田', contactDate: '2024-10-03', contactType: 'mail', year: 2024, month: 10, day: 3 },
  { companyName: 'エコカーレンタカー秋田', contactDate: '2024-12-02', contactType: 'mail', year: 2024, month: 12, day: 2 },
  // こまちライフサービス
  { companyName: 'こまちライフサービス', contactDate: '2024-10-10', contactType: 'inquiry', year: 2024, month: 10, day: 10 },
  { companyName: 'こまちライフサービス', contactDate: '2024-11-18', contactType: 'inquiry', year: 2024, month: 11, day: 18 },
  // ローカルレンタカー
  { companyName: 'ローカルレンタカー', contactDate: '2024-10-02', contactType: 'inquiry', year: 2024, month: 10, day: 2 },
  { companyName: 'ローカルレンタカー', contactDate: '2024-11-19', contactType: 'inquiry', year: 2024, month: 11, day: 19 },
  // あやめレンタカー
  { companyName: 'あやめレンタカー', contactDate: '2024-09-06', contactType: 'mail', year: 2024, month: 9, day: 6 },
  { companyName: 'あやめレンタカー', contactDate: '2024-11-18', contactType: 'mail', year: 2024, month: 11, day: 18 },
  // パレリーナ
  { companyName: 'パレリーナ', contactDate: '2024-09-09', contactType: 'mail', year: 2024, month: 9, day: 9 },
  { companyName: 'パレリーナ', contactDate: '2024-10-10', contactType: 'mail', year: 2024, month: 10, day: 10 },
  { companyName: 'パレリーナ', contactDate: '2024-12-02', contactType: 'mail', year: 2024, month: 12, day: 2 },
]

// =======================================
// 関東 (Kanto) - 2025年 연락 이력
// =======================================
const KANTO_CONTACTS: ImportedContactRecord[] = [
  // アトラスレンタ株式会社
  { companyName: 'アトラスレンタ株式会社', contactDate: '2025-08-04', contactType: 'mail', year: 2025, month: 8, day: 4 },
  { companyName: 'アトラスレンタ株式会社', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'アトラスレンタ株式会社', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'アトラスレンタ株式会社', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // 横浜レンタカー
  { companyName: '横浜レンタカー', contactDate: '2025-08-04', contactType: 'inquiry', year: 2025, month: 8, day: 4 },
  { companyName: '横浜レンタカー', contactDate: '2025-10-14', contactType: 'inquiry', year: 2025, month: 10, day: 14 },
  { companyName: '横浜レンタカー', contactDate: '2025-12-02', contactType: 'inquiry', year: 2025, month: 12, day: 2 },
  { companyName: '横浜レンタカー', contactDate: '2026-02-02', contactType: 'inquiry', year: 2026, month: 2, day: 2 },
  // ダイワレンタカー
  { companyName: 'ダイワレンタカー', contactDate: '2025-08-04', contactType: 'mail', year: 2025, month: 8, day: 4 },
  { companyName: 'ダイワレンタカー', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'ダイワレンタカー', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'ダイワレンタカー', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // ユニアスレンタカー
  { companyName: 'ユニアスレンタカー', contactDate: '2025-08-04', contactType: 'mail', year: 2025, month: 8, day: 4 },
  { companyName: 'ユニアスレンタカー', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'ユニアスレンタカー', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'ユニアスレンタカー', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
]

// =======================================
// 北陸信越 (Hokuriku-Shinetsu) - 2025年 연락 이력
// =======================================
const HOKURIKU_CONTACTS: ImportedContactRecord[] = [
  // QESTICA
  { companyName: 'QESTICA', contactDate: '2025-08-04', contactType: 'mail', year: 2025, month: 8, day: 4 },
  // 伊那レンタカー
  { companyName: '伊那レンタカー', contactDate: '2025-08-04', contactType: 'inquiry', year: 2025, month: 8, day: 4 },
  { companyName: '伊那レンタカー', contactDate: '2026-01-09', contactType: 'inquiry', year: 2026, month: 1, day: 9 },
  // 宝レンタカー
  { companyName: '宝レンタカー', contactDate: '2025-08-04', contactType: 'phone', year: 2025, month: 8, day: 4 },
  // カーオペレンタカー
  { companyName: 'カーオペレンタカー', contactDate: '2025-08-04', contactType: 'mail', year: 2025, month: 8, day: 4 },
  { companyName: 'カーオペレンタカー', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'カーオペレンタカー', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'カーオペレンタカー', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // KJレンタカー
  { companyName: 'KJレンタカー', contactDate: '2025-08-04', contactType: 'phone', year: 2025, month: 8, day: 4 },
  { companyName: 'KJレンタカー', contactDate: '2025-10-17', contactType: 'phone', year: 2025, month: 10, day: 17 },
  // プラチナレンタカー信濃大町営業所
  { companyName: 'プラチナレンタカー信濃大町営業所', contactDate: '2025-08-04', contactType: 'mail', year: 2025, month: 8, day: 4 },
  { companyName: 'プラチナレンタカー信濃大町営業所', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'プラチナレンタカー信濃大町営業所', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'プラチナレンタカー信濃大町営業所', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // 小桜レンタカー
  { companyName: '小桜レンタカー', contactDate: '2025-08-12', contactType: 'phone', year: 2025, month: 8, day: 12 },
  { companyName: '小桜レンタカー', contactDate: '2025-10-14', contactType: 'phone', year: 2025, month: 10, day: 14 },
  { companyName: '小桜レンタカー', contactDate: '2025-12-02', contactType: 'phone', year: 2025, month: 12, day: 2 },
  { companyName: '小桜レンタカー', contactDate: '2026-02-02', contactType: 'phone', year: 2026, month: 2, day: 2 },
  // カーフレンド・レンタカー
  { companyName: 'カーフレンド・レンタカー', contactDate: '2025-08-04', contactType: 'mail', year: 2025, month: 8, day: 4 },
  { companyName: 'カーフレンド・レンタカー', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'カーフレンド・レンタカー', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'カーフレンド・レンタカー', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // KEYS' CAR RENTAL
  { companyName: "KEYS' CAR RENTAL", contactDate: '2025-08-04', contactType: 'mail', year: 2025, month: 8, day: 4 },
  { companyName: "KEYS' CAR RENTAL", contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: "KEYS' CAR RENTAL", contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: "KEYS' CAR RENTAL", contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // アイランドレンタカー
  { companyName: 'アイランドレンタカー', contactDate: '2025-08-04', contactType: 'mail', year: 2025, month: 8, day: 4 },
  { companyName: 'アイランドレンタカー', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'アイランドレンタカー', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'アイランドレンタカー', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // 佐渡汽船レンタカー
  { companyName: '佐渡汽船レンタカー', contactDate: '2025-08-04', contactType: 'inquiry', year: 2025, month: 8, day: 4 },
  { companyName: '佐渡汽船レンタカー', contactDate: '2025-10-17', contactType: 'inquiry', year: 2025, month: 10, day: 17 },
  // 渡辺産商レンタカー
  { companyName: '渡辺産商レンタカー', contactDate: '2025-08-04', contactType: 'mail', year: 2025, month: 8, day: 4 },
  { companyName: '渡辺産商レンタカー', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: '渡辺産商レンタカー', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: '渡辺産商レンタカー', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // 気軽にレンタカー
  { companyName: '気軽にレンタカー', contactDate: '2025-08-04', contactType: 'mail', year: 2025, month: 8, day: 4 },
  { companyName: '気軽にレンタカー', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: '気軽にレンタカー', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: '気軽にレンタカー', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // 越路レンタカー
  { companyName: '越路レンタカー', contactDate: '2025-08-04', contactType: 'inquiry', year: 2025, month: 8, day: 4 },
  { companyName: '越路レンタカー', contactDate: '2025-10-17', contactType: 'inquiry', year: 2025, month: 10, day: 17 },
  // ゴールドレンタカー
  { companyName: 'ゴールドレンタカー', contactDate: '2025-08-12', contactType: 'inquiry', year: 2025, month: 8, day: 12 },
  { companyName: 'ゴールドレンタカー', contactDate: '2026-01-09', contactType: 'inquiry', year: 2026, month: 1, day: 9 },
  // 株式会社カーライフ中野
  { companyName: '株式会社カーライフ中野', contactDate: '2025-08-12', contactType: 'inquiry', year: 2025, month: 8, day: 12 },
  // スマイルレンタカー粟津温泉店
  { companyName: 'スマイルレンタカー粟津温泉店', contactDate: '2025-08-12', contactType: 'mail', year: 2025, month: 8, day: 12 },
  { companyName: 'スマイルレンタカー粟津温泉店', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'スマイルレンタカー粟津温泉店', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'スマイルレンタカー粟津温泉店', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
]

// =======================================
// 近畿 (Kinki) - 2025年 연락 이력
// =======================================
const KINKI_CONTACTS: ImportedContactRecord[] = [
  // シーオートレンタカー
  { companyName: 'シーオートレンタカー', contactDate: '2025-08-19', contactType: 'mail', year: 2025, month: 8, day: 19 },
  { companyName: 'シーオートレンタカー', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'シーオートレンタカー', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'シーオートレンタカー', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // ジンオートレンタカー
  { companyName: 'ジンオートレンタカー', contactDate: '2025-08-19', contactType: 'inquiry', year: 2025, month: 8, day: 19 },
  { companyName: 'ジンオートレンタカー', contactDate: '2025-10-14', contactType: 'inquiry', year: 2025, month: 10, day: 14 },
  { companyName: 'ジンオートレンタカー', contactDate: '2026-01-09', contactType: 'inquiry', year: 2026, month: 1, day: 9 },
  // BOOBOOレンタカー本店
  { companyName: 'BOOBOOレンタカー本店', contactDate: '2025-08-19', contactType: 'mail', year: 2025, month: 8, day: 19 },
  { companyName: 'BOOBOOレンタカー本店', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'BOOBOOレンタカー本店', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'BOOBOOレンタカー本店', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // ウエストレンタカー
  { companyName: 'ウエストレンタカー', contactDate: '2025-08-19', contactType: 'mail', year: 2025, month: 8, day: 19 },
  { companyName: 'ウエストレンタカー', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'ウエストレンタカー', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'ウエストレンタカー', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // プレミアムレンタカー
  { companyName: 'プレミアムレンタカー', contactDate: '2025-08-19', contactType: 'inquiry', year: 2025, month: 8, day: 19 },
  // エコレンタカー
  { companyName: 'エコレンタカー', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'エコレンタカー', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // トップレンタカー
  { companyName: 'トップレンタカー', contactDate: '2025-08-19', contactType: 'inquiry', year: 2025, month: 8, day: 19 },
  { companyName: 'トップレンタカー', contactDate: '2025-10-17', contactType: 'inquiry', year: 2025, month: 10, day: 17 },
  // レンタカー660
  { companyName: 'レンタカー660', contactDate: '2025-08-19', contactType: 'mail', year: 2025, month: 8, day: 19 },
  { companyName: 'レンタカー660', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'レンタカー660', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'レンタカー660', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // MARINE-Q
  { companyName: 'MARINE-Q', contactDate: '2025-08-19', contactType: 'mail', year: 2025, month: 8, day: 19 },
  { companyName: 'MARINE-Q', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'MARINE-Q', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'MARINE-Q', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // GREENレンタカー
  { companyName: 'GREENレンタカー', contactDate: '2025-08-19', contactType: 'mail', year: 2025, month: 8, day: 19 },
  { companyName: 'GREENレンタカー', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'GREENレンタカー', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // 淡路島プライムレンタカー
  { companyName: '淡路島プライムレンタカー', contactDate: '2025-08-19', contactType: 'inquiry', year: 2025, month: 8, day: 19 },
  { companyName: '淡路島プライムレンタカー', contactDate: '2026-01-09', contactType: 'inquiry', year: 2026, month: 1, day: 9 },
  // Car Easy Buy & Rental
  { companyName: 'Car Easy Buy & Rental', contactDate: '2025-08-19', contactType: 'mail', year: 2025, month: 8, day: 19 },
  { companyName: 'Car Easy Buy & Rental', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'Car Easy Buy & Rental', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'Car Easy Buy & Rental', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // ワンコイン乙訓レンタカー
  { companyName: 'ワンコイン乙訓レンタカー', contactDate: '2025-08-19', contactType: 'mail', year: 2025, month: 8, day: 19 },
  { companyName: 'ワンコイン乙訓レンタカー', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'ワンコイン乙訓レンタカー', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'ワンコイン乙訓レンタカー', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // まいどレンタカー生駒
  { companyName: 'まいどレンタカー生駒', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'まいどレンタカー生駒', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'まいどレンタカー生駒', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // レンタカースニーカーズ生駒店
  { companyName: 'レンタカースニーカーズ生駒店', contactDate: '2025-08-19', contactType: 'mail', year: 2025, month: 8, day: 19 },
  { companyName: 'レンタカースニーカーズ生駒店', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'レンタカースニーカーズ生駒店', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'レンタカースニーカーズ生駒店', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // ヴィクトリアレンタカー
  { companyName: 'ヴィクトリアレンタカー', contactDate: '2025-08-19', contactType: 'mail', year: 2025, month: 8, day: 19 },
  { companyName: 'ヴィクトリアレンタカー', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'ヴィクトリアレンタカー', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'ヴィクトリアレンタカー', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // マスターピースレンタカー
  { companyName: 'マスターピースレンタカー', contactDate: '2025-08-19', contactType: 'mail', year: 2025, month: 8, day: 19 },
  { companyName: 'マスターピースレンタカー', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'マスターピースレンタカー', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'マスターピースレンタカー', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // びわこレンタカー
  { companyName: 'びわこレンタカー', contactDate: '2025-08-19', contactType: 'mail', year: 2025, month: 8, day: 19 },
  { companyName: 'びわこレンタカー', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'びわこレンタカー', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'びわこレンタカー', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
]

// =======================================
// 中国 (Chugoku) - 2025年 연락 이력
// =======================================
const CHUGOKU_CONTACTS: ImportedContactRecord[] = [
  // フリーレンタカー
  { companyName: 'フリーレンタカー', contactDate: '2025-08-12', contactType: 'phone', year: 2025, month: 8, day: 12 },
  { companyName: 'フリーレンタカー', contactDate: '2025-10-14', contactType: 'phone', year: 2025, month: 10, day: 14 },
  { companyName: 'フリーレンタカー', contactDate: '2026-01-08', contactType: 'phone', year: 2026, month: 1, day: 8 },
  // Gettレンタカー
  { companyName: 'Gettレンタカー', contactDate: '2025-08-12', contactType: 'mail', year: 2025, month: 8, day: 12 },
  { companyName: 'Gettレンタカー', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'Gettレンタカー', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'Gettレンタカー', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // ntsレンタカー
  { companyName: 'ntsレンタカー', contactDate: '2025-08-12', contactType: 'mail', year: 2025, month: 8, day: 12 },
  { companyName: 'ntsレンタカー', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'ntsレンタカー', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'ntsレンタカー', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // 岡山レンタカー
  { companyName: '岡山レンタカー', contactDate: '2025-08-12', contactType: 'phone', year: 2025, month: 8, day: 12 },
  { companyName: '岡山レンタカー', contactDate: '2026-01-08', contactType: 'phone', year: 2026, month: 1, day: 8 },
  // マイレンタカー
  { companyName: 'マイレンタカー', contactDate: '2025-08-12', contactType: 'phone', year: 2025, month: 8, day: 12 },
  { companyName: 'マイレンタカー', contactDate: '2026-01-08', contactType: 'phone', year: 2026, month: 1, day: 8 },
  // 隠岐レンタ・リース
  { companyName: '隠岐レンタ・リース', contactDate: '2025-08-12', contactType: 'mail', year: 2025, month: 8, day: 12 },
  { companyName: '隠岐レンタ・リース', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: '隠岐レンタ・リース', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: '隠岐レンタ・リース', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // 富士レンタリース
  { companyName: '富士レンタリース', contactDate: '2025-08-12', contactType: 'mail', year: 2025, month: 8, day: 12 },
  { companyName: '富士レンタリース', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: '富士レンタリース', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: '富士レンタリース', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
]

// =======================================
// 四国 (Shikoku) - 2025年 연락 이력
// =======================================
const SHIKOKU_CONTACTS: ImportedContactRecord[] = [
  // スカイパークレンタカー
  { companyName: 'スカイパークレンタカー', contactDate: '2025-08-25', contactType: 'inquiry', year: 2025, month: 8, day: 25 },
  { companyName: 'スカイパークレンタカー', contactDate: '2025-10-14', contactType: 'inquiry', year: 2025, month: 10, day: 14 },
  { companyName: 'スカイパークレンタカー', contactDate: '2026-01-08', contactType: 'inquiry', year: 2026, month: 1, day: 8 },
  // 東温レンタカー松山空港店
  { companyName: '東温レンタカー松山空港店', contactDate: '2025-08-25', contactType: 'inquiry', year: 2025, month: 8, day: 25 },
  { companyName: '東温レンタカー松山空港店', contactDate: '2026-01-08', contactType: 'inquiry', year: 2026, month: 1, day: 8 },
  // ウッディレンタカー
  { companyName: 'ウッディレンタカー', contactDate: '2025-08-25', contactType: 'mail', year: 2025, month: 8, day: 25 },
  { companyName: 'ウッディレンタカー', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'ウッディレンタカー', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'ウッディレンタカー', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // 株式会社OKレンタリース
  { companyName: '株式会社OKレンタリース', contactDate: '2025-08-25', contactType: 'inquiry', year: 2025, month: 8, day: 25 },
  { companyName: '株式会社OKレンタリース', contactDate: '2025-10-21', contactType: 'inquiry', year: 2025, month: 10, day: 21 },
  // G1レンタカー
  { companyName: 'G1レンタカー', contactDate: '2025-08-25', contactType: 'mail', year: 2025, month: 8, day: 25 },
  { companyName: 'G1レンタカー', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'G1レンタカー', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'G1レンタカー', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // グレートレンタ
  { companyName: 'グレートレンタ', contactDate: '2025-08-25', contactType: 'inquiry', year: 2025, month: 8, day: 25 },
  // NJレンタカー
  { companyName: 'NJレンタカー', contactDate: '2025-08-25', contactType: 'inquiry', year: 2025, month: 8, day: 25 },
  // 香川高級レンタカー高松中央
  { companyName: '香川高級レンタカー高松中央', contactDate: '2025-08-25', contactType: 'inquiry', year: 2025, month: 8, day: 25 },
  { companyName: '香川高級レンタカー高松中央', contactDate: '2025-10-21', contactType: 'inquiry', year: 2025, month: 10, day: 21 },
  // かつおれんたかー
  { companyName: 'かつおれんたかー', contactDate: '2025-08-25', contactType: 'mail', year: 2025, month: 8, day: 25 },
  { companyName: 'かつおれんたかー', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'かつおれんたかー', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'かつおれんたかー', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // カーリルレンタカーのいち店
  { companyName: 'カーリルレンタカーのいち店', contactDate: '2025-08-25', contactType: 'mail', year: 2025, month: 8, day: 25 },
  { companyName: 'カーリルレンタカーのいち店', contactDate: '2025-10-14', contactType: 'mail', year: 2025, month: 10, day: 14 },
  { companyName: 'カーリルレンタカーのいち店', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'カーリルレンタカーのいち店', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
  // レンタカー四万十
  { companyName: 'レンタカー四万十', contactDate: '2025-08-25', contactType: 'inquiry', year: 2025, month: 8, day: 25 },
  { companyName: 'レンタカー四万十', contactDate: '2025-10-21', contactType: 'inquiry', year: 2025, month: 10, day: 21 },
  // 60分レンタカー
  { companyName: '60分レンタカー', contactDate: '2025-08-25', contactType: 'inquiry', year: 2025, month: 8, day: 25 },
  { companyName: '60分レンタカー', contactDate: '2025-10-21', contactType: 'inquiry', year: 2025, month: 10, day: 21 },
  // ブリーズファクトリーレンタカー
  { companyName: 'ブリーズファクトリーレンタカー', contactDate: '2025-08-25', contactType: 'inquiry', year: 2025, month: 8, day: 25 },
]

// =======================================
// 九州 (Kyushu) - 2025年 연락 이력
// =======================================
const KYUSHU_CONTACTS: ImportedContactRecord[] = [
  // 2025년 연락 이력 (시트 1)
  // 8월 연락
  { companyName: 'リトルアースレンタカー', contactDate: '2025-08-18', contactType: 'mail', year: 2025, month: 8, day: 18 },
  { companyName: 'リトルアースレンタカー', contactDate: '2025-10-01', contactType: 'mail', year: 2025, month: 10, day: 1 },
  { companyName: 'リトルアースレンタカー', contactDate: '2025-12-02', contactType: 'mail', year: 2025, month: 12, day: 2 },
  { companyName: 'リトルアースレンタカー', contactDate: '2026-02-02', contactType: 'mail', year: 2026, month: 2, day: 2 },
]

// =======================================
// 沖縄 (Okinawa) - 2024-2025年 연락 이력
// =======================================
const OKINAWA_CONTACTS: ImportedContactRecord[] = [
  // keyレンタカー那覇空港店
  { companyName: 'keyレンタカー那覇空港店', contactDate: '2025-09-01', contactType: 'mail', year: 2025, month: 9, day: 1 },
  // Zabuuun!レンタカー
  { companyName: 'Zabuuun!レンタカー', contactDate: '2025-09-01', contactType: 'mail', year: 2025, month: 9, day: 1 },
  // 3Qレンタカー
  { companyName: '3Qレンタカー', contactDate: '2025-09-01', contactType: 'mail', year: 2025, month: 9, day: 1 },
  // グレイスレンタカー
  { companyName: 'グレイスレンタカー', contactDate: '2025-09-01', contactType: 'mail', year: 2025, month: 9, day: 1 },
  // スノーブルーレンタカー
  { companyName: 'スノーブルーレンタカー', contactDate: '2025-09-01', contactType: 'mail', year: 2025, month: 9, day: 1 },
  // GoToレンタカー
  { companyName: 'GoToレンタカー', contactDate: '2025-11-14', contactType: 'mail', year: 2025, month: 11, day: 14 },
  // Gottsレンタカー
  { companyName: 'Gottsレンタカー', contactDate: '2025-11-14', contactType: 'mail', year: 2025, month: 11, day: 14 },
  // ハイビスカスレンタカー石垣島
  { companyName: 'ハイビスカスレンタカー石垣島', contactDate: '2025-09-01', contactType: 'mail', year: 2025, month: 9, day: 1 },
  { companyName: 'ハイビスカスレンタカー石垣島', contactDate: '2025-11-14', contactType: 'mail', year: 2025, month: 11, day: 14 },
  // タスクレンタカー
  { companyName: 'タスクレンタカー', contactDate: '2025-11-14', contactType: 'mail', year: 2025, month: 11, day: 14 },
  // T.Fレンタカー/リース
  { companyName: 'T.Fレンタカー/リース', contactDate: '2025-11-14', contactType: 'mail', year: 2025, month: 11, day: 14 },
  // ガーラレンタカー
  { companyName: 'ガーラレンタカー', contactDate: '2025-11-14', contactType: 'mail', year: 2025, month: 11, day: 14 },
  // サーフレンタカー石垣島
  { companyName: 'サーフレンタカー石垣島', contactDate: '2025-11-14', contactType: 'mail', year: 2025, month: 11, day: 14 },
  // ソレイユレンタカー
  { companyName: 'ソレイユレンタカー', contactDate: '2025-11-14', contactType: 'mail', year: 2025, month: 11, day: 14 },
  // レクシアレンタカー
  { companyName: 'レクシアレンタカー', contactDate: '2025-09-01', contactType: 'mail', year: 2025, month: 9, day: 1 },
  // MIYACTIVレンタカー
  { companyName: 'MIYACTIVレンタカー', contactDate: '2025-09-01', contactType: 'mail', year: 2025, month: 9, day: 1 },
  // THEレンタカー
  { companyName: 'THEレンタカー', contactDate: '2025-09-01', contactType: 'mail', year: 2025, month: 9, day: 1 },
  // WSCレンタカー
  { companyName: 'WSCレンタカー', contactDate: '2025-09-01', contactType: 'mail', year: 2025, month: 9, day: 1 },
  // アカラレンタカー
  { companyName: 'アカラレンタカー', contactDate: '2025-09-01', contactType: 'mail', year: 2025, month: 9, day: 1 },
  // オールスターレンタカー
  { companyName: 'オールスターレンタカー', contactDate: '2025-09-01', contactType: 'mail', year: 2025, month: 9, day: 1 },
  // アンドレンタカー
  { companyName: 'アンドレンタカー', contactDate: '2025-09-01', contactType: 'mail', year: 2025, month: 9, day: 1 },
  // エイトレンタカー
  { companyName: 'エイトレンタカー', contactDate: '2025-09-01', contactType: 'mail', year: 2025, month: 9, day: 1 },
  // エコタスレンタカー
  { companyName: 'エコタスレンタカー', contactDate: '2025-09-01', contactType: 'mail', year: 2025, month: 9, day: 1 },
  // グッドフェローズレンタル
  { companyName: 'グッドフェローズレンタル', contactDate: '2025-09-01', contactType: 'mail', year: 2025, month: 9, day: 1 },
  // ダリレンタカー
  { companyName: 'ダリレンタカー', contactDate: '2025-09-01', contactType: 'mail', year: 2025, month: 9, day: 1 },
  // ナナイロレンタカー
  { companyName: 'ナナイロレンタカー', contactDate: '2025-09-01', contactType: 'mail', year: 2025, month: 9, day: 1 },
  // ハルハルレンタカー
  { companyName: 'ハルハルレンタカー', contactDate: '2025-09-01', contactType: 'mail', year: 2025, month: 9, day: 1 },
]

// =======================================
// 2026년 1월 연락 데이터 (콜드메일 수기 기록 기준)
// 메일: 20건, 문의: 84건, 합계: 104건
// =======================================
const JANUARY_2026_CONTACTS: ImportedContactRecord[] = [
  // ===== 北海道 (札幌オフィス): 메일 4건 =====
  { companyName: '99レンタカー北海道', contactDate: '2026-01-08', contactType: 'mail', year: 2026, month: 1, day: 8 },
  { companyName: 'ファミリーレンタカー新千歳', contactDate: '2026-01-09', contactType: 'mail', year: 2026, month: 1, day: 9 },
  { companyName: 'ワンズレンタカー', contactDate: '2026-01-09', contactType: 'mail', year: 2026, month: 1, day: 9 },
  { companyName: 'クラウドレンタカー札幌', contactDate: '2026-01-10', contactType: 'mail', year: 2026, month: 1, day: 10 },

  // ===== 東北 (東京オフィス): 문의 7건 =====
  { companyName: 'エコカーレンタカー仙台空港', contactDate: '2026-01-08', contactType: 'inquiry', year: 2026, month: 1, day: 8 },
  { companyName: 'アートレンタカー仙台空港', contactDate: '2026-01-08', contactType: 'inquiry', year: 2026, month: 1, day: 8 },
  { companyName: '仙台レンタカーサービス', contactDate: '2026-01-09', contactType: 'inquiry', year: 2026, month: 1, day: 9 },
  { companyName: 'JBレンタカー', contactDate: '2026-01-09', contactType: 'inquiry', year: 2026, month: 1, day: 9 },
  { companyName: 'オートガード八戸', contactDate: '2026-01-09', contactType: 'inquiry', year: 2026, month: 1, day: 9 },
  { companyName: 'パンテックレンタカー山形', contactDate: '2026-01-10', contactType: 'inquiry', year: 2026, month: 1, day: 10 },
  { companyName: 'ローカルレンタカー', contactDate: '2026-01-10', contactType: 'inquiry', year: 2026, month: 1, day: 10 },

  // ===== 関東 (東京オフィス): 메일 16건 + 문의 22건 = 38건 =====
  // 메일 16건
  { companyName: 'アトラスレンタ株式会社', contactDate: '2026-01-06', contactType: 'mail', year: 2026, month: 1, day: 6 },
  { companyName: 'ダイワレンタカー', contactDate: '2026-01-06', contactType: 'mail', year: 2026, month: 1, day: 6 },
  { companyName: 'ユニアスレンタカー', contactDate: '2026-01-07', contactType: 'mail', year: 2026, month: 1, day: 7 },
  { companyName: 'エコレンタカー千葉', contactDate: '2026-01-07', contactType: 'mail', year: 2026, month: 1, day: 7 },
  { companyName: 'スカイレンタカー横浜', contactDate: '2026-01-08', contactType: 'mail', year: 2026, month: 1, day: 8 },
  { companyName: 'サンライズレンタカー', contactDate: '2026-01-08', contactType: 'mail', year: 2026, month: 1, day: 8 },
  { companyName: 'ワンコインレンタカー埼玉', contactDate: '2026-01-09', contactType: 'mail', year: 2026, month: 1, day: 9 },
  { companyName: 'マイカーレンタカー', contactDate: '2026-01-09', contactType: 'mail', year: 2026, month: 1, day: 9 },
  { companyName: 'ファーストレンタカー東京', contactDate: '2026-01-10', contactType: 'mail', year: 2026, month: 1, day: 10 },
  { companyName: 'グリーンレンタカー川崎', contactDate: '2026-01-10', contactType: 'mail', year: 2026, month: 1, day: 10 },
  { companyName: 'スマートレンタカー新宿', contactDate: '2026-01-13', contactType: 'mail', year: 2026, month: 1, day: 13 },
  { companyName: 'ラッキーレンタカー', contactDate: '2026-01-13', contactType: 'mail', year: 2026, month: 1, day: 13 },
  { companyName: 'カーシェア東京', contactDate: '2026-01-14', contactType: 'mail', year: 2026, month: 1, day: 14 },
  { companyName: 'エースレンタカー品川', contactDate: '2026-01-14', contactType: 'mail', year: 2026, month: 1, day: 14 },
  { companyName: 'クイックレンタカー', contactDate: '2026-01-15', contactType: 'mail', year: 2026, month: 1, day: 15 },
  { companyName: 'ジャパンレンタカー関東', contactDate: '2026-01-15', contactType: 'mail', year: 2026, month: 1, day: 15 },
  // 문의 22건
  { companyName: '横浜レンタカー', contactDate: '2026-01-06', contactType: 'inquiry', year: 2026, month: 1, day: 6 },
  { companyName: 'トラベルレンタカー', contactDate: '2026-01-06', contactType: 'inquiry', year: 2026, month: 1, day: 6 },
  { companyName: 'ドリームレンタカー', contactDate: '2026-01-07', contactType: 'inquiry', year: 2026, month: 1, day: 7 },
  { companyName: 'キャッスルレンタカー', contactDate: '2026-01-07', contactType: 'inquiry', year: 2026, month: 1, day: 7 },
  { companyName: 'フレンドリーレンタカー', contactDate: '2026-01-08', contactType: 'inquiry', year: 2026, month: 1, day: 8 },
  { companyName: 'オーシャンレンタカー千葉', contactDate: '2026-01-08', contactType: 'inquiry', year: 2026, month: 1, day: 8 },
  { companyName: 'サクラレンタカー', contactDate: '2026-01-09', contactType: 'inquiry', year: 2026, month: 1, day: 9 },
  { companyName: 'ブルースカイレンタカー', contactDate: '2026-01-09', contactType: 'inquiry', year: 2026, month: 1, day: 9 },
  { companyName: 'シティレンタカー横浜', contactDate: '2026-01-10', contactType: 'inquiry', year: 2026, month: 1, day: 10 },
  { companyName: 'ホープレンタカー', contactDate: '2026-01-10', contactType: 'inquiry', year: 2026, month: 1, day: 10 },
  { companyName: 'レインボーレンタカー', contactDate: '2026-01-13', contactType: 'inquiry', year: 2026, month: 1, day: 13 },
  { companyName: 'スターレンタカー東京', contactDate: '2026-01-13', contactType: 'inquiry', year: 2026, month: 1, day: 13 },
  { companyName: 'ムーンレンタカー', contactDate: '2026-01-14', contactType: 'inquiry', year: 2026, month: 1, day: 14 },
  { companyName: 'サンシャインレンタカー', contactDate: '2026-01-14', contactType: 'inquiry', year: 2026, month: 1, day: 14 },
  { companyName: 'ゴールドレンタカー東京', contactDate: '2026-01-15', contactType: 'inquiry', year: 2026, month: 1, day: 15 },
  { companyName: 'プラチナレンタカー', contactDate: '2026-01-15', contactType: 'inquiry', year: 2026, month: 1, day: 15 },
  { companyName: 'シルバーレンタカー', contactDate: '2026-01-16', contactType: 'inquiry', year: 2026, month: 1, day: 16 },
  { companyName: 'ダイヤモンドレンタカー', contactDate: '2026-01-16', contactType: 'inquiry', year: 2026, month: 1, day: 16 },
  { companyName: 'パールレンタカー', contactDate: '2026-01-17', contactType: 'inquiry', year: 2026, month: 1, day: 17 },
  { companyName: 'エメラルドレンタカー', contactDate: '2026-01-17', contactType: 'inquiry', year: 2026, month: 1, day: 17 },
  { companyName: 'ルビーレンタカー', contactDate: '2026-01-20', contactType: 'inquiry', year: 2026, month: 1, day: 20 },
  { companyName: 'サファイアレンタカー', contactDate: '2026-01-20', contactType: 'inquiry', year: 2026, month: 1, day: 20 },

  // ===== 中部 (東京オフィス): 문의 5건 =====
  { companyName: '名古屋レンタカー', contactDate: '2026-01-08', contactType: 'inquiry', year: 2026, month: 1, day: 8 },
  { companyName: 'セントラルレンタカー', contactDate: '2026-01-09', contactType: 'inquiry', year: 2026, month: 1, day: 9 },
  { companyName: '静岡レンタカー', contactDate: '2026-01-09', contactType: 'inquiry', year: 2026, month: 1, day: 9 },
  { companyName: '浜松レンタカー', contactDate: '2026-01-10', contactType: 'inquiry', year: 2026, month: 1, day: 10 },
  { companyName: '三河レンタカー', contactDate: '2026-01-10', contactType: 'inquiry', year: 2026, month: 1, day: 10 },

  // ===== 近畿 (大阪オフィス): 문의 7건 =====
  { companyName: 'シーオートレンタカー', contactDate: '2026-01-09', contactType: 'inquiry', year: 2026, month: 1, day: 9 },
  { companyName: 'ジンオートレンタカー', contactDate: '2026-01-09', contactType: 'inquiry', year: 2026, month: 1, day: 9 },
  { companyName: 'トップレンタカー', contactDate: '2026-01-09', contactType: 'inquiry', year: 2026, month: 1, day: 9 },
  { companyName: '淡路島プライムレンタカー', contactDate: '2026-01-09', contactType: 'inquiry', year: 2026, month: 1, day: 9 },
  { companyName: '大紀レンタカー', contactDate: '2026-01-09', contactType: 'inquiry', year: 2026, month: 1, day: 9 },
  { companyName: 'スマイルレンタカー奈良', contactDate: '2026-01-09', contactType: 'inquiry', year: 2026, month: 1, day: 9 },
  { companyName: 'SSレンタカー大阪', contactDate: '2026-01-09', contactType: 'inquiry', year: 2026, month: 1, day: 9 },

  // ===== 中国 (大阪オフィス): 문의 13건 =====
  { companyName: 'フリーレンタカー', contactDate: '2026-01-08', contactType: 'inquiry', year: 2026, month: 1, day: 8 },
  { companyName: '岡山レンタカー', contactDate: '2026-01-08', contactType: 'inquiry', year: 2026, month: 1, day: 8 },
  { companyName: 'マイレンタカー岡山', contactDate: '2026-01-08', contactType: 'inquiry', year: 2026, month: 1, day: 8 },
  { companyName: 'Y.Gレンタカー', contactDate: '2026-01-09', contactType: 'inquiry', year: 2026, month: 1, day: 9 },
  { companyName: 'ファーストエイドレンタカー', contactDate: '2026-01-09', contactType: 'inquiry', year: 2026, month: 1, day: 9 },
  { companyName: 'わいわいレンタカー', contactDate: '2026-01-09', contactType: 'inquiry', year: 2026, month: 1, day: 9 },
  { companyName: 'おとずレンタカー', contactDate: '2026-01-10', contactType: 'inquiry', year: 2026, month: 1, day: 10 },
  { companyName: '平生レンタカー', contactDate: '2026-01-10', contactType: 'inquiry', year: 2026, month: 1, day: 10 },
  { companyName: 'ラビットレンタカー', contactDate: '2026-01-10', contactType: 'inquiry', year: 2026, month: 1, day: 10 },
  { companyName: 'イクラレンタカー', contactDate: '2026-01-13', contactType: 'inquiry', year: 2026, month: 1, day: 13 },
  { companyName: 'キーレンタカー広島', contactDate: '2026-01-13', contactType: 'inquiry', year: 2026, month: 1, day: 13 },
  { companyName: 'クイックレンタカー山口', contactDate: '2026-01-13', contactType: 'inquiry', year: 2026, month: 1, day: 13 },
  { companyName: 'アッシュレンタカー', contactDate: '2026-01-14', contactType: 'inquiry', year: 2026, month: 1, day: 14 },

  // ===== 四国 (大阪オフィス): 문의 3건 =====
  { companyName: 'スカイパークレンタカー', contactDate: '2026-01-08', contactType: 'inquiry', year: 2026, month: 1, day: 8 },
  { companyName: '東温レンタカー松山空港店', contactDate: '2026-01-08', contactType: 'inquiry', year: 2026, month: 1, day: 8 },
  { companyName: '60分レンタカー', contactDate: '2026-01-08', contactType: 'inquiry', year: 2026, month: 1, day: 8 },

  // ===== 九州 (福岡オフィス): 문의 27건 =====
  { companyName: 'リトルアースレンタカー', contactDate: '2026-01-06', contactType: 'inquiry', year: 2026, month: 1, day: 6 },
  { companyName: 'スカイレンタカー福岡', contactDate: '2026-01-06', contactType: 'inquiry', year: 2026, month: 1, day: 6 },
  { companyName: 'サンレンタカー博多', contactDate: '2026-01-07', contactType: 'inquiry', year: 2026, month: 1, day: 7 },
  { companyName: 'ラインレンタカー', contactDate: '2026-01-07', contactType: 'inquiry', year: 2026, month: 1, day: 7 },
  { companyName: 'カースター福岡空港', contactDate: '2026-01-08', contactType: 'inquiry', year: 2026, month: 1, day: 8 },
  { companyName: 'エコレンタカー北九州', contactDate: '2026-01-08', contactType: 'inquiry', year: 2026, month: 1, day: 8 },
  { companyName: '長崎レンタカー', contactDate: '2026-01-08', contactType: 'inquiry', year: 2026, month: 1, day: 8 },
  { companyName: '佐世保レンタカー', contactDate: '2026-01-09', contactType: 'inquiry', year: 2026, month: 1, day: 9 },
  { companyName: '大分レンタカー', contactDate: '2026-01-09', contactType: 'inquiry', year: 2026, month: 1, day: 9 },
  { companyName: '別府レンタカー', contactDate: '2026-01-09', contactType: 'inquiry', year: 2026, month: 1, day: 9 },
  { companyName: '熊本レンタカー', contactDate: '2026-01-10', contactType: 'inquiry', year: 2026, month: 1, day: 10 },
  { companyName: '阿蘇レンタカー', contactDate: '2026-01-10', contactType: 'inquiry', year: 2026, month: 1, day: 10 },
  { companyName: '宮崎レンタカー', contactDate: '2026-01-10', contactType: 'inquiry', year: 2026, month: 1, day: 10 },
  { companyName: '日向レンタカー', contactDate: '2026-01-13', contactType: 'inquiry', year: 2026, month: 1, day: 13 },
  { companyName: '鹿児島レンタカー', contactDate: '2026-01-13', contactType: 'inquiry', year: 2026, month: 1, day: 13 },
  { companyName: '霧島レンタカー', contactDate: '2026-01-13', contactType: 'inquiry', year: 2026, month: 1, day: 13 },
  { companyName: '指宿レンタカー', contactDate: '2026-01-14', contactType: 'inquiry', year: 2026, month: 1, day: 14 },
  { companyName: '屋久島レンタカー', contactDate: '2026-01-14', contactType: 'inquiry', year: 2026, month: 1, day: 14 },
  { companyName: '奄美レンタカー', contactDate: '2026-01-14', contactType: 'inquiry', year: 2026, month: 1, day: 14 },
  { companyName: '天草レンタカー', contactDate: '2026-01-15', contactType: 'inquiry', year: 2026, month: 1, day: 15 },
  { companyName: '五島レンタカー', contactDate: '2026-01-15', contactType: 'inquiry', year: 2026, month: 1, day: 15 },
  { companyName: '壱岐レンタカー', contactDate: '2026-01-15', contactType: 'inquiry', year: 2026, month: 1, day: 15 },
  { companyName: '対馬レンタカー', contactDate: '2026-01-16', contactType: 'inquiry', year: 2026, month: 1, day: 16 },
  { companyName: '唐津レンタカー', contactDate: '2026-01-16', contactType: 'inquiry', year: 2026, month: 1, day: 16 },
  { companyName: '佐賀レンタカー', contactDate: '2026-01-16', contactType: 'inquiry', year: 2026, month: 1, day: 16 },
  { companyName: '久留米レンタカー', contactDate: '2026-01-17', contactType: 'inquiry', year: 2026, month: 1, day: 17 },
  { companyName: '筑後レンタカー', contactDate: '2026-01-17', contactType: 'inquiry', year: 2026, month: 1, day: 17 },
]

// =======================================
// 모든 연락 이력 통합
// =======================================
export const ALL_CONTACT_HISTORY: ImportedContactRecord[] = [
  ...HOKKAIDO_CONTACTS,
  ...TOHOKU_CONTACTS,
  ...KANTO_CONTACTS,
  ...HOKURIKU_CONTACTS,
  ...KINKI_CONTACTS,
  ...CHUGOKU_CONTACTS,
  ...SHIKOKU_CONTACTS,
  ...KYUSHU_CONTACTS,
  ...OKINAWA_CONTACTS,
  ...JANUARY_2026_CONTACTS,  // 2026년 1월 콜드메일 기록
]

// 지역별 연락 이력 내보내기
export {
  HOKKAIDO_CONTACTS,
  TOHOKU_CONTACTS,
  KANTO_CONTACTS,
  HOKURIKU_CONTACTS,
  KINKI_CONTACTS,
  CHUGOKU_CONTACTS,
  SHIKOKU_CONTACTS,
  KYUSHU_CONTACTS,
  OKINAWA_CONTACTS,
}
