import Image from "next/image";
import Link from "next/link";
import { BarChart3, ArrowRight, LogIn } from "lucide-react";

export function GuestDashboard() {
  return (
    <div className="p-4 sm:p-6 space-y-8">
      {/* Hero */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Image
            src="/anydigi-icon.png"
            alt="AnyDigi"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              AnyDigi Lab
            </h1>
            <p className="text-sm text-muted-foreground">
              by AnyDigi LLC
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
          データ × AI基盤エンジニアリングの実験場。
          RSSニュース分析、株式観測、YouTubeコメント分析など、
          AIアナリストが毎日稼働するプラットフォームです。
        </p>
      </div>

      {/* Public Modules */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Public Modules
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href="/needradar"
            className="group rounded-lg border border-border bg-card p-5 space-y-3 transition-colors hover:bg-accent"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                NeedRadar
              </h3>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-500">
                Public
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              YouTubeコメントから不満・要望を分析し、
              AIアナリストレポートとして毎日公開しています。
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              View Reports
              <ArrowRight className="h-3 w-3" />
            </div>
          </a>
        </div>
      </div>

      {/* About */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-3 max-w-xl">
        <h2 className="text-sm font-medium text-foreground">
          About AnyDigi Lab
        </h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <span className="text-foreground font-medium">Stack:</span>{" "}
            Next.js + Neon Postgres + Claude Code Max
          </li>
          <li>
            <span className="text-foreground font-medium">Concept:</span>{" "}
            1人 + AI、稟議ゼロで動ける会社のインフラ
          </li>
          <li>
            <span className="text-foreground font-medium">Operator:</span>{" "}
            AnyDigi合同会社 代表 中川健太郎
          </li>
        </ul>
      </div>

      {/* Login CTA */}
      <div>
        <Link
          href="/api/auth/signin?callbackUrl=/"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <LogIn className="h-4 w-4" />
          管理者ログイン
        </Link>
      </div>
    </div>
  );
}
