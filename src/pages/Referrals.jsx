import { useState, useEffect } from "react";
import { account, listDocs, Query } from "@/lib/appwrite";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Copy, Users, Gift, Zap, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Referrals() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  useEffect(() => { (async () => { try { const u = await account.get(); setUser(u); const profiles = await listDocs("profiles", [Query.equal("user_id", u.$id)]); if (profiles[0]) setProfile(profiles[0]); } catch {} })(); }, []);

  const { data: refs = [] } = useQuery({ queryKey: ["my-referrals"], queryFn: () => listDocs("referrals", [Query.equal("referrer_email", user.email)]), enabled: !!user });

  const longLink = user ? `${window.location.origin}/Dashboard?ref=${encodeURIComponent(user.email)}` : "";
  const shortLink = profile?.referral_short_url || "";
  const displayLink = shortLink || longLink;
  const cp = () => { navigator.clipboard.writeText(displayLink); toast.success("Link copied!"); };
  const bp = refs.filter(r => r.referral_bonus_paid).length, pp = refs.filter(r => r.power_bonus_paid).length, te = bp * 200 + pp * 1000;

  if (!user) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <h2 className="font-orbitron text-lg font-bold tracking-wider">Referrals</h2>

      {/* Referral link card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5 glow-primary">
        <div className="flex items-center gap-2 mb-3">
          <Share2 className="w-4 h-4 text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-space">Your Referral Link</p>
        </div>
        <div className="flex gap-2">
          <input readOnly value={displayLink} className="flex-1 bg-accent/50 border border-border/50 rounded-xl px-4 py-2.5 text-xs truncate focus:ring-1 focus:ring-primary/30 outline-none" />
          <Button onClick={cp} size="sm" className="gold-gradient text-black rounded-xl px-4 font-bold">
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        {shortLink && <p className="text-[10px] text-muted-foreground mt-2">Short link powered by Bitly/TinyURL</p>}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Users, color: "text-primary", bg: "bg-primary/10", value: refs.length, label: "Referred" },
          { icon: Gift, color: "text-green-400", bg: "bg-green-500/10", value: bp, label: "Bonuses" },
          { icon: Zap, color: "text-primary", bg: "bg-primary/10", value: `\u20A6${te.toLocaleString()}`, label: "Earned" },
        ].map(({ icon: I, color, bg, value, label }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
            className="glass-card glass-card-hover rounded-2xl p-4 text-center">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}>
              <I className={`w-5 h-5 ${color}`} />
            </div>
            <p className="font-orbitron text-xl font-bold">{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Referral list */}
      {refs.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border/30">
            <p className="text-sm font-semibold font-space">Your Referrals</p>
          </div>
          <div className="divide-y divide-border/20">
            {refs.map(r => (
              <div key={r.$id} className="px-4 py-3 flex items-center justify-between hover:bg-accent/30 transition-colors">
                <p className="text-sm text-foreground/80">{r.referred_email}</p>
                <div className="flex gap-1.5">
                  {r.referral_bonus_paid && <span className="text-[10px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded-lg">+\u20A6200</span>}
                  {r.power_bonus_paid && <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-lg">+\u20A61k</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
