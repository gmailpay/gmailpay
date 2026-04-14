import { useState } from "react";
import { createDoc } from "@/lib/appwrite";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Wallet, User, Building2, CreditCard } from "lucide-react";
import { toast } from "sonner";

export default function WithdrawDialog({ open, onClose, userEmail, withdrawableAmount, onWithdrawn }) {
  const [accountName, setAccountName] = useState("");
  const [bank, setBank] = useState("");
  const [acct, setAcct] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!accountName.trim() || !bank.trim() || !acct.trim()) { toast.error("Please fill all fields."); return; }
    setLoading(true);
    try {
      await createDoc("withdrawals", {
        user_email: userEmail,
        amount: withdrawableAmount,
        account_name: accountName.trim(),
        bank_name: bank.trim(),
        bank_account_number: acct.trim(),
        status: "pending"
      });
      toast.success("Withdrawal submitted!");
      setAccountName(""); setBank(""); setAcct("");
      onClose(); onWithdrawn?.();
    } catch { toast.error("Failed to submit withdrawal."); }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card border-border/50 rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 font-space">
            <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            Withdraw Funds
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-accent/50 rounded-xl p-4 text-center glow-primary">
            <p className="text-xs text-muted-foreground mb-1">Withdrawable Amount</p>
            <p className="font-orbitron text-3xl font-bold gradient-text">₦{withdrawableAmount?.toLocaleString()}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Account Name</Label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Your full name" value={accountName} onChange={e => setAccountName(e.target.value)} className="bg-accent/50 border-border/50 pl-10 h-11 rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Bank Name</Label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="e.g. Opay, Palmpay" value={bank} onChange={e => setBank(e.target.value)} className="bg-accent/50 border-border/50 pl-10 h-11 rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Account Number</Label>
            <div className="relative">
              <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Account number" value={acct} onChange={e => setAcct(e.target.value)} className="bg-accent/50 border-border/50 pl-10 h-11 rounded-xl" />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl border-border/50">Cancel</Button>
          <Button onClick={submit} disabled={loading} className="gold-gradient text-black font-bold rounded-xl">
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Confirm Withdrawal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
