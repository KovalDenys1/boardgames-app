import NextAuth from 'next-auth'
import { getAuthOptions } from '@/lib/next-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Initialize NextAuth at request time to avoid build-time issues
export const GET = (req: Request, ctx: any) => NextAuth(getAuthOptions())(req, ctx as any)
export const POST = (req: Request, ctx: any) => NextAuth(getAuthOptions())(req, ctx as any)
