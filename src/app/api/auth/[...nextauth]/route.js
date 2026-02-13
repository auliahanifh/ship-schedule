import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import pool from "@/lib/db"; 
import bcrypt from "bcryptjs"; 

const handler = NextAuth({
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET, 
  pages: {
    signIn: "/login", 
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" }, 
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const result = await pool.query("SELECT * FROM users WHERE username = $1", [credentials.username]);
        const user = result.rows[0];

        if (!user) return null;
        
        let isValid = false;

        const isHashed = user.password.startsWith('$');

        if (isHashed) {
            isValid = await bcrypt.compare(credentials.password, user.password);
        } else {
            isValid = user.password === credentials.password;
        }

        if (!isValid) return null; 
        
        return {
          id: user.id,
          username: user.username,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };