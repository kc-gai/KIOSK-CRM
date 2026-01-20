// import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

console.log("Checking Env:", process.env.DATABASE_URL ? "Loaded" : "Missing")

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
})

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10)

    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            name: 'Admin User',
            password: hashedPassword,
            role: 'ADMIN',
        },
    })

    console.log({ admin })

    // Create some sample partners
    await prisma.partner.deleteMany() // Reset partners for seed

    const supplier = await prisma.partner.create({
        data: {
            name: 'Alpha Electronics',
            type: 'SUPPLIER',
            contact: '010-1234-5678',
            address: 'Seoul, Korea'
        }
    })

    const client = await prisma.partner.create({
        data: {
            name: 'Cafe Delight',
            type: 'CLIENT',
            contact: '010-9876-5432',
            address: 'Busan, Korea'
        }
    })

    // Create Logistics
    const logistics = await prisma.partner.create({
        data: {
            name: 'Speedy Logistics',
            type: 'LOGISTICS',
            contact: '1588-0000',
            address: 'Incheon, Korea'
        }
    })

    console.log({ supplier, client, logistics })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
