import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const process = await prisma.process.findUnique({
            where: { id },
            include: {
                client: true
            }
        })

        if (!process) {
            return new NextResponse("Not Found", { status: 404 })
        }

        return NextResponse.json(process)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const json = await req.json()

        const existing = await prisma.process.findUnique({ where: { id } })
        if (!existing) {
            return new NextResponse("Not Found", { status: 404 })
        }

        const process = await prisma.process.update({
            where: { id },
            data: {
                title: json.title ?? existing.title,
                clientId: json.clientId ?? existing.clientId,
                currentStage: json.currentStage ?? existing.currentStage,

                // 1. 계약 단계
                contractStatus: json.contractStatus ?? existing.contractStatus,
                contractManager: json.contractManager ?? existing.contractManager,
                contractDate: json.contractDate ? new Date(json.contractDate) : existing.contractDate,
                legalCheckCompleted: json.legalCheckCompleted ?? existing.legalCheckCompleted,
                contractSigned: json.contractSigned ?? existing.contractSigned,
                contractDocUpdated: json.contractDocUpdated ?? existing.contractDocUpdated,
                contractNotes: json.contractNotes ?? existing.contractNotes,

                // 2. 키오스크 납품 의뢰 단계
                deliveryRequestStatus: json.deliveryRequestStatus ?? existing.deliveryRequestStatus,
                deliveryManager: json.deliveryManager ?? existing.deliveryManager,
                deliveryDate: json.deliveryDate ? new Date(json.deliveryDate) : existing.deliveryDate,
                stockConfirmed: json.stockConfirmed ?? existing.stockConfirmed,
                manufacturingRequested: json.manufacturingRequested ?? existing.manufacturingRequested,
                orderRequested: json.orderRequested ?? existing.orderRequested,
                leaseContacted: json.leaseContacted ?? existing.leaseContacted,
                externalPartsOrdered: json.externalPartsOrdered ?? existing.externalPartsOrdered,
                deliveryNotes: json.deliveryNotes ?? existing.deliveryNotes,

                // 3. 키오스크 납품 상황 확인 단계
                deliveryCheckStatus: json.deliveryCheckStatus ?? existing.deliveryCheckStatus,
                kioskShipped: json.kioskShipped ?? existing.kioskShipped,
                deliveryConfirmed: json.deliveryConfirmed ?? existing.deliveryConfirmed,
                kioskInfoUpdated: json.kioskInfoUpdated ?? existing.kioskInfoUpdated,
                trackingNumber: json.trackingNumber ?? existing.trackingNumber,
                anydeskNo: json.anydeskNo ?? existing.anydeskNo,
                serialNo: json.serialNo ?? existing.serialNo,
                deliveryCheckNotes: json.deliveryCheckNotes ?? existing.deliveryCheckNotes,

                // 4. ERP 통계 관리 단계
                erpStatus: json.erpStatus ?? existing.erpStatus,
                erpManager: json.erpManager ?? existing.erpManager,
                operationInfoCollected: json.operationInfoCollected ?? existing.operationInfoCollected,
                statsRequested: json.statsRequested ?? existing.statsRequested,
                dashboardUpdated: json.dashboardUpdated ?? existing.dashboardUpdated,
                statsReportCreated: json.statsReportCreated ?? existing.statsReportCreated,
                erpNotes: json.erpNotes ?? existing.erpNotes,
            },
            include: {
                client: true
            }
        })

        return NextResponse.json(process)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const existing = await prisma.process.findUnique({ where: { id } })
        if (!existing) {
            return new NextResponse("Not Found", { status: 404 })
        }

        await prisma.process.delete({
            where: { id }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
