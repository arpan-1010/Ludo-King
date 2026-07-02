import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { gameApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useGameStore } from "@/store/gameStore";
import { LobbyNavbar } from "@/components/Navbar";

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  );
}

export default function LobbyPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setRoomCode = useGameStore((s) => s.setRoomCode);

  const [roomInput, setRoomInput]     = useState("");
  const [playerCount, setPlayerCount]   = useState<2|3|4>(4);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingJoin, setLoadingJoin]   = useState(false);

  async function handleCreate() {
    if (!token) return;
    setLoadingCreate(true);
    try {
      const res = await gameApi.create({ playerCount }, token);
      setRoomCode(res.roomCode);
      toast.success(`Room created! Code: ${res.roomCode}`);
      navigate(`/game/${res.gameId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create game");
    } finally {
      setLoadingCreate(false);
    }
  }

  async function handleJoin() {
    if (!token) return;
    if (!roomInput.trim()) { toast.error("Enter a room code"); return; }
    setLoadingJoin(true);
    try {
      const res = await gameApi.join({ roomCode: roomInput.toUpperCase() }, token);
      setRoomCode(roomInput.toUpperCase());
      toast.success("Joined game!");
      navigate(`/game/${res.gameId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to join game");
    } finally {
      setLoadingJoin(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100
      dark:from-slate-900 dark:to-slate-800 flex flex-col transition-colors duration-500">

      <LobbyNavbar />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">

        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Create a new game or join a room
          </h1>
        </div>

        <div className="flex flex-col md:flex-row gap-4 w-full max-w-2xl">

          <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border
            border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md
            transition-shadow duration-200 overflow-hidden">
            <div className="p-6 sm:p-8 text-center">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-1">
                Create Game
              </h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">
                Start a new game and invite friends
              </p>
              <div className="mb-6">
                <Label className="text-xs font-semibold text-slate-500
                  dark:text-slate-400 uppercase tracking-wider mb-3 block">
                  Number of Players
                </Label>
                <div className="flex gap-2 justify-center">
                  {([2,3,4] as const).map((n) => (
                    <button key={n} onClick={() => setPlayerCount(n)}
                      className={`w-14 sm:w-16 py-2 rounded-xl text-sm font-semibold border
                        transition-all duration-150
                        ${playerCount===n
                          ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                          : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-orange-300"}`}>
                      {n}P
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} disabled={loadingCreate}
                className="w-2/3 bg-orange-600 hover:bg-orange-700 text-white
                  rounded-xl py-2.5 font-semibold disabled:opacity-60">
                {loadingCreate
                  ? <span className="flex items-center gap-2 justify-center"><Spinner/> Creating...</span>
                  : "Create Game"}
              </Button>
            </div>
          </div>

          <div className="flex md:flex-col items-center justify-center gap-2 py-2">
            <div className="flex-1 h-px md:h-auto md:w-px bg-slate-200 dark:bg-slate-600"/>
            <span className="text-xs font-medium text-slate-400 px-1">OR</span>
            <div className="flex-1 h-px md:h-auto md:w-px bg-slate-200 dark:bg-slate-600"/>
          </div>

          <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border
            border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md
            transition-shadow duration-200 overflow-hidden">
            <div className="p-6 sm:p-8 text-center">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-1">
                Join Game
              </h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">
                Enter a room code to join a friend
              </p>
              <div className="mb-6">
                <Label className="text-xs font-semibold text-slate-500
                  dark:text-slate-400 uppercase tracking-wider mb-3 block">
                  Room Code
                </Label>
                <Input placeholder="E.G. ABCD" value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                  maxLength={4}
                  className="uppercase tracking-[0.3em] text-center text-lg
                    font-mono font-bold border-slate-200 dark:border-slate-600
                    dark:bg-slate-700 dark:text-white
                    focus:border-emerald-400 rounded-xl h-12"/>
              </div>
              <Button onClick={handleJoin} disabled={loadingJoin}
                className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white
                  rounded-xl py-2.5 font-semibold disabled:opacity-60">
                {loadingJoin
                  ? <span className="flex items-center gap-2 justify-center"><Spinner/> Joining...</span>
                  : "Join Game"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
