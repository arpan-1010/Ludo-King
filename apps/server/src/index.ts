import { Hono } from "hono";
import { logger } from "hono/logger";
import { verifyToken } from "./lib/jwt.js";
import { wsHandler } from "./ws/handler.js";
import { prisma } from "@repo/db";
import authRoutes from "./routes/auth.js";
import gameRoutes from "./routes/game.js";

const app = new Hono();
const PORT = Number(process.env.PORT) || 3000;
const CLIENT_URL = (process.env.CLIENT_URL ?? "http://localhost:5173").trim();

console.log("CLIENT_URL:", CLIENT_URL);

function corsHeaders(origin: string): Record<string, string> {
  const allowed = [CLIENT_URL, "http://localhost:5173"];
  const finalOrigin = allowed.includes(origin) ? origin : CLIENT_URL;
  return {
    "Access-Control-Allow-Origin":      finalOrigin,
    "Access-Control-Allow-Methods":     "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":     "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age":           "86400",
    "Vary":                             "Origin",
  };
}
app.use("*", logger());
app.route("/auth", authRoutes);
app.route("/game", gameRoutes);
app.get("/health", (c) => c.json({ status: "ok", clientUrl: CLIENT_URL }));

const server = Bun.serve({
  port: PORT,

  async fetch(req) {
    const url    = new URL(req.url);
    const origin = req.headers.get("Origin") ?? "";
    const hdrs   = corsHeaders(origin);

    if (url.pathname === "/ws") {
      const token  = url.searchParams.get("token");
      const gameId = url.searchParams.get("gameId");

      if (!token || !gameId) {
        return new Response("Missing token or gameId", { status: 400 });
      }

      let payload: ReturnType<typeof verifyToken>;
      try {
        payload = verifyToken(token);
      } catch {
        return new Response("Invalid token", { status: 401 });
      }

      const player = await prisma.player.findFirst({
        where: { userId: payload.userId, gameId },
      });

      if (!player) {
        return new Response("Player not found", { status: 403 });
      }

      const upgraded = server.upgrade(req, {
        data: { playerId: player.id, userId: payload.userId, gameId },
      });

      if (!upgraded) {
        return new Response("WebSocket upgrade failed", { status: 500 });
      }

      return undefined;
    }

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: hdrs });
    }

    const honoRes = await app.fetch(req);

    const newRes = new Response(honoRes.body, honoRes);
    for (const [key, val] of Object.entries(hdrs)) {
      newRes.headers.set(key, val);
    }
    return newRes;
  },

  websocket: wsHandler,
});

console.log(`Server running on port ${PORT}`);

process.on("SIGINT",  async () => { await prisma.$disconnect(); process.exit(0); });
process.on("SIGTERM", async () => { await prisma.$disconnect(); process.exit(0); });
