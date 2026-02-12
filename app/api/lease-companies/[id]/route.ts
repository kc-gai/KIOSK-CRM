import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET: 리스 회사 상세 조회
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const leaseCompany = await prisma.leaseCompany.findUnique({
            where: { id },
            include: {
                leasedKiosks: {
                    select: {
                        id: true,
                        serialNumber: true,
                        kioskNumber: true,
                        branchName: true,
                        status: true,
                        leaseMonthlyFee: true,
                        leasePeriod: true,
                        leaseStartDate: true,
                        leaseEndDate: true,
                        leaseContractNo: true,
                        currentPartner: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                _count: {
                    select: { leasedKiosks: true }
                }
            }
        })

        if (!leaseCompany) {
            return new NextResponse("Not Found", { status: 404 })
        }

        return NextResponse.json(leaseCompany)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

// PUT: 리스 회사 수정
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const json = await req.json()

        const existing = await prisma.leaseCompany.findUnique({ where: { id } })
        if (!existing) {
            return new NextResponse("Not Found", { status: 404 })
        }

        const leaseCompany = await prisma.leaseCompany.update({
            where: { id },
            data: {
                name: json.name !== undefined ? json.name : existing.name,
                code: json.code !== undefined ? json.code : existing.code,
                contact: json.contact !== undefined ? json.contact : existing.contact,
                email: json.email !== undefined ? json.email : existing.email,
                address: json.address !== undefined ? json.address : existing.address,
                managerName: json.managerName !== undefined ? json.managerName : existing.managerName,
                managerPhone: json.managerPhone !== undefined ? json.managerPhone : existing.managerPhone,
                managerEmail: json.managerEmail !== undefined ? json.managerEmail : existing.managerEmail,
                defaultMonthlyFee: json.defaultMonthlyFee !== undefined
                    ? (json.defaultMonthlyFee ? parseInt(json.defaultMonthlyFee) : null)
                    : existing.defaultMonthlyFee,
                defaultPeriod: json.defaultPeriod !== undefined
                    ? (json.defaultPeriod ? parseInt(json.defaultPeriod) : null)
                    : existing.defaultPeriod,
                contractTerms: json.contractTerms !== undefined ? json.contractTerms : existing.contractTerms,
                isActive: json.isActive !== undefined ? json.isActive : existing.isActive
            }
        })

        return NextResponse.json(leaseCompany)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

// DELETE: 리스 회사 삭제
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const existing = await prisma.leaseCompany.findUnique({
            where: { id },
            include: { _count: { select: { leasedKiosks: true } } }
        })
        if (!existing) {
            return new NextResponse("Not Found", { status: 404 })
        }

        // 리스된 키오스크가 있으면 삭제 불가
        if (existing._count.leasedKiosks > 0) {
            return new NextResponse("Cannot delete lease company with existing leased kiosks", { status: 400 })
        }

        await prisma.leaseCompany.delete({
            where: { id }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
