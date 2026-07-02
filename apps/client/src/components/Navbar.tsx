import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useGameStore } from "@/store/gameStore";
import { useDarkMode } from "@/hooks/useDarkMode";

function DarkToggle() {
  const { dark, toggle } = useDarkMode();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="w-9 h-9 rounded-xl flex items-center justify-center
        bg-slate-100 dark:bg-slate-800
        hover:bg-slate-200 dark:hover:bg-slate-700
        border border-slate-200 dark:border-slate-600
        transition-all duration-300 flex-shrink-0"
    >
      {dark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          className="text-yellow-400">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1"  x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22"   x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1"  y1="12" x2="3"  y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
          <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          className="text-slate-600 dark:text-slate-300">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className="text-2xl">🎲</span>
      <span className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">
        Ludo King
      </span>
    </div>
  );
}

function NavShell({ children }: { children: React.ReactNode }) {
  return (
    <nav className="w-full bg-white dark:bg-slate-900
      border-b border-slate-200 dark:border-slate-700
      shadow-sm px-4 sm:px-8 py-4
      flex items-center justify-between
      transition-colors duration-500">
      {children}
    </nav>
  );
}

export function AuthNavbar() {
  return (
    <NavShell>
      <Brand />
      <DarkToggle />
    </NavShell>
  );
}

export function LobbyNavbar() {
  const navigate  = useNavigate();
  const user      = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const clearGame = useGameStore((s) => s.clearGame);

  function handleLogout() {
    clearAuth();
    clearGame();
    navigate("/login");
  }

  return (
    <NavShell>
      <Brand />
      <div className="flex items-center gap-2 sm:gap-3">
        <DarkToggle />
        {user && (
          <>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-600 flex-shrink-0" />
            <span className="text-sm text-slate-500 dark:text-slate-400 flex-shrink-0">
              Hello,{" "}
              <span className="font-semibold text-slate-800 dark:text-white">
                {user.username}
              </span>
            </span>
            <button
              onClick={handleLogout}
              className="text-sm font-semibold flex-shrink-0
                text-red-500 hover:text-white
                border border-red-300 hover:border-red-500
                hover:bg-red-500
                px-3 sm:px-4 py-1.5 rounded-xl
                transition-all duration-200"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </NavShell>
  );
}

export function GameNavbar({
  onLeave,
  isConnected,
}: {
  onLeave: () => void;
  isConnected: boolean;
}) {
  const user = useAuthStore((s) => s.user);

  return (
    <NavShell>
      <Brand />
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300
          ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
        />
        <DarkToggle />
        {user && (
          <>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-600 flex-shrink-0" />
            <span className="text-sm text-slate-500 dark:text-slate-400 flex-shrink-0">
              Hello,{" "}
              <span className="font-semibold text-slate-800 dark:text-white">
                {user.username}
              </span>
            </span>
          </>
        )}
        <button
          onClick={onLeave}
          className="text-sm font-semibold flex-shrink-0
            text-red-500 hover:text-white
            border border-red-300 hover:border-red-500
            hover:bg-red-500
            px-3 sm:px-4 py-1.5 rounded-xl
            transition-all duration-200"
        >
          Leave
        </button>
      </div>
    </NavShell>
  );
}