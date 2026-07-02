import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { AuthNavbar } from "@/components/Navbar";

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.register({ username: username.trim(), email: email.trim(), password });

      const name = res.user.username;

      setAuth(res.token, res.user);
      toast.success(`Welcome, ${name}!`);
      navigate("/lobby");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100
      dark:from-slate-900 dark:to-slate-800 flex flex-col transition-colors duration-500">

      <AuthNavbar />

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border
            border-slate-200 dark:border-slate-700 p-6 sm:p-8"
            style={{
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 10px 40px -10px rgba(0,0,0,0.12)",
              transform: "perspective(1000px) rotateX(1deg)",
            }}>

            <div className="mb-6">
              <h2 className="text-xl text-center font-bold text-slate-800 dark:text-white">Create an account</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500
                  dark:text-slate-400 uppercase tracking-wider">
                  Username
                </Label>
                <Input
                  type="text"
                  placeholder="coolplayer123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="username"
                  className="h-11 rounded-xl border-slate-200 dark:border-slate-600
                    bg-slate-50 dark:bg-slate-700 dark:text-white
                    focus:border-emerald-400 focus:ring-emerald-400 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500
                  dark:text-slate-400 uppercase tracking-wider">
                  Email
                </Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                  className="h-11 rounded-xl border-slate-200 dark:border-slate-600
                    bg-slate-50 dark:bg-slate-700 dark:text-white
                    focus:border-emerald-400 focus:ring-emerald-400 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500
                  dark:text-slate-400 uppercase tracking-wider">
                  Password
                </Label>
                <Input
                  type="password"
                  placeholder="length must be atleast 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                  className="h-11 rounded-xl border-slate-200 dark:border-slate-600
                    bg-slate-50 dark:bg-slate-700 dark:text-white
                    focus:border-emerald-400 focus:ring-emerald-400 transition-colors"
                />
              </div>

              <div className="flex justify-center pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white
                    rounded-xl h-11 font-semibold transition-all duration-200
                    disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading
                    ? <span className="flex items-center gap-2"><Spinner /> Creating...</span>
                    : "Create Account"}
                </Button>
              </div>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700"/>
              <span className="text-xs text-slate-400">or</span>
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700"/>
            </div>

            <div className="pb-2 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{" "}
                <Link to="/login"
                  className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}