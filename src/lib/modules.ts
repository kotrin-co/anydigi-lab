export const modules = {
  insights: { public: false },
  trade: { public: false },
  needradar: { public: true },
} as const;

export type ModuleName = keyof typeof modules;

export function isPublicPath(pathname: string): boolean {
  // トップページはゲスト用表示があるので公開
  if (pathname === "/") return true;

  // API認証ルートは常に公開
  if (pathname.startsWith("/api/auth")) return true;

  // /api/health は公開
  if (pathname === "/api/health") return true;

  // /api/mcp は独自JWT認証のため公開（proxy層では通す）
  if (pathname === "/api/mcp") return true;

  // モジュールパスの公開判定
  for (const [name, config] of Object.entries(modules)) {
    if (pathname.startsWith(`/${name}`)) {
      return config.public;
    }
  }

  // それ以外は認証必須
  return false;
}
