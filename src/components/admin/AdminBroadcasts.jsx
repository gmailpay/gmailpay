import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Trash2, Eye, EyeOff, Megaphone } from "lucide-react";
import { toast } from "sonner";

export default function AdminBroadcasts() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();

  const { data: broadcasts = [] } = useQuery({
    queryKey: ["admin-broadcasts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("broadcasts")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const sendBroadcast = async () => {
    if (!message.trim()) {
      toast.error("Enter a message.");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("broadcasts")
      .insert({ message: message.trim(), is_active: true });
    if (error) {
      toast.error("Failed to send broadcast.");
    } else {
      toast.success("Broadcast sent!");
      setMessage("");
      qc.invalidateQueries({ queryKey: ["admin-broadcasts"] });
    }
    setBusy(false);
  };

  const toggleActive = async (id, currentActive) => {
    await supabase
      .from("broadcasts")
      .update({ is_active: !currentActive })
      .eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-broadcasts"] });
    toast.success(currentActive ? "Broadcast hidden" : "Broadcast shown");
  };

  const deleteBroadcast = async (id) => {
    await supabase.from("broadcasts").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-broadcasts"] });
    toast.success("Broadcast deleted");
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">New Broadcast</h3>
        </div>
        <Textarea
          placeholder="Type your broadcast message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="bg-secondary border-border min-h-[80px] text-sm mb-3"
        />
        <Button
          onClick={sendBroadcast}
          disabled={busy}
          className="w-full bg-primary text-primary-foreground font-semibold"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          {busy ? "Sending..." : "Send Broadcast"}
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase">
          Previous Broadcasts ({broadcasts.length})
        </p>
        {broadcasts.map((b) => (
          <div
            key={b.id}
            className="bg-card border border-border rounded-lg p-3 flex items-start justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm">{b.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(b.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Badge
                variant="outline"
                className={
                  b.is_active
                    ? "bg-green-500/20 text-green-400 border-green-500/30 text-xs"
                    : "bg-red-500/20 text-red-400 border-red-500/30 text-xs"
                }
              >
                {b.is_active ? "Active" : "Hidden"}
              </Badge>
              <button
                onClick={() => toggleActive(b.id, b.is_active)}
                className="p-1.5 rounded hover:bg-secondary"
              >
                {b.is_active ? (
                  <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </button>
              <button
                onClick={() => deleteBroadcast(b.id)}
                className="p-1.5 rounded hover:bg-red-500/10"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
