import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useGameStore } from "../store/gameStore";

export function useAuth() {
  const navigate  = useNavigate();
  const setAuth   = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const clearGame = useGameStore((s) => s.clearGame);

  const logout = () => {
    clearAuth();
    clearGame();
    navigate("/login");
  };

  return { setAuth, logout };
}