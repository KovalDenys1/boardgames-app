import NextAuth from 'next-auth'
import { authOptions } from '@/lib/next-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
