import { ShieldX } from "lucide-react";

export default function UserNotRegisteredError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center glow-primary">
        <div className="w-16 h-16 rounded-2xl bg-destructive/15 flex items-center justify-center mx-auto mb-5">
          <ShieldX className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="font-orbitron text-2xl font-bold text-foreground mb-3">Access Restricted</h1>
        <p className="text-sm text-muted-foreground">You are not registered. Contact the app administrator for access.</p>
      </div>
    </div>
  );
}
