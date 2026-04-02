import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listDocs, updateDoc, Query } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Loader2, ArrowLeft, Shield, Lock, Users, Mail, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Link } from "react-router-dom";

const ACCESS_CODE = "INK";

function maskEmail(email) {
  if (!email) return "***";
  const [local, domain] = email.split("@");
  if (!domain) return email[0] + "***";
  return local[0] + "***@" + domain;
}

function BuyerSubmissions() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [rt, setRt] = useState(null);
  const [rr, setRr] = useState("");
  const [pr, setPr] = useState(null);
  const [view, setView] = useState("list");

  const { data: subs = [], isLoading } = useQuery({
    queryKey: ["buyer-admin-subs"],
    queryFn: () => listDocs("gmail_submissions", [Query.orderDesc("$createdAt"), Query.limit(500)])
  });

  const totalCount = subs.length;
  const pendingCount = subs.filter(s => s.status === "pending").length;
  const approvedCount = subs.filter(s => s.status === "approved").length;
  const rejectedCount = subs.filter(s => s.status === "rejected").length;
  const amountOwed = approvedCount * 300;

  const filtered = subs.filter(s =>
    (filter === "all" || s.status === filter) &&
    (!search || s.email_address?.toLowerCase().includes(search.toLowerCase()))
  );

  // Batch view grouped by submitter
  const batches = {};
  subs.forEach(s => {
    const key = maskEmail(s.submitted_by);
    if (!batches[key]) batches[key] = { label: key, pending: 0, approved: 0, rejected: 0, total: 0, subs: [] };
    batches[key][s.status] = (batches[key][s.status] || 0) + 1;
    batches[key].total++;
    batches[key].subs.push(s);
  });
  const batchList = Object.values(batches).sort((a, b) => b.pending - a.pending);

  const approve = async (s) => {
    setPr(s.$id);
    try { await updateDoc("gmail_submissions", s.$id, { status: "approved" }); qc.invalidateQueries({ queryKey: ["buyer-admin-subs"] }); toast.success("Approved!"); }
    catch { toast.error("Failed"); }
    setPr(null);
  };

  const reject = async () => {
    if (!rt) return;
    setPr(rt.$id);
    try { await updateDoc("gmail_submissions", rt.$id, { status: "rejected", rejection_reason: rr }); qc.invalidateQueries({ queryKey: ["buyer-admin-subs"] }); toast.success("Rejected."); }
    catch { toast.error("Failed"); }
    setRt(null); setRr(""); setPr(null);
  };

  const sc = {
    pending: { l: "Pending", c: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    approved: { l: "Approved", c: "bg-green-500/20 text-green-400 border-green-500/30" },
    rejected: { l: "Rejected", c: "bg-red-500/20 text-red-400 border-red-500/30" }
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold font-orbitron">{totalCount}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="bg-yellow-500/10 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold font-orbitron text-yellow-400">{pendingCount}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="bg-green-500/10 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold font-orbitron text-green-400">{approvedCount}</p>
          <p className="text-xs text-muted-foreground">Approved</p>
        </div>
        <div className="bg-primary/10 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold font-orbitron text-primary">\u20A6{amountOwed.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Amount Owed</p>
        </div>
      </div>

      {/* View toggle + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Search emails..." value={search} onChange={e => setSearch(e.target.value)} className="bg-secondary flex-1" />
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${filter === f ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary"}`}>{f}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView("list")} className={`px-3 py-1.5 rounded-lg text-xs ${view === "list" ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>List</button>
          <button onClick={() => setView("batch")} className={`px-3 py-1.5 rounded-lg text-xs ${view === "batch" ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>Batches</button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : view === "batch" ? (
        <div className="space-y-3">
          {batchList.map(b => (
            <div key={b.label} className="bg-secondary/30 rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm">{b.label}</p>
                <div className="flex gap-2 text-xs">
                  <span className="text-yellow-400">{b.pending} pending</span>
                  <span className="text-green-400">{b.approved} approved</span>
                  <span className="text-red-400">{b.rejected} rejected</span>
                </div>
              </div>
              <div className="space-y-2">
                {b.subs.filter(s => filter === "all" || s.status === filter).map(s => (
                  <div key={s.$id} className="flex items-center justify-between bg-background/50 rounded-lg p-2">
                    <div>
                      <p className="text-sm font-mono">{s.email_address}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(s.$createdAt), "MMM d, HH:mm")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={sc[s.status]?.c}>{sc[s.status]?.l}</Badge>
                      {s.status === "pending" && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => approve(s)} disabled={pr === s.$id} className="text-green-400 h-7 px-2">
                            {pr === s.$id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRt(s)} className="text-red-400 h-7 px-2">
                            <XCircle className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <div key={s.$id} className="flex items-center justify-between bg-secondary/30 rounded-xl p-3 border border-border">
              <div>
                <p className="text-sm font-mono">{s.email_address}</p>
                <p className="text-xs text-muted-foreground">{maskEmail(s.submitted_by)} \u2022 {format(new Date(s.$createdAt), "MMM d, HH:mm")}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={sc[s.status]?.c}>{sc[s.status]?.l}</Badge>
                {s.status === "pending" && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => approve(s)} disabled={pr === s.$id} className="text-green-400 h-8 px-2">
                      {pr === s.$id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setRt(s)} className="text-red-400 h-8 px-2">
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject dialog */}
      <Dialog open={!!rt} onOpenChange={() => { setRt(null); setRr(""); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Reject Submission</DialogTitle></DialogHeader>
          <Textarea placeholder="Reason (optional)" value={rr} onChange={e => setRr(e.target.value)} className="bg-secondary" />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRt(null); setRr(""); }}>Cancel</Button>
            <Button onClick={reject} disabled={!!pr} className="bg-red-600 hover:bg-red-700 text-white">Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BuyerUsers() {
  const { data: subs = [] } = useQuery({
    queryKey: ["buyer-admin-users"],
    queryFn: () => listDocs("gmail_submissions", [Query.orderDesc("$createdAt"), Query.limit(2000)])
  });

  const users = {};
  subs.forEach(s => {
    const key = s.submitted_by;
    if (!users[key]) users[key] = { email: maskEmail(key), pending: 0, approved: 0, rejected: 0, total: 0 };
    users[key][s.status] = (users[key][s.status] || 0) + 1;
    users[key].total++;
  });
  const userList = Object.values(users).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{userList.length} users</p>
      {userList.map(u => (
        <div key={u.email} className="bg-secondary/30 rounded-xl p-4 border border-border flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">{u.email}</p>
            <p className="text-xs text-muted-foreground">{u.total} submissions</p>
          </div>
          <div className="flex gap-3 text-xs">
            <span className="text-yellow-400">{u.pending} pending</span>
            <span className="text-green-400">{u.approved} approved</span>
            <span className="text-red-400">{u.rejected} rejected</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function BuyerStats() {
  const { data: subs = [] } = useQuery({
    queryKey: ["buyer-admin-stats"],
    queryFn: () => listDocs("gmail_submissions", [Query.orderDesc("$createdAt"), Query.limit(2000)])
  });

  const total = subs.length;
  const approved = subs.filter(s => s.status === "approved").length;
  const rejected = subs.filter(s => s.status === "rejected").length;
  const pending = subs.filter(s => s.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-secondary/50 rounded-xl p-6 text-center">
          <p className="text-4xl font-bold font-orbitron">{total}</p>
          <p className="text-sm text-muted-foreground mt-1">Total Submissions</p>
        </div>
        <div className="bg-green-500/10 rounded-xl p-6 text-center">
          <p className="text-4xl font-bold font-orbitron text-green-400">{approved}</p>
          <p className="text-sm text-muted-foreground mt-1">Approved</p>
        </div>
        <div className="bg-yellow-500/10 rounded-xl p-6 text-center">
          <p className="text-4xl font-bold font-orbitron text-yellow-400">{pending}</p>
          <p className="text-sm text-muted-foreground mt-1">Pending</p>
        </div>
        <div className="bg-primary/10 rounded-xl p-6 text-center">
          <p className="text-4xl font-bold font-orbitron text-primary">\u20A6{(approved * 300).toLocaleString()}</p>
          <p className="text-sm text-muted-foreground mt-1">Total Owed</p>
        </div>
      </div>
    </div>
  );
}

export default function BuyerAdmin() {
  const [code, setCode] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (code.toUpperCase() === ACCESS_CODE) {
      setAuthenticated(true);
      setError("");
    } else {
      setError("Invalid access code");
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <Lock className="w-10 h-10 text-primary mx-auto mb-3" />
            <h1 className="font-orbitron text-xl font-bold tracking-wider">BUYER PANEL</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter access code to continue</p>
          </div>
          <Input
            type="password"
            placeholder="Access Code"
            value={code}
            onChange={e => { setCode(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            className="bg-secondary mb-3"
          />
          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
          <Button onClick={handleLogin} className="w-full gold-gradient text-black font-bold">Enter</Button>
          <Link to="/Dashboard" className="block text-center text-sm text-muted-foreground mt-4 hover:text-primary">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/Dashboard" className="p-2 rounded-lg hover:bg-secondary"><ArrowLeft className="w-5 h-5" /></Link>
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="font-orbitron text-xl font-bold tracking-wider">Buyer Panel</h1>
      </div>
      <Tabs defaultValue="submissions">
        <TabsList className="bg-secondary mb-6 w-full justify-start flex-wrap">
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="users">Sellers</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>
        <TabsContent value="submissions"><BuyerSubmissions /></TabsContent>
        <TabsContent value="users"><BuyerUsers /></TabsContent>
        <TabsContent value="stats"><BuyerStats /></TabsContent>
      </Tabs>
    </div>
  );
}
