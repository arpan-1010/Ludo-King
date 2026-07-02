import type { ServerWebSocket } from "bun";
import type { ServerMessage } from "@repo/shared";

export interface WsData {
  playerId: string;
  userId: string;
  gameId: string;
}

type LudoWebSocket = ServerWebSocket<WsData>;

const rooms = new Map<string, Map<string, LudoWebSocket>>();

export function joinRoom(
  gameId: string,
  playerId: string,
  ws: LudoWebSocket
): void {
  if (!rooms.has(gameId)) {
    rooms.set(gameId, new Map());
  }
  rooms.get(gameId)!.set(playerId, ws);
}

export function leaveRoom(gameId: string, playerId: string): void {
  const room = rooms.get(gameId);
  if (!room) return;

  room.delete(playerId);

  if (room.size === 0) {
    rooms.delete(gameId);
  }
}

export function broadcast(gameId: string, message: ServerMessage): void {
  const room = rooms.get(gameId);
  if (!room) return;

  const serialized = JSON.stringify(message);

  for (const ws of room.values()) {

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(serialized);
    }
  }
}

export function sendToPlayer(
  gameId: string,
  playerId: string,
  message: ServerMessage
): void {
  const room = rooms.get(gameId);
  if (!room) return;

  const ws = room.get(playerId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

export function isConnected(gameId: string, playerId: string): boolean {
  return rooms.get(gameId)?.has(playerId) ?? false;
}

export function getPlayersInRoom(gameId: string): string[] {
  return Array.from(rooms.get(gameId)?.keys() ?? []);
}