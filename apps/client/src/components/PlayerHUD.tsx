import type { Player } from "@repo/shared";
import { COLOR_STYLES } from "@repo/shared";
import { cn } from "@/lib/utils";

interface Props {
  player: Player;
  isCurrentTurn: boolean;
  isMe: boolean;
}

export default function PlayerHUD({ player, isCurrentTurn, isMe }: Props) {
  const styles = COLOR_STYLES[player.color];
  const finishedTokens = player.tokens.filter((t) => t.status === "FINISHED").length;

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-all",
        styles.border,
        isCurrentTurn && "ring-2 ring-offset-2",
        isCurrentTurn && styles.border,
        isMe && "bg-muted"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-full", styles.bg)} />
          <span className="font-medium text-sm">
            {player.username}
            {isMe && (
              <span className="text-xs text-muted-foreground ml-1">(you)</span>
            )}
          </span>
        </div>
        {isCurrentTurn && (
          <span className="text-xs font-medium text-green-600 animate-pulse">
            ● Turn
          </span>
        )}
        {player.rank !== null && (
          <span className="text-xs font-bold text-yellow-600">
            #{player.rank}
          </span>
        )}
      </div>

      <div className="flex gap-1">
        {player.tokens.map((token) => (
          <div
            key={token.id}
            className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold",
              token.status === "FINISHED"
                ? cn(styles.bg, "border-transparent text-white")
                : token.status === "ACTIVE"
                ? cn("border-current", styles.text)
                : "border-muted-foreground bg-muted text-muted-foreground"
            )}
          >
            {token.status === "FINISHED"
              ? "✓"
              : token.status === "ACTIVE"
              ? token.position
              : "H"}
          </div>
        ))}
      </div>

      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", styles.bg)}
          style={{ width: `${(finishedTokens / 4) * 100}%` }}
        />
      </div>
    </div>
  );
}