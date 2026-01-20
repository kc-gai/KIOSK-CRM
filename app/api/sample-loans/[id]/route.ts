import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

type RouteParams = { params: Promise<{ id: string }> }

// GET: 샘플 대여 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const sample = await prisma.sampleLoan.findUnique({
            where: { id }
        })

        if (!sample) {
            return NextResponse.json({ error: 'Sample loan not found' }, { status: 404 })
        }

        return NextResponse.json(sample)
    } catch (error) {
        console.error('Failed to fetch sample loan:', error)
        return NextResponse.json({ error: 'Failed to fetch sample loan' }, { status: 500 })
    }
}

// PUT: 샘플 대여 정보 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()

        const {
            status,
            serialNumber,
            modelName,
            description,
            lenderName,
            lenderContact,
            lenderPhone,
            lenderEmail,
            expectedReturnDate,
            actualReturnDate,
            purpose,
            usageLocation,
            responsiblePerson,
            returnCondition,
            returnNotes,
            convertedToKioskId,
            notes
        } = body

        const updateData: Record<string, unknown> = {}

        if (status) updateData.status = status
        if (serialNumber !== undefined) updateData.serialNumber = serialNumber
        if (modelName !== undefined) updateData.modelName = modelName
        if (description !== undefined) updateData.description = description
        if (lenderName !== undefined) updateData.lenderName = lenderName
        if (lenderContact !== undefined) updateData.lenderContact = lenderContact
        if (lenderPhone !== undefined) updateData.lenderPhone = lenderPhone
        if (lenderEmail !== undefined) updateData.lenderEmail = lenderEmail
        if (expectedReturnDate) updateData.expectedReturnDate = new Date(expectedReturnDate)
        if (actualReturnDate) updateData.actualReturnDate = new Date(actualReturnDate)
        if (purpose !== undefined) updateData.purpose = purpose
        if (usageLocation !== undefined) updateData.usageLocation = usageLocation
        if (responsiblePerson !== undefined) updateData.responsiblePerson = responsiblePerson
        if (returnCondition !== undefined) updateData.returnCondition = returnCondition
        if (returnNotes !== undefined) updateData.returnNotes = returnNotes
        if (convertedToKioskId !== undefined) updateData.convertedToKioskId = convertedToKioskId
        if (notes !== undefined) updateData.notes = notes

        const sample = await prisma.sampleLoan.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json(sample)
    } catch (error) {
        console.error('Failed to update sample loan:', error)
        return NextResponse.json({ error: 'Failed to update sample loan' }, { status: 500 })
    }
}

// DELETE: 샘플 대여 기록 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        await prisma.sampleLoan.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete sample loan:', error)
        return NextResponse.json({ error: 'Failed to delete sample loan' }, { status: 500 })
    }
}
