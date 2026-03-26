import { useState, useEffect } from "react";
import { account, createDoc, listDocs, Query, ID } from "@/lib/appwrite";
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
        // Create account
        const newUser = await account.create(ID.unique(), email, password, fullName || undefined);
        // Create session
        await account.createEmailPasswordSession(email, password);
        // Create profile document
        await createDoc("profiles", {
          user_id: newUser.$id,
          email: email,
          full_name: fullName || "",
          trust_level: "low",
          is_banned: false,
          ban_reason: "",
          warning_count: 0,
          is_restricted: false
        });
        toast.success("Account created!");
        // Full page reload to pick up new session
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
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-secondary border-border mt-1" required minLength={8} />
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
