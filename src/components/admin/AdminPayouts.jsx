import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listDocs, updateDoc, Query } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, Banknote } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
export default function AdminPayouts() {
  const qc = useQueryClient();
  const [pr, setPr] = useState(null);
  const [filter, setFilter] = useState("pending");
  const { data: wds = [], isLoading } = useQuery({ queryKey: ["admin-wds"], queryFn: () => listDocs("withdrawals", [Query.orderDesc("$createdAt"), Query.limit(500)]) });
  const f = filter === "all" ? wds : wds.filter(w => w.status === filter);
  const pay = async w => { setPr(w.$id); await updateDoc("withdrawals", w.$id, { status: "paid", paid_at: new Date().toISOString() }); qc.invalidateQueries({ queryKey: ["admin-wds"] }); toast.success("Paid!"); setPr(null); };
  return <div className="space-y-4"><div className="flex gap-2">{["all", "pending", "paid"].map(x => <button key={x} onClick={() => setFilter(x)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${filter === x ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary"}`}>{x}</button>)}</div>{isLoading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div> : f.length === 0 ? <div className="text-center py-16 text-muted-foreground"><Banknote className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>No withdrawals</p></div> : <div className="space-y-3">{f.map(w => <div key={w.$id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><p className="text-sm font-medium">{w.user_email}</p><p className="text-xs text-muted-foreground">\u20A6{w.amount?.toLocaleString()} {w.bank_name} {w.bank_account_number}</p><p className="text-xs text-muted-foreground">{w.$createdAt ? format(new Date(w.$createdAt), "MMM d, yyyy") : ""}</p></div>{w.status === "pending" ? <Button size="sm" onClick={() => pay(w)} disabled={pr === w.$id} className="bg-green-600 text-white">{pr === w.$id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}Mark Paid</Button> : <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border">Paid</Badge>}</div>)}</div>}</div>;
}
