import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { verifyToken } from "./lib/jwt.js";
import { wsHandler } from "./ws/handler.js";
import { prisma } from "@repo/db";
import authRoutes from "./routes/auth.js";
import gameRoutes from "./routes/game.js";

const app = new Hono();
const PORT = Number(process.env.PORT) || 3000;

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:5173",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.route("/auth", authRoutes);
app.route("/game", gameRoutes);

app.get("/health", (c) => c.json({ status: "ok" }));

const server = Bun.serve({
  port: PORT,

  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/ws") {
      const token = url.searchParams.get("token");
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
        return new Response("Player not found in this game", { status: 403 });
      }

      const upgraded = server.upgrade(req, {
        data: {
          playerId: player.id,
          userId: payload.userId,
          gameId,
        },
      });

      if (!upgraded) {
        return new Response("WebSocket upgrade failed", { status: 500 });
      }

      return undefined;
    }

    return app.fetch(req);
  },

  websocket: wsHandler,
});

console.log(`Server running on http://localhost:${PORT}`);

process.on("SIGINT", async () => {
  console.log("\nShutting down server...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nShutting down server...");
  await prisma.$disconnect();
  process.exit(0);
});