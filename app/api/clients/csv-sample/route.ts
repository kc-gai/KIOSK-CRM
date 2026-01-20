import { NextRequest, NextResponse } from 'next/server'

// UTF-8 BOM
const BOM = '\uFEFF'

// 통합 샘플 (FC/법인/지점 한번에)
const UNIFIED_SAMPLE = `fcCode,fcName,corpCode,corpName,branchCode,branchName,brand,zip,address,contact,managerName,managerPhone
FC001,ニッポンレンタカー,CORP001,ニッポンレンタカー北海道,BR001,札幌駅前,NIPPON RENT-A-CAR,060-0001,北海道札幌市中央区北一条,011-234-5678,田中太郎,090-1234-5678
FC001,ニッポンレンタカー,CORP001,ニッポンレンタカー北海道,BR002,新千歳空港,NIPPON RENT-A-CAR,066-0012,北海道千歳市新千歳空港,011-234-5679,田中花子,090-1234-5679
FC002,スカイレンタカー,CORP002,スカイレンタカー四国,BR003,徳島空港,SKY RENT-A-CAR,770-0011,徳島県徳島市外町朝日町120-7,03-1234-5678,山田太郎,090-2345-6789
FC002,スカイレンタカー,CORP002,スカイレンタカー四国,BR004,高松空港,SKY RENT-A-CAR,761-0301,香川県高松市空港町,03-1234-5679,山田花子,090-2345-6790
,, CORP003,独立法人株式会社,BR005,本店,,100-0001,東京都千代田区,03-9999-8888,佐藤一郎,090-9999-8888`

export async function GET(req: NextRequest) {
    const csvContent = BOM + UNIFIED_SAMPLE
    const filename = 'client_import_sample.csv'

    return new NextResponse(csvContent, {
        status: 200,
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    })
}
