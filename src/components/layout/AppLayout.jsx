import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Mail, Users, Settings, X, Megaphone, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { listDocs, Query } from "@/lib/appwrite";
import InstallPWA from "@/components/InstallPWA";
import { AnimatePresence, motion } from "framer-motion";

export default function AppLayout() {
  const loc = useLocation();
  const navigate = useNavigate();
  const [sa, setSa] = useState(false);
  const [code, setCode] = useState("");
  const [broadcasts, setBroadcasts] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    const fetchBroadcasts = async () => {
      try {
        const data = await listDocs("broadcasts", [Query.equal("is_active", true), Query.orderDesc("$createdAt"), Query.limit(3)]);
        setBroadcasts(data);
      } catch {}
    };
    fetchBroadcasts();
    const interval = setInterval(fetchBroadcasts, 30000);
    return () => clearInterval(interval);
  }, []);

  const nav = [
    { label: "Dashboard", path: "/Dashboard", icon: LayoutDashboard },
    { label: "Submissions", path: "/Submissions", icon: Mail },
    { label: "Referrals", path: "/Referrals", icon: Users },
  ];
  const go = () => { if (code === "808254") navigate("/Admin"); else if (code === "449922") navigate("/Admin1"); else if (code.toUpperCase() === "INK") navigate("/BuyerAdmin?auth=1"); else alert("Invalid"); setCode(""); setSa(false); };
  const activeBroadcasts = broadcasts.filter((b) => !dismissed.has(b.$id));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-orbitron text-xl md:text-2xl font-bold tracking-wider">
            <span className="text-foreground">GMAIL</span><span className="gradient-text">PAY</span>
          </h1>
          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            {nav.map((i) => {
              const I = i.icon;
              const a = loc.pathname === i.path;
              return (
                <Link key={i.path} to={i.path} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${a ? "bg-primary/10 text-primary glow-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
                  <I className="w-4 h-4" />
                  <span>{i.label}</span>
                </Link>
              );
            })}
            <button onClick={() => setSa(!sa)} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent ml-1 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
          {/* Mobile: settings only in header */}
          <button onClick={() => setSa(!sa)} className="sm:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent">
            <Settings className="w-4 h-4" />
          </button>
        </div>
        <AnimatePresence>
          {sa && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="max-w-6xl mx-auto px-4 pb-3 flex gap-2">
                <input autoFocus type="password" placeholder="Admin code..." value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} className="flex-1 bg-accent border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary/50 outline-none" />
                <button onClick={go} className="px-5 py-2.5 gold-gradient text-black rounded-xl text-sm font-bold">Go</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Password notice banner - sleek and visible */}
      <div className="notice-banner py-2.5 px-4">
        <p className="text-center text-xs md:text-sm font-semibold text-primary/90 tracking-wide max-w-6xl mx-auto">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            All Gmails MUST use password: <span className="font-bold text-primary">iffyboi77</span>
            <span className="mx-2 text-border">|</span>
            Chat with the <span className="font-bold text-primary">GPay Bot</span> for help
          </span>
        </p>
      </div>

      {/* APK Download Banner */}
      <div className="mx-4 mt-3 max-w-6xl lg:mx-auto w-auto">
        <a href="https://github.com/gmailpay/gmailpay/releases/download/v1.0.0/app-release.apk" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 glass-card glass-card-hover rounded-2xl px-4 py-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Download Android App</p>
            <p className="text-xs text-muted-foreground">Get the full GmailPay experience</p>
          </div>
          <span className="text-xs text-primary font-semibold shrink-0">GET</span>
        </a>
      </div>

      <InstallPWA />

      {/* Broadcasts */}
      <AnimatePresence>
        {activeBroadcasts.map((b) => (
          <motion.div key={b.$id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="mx-4 mt-2 max-w-6xl lg:mx-auto w-auto">
            <div className="flex items-start gap-3 glass-card rounded-2xl px-4 py-3">
              <Megaphone className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground/90 flex-1">{b.message}</p>
              <button onClick={() => setDismissed(prev => new Set([...prev, b.$id]))} className="p-1 rounded-lg hover:bg-accent shrink-0">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-4 pb-safe">
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/30 bg-card/80 backdrop-blur-xl">
        <div className="flex items-center justify-around px-2 py-1" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
          {nav.map((i) => {
            const I = i.icon;
            const a = loc.pathname === i.path;
            return (
              <Link key={i.path} to={i.path} className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 min-w-[64px] ${a ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`p-1.5 rounded-xl transition-all ${a ? "bg-primary/15 glow-primary" : ""}`}>
                  <I className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">{i.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
