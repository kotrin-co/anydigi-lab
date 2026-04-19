"use client";

import { useState } from "react";
import { Copy, Check, RefreshCw, Key } from "lucide-react";
import { generateMcpToken } from "./actions";

const CLIENT_TEMPLATES = [
  {
    name: "Claude Code",
    path: "~/.claude/.mcp.json",
    template: (token: string, url: string) =>
      JSON.stringify(
        {
          "anydigi-lab": {
            type: "streamable-http",
            url,
            headers: { Authorization: `Bearer ${token}` },
          },
        },
        null,
        2
      ),
  },
  {
    name: "Claude Desktop",
    path: "~/Library/Application Support/Claude/claude_desktop_config.json",
    template: (token: string, url: string) =>
      JSON.stringify(
        {
          mcpServers: {
            "anydigi-lab": {
              type: "streamable-http",
              url,
              headers: { Authorization: `Bearer ${token}` },
            },
          },
        },
        null,
        2
      ),
  },
  {
    name: "GitHub Copilot (VS Code)",
    path: ".vscode/mcp.json",
    template: (token: string, url: string) =>
      JSON.stringify(
        {
          mcp: {
            servers: {
              "anydigi-lab": {
                type: "streamable-http",
                url,
                headers: { Authorization: `Bearer ${token}` },
              },
            },
          },
        },
        null,
        2
      ),
  },
];

export function McpTokenSection({ mcpUrl }: { mcpUrl: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("days", String(days));
      const result = await generateMcpToken(formData);
      setToken(result.token);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        <div className="rounded-md p-1.5 bg-violet-500/10">
          <Key className="h-4 w-4 text-violet-500" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">MCP連携設定</h2>
      </div>

      <div className="p-4 space-y-4">
        {/* 発行コントロール */}
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-8 rounded-md border border-border bg-card px-3 text-xs text-foreground focus:border-ring focus:outline-none"
          >
            <option value={7}>7日間</option>
            <option value={30}>30日間</option>
            <option value={90}>90日間</option>
          </select>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium bg-foreground text-background hover:bg-foreground/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {token ? "再発行" : "トークンを発行"}
          </button>
        </div>

        {/* トークン表示 */}
        {token && (
          <div className="space-y-4">
            <div className="rounded-md bg-accent/30 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  トークン（{days}日間有効）
                </span>
                <button
                  onClick={() => copyToClipboard(token, "token")}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied === "token" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <code className="text-xs font-mono text-foreground break-all">
                {token}
              </code>
            </div>

            {/* クライアント別テンプレート */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                以下の設定をお使いのクライアントに追加してください
              </p>
              {CLIENT_TEMPLATES.map((client) => (
                <div key={client.name} className="rounded-md border border-border/50 bg-accent/20">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
                    <div>
                      <span className="text-xs font-semibold text-foreground">
                        {client.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-2">
                        {client.path}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(client.template(token, mcpUrl), client.name)
                      }
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied === client.name ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-emerald-500">コピー済</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>コピー</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 text-xs font-mono text-foreground overflow-x-auto">
                    {client.template(token, mcpUrl)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
