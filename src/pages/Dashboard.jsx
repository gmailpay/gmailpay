import { useState, useEffect } from "react";
import { account, listDocs, createDoc, Query } from "@/lib/appwrite";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Wallet, PartyPopper, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BalanceCard from "../components/dashboard/BalanceCard";
import MilestoneCard from "../components/dashboard/MilestoneCard";
import SubmitMailsCard from "../components/dashboard/SubmitMailsCard";
import GPayBot from "../components/dashboard/GPayBot";
import WithdrawDialog from "../components/dashboard/WithdrawDialog";
import ReserveUsernameCard from "../components/dashboard/ReserveUsernameCard";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [wo, setWo] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    (async () => {
      try {
        const au = await account.get();
        const profiles = await listDocs("profiles", [Query.equal("user_id", au.$id)]);
        const p = profiles[0] || null;
        const u = { id: au.$id, email: au.email, full_name: p?.full_name || "" };
        setUser(u);
        setProfile(p);
        if (p && !p.referral_short_url && u.email) {
          fetch("/api/generate-short-link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: u.email, profile_id: p.$id }),
          }).then(r => r.json()).then(data => {
            if (data.short_url) setProfile(prev => ({ ...prev, referral_short_url: data.short_url }));
          }).catch(() => {});
        }
        const ref = new URLSearchParams(window.location.search).get("ref");
        if (ref && ref !== u.email) {
          const ex = await listDocs("referrals", [Query.equal("referred_email", u.email)]);
          if (!ex || ex.length === 0) await createDoc("referrals", { referrer_email: ref, referred_email: u.email, referral_bonus_paid: false, power_bonus_paid: false });
        }
      } catch {}
    })();
  }, []);

  const { data: subs = [] } = useQuery({ queryKey: ["my-submissions"], queryFn: () => listDocs("gmail_submissions", [Query.equal("submitted_by", user.email), Query.limit(500)]), enabled: !!user });
  const { data: wds = [] } = useQuery({ queryKey: ["my-withdrawals"], queryFn: () => listDocs("withdrawals", [Query.equal("user_email", user.email), Query.limit(500)]), enabled: !!user });
  const { data: settings = [] } = useQuery({ queryKey: ["app-settings"], queryFn: () => listDocs("app_settings", [Query.equal("setting_key", "main")]) });

  const so = settings.length > 0 ? settings[0].submissions_open : true;
  const pc = subs.filter(s => s.status === "pending").length, ac = subs.filter(s => s.status === "approved").length;
  const ae = ac * 200, mb = ac >= 50 ? 500 : 0;
  const pw = wds.filter(w => w.status === "paid").reduce((s, w) => s + w.amount, 0);
  const pW = wds.filter(w => w.status === "pending").reduce((s, w) => s + w.amount, 0);
  const tb = ae + mb - pw - pW, cw = tb >= 1000;
  const refresh = () => { qc.invalidateQueries({ queryKey: ["my-submissions"] }); qc.invalidateQueries({ queryKey: ["my-withdrawals"] }); };

  const recentlyPaid = wds.find(w => {
    if (w.status !== "paid") return false;
    const paidTime = w.paid_at ? new Date(w.paid_at) : (w.$updatedAt ? new Date(w.$updatedAt) : null);
    if (!paidTime) return false;
    return paidTime > new Date(Date.now() - 60 * 60 * 1000);
  });
  const showPaymentBanner = !!recentlyPaid && !dismissedBanner;

  if (!user) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-muted-foreground">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-space">Welcome back,</p>
          <h2 className="font-orbitron text-lg font-bold tracking-wider">{user.full_name || "Creator"}</h2>
        </div>
        <Button onClick={() => cw && setWo(true)} disabled={!cw} size="sm" className={`rounded-xl font-semibold text-xs ${cw ? "gold-gradient text-black" : "bg-accent text-muted-foreground"}`}>
          <Wallet className="w-4 h-4 mr-1.5" />
          Withdraw
        </Button>
      </div>

      {/* Payment success banner */}
      <AnimatePresence>
        {showPaymentBanner && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-3">
            <PartyPopper className="w-5 h-5 text-green-400 shrink-0" />
            <p className="text-sm text-green-400 flex-1">Payment of <span className="font-bold">\u20A6{recentlyPaid.amount?.toLocaleString()}</span> received!</p>
            <button onClick={() => setDismissedBanner(true)} className="p-1 rounded-lg hover:bg-green-500/10"><X className="w-4 h-4 text-green-400" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards grid */}
      <BalanceCard pendingCount={pc} approvedCount={ac} paidAmount={pw} totalBalance={tb} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MilestoneCard approvedCount={ac} />
        <ReserveUsernameCard userEmail={user.email} />
      </div>

      <SubmitMailsCard userEmail={user.email} onSubmitted={refresh} submissionsOpen={so} profile={profile} />

      <WithdrawDialog open={wo} onClose={() => setWo(false)} userEmail={user.email} withdrawableAmount={tb} onWithdrawn={refresh} />
      <GPayBot />
    </div>
  );
}
