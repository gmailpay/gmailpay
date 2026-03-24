import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw } from "lucide-react";
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
  const [serverReady, setServerReady] = useState(false);

  useEffect(() => {
    if (isAuthenticated) nav("/Dashboard", { replace: true });
  }, [isAuthenticated, nav]);

  // Warm up the server on page load
  useEffect(() => {
    let cancelled = false;
    const warmUp = async () => {
      setStatusMsg("Connecting to server...");
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          await supabase.from("app_settings").select("setting_key").limit(1).abortSignal(controller.signal);
          clearTimeout(timeoutId);
          if (!cancelled) {
            setServerReady(true);
            setStatusMsg("");
          }
          return;
        } catch (e) {
          if (!cancelled) {
            setStatusMsg(attempt < 2 ? "Server is waking up... hang tight!" : "Almost there...");
          }
        }
      }
      if (!cancelled) {
        setServerReady(true);
        setStatusMsg("");
      }
    };
    warmUp();
    return () => { cancelled = true; };
  }, []);

  const attemptAuth = async (retries = 2) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (isSignUp) {
          setStatusMsg(attempt > 0 ? "Retrying... creating account" : "Creating your account...");
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
          });
          if (error) throw error;
          toast.success("Account created!");
          if (!data?.session) {
            setIsSignUp(false);
            toast.info("Please sign in with your new account.");
          }
          return true;
        } else {
          setStatusMsg(attempt > 0 ? "Retrying... signing in" : "Signing you in...");
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          toast.success("Signed in!");
          return true;
        }
      } catch (err) {
        // If it's a real auth error (wrong password etc.), don't retry
        if (err.message?.includes("Invalid") || err.message?.includes("invalid") || 
            err.message?.includes("already") || err.message?.includes("exists") ||
            err.message?.includes("weak") || err.message?.includes("short")) {
          throw err;
        }
        // Network/timeout error - retry
        if (attempt < retries) {
          setStatusMsg("Server was slow. Retrying...");
          await new Promise(r => setTimeout(r, 2000));
        } else {
          throw err;
        }
      }
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const timeout = setTimeout(() => {
      setLoading(false);
      setStatusMsg("");
      setErrorMsg("Connection is very slow. The server may be waking up — please try again in 30 seconds.");
    }, 45000);

    try {
      await attemptAuth(2);
      clearTimeout(timeout);
    } catch (err) {
      clearTimeout(timeout);
      setErrorMsg(err.message);
      toast.error(err.message);
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

        {!serverReady && statusMsg && (
          <div className="mb-4 flex items-center justify-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <p className="text-sm text-primary">{statusMsg}</p>
          </div>
        )}

        <form
          onSubmit={handleAuth}
          className="bg-card border border-border rounded-xl p-6 space-y-4"
        >
          {isSignUp && (
            <div>
              <Label>Full Name</Label>
              <Input
                placeholder="Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-secondary border-border mt-1"
                required
              />
            </div>
          )}
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-secondary border-border mt-1"
              required
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-secondary border-border mt-1"
              required
            />
          </div>
          {errorMsg && (
            <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded space-y-2">
              <p>{errorMsg}</p>
              {errorMsg.includes("slow") && (
                <button
                  type="button"
                  onClick={handleAuth}
                  className="flex items-center gap-1 text-primary text-xs hover:underline"
                >
                  <RefreshCw className="w-3 h-3" /> Try again
                </button>
              )}
            </div>
          )}
          {statusMsg && loading && (
            <div className="flex items-center justify-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <p className="text-primary text-sm">{statusMsg}</p>
            </div>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline"
            >
              {isSignUp ? "Sign In instead" : "Sign Up instead"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
