import { useQuery } from "@tanstack/react-query";
import { listDocs, Query } from "@/lib/appwrite";
import { format } from "date-fns";
import { Users, Banknote, TrendingDown } from "lucide-react";

export default function AdminUsers() {
  const { data: users = [], isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => listDocs("profiles", [Query.orderDesc("$createdAt"), Query.limit(500)]) });
  const { data: subs = [] } = useQuery({ queryKey: ["admin-all-subs"], queryFn: () => listDocs("gmail_submissions", [Query.limit(5000)]) });
  const { data: wds = [] } = useQuery({ queryKey: ["admin-all-wds"], queryFn: () => listDocs("withdrawals", [Query.limit(5000)]) });

  const stats = email => {
    const us = subs.filter(s => s.submitted_by === email);
    const uw = wds.filter(w => w.user_email === email);
    const approved = us.filter(s => s.status === "approved").length;
    const earned = approved * 200 + (approved >= 50 ? 500 : 0);
    const paid = uw.filter(w => w.status === "paid").reduce((s, w) => s + w.amount, 0);
    const pendingWd = uw.filter(w => w.status === "pending").reduce((s, w) => s + w.amount, 0);
    const owed = earned - paid - pendingWd;
    return {
      total: us.length,
      pending: us.filter(s => s.status === "pending").length,
      approved,
      rejected: us.filter(s => s.status === "rejected").length,
      earned,
      paid,
      pendingWd,
      owed: Math.max(0, owed),
    };
  };

  // Summary totals
  const allStats = users.map(u => ({ ...stats(u.email), email: u.email }));
  const totalPaid = allStats.reduce((s, u) => s + u.paid, 0);
  const totalOwed = allStats.reduce((s, u) => s + u.owed, 0);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4 text-center">
          <Users className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="font-orbitron text-xl font-bold">{users.length}</p>
          <p className="text-[10px] text-muted-foreground">Users</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <Banknote className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <p className="font-orbitron text-xl font-bold text-green-400">₦{totalPaid.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Total Paid</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <TrendingDown className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <p className="font-orbitron text-xl font-bold text-yellow-400">₦{totalOwed.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Total Owed</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{users.length} users</p>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-2.5">
          {users.map(u => {
            const s = stats(u.email);
            return (
              <div key={u.$id} className="glass-card rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium">{u.full_name || "No name"}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{u.$createdAt ? format(new Date(u.$createdAt), "MMM d, yyyy") : ""}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                  <div className="bg-accent/30 rounded-lg p-2 text-center"><p className="font-semibold">{s.total}</p><p className="text-[9px] text-muted-foreground">Total</p></div>
                  <div className="bg-yellow-500/10 rounded-lg p-2 text-center"><p className="font-semibold text-yellow-400">{s.pending}</p><p className="text-[9px] text-muted-foreground">Pending</p></div>
                  <div className="bg-green-500/10 rounded-lg p-2 text-center"><p className="font-semibold text-green-400">{s.approved}</p><p className="text-[9px] text-muted-foreground">Approved</p></div>
                  <div className="bg-red-500/10 rounded-lg p-2 text-center"><p className="font-semibold text-red-400">{s.rejected}</p><p className="text-[9px] text-muted-foreground">Rejected</p></div>
                </div>
                <div className="flex items-center justify-between bg-accent/20 rounded-lg px-3 py-2 text-xs">
                  <span>Paid: <span className="text-green-400 font-semibold">₦{s.paid.toLocaleString()}</span></span>
                  <span>Owed: <span className="text-yellow-400 font-semibold">₦{s.owed.toLocaleString()}</span></span>
                  <span>Earned: <span className="text-primary font-semibold">₦{s.earned.toLocaleString()}</span></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
