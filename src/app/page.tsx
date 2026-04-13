import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Newspaper,
  LineChart,
  BarChart3,
  TrendingUp,
  Lightbulb,
  FileText,
  Clock,
  ArrowRight,
} from "lucide-react";

const kpiCards = [
  {
    title: "Ideas Tracked",
    value: "—",
    change: "insights",
    icon: Lightbulb,
    color: "text-violet-500",
  },
  {
    title: "Watchlist Stocks",
    value: "—",
    change: "trade",
    icon: TrendingUp,
    color: "text-emerald-500",
  },
  {
    title: "Reports Published",
    value: "—",
    change: "needradar",
    icon: FileText,
    color: "text-blue-500",
  },
  {
    title: "Last Batch Run",
    value: "—",
    change: "pending",
    icon: Clock,
    color: "text-amber-500",
  },
];

const modules = [
  {
    name: "Insights",
    description: "RSSニュースから日々のビジネスアイデアを蓄積・スコアリング",
    icon: Newspaper,
    href: "/insights",
    status: "Phase 1",
    statusColor: "bg-violet-500/10 text-violet-500",
  },
  {
    name: "Trade",
    description: "高配当株分析・銘柄観測ダッシュボード",
    icon: LineChart,
    href: "/trade",
    status: "Phase 3",
    statusColor: "bg-emerald-500/10 text-emerald-500",
  },
  {
    name: "NeedRadar",
    description: "YouTubeコメント分析 → AIアナリストレポート公開",
    icon: BarChart3,
    href: "/needradar",
    status: "Phase 4-5",
    statusColor: "bg-blue-500/10 text-blue-500",
  },
];

export default function Home() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AnyDigi Lab — 個人ツール群とポートフォリオの統合プラットフォーム
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((card) => (
            <div
              key={card.title}
              className="rounded-lg border border-border bg-card p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {card.title}
                </span>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <div className="text-2xl font-semibold tracking-tight text-foreground">
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground">{card.change}</p>
            </div>
          ))}
        </div>

        {/* Modules */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Modules
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {modules.map((mod) => (
              <a
                key={mod.name}
                href={mod.href}
                className="group rounded-lg border border-border bg-card p-5 space-y-3 transition-colors hover:bg-accent"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <mod.icon className="h-5 w-5 text-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">
                      {mod.name}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${mod.statusColor}`}
                  >
                    {mod.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {mod.description}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                  Open
                  <ArrowRight className="h-3 w-3" />
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            System Status
          </h2>
          <div className="space-y-2">
            {[
              { name: "Neon Postgres", status: "Connected", ok: true },
              { name: "Vercel", status: "Deployed", ok: true },
              { name: "Nightly Batch (launchd)", status: "Not configured", ok: false },
              { name: "Slack Notifications", status: "Not configured", ok: false },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{item.name}</span>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${
                      item.ok ? "bg-emerald-500" : "bg-muted-foreground"
                    }`}
                  />
                  <span className={item.ok ? "text-foreground" : "text-muted-foreground"}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
