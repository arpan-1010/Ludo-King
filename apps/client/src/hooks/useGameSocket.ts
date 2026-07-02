import { useEffect, useRef, useCallback } from "react";
import { useGameStore } from "../store/gameStore";
import { useAuthStore } from "../store/authStore";
import type { ClientMessage, ServerMessage } from "@repo/shared";

const WS_URL = "ws://localhost:3000/ws";
const RECONNECT_DELAY = 3000;

export function useGameSocket(gameId: string | null) {
  const wsRef           = useRef<WebSocket | null>(null);
  const reconnectTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  // shouldReconnect = false when we intentionally close (navigate away)
  const shouldReconnect = useRef(true);

  const token          = useAuthStore((s) => s.token);
  const setGameState   = useGameStore((s) => s.setGameState);
  const setConnected   = useGameStore((s) => s.setConnected);
  const setError       = useGameStore((s) => s.setError);
  const setLastMessage = useGameStore((s) => s.setLastMessage);

  const connect = useCallback(() => {
    if (!gameId || !token) return;

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    const ws = new WebSocket(`${WS_URL}?gameId=${gameId}&token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setError(null);
    };

    ws.onmessage = (event: MessageEvent) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(event.data as string) as ServerMessage;
      } catch {
        return;
      }

      setLastMessage(msg);

      switch (msg.type) {
        case "GAME_STATE":
        case "RECONNECT_STATE":
          setGameState(msg.payload);
          break;
        case "PLAYER_JOINED":
        case "PLAYER_LEFT":
          setGameState(msg.payload.gameState);
          break;
        case "ERROR":
          setError(msg.payload.message);
          break;
      }
    };

    ws.onclose = () => {
      setConnected(false);
      if (shouldReconnect.current) {
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
      }
    };

    ws.onerror = () => {
      setError("Connection error");
    };
  }, [gameId, token]);

  useEffect(() => {
    if (!gameId) return;
    shouldReconnect.current = true;
    connect();

    return () => {
      shouldReconnect.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      setConnected(false);
    };
  }, [connect]);

  const sendMessage = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { sendMessage };
}
