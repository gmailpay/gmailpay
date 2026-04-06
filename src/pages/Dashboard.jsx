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

  // Check for recently paid withdrawals (within last 1 hour)
  const recentlyPaid = wds.find(w => {
    if (w.status !== "paid") return false;
    const paidTime = w.paid_at ? new Date(w.paid_at) : (w.$updatedAt ? new Date(w.$updatedAt) : null);
    if (!paidTime) return false;
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return paidTime > hourAgo;
  });
  const showPaymentBanner = !!recentlyPaid && !dismissedBanner;

  if (!user) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showPaymentBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="relative bg-gradient-to-r from-green-500/20 via-emerald-500/15 to-green-500/20 border border-green-500/30 rounded-xl p-4 md:p-5"
          >
            <button onClick={() => setDismissedBanner(true)} className="absolute top-2 right-2 p-1 rounded-lg hover:bg-green-500/20 text-green-400/60 hover:text-green-400"><X className="w-4 h-4" /></button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <PartyPopper className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm md:text-base font-bold text-green-400">Your payment has been made! \u{1F389}</p>
                <p className="text-xs md:text-sm text-green-400/80 mt-0.5">Create more Gmails to earn more</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BalanceCard pendingCount={pc} approvedCount={ac} paidAmount={pw} totalBalance={tb} />
        <MilestoneCard approvedCount={ac} />
      </div>
      <div className="flex justify-center">
        <Button onClick={() => setWo(true)} disabled={!cw} className="gold-gradient text-black font-bold px-8 py-3 rounded-xl text-base disabled:opacity-40">
          <Wallet className="w-5 h-5 mr-2" />{cw ? `Withdraw \u20A6${tb.toLocaleString()}` : `\u20A6${(1000 - tb).toLocaleString()} more`}
        </Button>
      </div>
      <ReserveUsernameCard userEmail={user.email} />
      <SubmitMailsCard userEmail={user.email} onSubmitted={refresh} submissionsOpen={so} profile={profile} />
      <GPayBot />
      <WithdrawDialog open={wo} onClose={() => setWo(false)} userEmail={user.email} withdrawableAmount={tb} onWithdrawn={refresh} />
    </div>
  );
}
