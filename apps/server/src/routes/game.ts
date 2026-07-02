import { Hono } from "hono";
import { prisma } from "@repo/db";
import { authMiddleware } from "../middleware/auth.js";
import { TOKENS_PER_PLAYER, COLOR_ORDER } from "@repo/shared";
import type { JwtPayload } from "../lib/jwt.js";
import type { Player, Prisma } from "@repo/db";

type Variables = {user: JwtPayload};

const game = new Hono<{Variables : Variables}>();

game.use("*", authMiddleware);

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

game.post("/create", async (c) => {
  const user = c.get("user") as JwtPayload;
  const body = await c.req.json<{ playerCount: 2 | 3 | 4 }>();

  const playerCount = body.playerCount ?? 4;

  let roomCode = generateRoomCode();
  while (await prisma.game.findUnique({ where: { roomCode } })) {
    roomCode = generateRoomCode();
  }

  const game = await prisma.$transaction(async (tx : Prisma.TransactionClient) => {
    const newGame = await tx.game.create({
      data: {
        roomCode,
        playerCount,
        status: "WAITING",
      },
    });

    const firstColor = COLOR_ORDER[0]!;

    const player = await tx.player.create({
      data: {
        userId: user.userId,
        gameId: newGame.id,
        color: firstColor,
        tokens: {
          create: Array.from({ length: TOKENS_PER_PLAYER }, (_, i) => ({
            color: firstColor,
            position: 0,
            status: "HOME",
          })),
        },
      },
    });

    return newGame;
  });

  return c.json({ gameId: game.id, roomCode: game.roomCode }, 201);
});

game.post("/join", async (c) => {
  const user = c.get("user") as JwtPayload;
  const body = await c.req.json<{ roomCode: string }>();

  if (!body.roomCode) {
    return c.json({ error: "Room code is required" }, 400);
  }

  const existingGame = await prisma.game.findUnique({
    where: { roomCode: body.roomCode.toUpperCase() },
    include: { players: true },
  });

  if (!existingGame) {
    return c.json({ error: "Game not found" }, 404);
  }

  if (existingGame.status !== "WAITING") {
    return c.json({ error: "Game has already started" }, 400);
  }

  if (existingGame.players.length >= existingGame.playerCount) {
    return c.json({ error: "Game is full" }, 400);
  }

  const alreadyJoined = existingGame.players.find(
    (p : Player) => p.userId === user.userId
  );
  if (alreadyJoined) {
    return c.json({ error: "You already joined this game" }, 400);
  }

  const usedColors = existingGame.players.map((p : Player) => p.color);
  const nextColor = COLOR_ORDER.find((c) => !usedColors.includes(c));

  if (!nextColor) {
    return c.json({ error: "No colors available" }, 400);
  }

  await prisma.$transaction(async (tx : Prisma.TransactionClient) => {
    const player = await tx.player.create({
      data: {
        userId: user.userId,
        gameId: existingGame.id,
        color: nextColor,
        tokens: {
          create: Array.from({ length: TOKENS_PER_PLAYER }, () => ({
            color: nextColor,
            position: 0,
            status: "HOME",
          })),
        },
      },
    });

    if (existingGame.players.length + 1 >= existingGame.playerCount) {
      await tx.game.update({
        where: { id: existingGame.id },
        data: {
          status: "IN_PROGRESS",
          currentPlayerId: existingGame.players[0]!.id,
        },
      });
    }
  });

  return c.json({ gameId: existingGame.id });
});

game.get("/:id", async (c) => {
  const gameId = c.req.param("id");

  const foundGame = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      players: {
        include: {
          user: { select: { username: true } },
          tokens: true,
        },
      },
    },
  });

  if (!foundGame) {
    return c.json({ error: "Game not found" }, 404);
  }

  return c.json(foundGame);
});

game.delete("/:id/cancel", async (c) => {
  const user   = c.get("user") as JwtPayload;
  const gameId = c.req.param("id");

  const existingGame = await prisma.game.findUnique({
    where: { id: gameId },
    include: { players: { orderBy: { createdAt: "asc" } } },
  });

  if (!existingGame) return c.json({ error: "Game not found" }, 404);
  if (existingGame.status !== "WAITING") {
    return c.json({ error: "Game already started" }, 400);
  }

  const creator = existingGame.players[0];
  if (!creator || creator.userId !== user.userId) {
    return c.json({ error: "Only the room creator can cancel" }, 403);
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.token.deleteMany({ where: { player: { gameId } } });
    await tx.player.deleteMany({ where: { gameId } });
    await tx.game.delete({ where: { id: gameId } });
  });

  return c.json({ success: true });
});

export default game;