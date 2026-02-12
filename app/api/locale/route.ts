import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: Request) {
    try {
        const { locale } = await req.json()

        if (!locale || !['ja', 'ko'].includes(locale)) {
            return new NextResponse("Invalid locale", { status: 400 })
        }

        const cookieStore = await cookies()
        cookieStore.set('NEXT_LOCALE', locale, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365, // 1 year
            sameSite: 'lax'
        })

        return NextResponse.json({ success: true, locale })
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function GET() {
    try {
        const cookieStore = await cookies()
        const locale = cookieStore.get('NEXT_LOCALE')?.value || 'ja'
        return NextResponse.json({ locale })
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 })
    }
}
