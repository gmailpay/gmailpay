import { useState, useEffect } from "react";
import { account, createDoc, listDocs, Query, ID } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";

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
        const newUser = await account.create(ID.unique(), email, password, fullName || undefined);
        await account.createEmailPasswordSession(email, password);
        await createDoc("profiles", { user_id: newUser.$id, email, full_name: fullName || "", trust_level: "low", is_banned: false, ban_reason: "", warning_count: 0, is_restricted: false });
        toast.success("Account created!");
        window.location.href = "/Dashboard";
      } else {
        await account.createEmailPasswordSession(email, password);
        toast.success("Signed in!");
        window.location.href = "/Dashboard";
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-orbitron text-4xl font-bold tracking-wider mb-2">
            <span className="text-foreground">GMAIL</span><span className="gradient-text">PAY</span>
          </h1>
          <p className="text-sm text-muted-foreground font-space">Create. Submit. Get Paid.</p>
        </div>

        {/* Form card */}
        <div className="glass-card rounded-2xl p-8 glow-primary">
          <h2 className="text-lg font-semibold text-foreground mb-6 font-space">{isSignUp ? "Create Account" : "Welcome Back"}</h2>
          <form onSubmit={handleAuth} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-accent/50 border-border/50 pl-10 h-12 rounded-xl focus:ring-1 focus:ring-primary/30 focus:border-primary/50" required />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-accent/50 border-border/50 pl-10 h-12 rounded-xl focus:ring-1 focus:ring-primary/30 focus:border-primary/50" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="password" placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-accent/50 border-border/50 pl-10 h-12 rounded-xl focus:ring-1 focus:ring-primary/30 focus:border-primary/50" required minLength={8} />
              </div>
            </div>
            {errorMsg && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-xl">{errorMsg}</div>}
            {statusMsg && loading && <div className="text-primary text-sm bg-primary/10 border border-primary/20 p-3 rounded-xl text-center">{statusMsg}</div>}
            <Button type="submit" disabled={loading} className="w-full h-12 gold-gradient text-black font-bold rounded-xl text-sm tracking-wide group">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{isSignUp ? "Create Account" : "Sign In"}<ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></>}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(""); }} className="text-sm text-muted-foreground hover:text-primary transition-colors">
              {isSignUp ? "Already have an account? " : "Don\u2019t have an account? "}
              <span className="text-primary font-semibold">{isSignUp ? "Sign In" : "Sign Up"}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
