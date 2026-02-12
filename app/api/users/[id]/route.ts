import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-middleware"
import bcrypt from "bcryptjs"

/**
 * GET /api/users/[id]
 * Get a specific user by ID (ADMIN only)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const { id } = await params
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                lastLoginAt: true,
                createdBy: true,
                createdAt: true,
                updatedAt: true,
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error("Error fetching user:", error)
        return NextResponse.json(
            { error: "Failed to fetch user" },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/users/[id]
 * Update a user (ADMIN only)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const { id } = await params
        const body = await request.json()
        const { email, name, password, role, isActive } = body

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id }
        })

        if (!existingUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        // If email is being changed, check for duplicates
        if (email && email !== existingUser.email) {
            const emailExists = await prisma.user.findUnique({
                where: { email }
            })
            if (emailExists) {
                return NextResponse.json(
                    { error: "Email already in use" },
                    { status: 409 }
                )
            }
        }

        // Prepare update data
        const updateData: any = {}
        if (email) updateData.email = email
        if (name !== undefined) updateData.name = name
        if (role) updateData.role = role
        if (isActive !== undefined) updateData.isActive = isActive

        // Hash new password if provided
        if (password) {
            updateData.password = await bcrypt.hash(password, 10)
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
            }
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error("Error updating user:", error)
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/users/[id]
 * Delete a user (ADMIN only)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireAdmin()
    if (error) return error

    try {
        const { id } = await params

        // Prevent self-deletion
        // @ts-ignore - session.user.id exists
        if (id === session?.user?.id) {
            return NextResponse.json(
                { error: "Cannot delete your own account" },
                { status: 400 }
            )
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id }
        })

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        // Delete user
        await prisma.user.delete({
            where: { id }
        })

        return NextResponse.json(
            { message: "User deleted successfully" },
            { status: 200 }
        )
    } catch (error) {
        console.error("Error deleting user:", error)
        return NextResponse.json(
            { error: "Failed to delete user" },
            { status: 500 }
        )
    }
}
