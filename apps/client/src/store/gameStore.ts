import { create } from "zustand";
import type { GameState, ServerMessage } from "@repo/shared";

interface GameStore {
  gameState : GameState | null;
  lastMessage : ServerMessage | null;
  isConnected : boolean;
  error : string | null;
  roomCode : string | null;

  setGameState: (state: GameState) => void;
  setLastMessage: (msg: ServerMessage) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  setRoomCode: (code: string) => void;
  clearGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  lastMessage: null,
  isConnected: false,
  error: null,
  roomCode: null,

  setGameState: (gameState) => set({ gameState }),
  setLastMessage: (lastMessage) => set({ lastMessage }),
  setConnected: (isConnected) => set({ isConnected }),
  setError: (error) => set({ error }),
  setRoomCode: (roomCode) => set({ roomCode }),
  clearGame: () => set({
    gameState: null,
    lastMessage: null,
    isConnected: false,
    error: null,
    roomCode: null,
  }),
}));