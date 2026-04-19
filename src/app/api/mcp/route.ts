import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp";
import { registerPortfolioTools } from "@/mcp";
import { verifyToken } from "@/lib/jwt";

const authenticate = async (req: Request) => {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    throw new Error("Missing token");
  }

  return verifyToken(auth.slice("Bearer ".length));
};

const handleMcp = async (req: Request): Promise<Response> => {
  let email: string;
  try {
    email = await authenticate(req)
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const server = new McpServer({
    name: 'anydigi-lab',
    version: '1.0.0',
  })

  registerPortfolioTools(server, email)

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  })

  await server.connect(transport)

  return transport.handleRequest(req)
};

export const POST = handleMcp
export const GET = handleMcp
export const DELETE = handleMcp
