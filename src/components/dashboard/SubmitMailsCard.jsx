import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Clock, CheckCircle, XCircle, Mail, Shield, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const TRUST_LIMITS = { low: 20, medium: 30, high: 50 };
const TRUST_COLORS = { low: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", medium: "bg-blue-500/20 text-blue-400 border-blue-500/30", high: "bg-green-500/20 text-green-400 border-green-500/30" };
const sc = { pending: { l: "Pending", i: Clock, c: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" }, approved: { l: "Approved", i: CheckCircle, c: "bg-green-500/20 text-green-400 border-green-500/30" }, rejected: { l: "Rejected", i: XCircle, c: "bg-red-500/20 text-red-400 border-red-500/30" } };

export default function SubmitMailsCard({ userEmail, onSubmitted, submissionsOpen, profile }) {
  const [mails, setMails] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();

  const trustLevel = profile?.trust_level || "low";
  const isBanned = profile?.is_banned;
  const isRestricted = profile?.is_restricted;
  const dailyLimit = TRUST_LIMITS[trustLevel] || 20;

  const { data: reserved = [] } = useQuery({ queryKey: ["reserved", userEmail], queryFn: async () => { const { data } = await supabase.from("reserved_usernames").select("*").eq("user_email", userEmail); return data || []; }, enabled: !!userEmail });
  const { data: subs = [] } = useQuery({ queryKey: ["subs-card", userEmail], queryFn: async () => { const { data } = await supabase.from("gmail_submissions").select("*").eq("submitted_by", userEmail).order("created_at", { ascending: false }); return data || []; }, enabled: !!userEmail });
  const { data: todaySubmitCount = 0 } = useQuery({ queryKey: ["today-subs", userEmail], queryFn: async () => { const today = new Date(); today.setHours(0,0,0,0); const { count } = await supabase.from("gmail_submissions").select("*", { count: "exact", head: true }).eq("submitted_by", userEmail).gte("created_at", today.toISOString()); return count || 0; }, enabled: !!userEmail });

  const totalSubs = subs.length;
  const rejectedCount = subs.filter(s => s.status === "rejected").length;
  const rejectionRate = totalSubs > 0 ? Math.round((rejectedCount / totalSubs) * 100) : 0;
  const remaining = Math.max(0, dailyLimit - todaySubmitCount);

  const submit = async () => {
    if (!submissionsOpen) { toast.error("Submissions closed."); return; }
    if (isBanned) { toast.error("Account banned."); return; }
    if (isRestricted) { toast.error("Account restricted due to high rejection rate."); return; }
    const lines = mails.split("\n").map(l => l.trim().toLowerCase()).filter(Boolean);
    if (!lines.length) { toast.error("Paste emails."); return; }
    if (!reserved.length) { toast.error("Generate usernames first."); return; }
    if (remaining <= 0) { toast.error(`Daily limit (${dailyLimit}) reached.`); return; }

    const valid = new Set(reserved.map(r => r.gmail_address.toLowerCase()));
    const already = new Set(subs.map(s => s.email_address.toLowerCase()));
    const errs = [], ok = [];
    for (const e of lines) {
      if (!valid.has(e)) errs.push(e + " — not your generated username");
      else if (already.has(e)) errs.push(e + " — already submitted");
      else ok.push(e);
    }
    const uniq = [...new Set(ok)].slice(0, remaining);
    if (errs.length) { toast.error(errs[0]); return; }
    if (!uniq.length) { toast.error("No valid new emails."); return; }

    setBusy(true);
    const { error } = await supabase.from("gmail_submissions").insert(uniq.map(e => ({ email_address: e, submitted_by: userEmail, status: "pending" })));
    if (error?.code === "23505") { toast.error("One or more emails already submitted by another user."); }
    else if (error) { toast.error("Submission failed: " + error.message); }
    else { toast.success(`${uniq.length} submitted!`); setMails(""); }
    setBusy(false);
    qc.invalidateQueries({ queryKey: ["subs-card", userEmail] });
    qc.invalidateQueries({ queryKey: ["today-subs", userEmail] });
    qc.invalidateQueries({ queryKey: ["my-submissions"] });
    onSubmitted?.();
  };

  if (isBanned) return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
      <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <h3 className="font-bold text-red-400 mb-1">Account Banned</h3>
      <p className="text-sm text-red-300">{profile?.ban_reason || "Your account has been permanently banned due to excessive rejections."}</p>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-xl p-5 md:p-6">
      <div className="silver-gradient rounded-lg py-2 px-4 mb-4 flex items-center justify-between">
        <h3 className="font-orbitron text-sm font-bold text-black uppercase">Submit Mails</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${TRUST_COLORS[trustLevel]} border text-xs`}>
            <Shield className="w-3 h-3 mr-1" />{trustLevel.toUpperCase()}
          </Badge>
        </div>
      </div>

      {isRestricted && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-center">
          <p className="text-red-400 text-sm flex items-center justify-center gap-1"><AlertTriangle className="w-4 h-4" /> Account restricted — high rejection rate ({rejectionRate}%)</p>
        </div>
      )}
      {rejectionRate >= 30 && rejectionRate < 50 && !isRestricted && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4 text-center">
          <p className="text-yellow-400 text-sm flex items-center justify-center gap-1"><AlertTriangle className="w-4 h-4" /> Warning: {rejectionRate}% rejection rate. Above 50% = restrictions.</p>
        </div>
      )}
      {!submissionsOpen && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-center"><p className="text-red-400 text-sm">Submissions closed</p></div>}

      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <span>Today: {todaySubmitCount}/{dailyLimit}</span>
        <span>{remaining} remaining</span>
      </div>

      <Textarea placeholder="Paste Gmails (one per line)" value={mails} onChange={e => setMails(e.target.value)} className="bg-secondary border-border min-h-[120px] text-sm mb-4" disabled={!submissionsOpen || !reserved.length || remaining <= 0 || isRestricted} />
      <Button onClick={submit} disabled={busy || !submissionsOpen || !reserved.length || remaining <= 0 || isRestricted} className="w-full bg-primary text-primary-foreground font-semibold mb-6">
        {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
        {busy ? "Submitting..." : remaining <= 0 ? "Daily Limit Reached" : "Submit"}
      </Button>

      {subs.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Submissions</p>
            <Link to="/Submissions" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {subs.slice(0, 20).map(s => { const cfg = sc[s.status] || sc.pending; const I = cfg.i; return (
              <div key={s.id} className="flex items-center justify-between gap-3 bg-secondary/50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 min-w-0"><I className={`w-4 h-4 ${s.status === "approved" ? "text-green-400" : s.status === "rejected" ? "text-red-400" : "text-yellow-400"}`} /><span className="text-xs font-mono truncate">{s.email_address}</span></div>
                <Badge variant="outline" className={`${cfg.c} border text-xs`}>{cfg.l}</Badge>
              </div>); })}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground"><Mail className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-xs">No submissions</p></div>
      )}
    </motion.div>
  );
}
