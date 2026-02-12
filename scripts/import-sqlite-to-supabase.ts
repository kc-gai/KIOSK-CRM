/**
 * prisma/dev.db에서 export한 JSON 데이터를 Supabase로 import
 * 사용법: DATABASE_URL="..." npx tsx scripts/import-sqlite-to-supabase.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Boolean 필드 목록 (SQLite에서 0/1로 저장됨)
const booleanFields = [
  'isActive', 'isPublished', 'isLatest', 'isVisible',
  'legalCheckCompleted', 'contractSigned', 'contractDocUpdated',
  'stockConfirmed', 'manufacturingRequested', 'orderRequested',
  'leaseContacted', 'externalPartsOrdered', 'kioskShipped',
  'deliveryConfirmed', 'kioskInfoUpdated', 'operationInfoCollected',
  'statsRequested', 'dashboardUpdated', 'statsReportCreated',
  'erpReflected', 'notificationSent', 'vendorOrderSent',
  'slackNotified', 'emailNotified', 'inspectionPassed',
  'taxIncluded', 'allDay', 'encrypted', 'smtpSecure'
]

// DateTime 필드 목록 (Date 변환이 필요한 필드들)
const dateTimeFields = [
  'createdAt', 'updatedAt', 'lastLoginAt', 'contractDate',
  'leaseStartDate', 'leaseEndDate', 'orderRequestDate', 'deliveryDate',
  'shippedDate', 'orderDate', 'eventDate', 'saleDate', 'purchaseDate',
  'versionDate', 'sentAt', 'lastTestedAt', 'tokenExpiry', 'syncedAt',
  'step1CompletedAt', 'step2CompletedAt', 'step3CompletedAt',
  'step4CompletedAt', 'step5CompletedAt', 'approvalDate', 'dueDate',
  'expectedArrival', 'actualArrival', 'receiptDate', 'repairStartDate',
  'repairEndDate', 'releaseDate', 'loanDate', 'expectedReturnDate',
  'actualReturnDate', 'notificationSentAt', 'contractStartDate',
  'desiredDeliveryDate'
]

// String 필드로 유지해야 하는 필드들 (숫자를 문자열로 변환)
const stringFields = [
  'deliveryDueDate', 'desiredDeliveryWeek', 'startTime', 'endTime'
]

// 데이터 변환 헬퍼
function processItem(item: any): any {
  const processed: any = {}
  for (const [key, value] of Object.entries(item)) {
    if (booleanFields.includes(key)) {
      processed[key] = value === 1 || value === true
    }
    else if (stringFields.includes(key)) {
      // 숫자 timestamp면 날짜 문자열로 변환
      if (typeof value === 'number' && value > 1000000000000) {
        processed[key] = new Date(value).toISOString().split('T')[0]
      } else if (typeof value === 'number' && value > 1000000000) {
        processed[key] = new Date(value * 1000).toISOString().split('T')[0]
      } else {
        processed[key] = value
      }
    }
    else if (dateTimeFields.includes(key) && value !== null) {
      if (typeof value === 'number' && value > 1000000000000) {
        processed[key] = new Date(value)
      } else if (typeof value === 'number' && value > 1000000000) {
        processed[key] = new Date(value * 1000)
      } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        processed[key] = new Date(value)
      } else {
        processed[key] = value
      }
    }
    else {
      processed[key] = value
    }
  }
  return processed
}

async function importData() {
  console.log('Supabase로 데이터 import 시작...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 60) + '...')

  const exportPath = path.join(process.cwd(), 'data-export', 'prisma-sqlite-data.json')

  if (!fs.existsSync(exportPath)) {
    console.error('export 파일이 없습니다. 먼저 export-prisma-sqlite.ts를 실행하세요.')
    process.exit(1)
  }

  const allData = JSON.parse(fs.readFileSync(exportPath, 'utf-8'))

  try {
    // 1단계: 모든 테이블 삭제 (역순 - 외래키 의존성 고려)
    console.log('\n[1단계] 기존 데이터 삭제...')

    await prisma.deliveryRequestItem.deleteMany()
    await prisma.deliveryRequest.deleteMany()
    await prisma.locationHistory.deleteMany()
    await prisma.orderKiosk.deleteMany()
    await prisma.order.deleteMany()
    await prisma.kioskSale.deleteMany()
    await prisma.kioskPricing.deleteMany()
    await prisma.kioskRepair.deleteMany()
    await prisma.kiosk.deleteMany()
    await prisma.deliveryProcess.deleteMany()
    await prisma.orderProcess.deleteMany()
    await prisma.process.deleteMany()
    await prisma.branch.deleteMany()
    await prisma.corporation.deleteMany()
    await prisma.partner.deleteMany()
    await prisma.fC.deleteMany()
    await prisma.leaseCompany.deleteMany()
    await prisma.area.deleteMany()
    await prisma.region.deleteMany()
    console.log('  삭제 완료')

    // 2단계: 데이터 삽입 (순서대로)
    console.log('\n[2단계] 데이터 삽입...')

    // User
    if (allData.User?.length) {
      for (const item of allData.User) {
        try {
          await prisma.user.upsert({
            where: { id: item.id },
            update: processItem(item),
            create: processItem(item),
          })
        } catch (e) {}
      }
      console.log(`  User: ${allData.User.length}건`)
    }

    // Region
    if (allData.Region?.length) {
      for (const item of allData.Region) {
        await prisma.region.create({ data: processItem(item) })
      }
      console.log(`  Region: ${allData.Region.length}건`)
    }

    // Area
    if (allData.Area?.length) {
      for (const item of allData.Area) {
        await prisma.area.create({ data: processItem(item) })
      }
      console.log(`  Area: ${allData.Area.length}건`)
    }

    // FC
    if (allData.FC?.length) {
      for (const item of allData.FC) {
        await prisma.fC.create({ data: processItem(item) })
      }
      console.log(`  FC: ${allData.FC.length}건`)
    }

    // LeaseCompany
    if (allData.LeaseCompany?.length) {
      for (const item of allData.LeaseCompany) {
        await prisma.leaseCompany.create({ data: processItem(item) })
      }
      console.log(`  LeaseCompany: ${allData.LeaseCompany.length}건`)
    }

    // Corporation
    if (allData.Corporation?.length) {
      for (const item of allData.Corporation) {
        await prisma.corporation.create({ data: processItem(item) })
      }
      console.log(`  Corporation: ${allData.Corporation.length}건`)
    }

    // Branch
    if (allData.Branch?.length) {
      for (const item of allData.Branch) {
        await prisma.branch.create({ data: processItem(item) })
      }
      console.log(`  Branch: ${allData.Branch.length}건`)
    }

    // Partner
    if (allData.Partner?.length) {
      for (const item of allData.Partner) {
        await prisma.partner.create({ data: processItem(item) })
      }
      console.log(`  Partner: ${allData.Partner.length}건`)
    }

    // Kiosk
    if (allData.Kiosk?.length) {
      for (const item of allData.Kiosk) {
        await prisma.kiosk.create({ data: processItem(item) })
      }
      console.log(`  Kiosk: ${allData.Kiosk.length}건`)
    }

    // LocationHistory
    if (allData.LocationHistory?.length) {
      for (const item of allData.LocationHistory) {
        await prisma.locationHistory.create({ data: processItem(item) })
      }
      console.log(`  LocationHistory: ${allData.LocationHistory.length}건`)
    }

    // DeliveryRequest
    if (allData.DeliveryRequest?.length) {
      for (const item of allData.DeliveryRequest) {
        await prisma.deliveryRequest.create({ data: processItem(item) })
      }
      console.log(`  DeliveryRequest: ${allData.DeliveryRequest.length}건`)
    }

    // DeliveryRequestItem
    if (allData.DeliveryRequestItem?.length) {
      for (const item of allData.DeliveryRequestItem) {
        await prisma.deliveryRequestItem.create({ data: processItem(item) })
      }
      console.log(`  DeliveryRequestItem: ${allData.DeliveryRequestItem.length}건`)
    }

    console.log('\n========================================')
    console.log('  데이터 import 완료!')
    console.log('  https://kiosk-crm.vercel.app 에서 확인하세요')
    console.log('========================================')
  } catch (error: any) {
    console.error('에러 발생:', error.message)
  }

  await prisma.$disconnect()
}

importData().catch(console.error)
