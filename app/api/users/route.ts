import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-middleware"
import bcrypt from "bcryptjs"

/**
 * GET /api/users
 * Get all users (ADMIN only)
 */
export async function GET() {
    const { error, session } = await requireAdmin()
    if (error) return error

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
                // Exclude password from response
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(users)
    } catch (error) {
        console.error("Error fetching users:", error)
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        )
    }
}

/**
 * POST /api/users
 * Create a new user (ADMIN only)
 */
export async function POST(request: NextRequest) {
    const { error, session } = await requireAdmin()
    if (error) return error

    try {
        const body = await request.json()
        const { email, name, password, role, isActive } = body

        // Validation
        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            )
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 409 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user
        const newUser = await prisma.user.create({
            data: {
                email,
                name: name || null,
                password: hashedPassword,
                role: role || "USER",
                isActive: isActive !== undefined ? isActive : true,
                // @ts-ignore - session.user.id exists
                createdBy: session?.user?.id || null
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            }
        })

        return NextResponse.json(newUser, { status: 201 })
    } catch (error) {
        console.error("Error creating user:", error)
        return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 }
        )
    }
}
