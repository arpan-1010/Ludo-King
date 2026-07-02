import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { GameState } from "@repo/shared";
import { COLOR_STYLES } from "@repo/shared";

interface Props {
  gameState: GameState;
  myPlayerId: string;
}

export default function WinScreen({ gameState, myPlayerId }: Props) {
  const navigate = useNavigate();

  const rankings = [...gameState.players]
    .filter((p) => p.rank !== null)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));

  const winner = rankings[0];
  const isWinner = winner?.id === myPlayerId;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.4 }}
        className="bg-background rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
      >
        <div className="text-6xl mb-4">
          {isWinner ? "🏆" : "🎮"}
        </div>
        <h2 className="text-2xl font-bold mb-1">
          {isWinner ? "You Won!" : "Game Over"}
        </h2>
        <p className="text-muted-foreground mb-6">
          {isWinner
            ? "Congratulations! You finished first!"
            : `${winner?.username ?? "Someone"} won the game`}
        </p>

        <div className="space-y-2 mb-6">
          {rankings.map((player) => {
            const styles = COLOR_STYLES[player.color];
            return (
              <div
                key={player.id}
                className="flex items-center justify-between px-4 py-2 rounded-lg bg-muted"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">
                    {player.rank === 1
                      ? "🥇"
                      : player.rank === 2
                      ? "🥈"
                      : player.rank === 3
                      ? "🥉"
                      : `#${player.rank}`}
                  </span>
                  <div className={`w-3 h-3 rounded-full ${styles.bg}`} />
                  <span className="font-medium">{player.username}</span>
                </div>
                {player.id === myPlayerId && (
                  <span className="text-xs text-muted-foreground">(you)</span>
                )}
              </div>
            );
          })}
        </div>

        <Button className="w-full" onClick={() => navigate("/lobby")}>
          Back to Lobby
        </Button>
      </motion.div>
    </motion.div>
  );
}