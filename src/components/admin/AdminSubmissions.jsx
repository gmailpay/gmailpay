import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listDocs, updateDoc, Query } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
export default function AdminSubmissions() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [rt, setRt] = useState(null);
  const [rr, setRr] = useState("");
  const [pr, setPr] = useState(null);
  const { data: subs = [], isLoading } = useQuery({ queryKey: ["admin-subs"], queryFn: () => listDocs("gmail_submissions", [Query.orderDesc("$createdAt"), Query.limit(500)]) });
  const filtered = subs.filter(s => (filter === "all" || s.status === filter) && (!search || s.email_address?.toLowerCase().includes(search.toLowerCase()) || s.submitted_by?.toLowerCase().includes(search.toLowerCase())));
  const approve = async s => { setPr(s.$id); await updateDoc("gmail_submissions", s.$id, { status: "approved" }); qc.invalidateQueries({ queryKey: ["admin-subs"] }); toast.success("Approved!"); setPr(null); };
  const reject = async () => { if (!rt) return; setPr(rt.$id); await updateDoc("gmail_submissions", rt.$id, { status: "rejected", rejection_reason: rr }); qc.invalidateQueries({ queryKey: ["admin-subs"] }); toast.success("Rejected."); setRt(null); setRr(""); setPr(null); };
  return <div className="space-y-4"><div className="flex flex-col sm:flex-row gap-3"><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="bg-secondary flex-1" /><div className="flex gap-2">{["all", "pending", "approved", "rejected"].map(f => <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${filter === f ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary"}`}>{f}</button>)}</div></div><p className="text-sm text-muted-foreground">{filtered.length} submissions</p>{isLoading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div> : <div className="space-y-2">{filtered.map(s => <div key={s.$id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div className="min-w-0"><p className="text-sm font-medium truncate">{s.email_address}</p><p className="text-xs text-muted-foreground">by {s.submitted_by} {s.$createdAt ? format(new Date(s.$createdAt), "MMM d") : ""}</p>{s.rejection_reason && <p className="text-xs text-red-400 mt-1">{s.rejection_reason}</p>}</div><div className="flex gap-2">{s.status === "pending" ? <><Button size="sm" onClick={() => approve(s)} disabled={pr === s.$id} className="bg-green-600 text-white"><CheckCircle className="w-3 h-3 mr-1" />Approve</Button><Button size="sm" variant="outline" onClick={() => setRt(s)} className="border-red-500/30 text-red-400"><XCircle className="w-3 h-3 mr-1" />Reject</Button></> : <Badge className={s.status === "approved" ? "bg-green-500/20 text-green-400 border-green-500/30 border" : "bg-red-500/20 text-red-400 border-red-500/30 border"}>{s.status}</Badge>}</div></div>)}</div>}<Dialog open={!!rt} onOpenChange={() => setRt(null)}><DialogContent className="bg-card border-border"><DialogHeader><DialogTitle>Reject Submission</DialogTitle></DialogHeader><Textarea placeholder="Reason..." value={rr} onChange={e => setRr(e.target.value)} className="bg-secondary" /><DialogFooter><Button variant="outline" onClick={() => setRt(null)}>Cancel</Button><Button onClick={reject} disabled={!!pr} className="bg-red-600 text-white">{pr ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Reject</Button></DialogFooter></DialogContent></Dialog></div>;
}
