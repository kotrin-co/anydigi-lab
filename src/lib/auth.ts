import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const ALLOWED_EMAILS = [
  // ログインを許可するGoogleアカウントのメールアドレスをここに追加
  "kentaro523@gmail.com",
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    signIn({ user }) {
      // ALLOWED_EMAILS が空の場合は全員許可（開発用）
      if (ALLOWED_EMAILS.length === 0) return true;
      return ALLOWED_EMAILS.includes(user.email ?? "");
    },
  },
});
