import { useState, useEffect } from "react";
import { account, listDocs, Query } from "@/lib/appwrite";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Copy, Users, Gift, Zap } from "lucide-react";
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
  const cp = () => { navigator.clipboard.writeText(displayLink); toast.success("Copied!"); };
  const bp = refs.filter(r => r.referral_bonus_paid).length, pp = refs.filter(r => r.power_bonus_paid).length, te = bp * 200 + pp * 1000;
  if (!user) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  return (<div className="space-y-6"><h2 className="font-orbitron text-lg font-bold tracking-wider">Referrals</h2><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-5"><p className="text-sm text-muted-foreground mb-3">Your Referral Link</p><div className="flex gap-2"><input readOnly value={displayLink} className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-xs truncate" /><Button onClick={cp} size="sm" className="bg-primary text-primary-foreground"><Copy className="w-4 h-4" /></Button></div>{shortLink && <p className="text-xs text-muted-foreground mt-2">Short link powered by Bitly/TinyURL</p>}</motion.div><div className="grid grid-cols-3 gap-3">{[{ icon: Users, color: "text-primary", value: refs.length, label: "Referred" }, { icon: Gift, color: "text-green-400", value: bp, label: "Bonuses" }, { icon: Zap, color: "text-primary", value: `\u20A6${te.toLocaleString()}`, label: "Earned" }].map(({ icon: I, color, value, label }, i) => <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className="bg-card border border-border rounded-xl p-4 text-center"><I className={`w-5 h-5 mx-auto ${color} mb-2`} /><p className="font-orbitron text-xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></motion.div>)}</div>{refs.length > 0 && <div className="bg-card border border-border rounded-xl overflow-hidden"><div className="p-4 border-b border-border"><p className="text-sm font-semibold">Your Referrals</p></div><div className="divide-y divide-border">{refs.map(r => <div key={r.$id} className="px-4 py-3 flex items-center justify-between"><p className="text-sm">{r.referred_email}</p><div className="flex gap-2">{r.referral_bonus_paid && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">+\u20A6200</span>}{r.power_bonus_paid && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">+\u20A61k</span>}</div></div>)}</div></div>}</div>);
}
