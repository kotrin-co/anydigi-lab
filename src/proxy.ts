import { auth } from "@/lib/auth";
import { isPublicPath } from "@/lib/modules";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 公開パスはそのまま通す
  if (isPublicPath(pathname)) return NextResponse.next();

  // 未認証なら /api/auth/signin へリダイレクト
  if (!req.auth) {
    const signInUrl = new URL("/api/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.svg$|.*\\.png$).*)"],
};
