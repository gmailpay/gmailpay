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
    setBusy(true);
    try {
      for (const email of valid) {
        await createDoc("gmail_submissions", { email_address: email, submitted_by: userEmail, status: "pending", rejection_reason: "" });
      }
      toast.success(`${valid.length} submitted!`);
      setMails("");
      qc.invalidateQueries({ queryKey: ["subs-card", userEmail] });
      qc.invalidateQueries({ queryKey: ["today-subs", userEmail] });
      onSubmitted?.();
    } catch (err) { toast.error(err?.message || "Failed."); }
    setBusy(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Mail className="w-5 h-5 text-primary" /><h3 className="font-orbitron text-sm font-bold uppercase">Submit Gmails</h3></div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${TRUST_COLORS[trustLevel]} border text-xs`}><Shield className="w-3 h-3 mr-1" />{trustLevel}</Badge>
          {isBanned && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border text-xs">Banned</Badge>}
          {isRestricted && <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 border text-xs"><AlertTriangle className="w-3 h-3 mr-1" />Restricted</Badge>}
        </div>
      </div>
      {rejectionRate > 40 && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-xs text-red-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />High rejection rate ({rejectionRate}%). Submit carefully.</div>}
      <p className="text-xs text-muted-foreground mb-3">One email per line. {remaining}/{dailyLimit} remaining today.</p>
      <Textarea placeholder={"example1@gmail.com\nexample2@gmail.com"} value={mails} onChange={(e) => setMails(e.target.value)} className="bg-secondary border-border min-h-[100px] text-sm mb-3" disabled={!submissionsOpen || isBanned || isRestricted || remaining <= 0} />
      <Button onClick={submit} disabled={busy || !submissionsOpen || isBanned || isRestricted || remaining <= 0} className="w-full bg-primary text-primary-foreground font-semibold">
        {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}{busy ? "Submitting..." : "Submit"}
      </Button>
    </motion.div>
  );
}
