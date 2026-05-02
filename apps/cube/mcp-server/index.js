import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const CUBE_API_URL = process.env.CUBE_API_URL || "http://localhost:4000/cubejs-api/v1";
const CUBE_API_SECRET = process.env.CUBE_API_SECRET || "";

const headers = {
  "Content-Type": "application/json",
  ...(CUBE_API_SECRET && { Authorization: CUBE_API_SECRET }),
};

// ── helpers ──────────────────────────────────────────────

async function cubeFetch(path, options = {}) {
  const res = await fetch(`${CUBE_API_URL}${path}`, { headers, ...options });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cube API ${res.status}: ${body}`);
  }
  return res.json();
}

function formatMeta(raw) {
  return raw.cubes
    .filter((c) => c.public)
    .map((c) => ({
      name: c.name,
      title: c.title,
      measures: c.measures.filter((m) => m.public).map((m) => ({
        name: m.name,
        title: m.shortTitle,
        type: m.aggType,
      })),
      dimensions: c.dimensions.filter((d) => d.public).map((d) => ({
        name: d.name,
        title: d.shortTitle,
        type: d.type,
      })),
    }));
}

// ── server ───────────────────────────────────────────────

const server = new McpServer({
  name: "cube",
  version: "0.1.0",
});

// Tool: get_meta
server.tool(
  "get_meta",
  "List available cubes with their measures and dimensions",
  {},
  async () => {
    const raw = await cubeFetch("/meta");
    const meta = formatMeta(raw);
    return { content: [{ type: "text", text: JSON.stringify(meta, null, 2) }] };
  }
);

// Tool: query
server.tool(
  "query",
  "Query Cube semantic layer. Specify measures, dimensions, and optional filters/time ranges.",
  {
    measures: z.array(z.string()).describe('e.g. ["popular_videos.count", "popular_videos.total_views"]'),
    dimensions: z.array(z.string()).optional().describe('e.g. ["popular_videos.region_code"]'),
    timeDimensions: z
      .array(
        z.object({
          dimension: z.string(),
          dateRange: z.array(z.string()).optional().describe('e.g. ["2026-04-21", "2026-04-21"]'),
          granularity: z.enum(["second", "minute", "hour", "day", "week", "month", "quarter", "year"]).optional(),
        })
      )
      .optional(),
    filters: z
      .array(
        z.object({
          member: z.string(),
          operator: z.string(),
          values: z.array(z.string()).optional(),
        })
      )
      .optional(),
    limit: z.number().optional().describe("Max rows to return (default 1000)"),
    order: z
      .array(z.tuple([z.string(), z.enum(["asc", "desc"])]))
      .optional()
      .describe('e.g. [["popular_videos.count", "desc"]]'),
  },
  async ({ measures, dimensions, timeDimensions, filters, limit, order }) => {
    const query = {
      measures,
      ...(dimensions && { dimensions }),
      ...(timeDimensions && { timeDimensions }),
      ...(filters && { filters }),
      ...(limit && { limit }),
      ...(order && { order: Object.fromEntries(order) }),
    };

    const result = await cubeFetch("/load", {
      method: "POST",
      body: JSON.stringify({ query }),
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              data: result.data,
              annotation: result.annotation,
              totalRows: result.data?.length ?? 0,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ── start ────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
