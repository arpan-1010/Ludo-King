import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { gameApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useGameStore } from "@/store/gameStore";
import { GameNavbar } from "@/components/Navbar";

export function WaitingRoom({
  gameId,
  roomCode,
  playerCount,
  isConnected,
  onLeave,
}: {
  gameId: string;
  roomCode: string | null;
  playerCount: number;
  isConnected: boolean;
  onLeave: () => void;
}) {
  const navigate    = useNavigate();
  const token       = useAuthStore((s) => s.token);
  const clearGame   = useGameStore((s) => s.clearGame);
  const [cancelling, setCancelling] = useState(false);

  async function handleCancel() {
    if (!token) return;
    setCancelling(true);
    try {
      await gameApi.cancelGame(gameId, token);
      toast.success("Room cancelled");
      clearGame();
      navigate("/lobby");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100
      dark:from-slate-900 dark:to-slate-800 flex flex-col transition-colors duration-500">

      <GameNavbar onLeave={onLeave} isConnected={isConnected}/>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-5 max-w-xs w-full">

          <div className="text-5xl animate-pulse">⏳</div>

          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            Waiting for players...
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {playerCount} player(s) joined
          </p>

          {/* Room code card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border
            border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-2">

            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500
              uppercase tracking-widest">
              Room Code
            </p>

            <p className="text-4xl font-mono font-bold tracking-[0.3em]
              text-slate-800 dark:text-white py-2">
              {roomCode ?? "----"}
            </p>

            <p className="text-xs text-slate-400 dark:text-slate-500">
              Share this code with your friends
            </p>
          </div>

          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full py-2.5 rounded-xl font-semibold text-sm
              text-red-500 border border-red-300
              hover:bg-red-500 hover:text-white hover:border-red-500
              transition-all duration-200 disabled:opacity-50
              flex items-center justify-center gap-2"
          >
            {cancelling ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Cancelling...
              </>
            ) : "Cancel Room"}
          </button>

        </div>
      </div>
    </div>
  );
}
