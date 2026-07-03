import { useEffect, useRef, useCallback } from "react";
import { useGameStore } from "../store/gameStore.ts";
import { useAuthStore } from "../store/authStore.ts";
import type { ClientMessage, ServerMessage } from "@repo/shared";

function getWsUrl(): string {
  const serverUrl = import.meta.env.VITE_SERVER_URL as string | undefined;

  if (serverUrl) {
    const wsBase = serverUrl
      .replace(/^https:\/\//, "wss://")
      .replace(/^http:\/\//, "ws://")
      .replace(/\/$/, "");
    return `${wsBase}/ws`;
  }

  return "ws://localhost:3000/ws";
}

const WS_BASE_URL = getWsUrl();
const RECONNECT_DELAY = 3000;

export function useGameSocket(gameId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnect = useRef(true);

  const token = useAuthStore((s) => s.token);
  const setGameState = useGameStore((s) => s.setGameState);
  const setConnected = useGameStore((s) => s.setConnected);
  const setError = useGameStore((s) => s.setError);
  const setLastMessage = useGameStore((s) => s.setLastMessage);

  const connect = useCallback(() => {
    if (!gameId || !token) return;

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    const url = `${WS_BASE_URL}?gameId=${gameId}&token=${token}`;
    console.log("[WS] Connecting to:", url);

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] Connected");
      setConnected(true);
      setError(null);
    };

    ws.onmessage = (event: MessageEvent) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(event.data as string) as ServerMessage;
      } catch {
        console.error("[WS] Failed to parse message:", event.data);
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

    ws.onclose = (event) => {
      console.log("[WS] Disconnected — code:", event.code, "reason:", event.reason);
      setConnected(false);
      if (shouldReconnect.current) {
        console.log("[WS] Reconnecting in", RECONNECT_DELAY, "ms...");
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
      }
    };

    ws.onerror = (event) => {
      console.error("[WS] Error:", event);
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
    } else {
      console.warn("[WS] Cannot send — socket not open. State:", wsRef.current?.readyState);
    }
  }, []);

  return { sendMessage };
}
