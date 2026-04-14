import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listDocs, updateDoc, Query } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Banknote, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
export default function AdminFinalPayouts() {
  const qc = useQueryClient();
  const [pr, setPr] = useState(null);
  const { data: logs = [], isLoading } = useQuery({ queryKey: ["final-logs"], queryFn: () => listDocs("payout_logs", [Query.equal("cleared_by_admin1", true), Query.limit(500)]) });
  const pending = logs.filter(p => !p.final_payout_done);
  const done = logs.filter(p => p.final_payout_done);
  const pay = async log => { setPr(log.$id); await updateDoc("payout_logs", log.$id, { final_payout_done: true, email_sent: true }); if (log.withdrawal_id) { try { await updateDoc("withdrawals", log.withdrawal_id, { status: "paid" }); } catch {} } qc.invalidateQueries({ queryKey: ["final-logs"] }); toast.success("Final payout done!"); setPr(null); };
  if (isLoading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  return (<div className="space-y-4"><p className="text-sm text-muted-foreground">{pending.length} awaiting</p>{pending.length === 0 ? <div className="text-center py-16 text-muted-foreground"><Banknote className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>None cleared yet</p></div> : <div className="space-y-2.5">{pending.map(l => <div key={l.$id} className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><p className="text-sm font-medium">{l.user_email}</p><p className="text-xs text-muted-foreground">{"₦"}{l.amount?.toLocaleString()} {l.bank_name} {l.bank_account_number}</p><p className="text-[10px] text-muted-foreground">{l.$createdAt ? format(new Date(l.$createdAt), "MMM d, yyyy") : ""}</p></div><Button size="sm" onClick={() => pay(l)} disabled={pr === l.$id} className="bg-green-600 hover:bg-green-700 text-white rounded-xl">{pr === l.$id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}Final Payout</Button></div>)}</div>}{done.length > 0 && <div className="mt-6"><p className="text-sm text-muted-foreground mb-3">Completed ({done.length})</p><div className="space-y-2">{done.map(l => <div key={l.$id} className="glass-card rounded-2xl p-4 flex items-center justify-between"><div><p className="text-sm font-medium">{l.user_email}</p><p className="text-xs text-muted-foreground">{"₦"}{l.amount?.toLocaleString()}</p></div><Badge className="bg-green-500/15 text-green-400 border-green-500/25 border">Paid</Badge></div>)}</div></div>}</div>);
}
