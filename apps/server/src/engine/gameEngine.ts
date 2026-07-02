import { prisma } from "@repo/db";
import type { GameState, PlayerColor, ServerMessage } from "@repo/shared";
import { FINISHED_POSITION } from "@repo/shared";
import type { Prisma } from "@repo/db";
import { rollDice, isBonusRoll } from "./dice.js";
import { calculateNewPosition, isOccupiedByEnemy } from "./boardUtils.js";

export async function fetchGameState(gameId: string): Promise<GameState | null> {
  const game = await prisma.game.findUnique({
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

  if (!game) return null;

  return {
    id: game.id,
    status: game.status as unknown as GameState["status"],
    currentPlayerId: game.currentPlayerId,
    diceValue: game.diceValue,
    diceRolled: game.diceRolled,
    winnerId: game.winnerId,
    createdAt: game.createdAt.toISOString(),
    players: game.players.map((p: typeof game.players[number]) => ({
      id: p.id,
      userId: p.userId,
      username: p.user.username,
      color: p.color as PlayerColor,
      rank: p.rank,
      tokens: p.tokens.map((t: typeof p.tokens[number]) => ({
        id: t.id,
        color: t.color as PlayerColor,
        position: t.position,
        status: t.status as "HOME" | "ACTIVE" | "FINISHED",
      })),
    })),
  };
}

export async function handleDiceRoll(
  gameId: string,
  playerId: string
): Promise<{ messages: ServerMessage[]; bonusTurn: boolean }> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { players: { include: { tokens: true } } },
  });

  if (!game) throw new Error("Game not found");
  if (game.currentPlayerId !== playerId) throw new Error("Not your turn");
  if (game.diceRolled) throw new Error("Already rolled this turn");

  const value = rollDice();
  const bonus = isBonusRoll(value);

  await prisma.game.update({
    where: { id: gameId },
    data: { diceValue: value, diceRolled: true },
  });

  const messages: ServerMessage[] = [
    { type: "DICE_ROLLED", payload: { playerId, value } },
  ];

  const currentPlayer = game.players.find((p: typeof game.players[number]) => p.id === playerId);
  if (!currentPlayer) throw new Error("Player not found");

  const hasValidMove = currentPlayer.tokens.some((token: typeof currentPlayer.tokens[number]) => {
    const newPos = calculateNewPosition(
      token.position,
      value,
      currentPlayer.color as PlayerColor
    );
    return newPos !== null;
  });

  if (!hasValidMove) {
    const nextPlayerId = await advanceTurn(gameId, game.players, playerId, false);
    messages.push({ type: "TURN_CHANGED", payload: { playerId: nextPlayerId } });
  }

  return { messages, bonusTurn: bonus };
}

export async function handleTokenMove(
  gameId: string,
  playerId: string,
  tokenId: string
): Promise<ServerMessage[]> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { players: { include: { tokens: true } } },
  });

  if (!game) throw new Error("Game not found");
  if (game.currentPlayerId !== playerId) throw new Error("Not your turn");
  if (!game.diceRolled) throw new Error("Roll dice first");
  if (!game.diceValue) throw new Error("No dice value");

  const currentPlayer = game.players.find((p: typeof game.players[number]) => p.id === playerId);
  if (!currentPlayer) throw new Error("Player not found");

  const token = currentPlayer.tokens.find((t: typeof currentPlayer.tokens[number]) => t.id === tokenId);
  if (!token) throw new Error("Token not found");

  const newPosition = calculateNewPosition(
    token.position,
    game.diceValue,
    currentPlayer.color as PlayerColor
  );

  if (newPosition === null) throw new Error("Invalid move");

  const allTokens = game.players.flatMap((p: typeof game.players[number]) =>
    p.tokens.map((t: typeof p.tokens[number]) => ({
      ...t,
      color: p.color as PlayerColor,
    }))
  );

  const { captured, capturedTokenIds } = isOccupiedByEnemy(
    newPosition,
    currentPlayer.color as PlayerColor,
    allTokens
  );

  const isFinished = newPosition === FINISHED_POSITION;

  const messages: ServerMessage[] = [];

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.token.update({
      where: { id: tokenId },
      data: {
        position: newPosition,
        status: isFinished ? "FINISHED" : "ACTIVE",
      },
    });

    if (captured && capturedTokenIds.length > 0) {
      await tx.token.updateMany({
        where: { id: { in: capturedTokenIds } },
        data: { position: 0, status: "HOME" },
      });
    }

    await tx.game.update({
      where: { id: gameId },
      data: { diceRolled: false, diceValue: null },
    });
  });

  messages.push({
    type: "TOKEN_MOVED",
    payload: {
      tokenId,
      from: token.position,
      to: newPosition,
      captured,
    },
  });

  const updatedTokens = await prisma.token.findMany({
    where: { playerId },
  });

  const allFinished = updatedTokens.every((t: typeof updatedTokens[number]) => t.status === "FINISHED");

  if (allFinished) {
    const finishedCount = await prisma.player.count({
      where: { gameId, rank: { not: null } },
    });

    await prisma.player.update({
      where: { id: playerId },
      data: { rank: finishedCount + 1 },
    });

    const activePlayers = await prisma.player.findMany({
      where: { gameId, rank: null },
      include: { tokens: true },
    });

    if (activePlayers.length === 0) {
      await prisma.game.update({
        where: { id: gameId },
        data: { status: "FINISHED", winnerId: playerId },
      });

      const allPlayers = await prisma.player.findMany({ where: { gameId } });
      messages.push({
        type: "GAME_OVER",
        payload: {
          winnerId: playerId,
          rankings: allPlayers
            .filter((p: typeof allPlayers[number]) => p.rank !== null)
            .map((p: typeof allPlayers[number]) => ({ playerId: p.id, rank: p.rank! })),
        },
      });

      return messages;
    }
  }

  const giveBonus = (isBonusRoll(game.diceValue) || captured) && !allFinished;
  if (!giveBonus) {
    const nextPlayerId = await advanceTurn(
      gameId,
      game.players,
      playerId,
      false
    );
    messages.push({ type: "TURN_CHANGED", payload: { playerId: nextPlayerId } });
  }

  return messages;
}

async function advanceTurn(
  gameId: string,
  players: { id: string; rank: number | null }[],
  currentPlayerId: string,
  _bonusTurn: boolean
): Promise<string> {
  const activePlayers = players.filter((p: { id: string; rank: number | null }) => p.rank === null);
  const currentIndex = activePlayers.findIndex((p: { id: string; rank: number | null }) => p.id === currentPlayerId);
  const nextIndex = (currentIndex + 1) % activePlayers.length;
  const nextPlayer = activePlayers[nextIndex];

  if (!nextPlayer) throw new Error("No next player found");

  await prisma.game.update({
    where: { id: gameId },
    data: {
      currentPlayerId: nextPlayer.id,
      diceRolled: false,
      diceValue: null,
    },
  });

  return nextPlayer.id;
}