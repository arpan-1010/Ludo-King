import type { AuthResponse, LogInRequest, RegisterRequest, CreateGameRequest, CreateGameResponse, JoinGameRequest, JoinGameResponse, GameState } from "@repo/shared";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

async function request<T>(
  path: string,
  options: RequestInit,
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE_URL}/${path}`.replace(/([^:])\/\/+/g, "$1/"), {
    ...options,
    headers,
  });

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server error: ${res.status} ${res.statusText}`);
  }

  if (!res.ok) {
    const errData = data as { error?: string };
    throw new Error(errData?.error ?? `Server error ${res.status}`);
  }

  return data as T;
}

export const authApi = {
  register: (body: RegisterRequest) =>
    request<AuthResponse>("auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (body: LogInRequest) =>
    request<AuthResponse>("auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export const gameApi = {
  create: (body: CreateGameRequest, token: string) =>
    request<CreateGameResponse>("game/create", {
      method: "POST",
      body: JSON.stringify(body),
    }, token),

  join: (body: JoinGameRequest, token: string) =>
    request<JoinGameResponse>("game/join", {
      method: "POST",
      body: JSON.stringify(body),
    }, token),

  get: (gameId: string, token: string) =>
    request<GameState>(`game/${gameId}`, {
      method: "GET",
    }, token),

  cancelGame: (gameId: string, token: string) =>
    request<{ success: boolean }>(`game/${gameId}/cancel`, {
      method: "DELETE",
    }, token),
};
