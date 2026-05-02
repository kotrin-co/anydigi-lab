import Link from "next/link";
import { TrendingUp, ArrowRight } from "lucide-react";

export default function TradePage() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Trade
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          高配当株分析・銘柄観測ダッシュボード
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/trade/jp-high-dividend"
          className="group rounded-lg border border-border bg-card p-5 space-y-4 transition-colors hover:bg-accent"
        >
          <div className="flex items-center">
            <div className="rounded-lg p-2 bg-rose-500/10">
              <TrendingUp className="h-5 w-5 text-rose-500" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              日本株高配当
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              配当利回り・増配年数をベースにした高配当銘柄のスクリーニングと観測
            </p>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
            Open
            <ArrowRight className="h-3 w-3" />
          </div>
        </Link>
      </div>
    </div>
  );
}
