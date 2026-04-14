import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listDocs, createDoc, Query } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Shield, Loader2, Banknote } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
function Modal({ withdrawal: wd, onConfirm, onClose, loading }) {
  return <Dialog open={!!wd} onOpenChange={onClose}><DialogContent className="glass-card border-border/50 rounded-2xl"><DialogHeader><DialogTitle className="font-space">Confirm Payment to Owner</DialogTitle></DialogHeader><div className="bg-accent/50 rounded-xl p-4 space-y-2.5 text-sm my-4"><div className="flex justify-between"><span className="text-muted-foreground">Bank</span><span className="font-semibold">Opay</span></div><div className="flex justify-between"><span className="text-muted-foreground">Account</span><span className="font-mono">8088101394</span></div><div className="flex justify-between"><span className="text-muted-foreground">Name</span><span>Onoja Praise</span></div><div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold text-primary font-orbitron">{"₦"}{wd?.amount?.toLocaleString()}</span></div></div><DialogFooter className="gap-2"><Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button><Button onClick={onConfirm} disabled={loading} className="gold-gradient text-black font-bold rounded-xl">{loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Confirm</Button></DialogFooter></DialogContent></Dialog>;
}
export default function Admin1() {
  const qc = useQueryClient();
  const [pt, setPt] = useState(null);
  const [pr, setPr] = useState(null);
  const { data: subs = [] } = useQuery({ queryKey: ["a1-subs"], queryFn: () => listDocs("gmail_submissions", [Query.orderDesc("$createdAt"), Query.limit(2000)]) });
  const { data: logs = [] } = useQuery({ queryKey: ["a1-logs"], queryFn: () => listDocs("payout_logs", [Query.orderDesc("$createdAt"), Query.limit(500)]) });
  const { data: wds = [] } = useQuery({ queryKey: ["a1-wds"], queryFn: () => listDocs("withdrawals", [Query.equal("status", "pending")]) });
  const apu = subs.filter(s => s.status === "approved").reduce((a, s) => { a[s.submitted_by] = (a[s.submitted_by] || 0) + 1; return a; }, {});
  const ce = new Set(logs.map(p => p.user_email));
  const ew = wds.filter(w => (apu[w.user_email] || 0) >= 5 && !ce.has(w.user_email));
  const confirm = async () => { if (!pt) return; setPr(pt.$id); await createDoc("payout_logs", { user_email: pt.user_email, withdrawal_id: pt.$id, amount: pt.amount, bank_name: pt.bank_name || "", bank_account_number: pt.bank_account_number || "", cleared_by_admin1: true, final_payout_done: false, email_sent: false }); qc.invalidateQueries({ queryKey: ["a1-logs"] }); qc.invalidateQueries({ queryKey: ["a1-wds"] }); toast.success("Moved to Final Payout!"); setPt(null); setPr(null); };
  return (<div className="min-h-screen bg-background p-4 md:p-6 max-w-6xl mx-auto"><div className="flex items-center gap-3 mb-6"><Link to="/Dashboard" className="p-2 rounded-xl hover:bg-accent transition-colors"><ArrowLeft className="w-5 h-5" /></Link><div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center"><Shield className="w-5 h-5 text-primary" /></div><h1 className="font-orbitron text-xl font-bold tracking-wider">Verification Manager</h1><Badge className="bg-primary/15 text-primary border-primary/25 border text-xs">Admin 1</Badge></div><div className="space-y-3"><p className="text-sm text-muted-foreground">{ew.length} users ready</p>{ew.length === 0 ? <div className="text-center py-16 text-muted-foreground"><Shield className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No eligible users</p></div> : ew.map(w => <div key={w.$id} className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><p className="text-sm font-medium">{w.user_email}</p><p className="text-xs text-muted-foreground">{"₦"}{w.amount?.toLocaleString()} - {apu[w.user_email]} approved</p><p className="text-[10px] text-muted-foreground">{w.$createdAt ? format(new Date(w.$createdAt), "MMM d, yyyy") : ""}</p></div><Button size="sm" onClick={() => setPt(w)} className="gold-gradient text-black font-bold rounded-xl"><Banknote className="w-4 h-4 mr-1.5" />Pay Owner</Button></div>)}</div><Modal withdrawal={pt} onConfirm={confirm} onClose={() => setPt(null)} loading={!!pr} /></div>);
}
