import { useState } from "react";
import { listDocs, createDoc, databases, DB_ID, Query } from "@/lib/appwrite";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, Copy, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const DAILY_GEN_LIMIT = 20;
const words = ["cool","fast","bright","star","blue","red","neo","max","zen","ace","fox","sky","ray","dot","pixel","nova","bolt","flash","prime","apex"];
function gen() { return `${words[Math.floor(Math.random()*words.length)]}${Math.floor(100+Math.random()*900)}prex@gmail.com`; }

export default function ReserveUsernameCard({ userEmail }) {
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(5);
  const qc = useQueryClient();
  const { data: reserved = [] } = useQuery({ queryKey: ["reserved", userEmail], queryFn: () => listDocs("reserved_usernames", [Query.equal("user_email", userEmail), Query.orderDesc("$createdAt"), Query.limit(100)]), enabled: !!userEmail });
  const { data: todayCount = 0 } = useQuery({ queryKey: ["today-gen", userEmail], queryFn: async () => {
    const today = new Date(); today.setHours(0,0,0,0);
    const r = await databases.listDocuments(DB_ID, "reserved_usernames", [Query.equal("user_email", userEmail), Query.greaterThanEqual("$createdAt", today.toISOString()), Query.limit(1)]);
    return r.total;
  }, enabled: !!userEmail });
  const remaining = Math.max(0, DAILY_GEN_LIMIT - todayCount);
  const effectiveCount = Math.min(count, remaining);
  const atLimit = remaining <= 0;

  const generate = async () => {
    if (atLimit) return;
    setBusy(true);
    const ex = new Set(reserved.map(r => r.gmail_address));
    const nu = []; let a = 0;
    while (nu.length < effectiveCount && a < 100) { const g = gen(); if (!ex.has(g)) { nu.push({ user_email: userEmail, gmail_address: g }); ex.add(g); } a++; }
    try {
      for (const item of nu) await createDoc("reserved_usernames", item);
      qc.invalidateQueries({ queryKey: ["reserved", userEmail] });
      qc.invalidateQueries({ queryKey: ["today-gen", userEmail] });
      toast.success(`${nu.length} usernames generated!`);
    } catch { toast.error("Generation failed."); }
    setBusy(false);
  };

  const cp = (addr) => { navigator.clipboard.writeText(addr); toast.success("Copied!"); };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card glass-card-hover rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-space">Reserve Usernames</p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <select value={count} onChange={e => setCount(+e.target.value)} className="bg-accent/50 border border-border/50 rounded-xl px-3 py-2.5 text-sm focus:ring-1 focus:ring-primary/30 outline-none" disabled={atLimit}>
          {[5, 10, 15, 20].filter(n => n <= remaining || remaining <= 0).map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <Button onClick={generate} disabled={busy || atLimit} className="gold-gradient text-black font-bold flex-1 rounded-xl h-10">
          {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
          {atLimit ? "Limit Reached" : "Generate"}
        </Button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">{remaining}/{DAILY_GEN_LIMIT} remaining today</p>
        <p className="text-xs text-muted-foreground">Total: {reserved.length}</p>
      </div>

      {reserved.length > 0 && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {reserved.map(r => (
            <div key={r.$id} className="flex items-center justify-between bg-accent/30 hover:bg-accent/50 rounded-xl px-3 py-2 transition-colors group">
              <span className="text-xs font-mono text-foreground/80 truncate">{r.gmail_address}</span>
              <button onClick={() => cp(r.gmail_address)} className="p-1.5 rounded-lg hover:bg-primary/15 opacity-50 group-hover:opacity-100 transition-opacity">
                <Copy className="w-3 h-3 text-primary" />
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
