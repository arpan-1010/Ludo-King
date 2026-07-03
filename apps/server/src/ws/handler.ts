import type { ServerWebSocket } from "bun";
import { prisma } from "@repo/db";
import type { ClientMessage } from "@repo/shared";
import { verifyToken } from "../lib/jwt.js";
import {
  joinRoom,
  leaveRoom,
  broadcast,
  sendToPlayer,
  type WsData,
} from "./roomManager.js";
import {
  handleDiceRoll,
  handleTokenMove,
  fetchGameState,
} from "../engine/gameEngine.js";

type LudoWebSocket = ServerWebSocket<WsData>;

export const wsHandler = {
  async open(ws: LudoWebSocket) {
    const { gameId, playerId } = ws.data;

    joinRoom(gameId, playerId, ws);

    const pingInterval = setInterval(() => {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          clearInterval(pingInterval);
        }
      } catch {
        clearInterval(pingInterval);
      }
    }, 25000);

    (ws.data as WsData & { pingInterval?: ReturnType<typeof setInterval> }).pingInterval = pingInterval;

    const gameState = await fetchGameState(gameId);
    if (gameState) {
      ws.send(JSON.stringify({ type: "RECONNECT_STATE", payload: gameState }));
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        user: { select: { username: true } },
        tokens: true,
      },
    });

    if (player && gameState) {
      broadcast(gameId, {
        type: "PLAYER_JOINED",
        payload: {
          player: {
            id:       player.id,
            userId:   player.userId,
            username: player.user.username,
            color:    player.color as import("@repo/shared").PlayerColor,
            rank:     player.rank,
            tokens:   player.tokens.map((t: typeof player.tokens[number]) => ({
              id:       t.id,
              color:    t.color as import("@repo/shared").PlayerColor,
              position: t.position,
              status:   t.status as "HOME" | "ACTIVE" | "FINISHED",
            })),
          },
          gameState,
        },
      });
    }
  },

  async message(ws: LudoWebSocket, raw: string | Buffer) {
    const { gameId, playerId } = ws.data;

    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString()) as ClientMessage;
    } catch {
      ws.send(JSON.stringify({
        type: "ERROR",
        payload: { message: "Invalid JSON", code: "PARSE_ERROR" },
      }));
      return;
    }

    try {
      switch (msg.type) {
        case "ROLL_DICE": {
          const { messages } = await handleDiceRoll(gameId, playerId);
          for (const m of messages) broadcast(gameId, m);
          const state = await fetchGameState(gameId);
          if (state) broadcast(gameId, { type: "GAME_STATE", payload: state });
          break;
        }

        case "MOVE_TOKEN": {
          const messages = await handleTokenMove(gameId, playerId, msg.payload.tokenId);
          for (const m of messages) broadcast(gameId, m);
          const state = await fetchGameState(gameId);
          if (state) broadcast(gameId, { type: "GAME_STATE", payload: state });
          break;
        }

        case "LEAVE_ROOM": {
          leaveRoom(gameId, playerId);
          const state = await fetchGameState(gameId);
          if (state) {
            broadcast(gameId, {
              type: "PLAYER_LEFT",
              payload: { playerId, gameState: state },
            });
          }
          ws.close();
          break;
        }

        case "JOIN_ROOM": {
          const state = await fetchGameState(gameId);
          if (state) {
            sendToPlayer(gameId, playerId, { type: "RECONNECT_STATE", payload: state });
          }
          break;
        }

        default: {
          ws.send(JSON.stringify({
            type: "ERROR",
            payload: { message: "Unknown message type", code: "UNKNOWN_TYPE" },
          }));
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      ws.send(JSON.stringify({
        type: "ERROR",
        payload: { message, code: "ENGINE_ERROR" },
      }));
    }
  },

  async close(ws: LudoWebSocket) {
    const { gameId, playerId } = ws.data;

    const data = ws.data as WsData & { pingInterval?: ReturnType<typeof setInterval> };
    if (data.pingInterval) clearInterval(data.pingInterval);

    leaveRoom(gameId, playerId);

    const state = await fetchGameState(gameId);
    if (state) {
      broadcast(gameId, {
        type: "PLAYER_LEFT",
        payload: { playerId, gameState: state },
      });
    }
  },

  error(ws: LudoWebSocket, error: Error) {
    console.error(`WebSocket error for player ${ws.data.playerId}:`, error);
  },
};
