import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        // Database lama menggunakan tabel m_admin untuk login
        const user = await prisma.admin.findFirst({
          where: { username: credentials.username },
        });

        if (!user) {
          return null;
        }

        // Database lama menggunakan MD5 murni tanpa salt
        const md5Hash = crypto
          .createHash("md5")
          .update(credentials.password)
          .digest("hex");

        if (md5Hash !== user.password) {
          return null;
        }

        // Map legacy fields to NextAuth token format
        return {
          id: user.id.toString(),
          email: user.username, // NextAuth membutuhkan email, kita isi dengan username
          name: user.username,
          role: user.level, // 'admin', 'guru', 'siswa'
          kon_id: user.kon_id, // Penting untuk cek relasi tabel master
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.kon_id = user.kon_id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.kon_id = token.kon_id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
