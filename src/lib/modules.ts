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

  // モジュールパスの公開判定
  for (const [name, config] of Object.entries(modules)) {
    if (pathname.startsWith(`/${name}`)) {
      return config.public;
    }
  }

  // それ以外は認証必須
  return false;
}
