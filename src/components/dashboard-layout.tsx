"use client";

import { Sidebar } from "./sidebar";

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
} | null;

export function DashboardLayout({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: User;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto bg-background pt-12 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
