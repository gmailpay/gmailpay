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

  useEffect(() => {
    if (isAuthenticated) nav("/Dashboard", { replace: true });
  }, [isAuthenticated, nav]);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMsg("");
    setStatusMsg(isSignUp ? "Creating account..." : "Signing in...");

    try {
      if (isSignUp) {
        // Use server-side proxy for signup
        const resp = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, full_name: fullName })
        });
        const data = await resp.json();
        
        if (!resp.ok) throw new Error(data.msg || data.error || "Sign up failed");
        
        if (data.access_token) {
          // Auto-set session in Supabase client
          await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token
          });
          toast.success("Account created!");
        } else {
          toast.success("Account created! Please sign in.");
          setIsSignUp(false);
        }
      } else {
        // Use server-side proxy for login
        const resp = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await resp.json();
        
        if (!resp.ok) throw new Error(data.msg || data.error || "Sign in failed");
        
        // Set session in Supabase client
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token
        });
        toast.success("Signed in!");
      }
    } catch (err) {
      const msg = err?.message || "Something went wrong";
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
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(""); }} className="text-primary hover:underline">
              {isSignUp ? "Sign In instead" : "Sign Up instead"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
