import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useGameStore } from "@/store/gameStore";
import { useAuthStore } from "@/store/authStore";
import { useGameSocket } from "@/hooks/useGameSocket";
import Board from "@/components/Board";
import Dice from "@/components/Dice";
import WinScreen from "@/components/WinScreen";
import { GameNavbar } from "@/components/Navbar";
import { WaitingRoom } from "@/components/WaitingRoom";
import type { Player } from "@repo/shared";
import { COLOR_STYLES } from "@repo/shared";
import { cn } from "@/lib/utils";

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const gameState = useGameStore((s) => s.gameState);
  const lastMessage = useGameStore((s) => s.lastMessage);
  const isConnected = useGameStore((s) => s.isConnected);
  const roomCode = useGameStore((s) => s.roomCode);
  const clearGame = useGameStore((s) => s.clearGame);

  const { sendMessage } = useGameSocket(gameId ?? null);

  const [isRolling, setIsRolling] = useState(false);

  const lastToastedTurnRef = useRef<string | null | undefined>(null);

  const prevStatusRef = useRef<string | null | undefined>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const myPlayer = gameState?.players.find((p: Player) => p.userId === user?.id) ?? null;
  const isMyTurn = gameState?.currentPlayerId === myPlayer?.id;
  const canRoll = isMyTurn && !gameState?.diceRolled && isConnected;
  const canMove = isMyTurn && (gameState?.diceRolled ?? false) && isConnected;

  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case "DICE_ROLLED":
        setTimeout(() => setIsRolling(false), 1000);
        break;

      case "TURN_CHANGED": {
        const newPlayerId = lastMessage.payload.playerId;
        if (
          newPlayerId === myPlayer?.id &&
          lastToastedTurnRef.current !== newPlayerId
        ) {
          toast.info("🎲 Your turn!");
          lastToastedTurnRef.current = newPlayerId;
        }
        break;
      }

      case "TOKEN_MOVED":
        break;

      case "PLAYER_LEFT": {

        if (!isMountedRef.current) break;

        const leftId = lastMessage.payload.playerId;

        if (leftId === myPlayer?.id) break;

        const leftPlayer = lastMessage.payload.gameState.players.find(
          (p: Player) => p.id === leftId
        ) ?? gameState?.players.find((p: Player) => p.id === leftId);

        const name = leftPlayer?.username ?? "A player";
        toast.warning(`${name} left the game`);

        const remaining = lastMessage.payload.gameState.players.filter(
          (p: Player) => p.id !== leftId
        );
        if (remaining.length <= 1) {
          setTimeout(() => {
            if (!isMountedRef.current) return;
            clearGame();
            navigate("/lobby");
          }, 2500);
        }
        break;
      }

      case "ERROR":
        toast.error(lastMessage.payload.message);
        setIsRolling(false);
        break;
    }
  }, [lastMessage]);

  useEffect(() => {
    const status = gameState?.status as string | undefined;
    const currentTurnId = gameState?.currentPlayerId;

    if (
      prevStatusRef.current === "WAITING" &&
      status === "IN_PROGRESS" &&
      currentTurnId === myPlayer?.id &&
      lastToastedTurnRef.current !== currentTurnId
    ) {
      toast.info("🎲 Your turn!");
      lastToastedTurnRef.current = currentTurnId;
    }

    prevStatusRef.current = status ?? null;
  }, [gameState?.status, gameState?.currentPlayerId]);

  const handleRoll = useCallback(() => {
    if (!canRoll || !gameId) return;
    setIsRolling(true);
    sendMessage({ type: "ROLL_DICE", payload: { gameId } });
  }, [canRoll, gameId, sendMessage]);

  const handleTokenClick = useCallback((tokenId: string) => {
    if (!canMove || !gameId) return;
    sendMessage({ type: "MOVE_TOKEN", payload: { gameId, tokenId } });
  }, [canMove, gameId, sendMessage]);

  const handleLeaveActiveGame = useCallback(() => {
    isMountedRef.current = false;
    if (gameId) sendMessage({ type: "LEAVE_ROOM", payload: { gameId } });
    clearGame();
    navigate("/lobby");
  }, [gameId, sendMessage, navigate, clearGame]);

  const handleLeaveWaiting = useCallback(() => {
    isMountedRef.current = false;
    clearGame();
    navigate("/lobby");
  }, [navigate, clearGame]);

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center
        bg-gradient-to-br from-slate-50 to-slate-100
        dark:from-slate-900 dark:to-slate-800 transition-colors duration-500">
        <div className="text-center space-y-3">
          <div className="text-4xl sm:text-5xl animate-bounce">🎲</div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Connecting to game...
          </p>
        </div>
      </div>
    );
  }

  if ((gameState.status as string) === "WAITING") {
    return (
      <WaitingRoom
        gameId={gameId ?? ""}
        roomCode={roomCode}
        playerCount={gameState.players.length}
        isConnected={isConnected}
        onLeave={handleLeaveWaiting}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100
      dark:from-slate-900 dark:to-slate-800 flex flex-col transition-colors duration-500">

      {(gameState.status as string) === "FINISHED" && myPlayer && (
        <WinScreen gameState={gameState} myPlayerId={myPlayer.id}/>
      )}

      <GameNavbar onLeave={handleLeaveActiveGame} isConnected={isConnected}/>

      <div className="flex-1 flex flex-col lg:flex-row items-center
        justify-center gap-3 sm:gap-4 p-2 sm:p-4">

        <div className="w-full max-w-[min(520px,100vw-16px)] lg:max-w-[560px] flex-shrink-0">
          <Board
            players={gameState.players}
            currentPlayerId={gameState.currentPlayerId}
            diceRolled={gameState.diceRolled}
            isMyTurn={isMyTurn}
            myPlayerColor={myPlayer?.color ?? null}
            onTokenClick={handleTokenClick}
          />
        </div>

        <div className="flex flex-row lg:flex-col items-stretch gap-3
          w-full lg:w-[176px] flex-shrink-0">

          <div className="bg-white dark:bg-slate-800 rounded-2xl border
            border-slate-200 dark:border-slate-700 shadow-sm p-3 sm:p-4
            flex flex-col items-center gap-2 flex-shrink-0">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {isMyTurn ? "Your Roll" : "Dice"}
            </p>
            <Dice
              value={gameState.diceValue}
              isRolling={isRolling}
              canRoll={canRoll}
              onRoll={handleRoll}
            />
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border
            border-slate-200 dark:border-slate-700 shadow-sm p-3 sm:p-4
            flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Players
            </p>
            <div className="space-y-1.5">
              {gameState.players.map((player: Player) => {
                const styles = COLOR_STYLES[player.color];
                const isActive = player.id === gameState.currentPlayerId;
                const done = player.tokens.filter(t => t.status === "FINISHED").length;
                const isMe = player.userId === user?.id;
                return (
                  <div key={player.id}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all duration-200",
                      isActive ? "bg-slate-100 dark:bg-slate-700 shadow-sm" : "opacity-55"
                    )}>
                    <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", styles.bg)}/>
                    <span className="text-xs font-medium text-slate-700
                      dark:text-slate-200 truncate flex-1 min-w-0">
                      {player.username}
                      {isMe && <span className="text-slate-400 ml-1 font-normal">(you)</span>}
                    </span>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">{done}/4</span>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0"/>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}