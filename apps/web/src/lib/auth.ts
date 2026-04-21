import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@anydigi-lab/database/db";
import { profiles } from "@anydigi-lab/database/schema/users";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const [found] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.email, user.email))
        .limit(1);
      return !!found;
    },
  },
});
