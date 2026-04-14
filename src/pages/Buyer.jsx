import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listDocs, updateDoc, Query } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Loader2, ArrowLeft, ShoppingBag, Mail, Clock, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const sc = { pending: { l: "Pending", c: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" }, approved: { l: "Approved", c: "bg-green-500/20 text-green-400 border-green-500/30" }, rejected: { l: "Rejected", c: "bg-red-500/20 text-red-400 border-red-500/30" } };

export default function Buyer() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [rt, setRt] = useState(null);
  const [rr, setRr] = useState("");
  const [pr, setPr] = useState(null);
  const [view, setView] = useState("list");

  const { data: subs = [], isLoading } = useQuery({ queryKey: ["buyer-subs"], queryFn: () => listDocs("gmail_submissions", [Query.orderDesc("$createdAt"), Query.limit(500)]) });

  const totalCount = subs.length;
  const pendingCount = subs.filter(s => s.status === "pending").length;
  const approvedCount = subs.filter(s => s.status === "approved").length;
  const rejectedCount = subs.filter(s => s.status === "rejected").length;
  const amountOwed = approvedCount * 300;

  const filtered = subs.filter(s => (filter === "all" || s.status === filter) && (!search || s.email_address?.toLowerCase().includes(search.toLowerCase()) || s.submitted_by?.toLowerCase().includes(search.toLowerCase())));

  // Group by submitter for batch view
  const batches = {};
  subs.forEach(s => {
    if (!batches[s.submitted_by]) batches[s.submitted_by] = { email: s.submitted_by, pending: 0, approved: 0, rejected: 0, total: 0, subs: [] };
    batches[s.submitted_by][s.status] = (batches[s.submitted_by][s.status] || 0) + 1;
    batches[s.submitted_by].total++;
    batches[s.submitted_by].subs.push(s);
  });
  const batchList = Object.values(batches).sort((a, b) => b.pending - a.pending);

  const approve = async (s) => { setPr(s.$id); try { await updateDoc("gmail_submissions", s.$id, { status: "approved" }); qc.invalidateQueries({ queryKey: ["buyer-subs"] }); toast.success("Approved!"); } catch { toast.error("Failed"); } setPr(null); };
  const reject = async () => { if (!rt) return; setPr(rt.$id); try { await updateDoc("gmail_submissions", rt.$id, { status: "rejected", rejection_reason: rr }); qc.invalidateQueries({ queryKey: ["buyer-subs"] }); toast.success("Rejected."); } catch { toast.error("Failed"); } setRt(null); setRr(""); setPr(null); };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/Dashboard" className="p-2 rounded-lg hover:bg-secondary"><ArrowLeft className="w-5 h-5" /></Link>
        <ShoppingBag className="w-6 h-6 text-primary" />
        <h1 className="font-orbitron text-xl font-bold tracking-wider">Buyer Panel</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total", value: totalCount, icon: Mail, color: "text-blue-400" },
          { label: "Pending", value: pendingCount, icon: Clock, color: "text-yellow-400" },
          { label: "Approved", value: approvedCount, icon: CheckCircle, color: "text-green-400" },
          { label: "Rejected", value: rejectedCount, icon: XCircle, color: "text-red-400" },
          { label: "Amount Owed", value: `₦${amountOwed.toLocaleString()}`, icon: CreditCard, color: "text-primary" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Payment Button */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Outstanding Payment</p>
          <p className="text-xs text-muted-foreground">{approvedCount} approved mails × ₦300</p>
        </div>
        <Button disabled className="bg-primary/50 text-primary-foreground font-bold">
          <CreditCard className="w-4 h-4 mr-2" />Pay ₦{amountOwed.toLocaleString()} (Coming Soon)
        </Button>
      </div>

      {/* View Toggle + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input placeholder="Search email or submitter..." value={search} onChange={e => setSearch(e.target.value)} className="bg-secondary flex-1" />
        <div className="flex gap-2">
          <button onClick={() => setView("list")} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${view === "list" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary"}`}>List</button>
          <button onClick={() => setView("batch")} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${view === "batch" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary"}`}>Batches</button>
        </div>
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map(f => <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${filter === f ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary"}`}>{f}</button>)}
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-3">{filtered.length} submissions</p>

      {isLoading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div> : view === "batch" ? (
        <div className="space-y-4">
          {batchList.map((b, bi) => (
            <motion.div key={b.email} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: bi * 0.03 }} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold">Batch #{bi + 1}</p>
                  <p className="text-xs text-muted-foreground">{b.email}</p>
                </div>
                <div className="flex gap-2 text-xs">
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border">{b.pending} pending</Badge>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border">{b.approved} approved</Badge>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border">{b.rejected} rejected</Badge>
                </div>
              </div>
              <div className="space-y-1">
                {b.subs.slice(0, 10).map(s => (
                  <div key={s.$id} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
                    <span className="text-xs truncate flex-1 mr-2">{s.email_address}</span>
                    <div className="flex gap-2 items-center">
                      <Badge variant="outline" className={`${(sc[s.status] || sc.pending).c} border text-[10px]`}>{(sc[s.status] || sc.pending).l}</Badge>
                      {s.status === "pending" && <>
                        <Button size="sm" onClick={() => approve(s)} disabled={pr === s.$id} className="bg-green-600 text-white h-7 text-xs px-2"><CheckCircle className="w-3 h-3" /></Button>
                        <Button size="sm" variant="outline" onClick={() => setRt(s)} className="border-red-500/30 text-red-400 h-7 text-xs px-2"><XCircle className="w-3 h-3" /></Button>
                      </>}
                    </div>
                  </div>
                ))}
                {b.subs.length > 10 && <p className="text-xs text-muted-foreground text-center pt-1">+{b.subs.length - 10} more</p>}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <div key={s.$id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{s.email_address}</p>
                <p className="text-xs text-muted-foreground">by {s.submitted_by} {s.$createdAt ? format(new Date(s.$createdAt), "MMM d, h:mm a") : ""}</p>
                {s.rejection_reason && <p className="text-xs text-red-400 mt-1">{s.rejection_reason}</p>}
              </div>
              <div className="flex gap-2">
                {s.status === "pending" ? <>
                  <Button size="sm" onClick={() => approve(s)} disabled={pr === s.$id} className="bg-green-600 text-white"><CheckCircle className="w-3 h-3 mr-1" />Accept</Button>
                  <Button size="sm" variant="outline" onClick={() => setRt(s)} className="border-red-500/30 text-red-400"><XCircle className="w-3 h-3 mr-1" />Reject</Button>
                </> : <Badge className={`${(sc[s.status] || sc.pending).c} border`}>{(sc[s.status] || sc.pending).l}</Badge>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!rt} onOpenChange={() => setRt(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Reject Submission</DialogTitle></DialogHeader>
          <Textarea placeholder="Reason for rejection..." value={rr} onChange={e => setRr(e.target.value)} className="bg-secondary" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRt(null)}>Cancel</Button>
            <Button onClick={reject} disabled={!!pr} className="bg-red-600 text-white">{pr ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
