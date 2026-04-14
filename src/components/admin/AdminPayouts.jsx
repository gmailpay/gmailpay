import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listDocs, updateDoc, Query } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, Banknote, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";

export default function AdminPayouts() {
  const qc = useQueryClient();
  const [pr, setPr] = useState(null);
  const [filter, setFilter] = useState("pending");
  const { data: wds = [], isLoading } = useQuery({ queryKey: ["admin-wds"], queryFn: () => listDocs("withdrawals", [Query.orderDesc("$createdAt"), Query.limit(500)]) });
  const f = filter === "all" ? wds : wds.filter(w => w.status === filter);

  const totalPaid = wds.filter(w => w.status === "paid").reduce((s, w) => s + w.amount, 0);
  const totalPending = wds.filter(w => w.status === "pending").reduce((s, w) => s + w.amount, 0);

  const pay = async w => {
    setPr(w.$id);
    await updateDoc("withdrawals", w.$id, { status: "paid", paid_at: new Date().toISOString() });
    qc.invalidateQueries({ queryKey: ["admin-wds"] });
    toast.success("Marked as paid!");
    setPr(null);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Wallet className="w-4 h-4 text-yellow-400" /><span className="text-xs text-muted-foreground">Pending</span></div>
          <p className="font-orbitron text-lg font-bold text-yellow-400">₦{totalPending.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Banknote className="w-4 h-4 text-green-400" /><span className="text-xs text-muted-foreground">Total Paid</span></div>
          <p className="font-orbitron text-lg font-bold text-green-400">₦{totalPaid.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {["all", "pending", "paid"].map(x => (
          <button key={x} onClick={() => setFilter(x)}
            className={`px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all ${filter === x ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-accent border border-transparent"}`}>
            {x}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : f.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><Banknote className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No withdrawals</p></div>
      ) : (
        <div className="space-y-2.5">
          {f.map(w => (
            <div key={w.$id} className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{w.user_email}</p>
                <p className="text-xs text-muted-foreground">₦{w.amount?.toLocaleString()} \u2022 {w.bank_name} \u2022 {w.bank_account_number}</p>
                {w.account_name && <p className="text-xs text-primary">Name: {w.account_name}</p>}
                <p className="text-[10px] text-muted-foreground">{w.$createdAt ? format(new Date(w.$createdAt), "MMM d, yyyy") : ""}</p>
              </div>
              {w.status === "pending" ? (
                <Button size="sm" onClick={() => pay(w)} disabled={pr === w.$id} className="bg-green-600 hover:bg-green-700 text-white rounded-xl">
                  {pr === w.$id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}Mark Paid
                </Button>
              ) : (
                <Badge className="bg-green-500/15 text-green-400 border-green-500/25 border">Paid</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
