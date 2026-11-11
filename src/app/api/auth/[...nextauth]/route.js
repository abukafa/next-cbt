import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
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
          console.warn("[auth] Credentials rejected: admin account not found");
          return null;
        }

        const isBcryptHash = /^\$2[aby]\$/.test(user.password);
        const isPasswordValid = isBcryptHash
          ? await bcrypt.compare(credentials.password, user.password)
          : crypto
              .createHash("md5")
              .update(credentials.password)
              .digest("hex")
              .toLowerCase() === user.password.toLowerCase();

        if (!isPasswordValid) {
          console.warn("[auth] Credentials rejected: password hash mismatch");
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
