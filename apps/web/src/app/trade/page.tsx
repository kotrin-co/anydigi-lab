import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  Building2,
  ArrowRight,
} from "lucide-react";

const genres = [
  {
    id: "jp-high-dividend",
    name: "日本株高配当",
    description: "配当利回り・増配年数をベースにした高配当銘柄のスクリーニングと観測",
    icon: TrendingUp,
    href: "/trade/jp-high-dividend",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    status: "準備中",
  },
  {
    id: "us-high-dividend",
    name: "米国株高配当",
    description: "VYM・SCHD等の高配当ETFおよび個別銘柄の分析・為替影響の把握",
    icon: DollarSign,
    href: "/trade/us-high-dividend",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    status: "計画中",
  },
  {
    id: "j-reit",
    name: "J-REIT",
    description: "分配金利回り・NAV倍率ベースのJ-REIT銘柄スクリーニングと比較",
    icon: Building2,
    href: "/trade/j-reit",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    status: "計画中",
  },
];

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
        {genres.map((genre) => (
          <Link
            key={genre.id}
            href={genre.href}
            className="group rounded-lg border border-border bg-card p-5 space-y-4 transition-colors hover:bg-accent"
          >
            <div className="flex items-center justify-between">
              <div className={`rounded-lg p-2 ${genre.bgColor}`}>
                <genre.icon className={`h-5 w-5 ${genre.color}`} />
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {genre.status}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                {genre.name}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {genre.description}
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              Open
              <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
