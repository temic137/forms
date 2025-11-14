import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { prisma } from "./prisma";
import { firebaseAdminAuth } from "./firebase-admin";

const providers: NextAuthOptions["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

providers.push(
  CredentialsProvider({
    id: "credentials",
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error("Invalid credentials");
      }

      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      });

      if (!user || !user.password) {
        throw new Error("Invalid credentials");
      }

      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.password
      );

      if (!isPasswordValid) {
        throw new Error("Invalid credentials");
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
      };
    },
  })
);

providers.push(
  CredentialsProvider({
    id: "firebase",
    name: "Firebase",
    credentials: {
      idToken: { label: "Firebase ID Token", type: "text" },
    },
    async authorize(credentials) {
      if (!credentials?.idToken) {
        throw new Error("Missing Firebase ID token");
      }

      try {
        const decoded = await firebaseAdminAuth().verifyIdToken(
          credentials.idToken
        );

        const email = decoded.email;

        if (!email) {
          throw new Error("Firebase account does not have an email");
        }

        const displayName = decoded.name || "";

        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          const hashedPassword = await bcrypt.hash(
            randomBytes(32).toString("hex"),
            10
          );

          user = await prisma.user.create({
            data: {
              email,
              name: displayName,
              password: hashedPassword,
            },
          });
        } else {
          const updates: {
            name?: string;
            password?: string;
          } = {};

          if (!user.name && displayName) {
            updates.name = displayName;
          }

          if (!user.password) {
            updates.password = await bcrypt.hash(
              randomBytes(32).toString("hex"),
              10
            );
          }

          if (Object.keys(updates).length > 0) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: updates,
            });
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      } catch (error) {
        // Enhanced error logging for debugging
        if (error instanceof Error) {
          console.error("Firebase ID token verification failed:", {
            message: error.message,
            name: error.name,
            stack: error.stack,
          });
          
          // Check if it's a Firebase Admin initialization error
          if (error.message.includes("Missing Firebase Admin credentials")) {
            throw new Error(
              "Firebase Admin not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables."
            );
          }
          
          // Check if it's a token verification error
          if (error.message.includes("auth/") || error.message.includes("Firebase")) {
            throw new Error(`Firebase verification failed: ${error.message}`);
          }
        }
        
        console.error("Firebase ID token verification failed:", error);
        throw new Error("Firebase verification failed");
      }
    },
  })
);

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            const hashedPassword = await bcrypt.hash(
              randomBytes(32).toString("hex"),
              10
            );

            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || "",
                password: hashedPassword,
              },
            });
          } else if (!existingUser.password) {
            const hashedPassword = await bcrypt.hash(
              randomBytes(32).toString("hex"),
              10
            );

            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                password: hashedPassword,
              },
            });
          }
        } catch (error) {
          console.error("Error during Google sign-in:", error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email || undefined },
        });

        if (dbUser) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - augmenting session user with id
          session.user.id = dbUser.id;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - augmenting token with id
        token.id = (user as { id?: string }).id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
