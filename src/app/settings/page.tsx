import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { McpTokenSection } from "./mcp-token-section";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/api/auth/signin?callbackUrl=/settings");

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          MCP連携・アカウント設定
        </p>
      </div>

      <McpTokenSection mcpUrl={`${process.env.NEXT_PUBLIC_APP_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")}/api/mcp`} />
    </div>
  );
}
