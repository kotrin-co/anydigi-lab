"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LineChart,
  Newspaper,
  LayoutDashboard,
  LogIn,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { SignOutModal } from "./sign-out-modal";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  public: boolean;
};

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, public: true },
  { name: "Insights", href: "/insights", icon: Newspaper, public: false },
  { name: "Trade", href: "/trade", icon: LineChart, public: false },
  { name: "NeedRadar", href: "/needradar", icon: BarChart3, public: true },
];

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
} | null;

export function Sidebar({ user }: { user?: User }) {
  const pathname = usePathname();
  const [showSignOut, setShowSignOut] = useState(false);
  const isAuthenticated = !!user;

  const visibleNav = navigation.filter(
    (item) => item.public || isAuthenticated
  );

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
        {visibleNav.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
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

      <div className="border-t border-border px-2 py-2 space-y-2">
        {isAuthenticated ? (
          <div className="flex items-center gap-2.5 px-2">
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name ?? ""}
                width={28}
                height={28}
                className="rounded-full"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-muted" />
            )}
            <span className="flex-1 truncate text-sm text-foreground">
              {user?.name}
            </span>
            <button
              onClick={() => setShowSignOut(true)}
              className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
              title="ログアウト"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/api/auth/signin?callbackUrl=/"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <LogIn className="h-4 w-4" />
            ログイン
          </Link>
        )}
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-muted-foreground">v0.1.0</span>
          <ThemeToggle />
        </div>
      </div>
      <SignOutModal open={showSignOut} onClose={() => setShowSignOut(false)} />
    </aside>
  );
}
