import type { PlayerColor } from "./types";

export const START_POSITIONS : Record<PlayerColor, number> = {
    RED : 1,
    GREEN : 14,
    YELLOW : 27,
    BLUE : 40
};

export const HOME_ENTRY_POSITIONS : Record<PlayerColor, number> = {
    RED : 51,
    GREEN : 12,
    YELLOW : 25,
    BLUE : 38
};

export const SAFE_CELLS : ReadonlySet<number> = new Set ([
    1, 9, 14, 22, 27, 35, 40, 48
]);

export const SHARED_PATH_LENGTH = 52;
export const HOME_COLUMN_LENGTH = 6;
export const FINISHED_POSITION = 57;
export const TOKENS_PER_PLAYER = 4;
export const MAX_PLAYERS = 4;

export const COLOR_ORDER : PlayerColor[] = ["RED", "GREEN", "YELLOW", "BLUE"];

export const COLOR_STYLES : Record<PlayerColor, {
    bg : string;
    text : string;
    border : string;
}> = {
    RED:    { bg: "bg-red-500", text: "text-red-700", border: "border-red-500"},
    GREEN:  { bg: "bg-green-500", text: "text-green-700", border: "border-green-500"},
    YELLOW: { bg: "bg-yellow-400", text: "text-yellow-700", border: "border-yellow-400"},
    BLUE:   { bg: "bg-blue-500", text: "text-blue-700", border: "border-blue-500"},
};
