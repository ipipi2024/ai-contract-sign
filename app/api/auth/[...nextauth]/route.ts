// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// Create the handler
const handler = NextAuth(authOptions)

// Export named exports for each HTTP method
export { handler as GET, handler as POST }