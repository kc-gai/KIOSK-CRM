import { prisma } from "../lib/prisma"

async function main() {
    console.log("Populating sample data for dashboard...")

    // Get existing partners
    const partners = await prisma.partner.findMany()
    const clients = partners.filter(p => p.type === 'CLIENT')

    if (clients.length === 0) {
        console.log("No clients found. Please run seed first.")
        return
    }

    // Create sample orders across different months
    const months = [
        new Date('2024-09-01'),
        new Date('2024-10-01'),
        new Date('2024-11-01'),
        new Date('2024-12-01'),
        new Date('2025-01-01'),
    ]

    let orderCount = 0
    for (const month of months) {
        // Create 2-5 orders per month
        const ordersThisMonth = Math.floor(Math.random() * 4) + 2

        for (let i = 0; i < ordersThisMonth; i++) {
            const randomClient = clients[Math.floor(Math.random() * clients.length)]
            const randomDay = Math.floor(Math.random() * 28) + 1
            const orderDate = new Date(month)
            orderDate.setDate(randomDay)

            await prisma.order.create({
                data: {
                    orderNumber: `ORD-${month.getFullYear()}${String(month.getMonth() + 1).padStart(2, '0')}-${String(orderCount++).padStart(4, '0')}`,
                    clientId: randomClient.id,
                    status: Math.random() > 0.3 ? 'SHIPPED' : 'REQUESTED',
                    orderDate: orderDate,
                    trackingNo: Math.random() > 0.5 ? `TRK-${Date.now()}-${i}` : undefined,
                    logistics: Math.random() > 0.5 ? 'ヤマト運輸' : 'クロネコヤマト'
                }
            })
        }
    }

    console.log(`Created ${orderCount} sample orders`)

    // Create sample kiosks in different regions
    const regions = [
        { name: 'Seoul', count: 5 },
        { name: 'Busan', count: 3 },
        { name: 'Incheon', count: 2 },
        { name: 'Daegu', count: 2 },
        { name: 'Warehouse', count: 3 }
    ]

    let kioskCount = 0
    for (const region of regions) {
        for (let i = 0; i < region.count; i++) {
            const status = region.name === 'Warehouse' ? 'IN_STOCK' :
                Math.random() > 0.2 ? 'DEPLOYED' : 'MAINTENANCE'

            const kiosk = await prisma.kiosk.create({
                data: {
                    serialNumber: `SN-${region.name.toUpperCase()}-${String(kioskCount++).padStart(4, '0')}`,
                    modelName: `Kiosk Model ${['A', 'B', 'C'][Math.floor(Math.random() * 3)]}`,
                    status: status,
                    acquisition: Math.random() > 0.5 ? 'PURCHASE' : 'LEASE',
                    currentLocation: `${region.name} ${Math.random() > 0.5 ? 'District A' : 'District B'}`,
                }
            })

            await prisma.locationHistory.create({
                data: {
                    kioskId: kiosk.id,
                    newLocation: kiosk.currentLocation,
                    description: 'Initial deployment'
                }
            })
        }
    }

    console.log(`Created ${kioskCount} sample kiosks`)
    console.log("Sample data population complete!")
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
