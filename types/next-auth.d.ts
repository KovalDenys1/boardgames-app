import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      image?: string | null
    }
  }

  interface User {
    id: string
    email?: string | null
    name?: string | null
    image?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
  }
}

export default NextAuth({
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
        domain: "boardgames-app.onrender.com",
      },
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        sameSite: "none",
        path: "/",
        secure: true,
        domain: "boardgames-app.onrender.com",
      },
    },
    state: {
      name: `__Secure-next-auth.state`,
      options: {
        sameSite: "none",
        path: "/",
        secure: true,
        domain: "boardgames-app.onrender.com",
      },
    },
  },
  providers: [],
  secret: process.env.NEXTAUTH_SECRET,
})
