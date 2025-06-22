// lib/auth.ts
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string | null
      role?: string
      plan?: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    image?: string | null
    role?: string
    plan?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role?: string
    plan?: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Allow linking if email exists
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        try {
          await connectToDatabase()
          
          // Use select('+password') since password has select: false
          const user = await User.findOne({ email: credentials.email })
            .select('+password')
            .lean()

          if (!user) {
            throw new Error("Invalid email or password")
          }

          // Check if user has a password (might be Google-only user)
          if (!user.password) {
            throw new Error("Please sign in with Google")
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            throw new Error("Invalid email or password")
          }

          // Update last login
          await User.findByIdAndUpdate(user._id, {
            lastLoginAt: new Date()
          })

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image || null,
            role: user.role,
            plan: user.plan
          }
        } catch (error) {
          console.error("Auth error:", error)
          throw error // Let NextAuth handle the error
        }
      }
    })
  ],

  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    // signUp is not a NextAuth page - handle it separately
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          await connectToDatabase()
          
          // Check if user exists
          let existingUser = await User.findOne({ email: user.email })
          
          if (!existingUser) {
            // Create new user from Google signin
            const newUser = await User.create({
              email: user.email,
              name: user.name,
              image: user.image,
              googleId: account.providerAccountId,
              emailVerified: new Date(),
              lastLoginAt: new Date()
            })
            
            // IMPORTANT: Set the MongoDB _id as the user.id
            user.id = newUser._id.toString()
            user.role = newUser.role
            user.plan = newUser.plan
          } else {
            // Update existing user
            await User.findByIdAndUpdate(existingUser._id, {
              googleId: account.providerAccountId,
              image: user.image || existingUser.image,
              lastLoginAt: new Date(),
              emailVerified: existingUser.emailVerified || new Date()
            })
            
            // IMPORTANT: Set the MongoDB _id as the user.id
            user.id = existingUser._id.toString()
            user.role = existingUser.role
            user.plan = existingUser.plan
          }
        } catch (error) {
          console.error("Error saving user:", error)
          return false
        }
      }
      return true
    },
    
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.role = user.role || 'user'
        token.plan = user.plan || 'free'
      }
      
      // Update token if user data changes
      if (trigger === "update" && session) {
        token = { ...token, ...session }
      }
      
      // Refresh user data periodically
      if (token.id) {
        try {
          await connectToDatabase()
          const dbUser = await User.findById(token.id).lean()
          if (dbUser) {
            token.role = dbUser.role
            token.plan = dbUser.plan
          }
        } catch (error) {
          console.error("Error refreshing user data:", error)
        }
      }
      
      return token
    },
    
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.plan = token.plan
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}