import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const json = await req.json()
        if (!Array.isArray(json)) {
            return new NextResponse("Invalid format: expected array", { status: 400 })
        }

        // Process each order. We need to find the Client ID by name.
        // This is less efficient than minimal SQL but simpler to implement safely.
        // We'll iterate and find/create.

        // Better strategy: 
        // 1. Get all clients map (Name -> ID)
        // 2. Iterate and match

        const partners = await prisma.partner.findMany()
        const partnerMap = new Map()
        partners.forEach(p => partnerMap.set(p.name, p.id))

        let successCount = 0
        let failCount = 0

        // Use transaction if possible, or just Promise.all
        await Promise.all(json.map(async (row: any) => {
            const clientName = row.clientName
            const clientId = partnerMap.get(clientName)

            if (!clientId) {
                failCount++
                return
            }

            try {
                await prisma.order.create({
                    data: {
                        orderNumber: row.orderNumber || `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        clientId: clientId,
                        status: row.status || 'REQUESTED',
                        trackingNo: row.trackingNo,
                        logistics: row.logistics,
                        shippedDate: (row.status === 'SHIPPED' || row.trackingNo) ? new Date() : undefined
                    }
                })
                successCount++
            } catch (e) {
                failCount++
            }
        }))

        return NextResponse.json({ success: true, count: successCount, failed: failCount })
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
