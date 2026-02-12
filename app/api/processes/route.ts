import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const processes = await prisma.process.findMany({
            include: {
                client: true
            },
            orderBy: { updatedAt: 'desc' }
        })
        return NextResponse.json(processes)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const json = await req.json()
        const { title, clientId } = json

        const process = await prisma.process.create({
            data: {
                title,
                clientId: clientId || null,
                currentStage: 'CONTRACT',
                contractStatus: 'PENDING'
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
