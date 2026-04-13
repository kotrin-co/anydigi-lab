"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LineChart, Newspaper, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Insights", href: "/insights", icon: Newspaper },
  { name: "Trade", href: "/trade", icon: LineChart },
  { name: "NeedRadar", href: "/needradar", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <Image
          src="/anydigi-icon.png"
          alt="AnyDigi"
          width={28}
          height={28}
          className="rounded-md"
        />
        <span className="text-sm font-semibold tracking-tight text-foreground">
          AnyDigi Lab
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                isActive
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-2 py-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">v0.1.0</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
