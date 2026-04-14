import { useState } from "react";
import { listDocs, createDoc, databases, DB_ID, Query } from "@/lib/appwrite";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Clock, CheckCircle, XCircle, Mail, Shield, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const TRUST_LIMITS = { low: 20, medium: 30, high: 50 };
const TRUST_COLORS = { low: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25", medium: "bg-blue-500/15 text-blue-400 border-blue-500/25", high: "bg-green-500/15 text-green-400 border-green-500/25" };
const sc = { pending: { l: "Pending", i: Clock, c: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25" }, approved: { l: "Approved", i: CheckCircle, c: "bg-green-500/15 text-green-400 border-green-500/25" }, sub_approved: { l: "Approved", i: CheckCircle, c: "bg-green-500/15 text-green-400 border-green-500/25" }, rejected: { l: "Rejected", i: XCircle, c: "bg-red-500/15 text-red-400 border-red-500/25" } };

export default function SubmitMailsCard({ userEmail, onSubmitted, submissionsOpen, profile }) {
  const [mails, setMails] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const trustLevel = profile?.trust_level || "low";
  const isBanned = profile?.is_banned;
  const isRestricted = profile?.is_restricted;
  const dailyLimit = TRUST_LIMITS[trustLevel] || 20;

  const { data: reserved = [] } = useQuery({ queryKey: ["reserved", userEmail], queryFn: () => listDocs("reserved_usernames", [Query.equal("user_email", userEmail)]), enabled: !!userEmail });
  const { data: subs = [] } = useQuery({ queryKey: ["subs-card", userEmail], queryFn: () => listDocs("gmail_submissions", [Query.equal("submitted_by", userEmail), Query.orderDesc("$createdAt"), Query.limit(500)]), enabled: !!userEmail });
  const { data: todaySubmitCount = 0 } = useQuery({ queryKey: ["today-subs", userEmail], queryFn: async () => {
    const today = new Date(); today.setHours(0,0,0,0);
    const r = await databases.listDocuments(DB_ID, "gmail_submissions", [Query.equal("submitted_by", userEmail), Query.greaterThanEqual("$createdAt", today.toISOString()), Query.limit(1)]);
    return r.total;
  }, enabled: !!userEmail });

  const totalSubs = subs.length;
  const rejectedCount = subs.filter(s => s.status === "rejected").length;
  const rejectionRate = totalSubs > 0 ? Math.round((rejectedCount / totalSubs) * 100) : 0;
  const remaining = Math.max(0, dailyLimit - todaySubmitCount);

  const submit = async () => {
    if (!submissionsOpen) { toast.error("Submissions closed."); return; }
    if (isBanned) { toast.error("Account banned."); return; }
    if (isRestricted) { toast.error("Account restricted due to high rejection rate."); return; }
    const lines = mails.split("\n").map(l => l.trim().toLowerCase()).filter(l => l && l.includes("@"));
    if (lines.length === 0) { toast.error("Enter valid emails."); return; }
    if (lines.length > remaining) { toast.error(`Daily limit: ${remaining} left.`); return; }
    const existingEmails = new Set(subs.map(s => s.email_address.toLowerCase()));
    const valid = lines.filter(l => !existingEmails.has(l));
    if (valid.length === 0) { toast.error("All emails already submitted."); return; }
    const now = new Date();
    const tooSoon = valid.filter(email => {
      const res = reserved.find(r => r.gmail_address?.toLowerCase() === email);
      if (res) { const diff = (now - new Date(res.$createdAt)) / (1000 * 60); return diff < 4; }
      return false;
    });
    if (tooSoon.length > 0) {
      const mins = tooSoon.map(email => { const res = reserved.find(r => r.gmail_address?.toLowerCase() === email); const diff = 4 - Math.floor((now - new Date(res.$createdAt)) / (1000 * 60)); return `${email} (${diff}m left)`; });
      toast.error(`Wait for cooldown: ${mins.join(", ")}`); return;
    }
    setBusy(true);
    let ok = 0, dup = 0;
    for (const email of valid) {
      try { await createDoc("gmail_submissions", { email_address: email, submitted_by: userEmail, status: "pending" }); ok++; } catch { dup++; }
    }
    qc.invalidateQueries({ queryKey: ["subs-card", userEmail] });
    qc.invalidateQueries({ queryKey: ["today-subs", userEmail] });
    qc.invalidateQueries({ queryKey: ["my-submissions"] });
    if (ok > 0) toast.success(`${ok} submitted!`);
    if (dup > 0) toast.error(`${dup} duplicates skipped.`);
    setMails(""); setBusy(false); onSubmitted?.();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-space">Submit Gmails</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${TRUST_COLORS[trustLevel]} border text-[10px]`}>
            <Shield className="w-3 h-3 mr-1" />{trustLevel}
          </Badge>
        </div>
      </div>

      {isBanned ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center">
          <AlertTriangle className="w-6 h-6 text-destructive mx-auto mb-2" />
          <p className="text-sm font-medium text-destructive">Account Banned</p>
          <p className="text-xs text-muted-foreground mt-1">{profile?.ban_reason || "Contact admin for details."}</p>
        </div>
      ) : isRestricted ? (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
          <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-yellow-400">Account Restricted</p>
          <p className="text-xs text-muted-foreground mt-1">High rejection rate ({rejectionRate}%). Improve quality to unlock.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            <span>{remaining}/{dailyLimit} remaining today</span>
            {rejectionRate > 30 && <span className="text-yellow-400">Rejection rate: {rejectionRate}%</span>}
          </div>
          <Textarea placeholder="Paste gmail addresses (one per line)..." value={mails} onChange={e => setMails(e.target.value)} className="bg-accent/30 border-border/50 rounded-xl min-h-[100px] text-sm focus:ring-1 focus:ring-primary/30 mb-3 resize-none" disabled={!submissionsOpen} />
          <Button onClick={submit} disabled={busy || !submissionsOpen || !mails.trim()} className="w-full gold-gradient text-black font-bold rounded-xl h-11">
            {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            {!submissionsOpen ? "Submissions Closed" : "Submit"}
          </Button>
        </>
      )}

      {/* Recent submissions */}
      {subs.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground font-space uppercase tracking-wider">Recent</p>
            <Link to="/Submissions" className="text-xs text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {subs.slice(0, 10).map(s => {
              const cfg = sc[s.status] || sc.pending;
              const I = cfg.i;
              return (
                <div key={s.$id} className="flex items-center justify-between bg-accent/20 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <I className={`w-3.5 h-3.5 shrink-0 ${s.status === "approved" || s.status === "sub_approved" ? "text-green-400" : s.status === "rejected" ? "text-red-400" : "text-yellow-400"}`} />
                    <span className="text-xs truncate">{s.email_address}</span>
                  </div>
                  <Badge variant="outline" className={`${cfg.c} border text-[9px] shrink-0`}>{cfg.l}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
