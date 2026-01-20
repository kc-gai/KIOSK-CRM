import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
    const email = "admin@example.com"
    const password = "password123"

    const hashedPassword = await bcrypt.hash(password, 10)

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: { password: hashedPassword },
            create: {
                email,
                name: "Admin",
                password: hashedPassword,
                role: "ADMIN"
            }
        })

        // Create sample partners if empty
        const count = await prisma.partner.count()
        if (count === 0) {
            await prisma.partner.createMany({
                data: [
                    { name: 'Alpha Electronics', type: 'SUPPLIER', contact: '010-1111-2222', address: 'Seoul' },
                    { name: 'Cafe Delight', type: 'CLIENT', contact: '010-3333-4444', address: 'Busan' },
                    { name: 'Speedy Logistics', type: 'LOGISTICS', contact: '1588-9999', address: 'Incheon' }
                ]
            })
        }

        return NextResponse.json({ success: true, message: "Admin created: admin@example.com / password123" })
    } catch (e) {
        return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
    }
}
