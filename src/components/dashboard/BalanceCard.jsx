import { motion } from "framer-motion";
import { TrendingUp, Clock, CheckCircle, Banknote } from "lucide-react";

export default function BalanceCard({ pendingCount, approvedCount, paidAmount, totalBalance }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 glow-primary relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <Banknote className="w-4 h-4 text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-space">Your Balance</p>
        </div>
        <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-foreground mt-2 mb-5">
          {totalBalance.toLocaleString()}
          <span className="text-lg text-primary ml-1">NGN</span>
        </h2>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-accent/50 rounded-xl p-3 text-center">
            <Clock className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
            <p className="font-orbitron text-lg font-bold text-yellow-400">{pendingCount}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
          <div className="bg-accent/50 rounded-xl p-3 text-center">
            <CheckCircle className="w-4 h-4 text-green-400 mx-auto mb-1" />
            <p className="font-orbitron text-lg font-bold text-green-400">{approvedCount}</p>
            <p className="text-[10px] text-muted-foreground">Approved</p>
          </div>
          <div className="bg-accent/50 rounded-xl p-3 text-center">
            <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="font-orbitron text-lg font-bold text-primary">{paidAmount.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Paid</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
