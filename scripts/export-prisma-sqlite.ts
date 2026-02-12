/**
 * prisma/dev.db SQLite 데이터를 JSON으로 export
 */

import * as fs from 'fs'
import * as path from 'path'
import Database from 'better-sqlite3'

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')

async function exportData() {
  console.log('prisma/dev.db 데이터 export 시작...')
  console.log('DB 경로:', dbPath)

  if (!fs.existsSync(dbPath)) {
    console.error('prisma/dev.db 파일이 없습니다.')
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
  let totalRecords = 0

  for (const { name } of tables) {
    try {
      const data = db.prepare(`SELECT * FROM "${name}"`).all()
      allData[name] = data
      totalRecords += data.length
      console.log(`  ${name}: ${data.length}건`)
    } catch (error) {
      console.log(`  ${name}: 에러`)
    }
  }

  const exportPath = path.join(exportDir, 'prisma-sqlite-data.json')
  fs.writeFileSync(exportPath, JSON.stringify(allData, null, 2))
  console.log(`\n총 ${totalRecords}건 데이터 export 완료: ${exportPath}`)

  db.close()
}

exportData().catch(console.error)
