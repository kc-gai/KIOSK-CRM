import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

/**
 * Middleware to require authentication
 * Returns user session if authenticated, otherwise returns 401 response
 */
export async function requireAuth() {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
        return {
            error: NextResponse.json(
                { error: "Unauthorized - Authentication required" },
                { status: 401 }
            ),
            session: null
        }
    }

    return { error: null, session }
}

/**
 * Middleware to require ADMIN role
 * Returns user session if user is ADMIN, otherwise returns 403 response
 */
export async function requireAdmin() {
    const { error, session } = await requireAuth()

    if (error) {
        return { error, session: null }
    }

    // @ts-ignore - session.user.role is added via JWT callback
    if (session?.user?.role !== "ADMIN") {
        return {
            error: NextResponse.json(
                { error: "Forbidden - Admin access required" },
                { status: 403 }
            ),
            session: null
        }
    }

    return { error: null, session }
}

/**
 * Check if user has ADMIN role (for client-side or conditional logic)
 */
export function isAdmin(session: any): boolean {
    return session?.user?.role === "ADMIN"
}
