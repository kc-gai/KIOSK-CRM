/**
 * JSON 데이터를 Supabase(PostgreSQL)로 import하는 스크립트
 * 사용법: DATABASE_URL="postgresql://..." npx tsx scripts/import-to-supabase.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function importData() {
  console.log('Supabase로 데이터 import 시작...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...')

  const exportPath = path.join(process.cwd(), 'data-export', 'all-data.json')

  if (!fs.existsSync(exportPath)) {
    console.error('export 파일이 없습니다. 먼저 export-local-data.ts를 실행하세요.')
    process.exit(1)
  }

  const allData = JSON.parse(fs.readFileSync(exportPath, 'utf-8'))

  // import 순서 (외래키 의존성 고려)
  const importOrder = [
    { name: 'users', model: prisma.user },
    { name: 'regions', model: prisma.region },
    { name: 'areas', model: prisma.area },
    { name: 'fcs', model: prisma.fC },
    { name: 'leaseCompanies', model: prisma.leaseCompany },
    { name: 'corporations', model: prisma.corporation },
    { name: 'branches', model: prisma.branch },
    { name: 'partners', model: prisma.partner },
    { name: 'kiosks', model: prisma.kiosk },
    { name: 'orders', model: prisma.order },
    { name: 'orderKiosks', model: prisma.orderKiosk },
    { name: 'locationHistories', model: prisma.locationHistory },
    { name: 'manuals', model: prisma.manual },
    { name: 'assemblyManuals', model: prisma.assemblyManual },
    { name: 'assemblyManualSections', model: prisma.assemblyManualSection },
    { name: 'processes', model: prisma.process },
    { name: 'deliveries', model: prisma.delivery },
    { name: 'notifications', model: prisma.notification },
    { name: 'kioskSales', model: prisma.kioskSale },
    { name: 'kioskPricings', model: prisma.kioskPricing },
    { name: 'salesHistories', model: prisma.salesHistory },
    { name: 'apiConfigs', model: prisma.apiConfig },
    { name: 'orderProcesses', model: prisma.orderProcess },
    { name: 'deliveryProcesses', model: prisma.deliveryProcess },
    { name: 'deliveryRequests', model: prisma.deliveryRequest },
    { name: 'deliveryRequestItems', model: prisma.deliveryRequestItem },
    { name: 'kioskRepairs', model: prisma.kioskRepair },
    { name: 'sampleLoans', model: prisma.sampleLoan },
    { name: 'calendarEvents', model: prisma.calendarEvent },
    { name: 'systemSettings', model: prisma.systemSetting },
  ]

  for (const { name, model } of importOrder) {
    const data = allData[name]
    if (!data || data.length === 0) {
      console.log(`  ${name}: 스킵 (데이터 없음)`)
      continue
    }

    try {
      // 기존 데이터 삭제 (옵션)
      // await (model as any).deleteMany()

      // 데이터 삽입 (upsert로 중복 방지)
      let successCount = 0
      for (const item of data) {
        try {
          await (model as any).upsert({
            where: { id: item.id },
            update: item,
            create: item,
          })
          successCount++
        } catch (err: any) {
          // unique constraint 에러 등 무시
          if (!err.message?.includes('Unique constraint')) {
            console.log(`    ${name} insert 에러:`, err.message?.substring(0, 100))
          }
        }
      }
      console.log(`  ${name}: ${successCount}/${data.length}건 완료`)
    } catch (error: any) {
      console.log(`  ${name}: 에러 - ${error.message?.substring(0, 100)}`)
    }
  }

  console.log('\n데이터 import 완료!')
  await prisma.$disconnect()
}

importData().catch(console.error)
