import { useState, useEffect } from "react";
import { account, listDocs, Query } from "@/lib/appwrite";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Mail, Clock, CheckCircle, XCircle, Search } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const sc = {
  pending: { l: "Pending", i: Clock, c: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25" },
  approved: { l: "Approved", i: CheckCircle, c: "bg-green-500/15 text-green-400 border-green-500/25" },
  sub_approved: { l: "Approved", i: CheckCircle, c: "bg-green-500/15 text-green-400 border-green-500/25" },
  rejected: { l: "Rejected", i: XCircle, c: "bg-red-500/15 text-red-400 border-red-500/25" },
};

export default function Submissions() {
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");
  useEffect(() => { account.get().then(u => setUser(u)).catch(() => {}); }, []);

  const { data: subs = [], isLoading } = useQuery({
    queryKey: ["my-subs-page"],
    queryFn: () => listDocs("gmail_submissions", [Query.equal("submitted_by", user.email), Query.orderDesc("$createdAt"), Query.limit(500)]),
    enabled: !!user
  });

  const f = filter === "all" ? subs : filter === "approved" ? subs.filter(s => s.status === "approved" || s.status === "sub_approved") : subs.filter(s => s.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-orbitron text-lg font-bold tracking-wider">My Submissions</h2>
        <p className="text-xs text-muted-foreground font-space">{subs.length} total</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", "pending", "approved", "rejected"].map(x => (
          <button key={x} onClick={() => setFilter(x)}
            className={`px-4 py-2 rounded-xl text-xs font-medium capitalize whitespace-nowrap transition-all ${filter === x ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-accent border border-transparent"}`}>
            {x}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : f.length === 0 ? (
        <div className="text-center py-16"><Mail className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" /><p className="text-muted-foreground text-sm">No submissions found</p></div>
      ) : (
        <div className="space-y-2.5">
          {f.map((s, i) => {
            const cfg = sc[s.status] || sc.pending;
            const I = cfg.i;
            return (
              <motion.div key={s.$id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="glass-card rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.status === "approved" || s.status === "sub_approved" ? "bg-green-500/10" : s.status === "rejected" ? "bg-red-500/10" : "bg-yellow-500/10"}`}>
                    <I className={`w-4 h-4 ${s.status === "approved" || s.status === "sub_approved" ? "text-green-400" : s.status === "rejected" ? "text-red-400" : "text-yellow-400"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.email_address}</p>
                    <p className="text-xs text-muted-foreground">{s.$createdAt ? format(new Date(s.$createdAt), "MMM d, yyyy h:mm a") : ""}</p>
                    {s.status === "rejected" && s.rejection_reason && <p className="text-xs text-red-400 mt-0.5">{s.rejection_reason}</p>}
                  </div>
                </div>
                <Badge variant="outline" className={`${cfg.c} border text-[10px] shrink-0`}>{cfg.l}</Badge>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
