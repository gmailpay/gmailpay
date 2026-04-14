import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Trophy, Target } from "lucide-react";

export default function MilestoneCard({ approvedCount }) {
  const t = 50;
  const p = Math.min((approvedCount / t) * 100, 100);
  const b = approvedCount >= t;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card glass-card-hover rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-primary" />
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-space">Milestone</p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-foreground font-medium">{approvedCount} <span className="text-muted-foreground">approved</span></span>
        <span className="text-xs text-muted-foreground font-orbitron">{t} target</span>
      </div>

      <div className="relative mb-5">
        <Progress value={p} className="h-2.5 rounded-full" />
        {p > 0 && p < 100 && (
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50" style={{ left: `calc(${p}% - 6px)` }} />
        )}
      </div>

      <div className="flex items-center justify-between bg-accent/50 rounded-xl p-3.5">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${b ? "bg-green-500/20" : "bg-primary/15"}`}>
            <Trophy className={`w-4 h-4 ${b ? "text-green-400" : "text-primary"}`} />
          </div>
          <div>
            <span className="text-sm font-medium">Milestone Bonus</span>
            <p className="text-[10px] text-muted-foreground">Reach 50 approved mails</p>
          </div>
        </div>
        <span className={`font-orbitron text-sm font-bold ${b ? "text-green-400" : "text-muted-foreground"}`}>
          {b ? "\u2713 " : ""}\u20A6500
        </span>
      </div>
    </motion.div>
  );
}
