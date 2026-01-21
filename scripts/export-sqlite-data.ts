/**
 * 로컬 SQLite 데이터를 직접 읽어서 JSON으로 export하는 스크립트
 * SQLite 파일을 직접 읽습니다.
 * 사용법: npx tsx scripts/export-sqlite-data.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import Database from 'better-sqlite3'

const dbPath = path.join(process.cwd(), 'dev.db')

async function exportData() {
  console.log('SQLite 데이터 export 시작...')
  console.log('DB 경로:', dbPath)

  if (!fs.existsSync(dbPath)) {
    console.error('dev.db 파일이 없습니다.')
    process.exit(1)
  }

  const db = new Database(dbPath, { readonly: true })

  const exportDir = path.join(process.cwd(), 'data-export')
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true })
  }

  // 테이블 목록 가져오기
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%'").all() as { name: string }[]

  const allData: Record<string, unknown[]> = {}

  for (const { name } of tables) {
    try {
      const data = db.prepare(`SELECT * FROM "${name}"`).all()
      allData[name] = data
      console.log(`  ${name}: ${data.length}건`)
    } catch (error) {
      console.log(`  ${name}: 에러`)
    }
  }

  const exportPath = path.join(exportDir, 'sqlite-data.json')
  fs.writeFileSync(exportPath, JSON.stringify(allData, null, 2))
  console.log(`\n데이터 export 완료: ${exportPath}`)

  db.close()
}

exportData().catch(console.error)
