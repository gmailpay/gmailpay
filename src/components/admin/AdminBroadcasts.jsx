import { useState } from "react";
import { listDocs, createDoc, updateDoc, deleteDoc, Query } from "@/lib/appwrite";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Trash2, Eye, EyeOff, Megaphone } from "lucide-react";
import { toast } from "sonner";
export default function AdminBroadcasts() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const { data: broadcasts = [] } = useQuery({ queryKey: ["admin-broadcasts"], queryFn: () => listDocs("broadcasts", [Query.orderDesc("$createdAt"), Query.limit(100)]) });
  const sendBroadcast = async () => { if (!message.trim()) { toast.error("Enter a message."); return; } setBusy(true); try { await createDoc("broadcasts", { message: message.trim(), is_active: true }); toast.success("Broadcast sent!"); setMessage(""); qc.invalidateQueries({ queryKey: ["admin-broadcasts"] }); } catch { toast.error("Failed."); } setBusy(false); };
  const toggleActive = async (id, cur) => { await updateDoc("broadcasts", id, { is_active: !cur }); qc.invalidateQueries({ queryKey: ["admin-broadcasts"] }); toast.success(cur ? "Hidden" : "Shown"); };
  const del = async id => { await deleteDoc("broadcasts", id); qc.invalidateQueries({ queryKey: ["admin-broadcasts"] }); toast.success("Deleted"); };
  return <div className="space-y-6"><div className="bg-card border border-border rounded-xl p-5"><div className="flex items-center gap-2 mb-4"><Megaphone className="w-5 h-5 text-primary" /><h3 className="font-semibold text-sm">New Broadcast</h3></div><Textarea placeholder="Type your broadcast message..." value={message} onChange={e => setMessage(e.target.value)} className="bg-secondary border-border min-h-[80px] text-sm mb-3" /><Button onClick={sendBroadcast} disabled={busy} className="w-full bg-primary text-primary-foreground font-semibold">{busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}{busy ? "Sending..." : "Send Broadcast"}</Button></div><div className="space-y-2"><p className="text-xs font-semibold text-muted-foreground uppercase">Previous ({broadcasts.length})</p>{broadcasts.map(b => <div key={b.$id} className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-3"><div className="flex-1 min-w-0"><p className="text-sm">{b.message}</p><Badge variant="outline" className={`mt-2 text-xs ${b.is_active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"}`}>{b.is_active ? "Active" : "Hidden"}</Badge></div><div className="flex gap-1">{b.is_active ? <button onClick={() => toggleActive(b.$id, true)} className="p-2 rounded-lg hover:bg-secondary"><EyeOff className="w-4 h-4 text-muted-foreground" /></button> : <button onClick={() => toggleActive(b.$id, false)} className="p-2 rounded-lg hover:bg-secondary"><Eye className="w-4 h-4 text-muted-foreground" /></button>}<button onClick={() => del(b.$id)} className="p-2 rounded-lg hover:bg-red-500/10"><Trash2 className="w-4 h-4 text-red-400" /></button></div></div>)}</div></div>;
}
