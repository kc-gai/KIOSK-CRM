import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const json = await req.json()
        // json should be an array of partners
        if (!Array.isArray(json)) {
            return new NextResponse("Invalid format: expected array", { status: 400 })
        }

        const createdCount = await prisma.partner.createMany({
            data: json.map((p: any) => ({
                name: p.name,
                type: p.type || 'CLIENT', // Default to CLIENT if missing
                contact: p.contact || '',
                address: p.address || ''
            }))
        })

        return NextResponse.json({ count: createdCount.count })
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
