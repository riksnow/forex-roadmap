import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";

// Every collection NextAuth and this app touch (users, accounts, sessions,
// progress) live in this one database inside your MongoDB cluster.
export const DB_NAME = "forex_roadmap";

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise, { databaseName: DB_NAME }),

  // Google sign-in only, as requested — no email/password or other providers.
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  // Sessions are stored in MongoDB (a real "sessions" collection), not just
  // signed cookies, so you can see logged-in users directly in Atlas.
  session: {
    strategy: "database",
  },

  secret: process.env.NEXTAUTH_SECRET,

  // Use our own styled pages instead of NextAuth's plain default ones.
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  callbacks: {
    // Make the MongoDB user _id available on the client as session.user.id
    // so we can key each person's roadmap progress to it.
    async session({ session, user }) {
      if (session?.user && user?.id) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};
