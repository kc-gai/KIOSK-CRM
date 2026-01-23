import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// 허용된 Google 이메일 목록
const ALLOWED_GOOGLE_EMAILS = [
    "gai@kaflixcloud.co.jp"
]

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "admin@example.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                })

                if (!user) {
                    return null
                }

                // Check if user is active
                if (!user.isActive) {
                    return null
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

                if (!isPasswordValid) {
                    return null
                }

                // Update last login time
                await prisma.user.update({
                    where: { id: user.id },
                    data: { lastLoginAt: new Date() }
                })

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                }
            }
        })
    ],
    callbacks: {
        async signIn({ user, account }) {
            // Google 로그인인 경우 허용된 이메일만 접근 허용
            if (account?.provider === "google") {
                const email = user.email?.toLowerCase()
                if (!email || !ALLOWED_GOOGLE_EMAILS.includes(email)) {
                    return false // 허용되지 않은 이메일은 로그인 거부
                }

                // Google 로그인 사용자가 DB에 없으면 자동 생성
                const existingUser = await prisma.user.findUnique({
                    where: { email: email }
                })

                if (!existingUser) {
                    await prisma.user.create({
                        data: {
                            email: email,
                            name: user.name || "Google User",
                            password: "", // Google 로그인은 비밀번호 불필요
                            role: "ADMIN",
                            isActive: true
                        }
                    })
                }
            }
            return true
        },
        session: async ({ session, token }) => {
            // @ts-ignore
            if (session.user && token) {
                // DB에서 사용자 정보 조회
                const dbUser = await prisma.user.findUnique({
                    where: { email: session.user.email || "" }
                })
                if (dbUser) {
                    session.user.id = dbUser.id
                    session.user.role = dbUser.role
                    session.user.name = dbUser.name  // DB에서 이름 가져오기
                } else {
                    session.user.id = token.id as string
                    session.user.role = token.role as string
                    session.user.name = token.name as string
                }
            }
            return session
        },
        jwt: ({ token, user }) => {
            if (user) {
                const u = user as any
                token.id = u.id
                token.role = u.role
                token.name = u.name
            }
            return token
        }
    },
    pages: {
        signIn: "/login",
        error: "/login"
    }
}
