import { auth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";

export default async function InsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return <DashboardLayout user={session?.user}>{children}</DashboardLayout>;
}
