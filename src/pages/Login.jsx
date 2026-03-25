import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function Login() {
  const nav = useNavigate();
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [debugLog, setDebugLog] = useState([]);

  const addLog = (msg) => {
    setDebugLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    if (isAuthenticated) {
      addLog("Auth detected! Redirecting to Dashboard...");
      nav("/Dashboard", { replace: true });
    }
  }, [isAuthenticated, nav]);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMsg("");
    setDebugLog([]);
    const mode = isSignUp ? "signup" : "login";
    setStatusMsg(isSignUp ? "Creating account..." : "Signing in...");
    addLog(`Starting ${mode} for ${email}`);

    try {
      if (isSignUp) {
        addLog("Calling supabase.auth.signUp...");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName || "" } }
        });
        addLog(`signUp returned: error=${error ? error.message : "none"}, session=${!!data?.session}, user=${!!data?.user}`);

        if (error) throw error;

        if (data.session) {
          addLog("Session received! Auto-confirmed.");
          toast.success("Account created!");
        } else if (data.user && !data.session) {
          addLog("User created but no session. Check email or confirm settings.");
          toast.success("Account created! Please sign in.");
          setIsSignUp(false);
        }
      } else {
        addLog("Calling supabase.auth.signInWithPassword...");
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        addLog(`signIn returned: error=${error ? error.message : "none"}, session=${!!data?.session}, user=${!!data?.user}`);

        if (error) throw error;
        addLog("Login successful! Waiting for auth state change...");
        toast.success("Signed in!");
      }
    } catch (err) {
      const msg = err?.message || "Something went wrong";
      addLog(`ERROR: ${msg}`);
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setStatusMsg("");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-orbitron text-3xl font-bold text-foreground">
            GMAIL<span className="text-primary">PAY</span>
          </h1>
        </div>
        <form onSubmit={handleAuth} className="bg-card border border-border rounded-xl p-6 space-y-4">
          {isSignUp && (
            <div>
              <Label>Full Name</Label>
              <Input placeholder="Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-secondary border-border mt-1" required />
            </div>
          )}
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-secondary border-border mt-1" required />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-secondary border-border mt-1" required />
          </div>
          {errorMsg && <p className="text-red-500 text-sm bg-red-500/10 p-2 rounded">{errorMsg}</p>}
          {statusMsg && loading && <p className="text-primary text-sm bg-primary/10 p-2 rounded text-center">{statusMsg}</p>}
          <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground">
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(""); setDebugLog([]); }} className="text-primary hover:underline">
              {isSignUp ? "Sign In instead" : "Sign Up instead"}
            </button>
          </p>
        </form>
        {debugLog.length > 0 && (
          <div className="mt-4 bg-zinc-900 border border-zinc-700 rounded-xl p-3">
            <p className="text-xs font-bold text-zinc-400 mb-2">Debug Log (temporary):</p>
            {debugLog.map((log, i) => (
              <p key={i} className="text-xs text-zinc-300 font-mono">{log}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
