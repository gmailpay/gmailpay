import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Mail, Users, Settings, X, Megaphone } from "lucide-react";
import { useState, useEffect } from "react";
import { listDocs, Query } from "@/lib/appwrite";

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
  const go = () => { if (code === "808254") navigate("/Admin"); else if (code === "449922") navigate("/Admin1"); else alert("Invalid"); setCode(""); setSa(false); };
  const activeBroadcasts = broadcasts.filter((b) => !dismissed.has(b.$id));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-orbitron text-xl md:text-2xl font-bold tracking-wider text-foreground">GMAIL<span className="text-primary">PAY</span></h1>
          <div className="flex items-center gap-1">
            {nav.map((i) => { const I = i.icon; const a = loc.pathname === i.path; return (<Link key={i.path} to={i.path} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${a ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}><I className="w-4 h-4" /><span className="hidden sm:inline">{i.label}</span></Link>); })}
            <button onClick={() => setSa(!sa)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"><Settings className="w-4 h-4" /></button>
          </div>
        </div>
        {sa && (<div className="max-w-6xl mx-auto px-4 pb-3 flex gap-2"><input autoFocus type="password" placeholder="Admin code..." value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" /><button onClick={go} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Go</button></div>)}
      </header>
      <div className="silver-gradient py-2 px-4 text-center"><p className="text-xs md:text-sm font-semibold text-black tracking-wide">All Gmails MUST use password: <span className="font-bold">iffyboi77</span><span className="mx-2">|</span>Chat with the <span className="font-bold">GPay Bot</span> if you need assistance</p></div>
      {activeBroadcasts.length > 0 && (<div className="space-y-1 px-4 py-2 max-w-6xl mx-auto w-full">{activeBroadcasts.map((b) => (<div key={b.$id} className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 text-sm"><Megaphone className="w-4 h-4 text-primary shrink-0" /><p className="flex-1 text-foreground text-xs md:text-sm">{b.message}</p><button onClick={() => setDismissed((prev) => new Set([...prev, b.$id]))} className="p-1 rounded hover:bg-primary/20 shrink-0"><X className="w-3 h-3 text-muted-foreground" /></button></div>))}</div>)}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6"><Outlet /></main>
      <a href="https://chat.whatsapp.com/JmSWDINefIA5cBLEon0Dz1?mode=gi_t" target="_blank" rel="noopener noreferrer" className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform" title="Join our WhatsApp group"><svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg></a>
    </div>
  );
}
