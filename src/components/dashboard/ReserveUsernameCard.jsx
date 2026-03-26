import { useState } from "react";
import { listDocs, createDoc, databases, DB_ID, Query } from "@/lib/appwrite";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, Copy } from "lucide-react";
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
      toast.success(`${nu.length} generated!`);
    } catch { toast.error("Failed."); }
    setBusy(false);
  };
  const cp = (addr) => { navigator.clipboard.writeText(addr); toast.success("Copied!"); };
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-xl p-5 md:p-6">
      <div className="silver-gradient rounded-lg py-2 px-4 mb-4 text-center"><h3 className="font-orbitron text-sm font-bold text-black uppercase">Reserve Usernames</h3></div>
      <div className="flex items-center gap-3 mb-4">
        <select value={count} onChange={e => setCount(+e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm" disabled={atLimit}>
          {[5, 10, 15, 20].filter(n => n <= remaining || remaining <= 0).map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <Button onClick={generate} disabled={busy || atLimit} className="bg-primary text-primary-foreground flex-1">{busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}{atLimit ? "Limit reached" : "Generate"}</Button>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{remaining}/{DAILY_GEN_LIMIT} remaining today. Total: {reserved.length}</p>
      {reserved.length > 0 && <div className="space-y-1 max-h-48 overflow-y-auto">{reserved.map(r => <div key={r.$id} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2"><span className="text-xs font-mono truncate">{r.gmail_address}</span><button onClick={() => cp(r.gmail_address)} className="p-1 hover:bg-primary/20 rounded"><Copy className="w-3 h-3 text-muted-foreground" /></button></div>)}</div>}
    </motion.div>
  );
}
