import { useState, useEffect } from "react";
import { account, listDocs, Query } from "@/lib/appwrite";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Mail, Clock, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
const sc = { pending: { l: "Pending", i: Clock, c: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" }, approved: { l: "Approved", i: CheckCircle, c: "bg-green-500/20 text-green-400 border-green-500/30" }, sub_approved: { l: "Approved", i: CheckCircle, c: "bg-green-500/20 text-green-400 border-green-500/30" }, rejected: { l: "Rejected", i: XCircle, c: "bg-red-500/20 text-red-400 border-red-500/30" } };
export default function Submissions() {
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");
  useEffect(() => { account.get().then(u => setUser(u)).catch(() => {}); }, []);
  const { data: subs = [], isLoading } = useQuery({ queryKey: ["my-subs-page"], queryFn: () => listDocs("gmail_submissions", [Query.equal("submitted_by", user.email), Query.orderDesc("$createdAt"), Query.limit(500)]), enabled: !!user });
  const f = filter === "all" ? subs : filter === "approved" ? subs.filter(s => s.status === "approved" || s.status === "sub_approved") : subs.filter(s => s.status === filter);
  return (<div className="space-y-6"><div className="flex items-center justify-between"><h2 className="font-orbitron text-lg font-bold tracking-wider">My Submissions</h2><div className="flex gap-2">{["all", "pending", "approved", "rejected"].map(x => <button key={x} onClick={() => setFilter(x)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${filter === x ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary"}`}>{x}</button>)}</div></div>{isLoading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div> : f.length === 0 ? <div className="text-center py-16 text-muted-foreground"><Mail className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>No submissions</p></div> : <div className="space-y-3">{f.map((s, i) => { const cfg = sc[s.status] || sc.pending; const I = cfg.i; return <motion.div key={s.$id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3"><div className="flex items-center gap-3 min-w-0"><I className={`w-5 h-5 ${s.status === "approved" || s.status === "sub_approved" ? "text-green-400" : s.status === "rejected" ? "text-red-400" : "text-yellow-400"}`} /><div className="min-w-0"><p className="text-sm font-medium truncate">{s.email_address}</p><p className="text-xs text-muted-foreground">{s.$createdAt ? format(new Date(s.$createdAt), "MMM d, yyyy h:mm a") : ""}</p>{s.status === "rejected" && s.rejection_reason && <p className="text-xs text-red-400 mt-1">{s.rejection_reason}</p>}</div></div><Badge variant="outline" className={`${cfg.c} border`}>{cfg.l}</Badge></motion.div> })}</div>}</div>);
}
