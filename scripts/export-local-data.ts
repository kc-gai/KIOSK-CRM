/**
 * 로컬 SQLite 데이터를 JSON으로 export하는 스크립트
 * 사용법: npx tsx scripts/export-local-data.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function exportData() {
  console.log('로컬 데이터 export 시작...')

  const exportDir = path.join(process.cwd(), 'data-export')
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true })
  }

  const tables = [
    { name: 'users', query: () => prisma.user.findMany() },
    { name: 'partners', query: () => prisma.partner.findMany() },
    { name: 'kiosks', query: () => prisma.kiosk.findMany() },
    { name: 'orders', query: () => prisma.order.findMany() },
    { name: 'orderKiosks', query: () => prisma.orderKiosk.findMany() },
    { name: 'locationHistories', query: () => prisma.locationHistory.findMany() },
    { name: 'manuals', query: () => prisma.manual.findMany() },
    { name: 'assemblyManuals', query: () => prisma.assemblyManual.findMany() },
    { name: 'assemblyManualSections', query: () => prisma.assemblyManualSection.findMany() },
    { name: 'processes', query: () => prisma.process.findMany() },
    { name: 'deliveries', query: () => prisma.delivery.findMany() },
    { name: 'notifications', query: () => prisma.notification.findMany() },
    { name: 'kioskSales', query: () => prisma.kioskSale.findMany() },
    { name: 'regions', query: () => prisma.region.findMany() },
    { name: 'areas', query: () => prisma.area.findMany() },
    { name: 'fcs', query: () => prisma.fC.findMany() },
    { name: 'corporations', query: () => prisma.corporation.findMany() },
    { name: 'branches', query: () => prisma.branch.findMany() },
    { name: 'kioskPricings', query: () => prisma.kioskPricing.findMany() },
    { name: 'salesHistories', query: () => prisma.salesHistory.findMany() },
    { name: 'apiConfigs', query: () => prisma.apiConfig.findMany() },
    { name: 'orderProcesses', query: () => prisma.orderProcess.findMany() },
    { name: 'deliveryProcesses', query: () => prisma.deliveryProcess.findMany() },
    { name: 'deliveryRequests', query: () => prisma.deliveryRequest.findMany() },
    { name: 'deliveryRequestItems', query: () => prisma.deliveryRequestItem.findMany() },
    { name: 'kioskRepairs', query: () => prisma.kioskRepair.findMany() },
    { name: 'sampleLoans', query: () => prisma.sampleLoan.findMany() },
    { name: 'calendarEvents', query: () => prisma.calendarEvent.findMany() },
    { name: 'leaseCompanies', query: () => prisma.leaseCompany.findMany() },
    { name: 'systemSettings', query: () => prisma.systemSetting.findMany() },
  ]

  const allData: Record<string, unknown[]> = {}

  for (const table of tables) {
    try {
      const data = await table.query()
      allData[table.name] = data
      console.log(`  ${table.name}: ${data.length}건`)
    } catch (error) {
      console.log(`  ${table.name}: 0건 (테이블 없음 또는 에러)`)
      allData[table.name] = []
    }
  }

  // 전체 데이터를 하나의 JSON 파일로 저장
  const exportPath = path.join(exportDir, 'all-data.json')
  fs.writeFileSync(exportPath, JSON.stringify(allData, null, 2))
  console.log(`\n데이터 export 완료: ${exportPath}`)

  await prisma.$disconnect()
}

exportData().catch(console.error)
