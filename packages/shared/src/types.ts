export type PlayerColor = "RED" | "GREEN" | "YELLOW" | "BLUE";

export type GameStatus = "WAITING" | "IN_PROGRESS" | "FINISHED";

export type TokenStatus = "HOME" | "ACTIVE" | "FINISHED";

export interface Token {
    id : string;
    color : PlayerColor;
    position : number;
    status : TokenStatus;
}

export interface Player {
    id : string;
    userId : string;
    username : string;
    color : PlayerColor;
    tokens : Token[];
    rank : number | null;
}

export interface GameState {
    id : string;
    status : GameStatus;
    players : Player[];
    currentPlayerId : string | null;
    diceValue : number | null;
    diceRolled : boolean;
    winnerId : string | null;
    createdAt : string;
}

export type ClientMessage = 
    | {type : "JOIN_ROOM"; payload : {gameId : string; token : string}}
    | {type : "ROLL_DICE"; payload : {gameId : string}}
    | {type : "MOVE_TOKEN"; payload : {gameId : string; tokenId : string}}
    | {type : "LEAVE_ROOM"; payload : {gameId : string}}

export type ServerMessage = 
    | {type : "GAME_STATE"; payload : GameState}
    | {type : "PLAYER_JOINED"; payload : {player : Player; gameState : GameState}}
    | {type : "PLAYER_LEFT"; payload : {playerId : string; gameState : GameState}}
    | {type : "DICE_ROLLED"; payload : {playerId : string; value : number}}
    | {type : "TOKEN_MOVED"; payload : {tokenId : string; from : number; to : number; captured : boolean}}
    | {type : "TURN_CHANGED"; payload : {playerId : string}}
    | {type : "GAME_OVER"; payload : {winnerId : string; rankings : {playerId : string; rank : number}[]}}
    | {type : "ERROR", payload : {message : string; code : string}}
    | {type : "RECONNECT_STATE"; payload : GameState}

export interface CreateGameRequest {
    playerCount : 2 | 3 | 4;
}

export interface CreateGameResponse {
    gameId : string;
    roomCode : string;
}

export interface JoinGameRequest {
    roomCode : string;
}

export interface JoinGameResponse {
    gameId : string;
}

export interface AuthUser {
    id : string;
    username : string;
    email : string;
}

export interface LogInRequest {
    email : string;
    password : string;
}

export interface RegisterRequest {
    username : string;
    email : string;
    password : string;
}

export interface AuthResponse {
    token : string;
    user : AuthUser;
}