import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthUser } from "@repo/shared";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
}

if (typeof window !== "undefined") {
  localStorage.removeItem("ludo-auth");
  localStorage.removeItem("ludo-auth-v2");
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user:  null,

      setAuth: (token, user) => {
        const safeUser: AuthUser = {
          id: user.id,
          username: user.username,
          email: user.email,
        };
        set({ token, user: safeUser });
      },

      clearAuth: () => set({ token: null, user: null }),
    }),
    {
      name: "ludo-auth",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
