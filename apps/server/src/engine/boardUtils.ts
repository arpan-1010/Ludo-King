import type { PlayerColor } from "@repo/shared";
import {START_POSITIONS, HOME_ENTRY_POSITIONS, SAFE_CELLS, SHARED_PATH_LENGTH, FINISHED_POSITION} from "@repo/shared";

export function calculateNewPosition(
  currentPosition: number,
  diceValue: number,
  color: PlayerColor
): number | null {
  if (currentPosition === 0) {
    if (diceValue === 6) {
      return START_POSITIONS[color];
    }
    return null;
  }

  if (currentPosition === FINISHED_POSITION) {
    return null;
  }

  if (currentPosition >= SHARED_PATH_LENGTH + 1) {
    const newPos = currentPosition + diceValue;
    if (newPos > FINISHED_POSITION) return null;
    return newPos;
  }

  const homeEntry = HOME_ENTRY_POSITIONS[color];
  const startPos = START_POSITIONS[color];

  const stepsTaken = (currentPosition - startPos + SHARED_PATH_LENGTH) % SHARED_PATH_LENGTH;
  const stepsToHomeEntry = (homeEntry - startPos + SHARED_PATH_LENGTH) % SHARED_PATH_LENGTH;

  if (stepsTaken + diceValue > stepsToHomeEntry) {
    const stepsIntoHomeColumn = stepsTaken + diceValue - stepsToHomeEntry;
    const newPos = SHARED_PATH_LENGTH + stepsIntoHomeColumn;
    if (newPos > FINISHED_POSITION) return null;
    return newPos;
  }

  const newPos = ((currentPosition - 1 + diceValue) % SHARED_PATH_LENGTH) + 1;
  return newPos;
}

export function isSafeCell(position: number): boolean {
  return SAFE_CELLS.has(position) || position > SHARED_PATH_LENGTH;
}

export function isOccupiedByEnemy(
  position: number,
  color: PlayerColor,
  allTokens: { position: number; color: PlayerColor; status: string }[]
): { captured: boolean; capturedTokenIds: string[] } {
  if (position === 0 || position === FINISHED_POSITION) {
    return { captured: false, capturedTokenIds: [] };
  }

  if (isSafeCell(position)) {
    return { captured: false, capturedTokenIds: [] };
  }

  const enemyTokens = allTokens.filter(
    (t) =>
      t.position === position &&
      t.color !== color &&
      t.status === "ACTIVE"
  ) as { position: number; color: PlayerColor; status: string; id?: string }[];

  if (enemyTokens.length === 0) {
    return { captured: false, capturedTokenIds: [] };
  }

  const colorCounts = enemyTokens.reduce<Record<string, number>>((acc, t) => {
    acc[t.color] = (acc[t.color] ?? 0) + 1;
    return acc;
  }, {});

  const isBlock = Object.values(colorCounts).some((count) => count >= 2);
  if (isBlock) {
    return { captured: false, capturedTokenIds: [] };
  }

  const capturedTokenIds = enemyTokens
    .map((t) => t.id)
    .filter((id): id is string => id !== undefined);

  return { captured: true, capturedTokenIds };
}