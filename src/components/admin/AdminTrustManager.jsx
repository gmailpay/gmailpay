import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Ban, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const TRUST_COLORS = { low: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", medium: "bg-blue-500/20 text-blue-400 border-blue-500/30", high: "bg-green-500/20 text-green-400 border-green-500/30" };

export default function AdminTrustManager() {
  const qc = useQueryClient();

  const { data: profiles = [] } = useQuery({ queryKey: ["admin-profiles"], queryFn: async () => { const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }); return data || []; } });
  const { data: allSubs = [] } = useQuery({ queryKey: ["admin-all-subs"], queryFn: async () => { const { data } = await supabase.from("gmail_submissions").select("submitted_by, status"); return data || []; } });

  const getStats = (email) => {
    const userSubs = allSubs.filter(s => s.submitted_by === email);
    const total = userSubs.length;
    const approved = userSubs.filter(s => s.status === "approved").length;
    const rejected = userSubs.filter(s => s.status === "rejected").length;
    const rate = total > 0 ? Math.round((rejected / total) * 100) : 0;
    return { total, approved, rejected, rate };
  };

  const updateTrust = async (id, level) => {
    await supabase.from("profiles").update({ trust_level: level }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-profiles"] });
    toast.success(`Trust set to ${level}`);
  };

  const toggleBan = async (id, currentBan) => {
    await supabase.from("profiles").update({ is_banned: !currentBan, ban_reason: !currentBan ? "Banned by admin" : null, is_restricted: false }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-profiles"] });
    toast.success(currentBan ? "User unbanned" : "User banned");
  };

  const toggleRestrict = async (id, current) => {
    await supabase.from("profiles").update({ is_restricted: !current }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-profiles"] });
    toast.success(current ? "Restriction removed" : "User restricted");
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{profiles.length} users</p>
      {profiles.map(p => {
        const stats = getStats(p.email);
        return (
          <div key={p.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-sm font-medium">{p.email}</p>
                <p className="text-xs text-muted-foreground">{p.full_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`${TRUST_COLORS[p.trust_level || "low"]} border text-xs`}>
                  <Shield className="w-3 h-3 mr-1" />{(p.trust_level || "low").toUpperCase()}
                </Badge>
                {p.is_banned && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border text-xs">BANNED</Badge>}
                {p.is_restricted && <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 border text-xs">RESTRICTED</Badge>}
              </div>
            </div>
            <div className="flex gap-4 text-xs">
              <span>Total: {stats.total}</span>
              <span className="text-green-400">Approved: {stats.approved}</span>
              <span className="text-red-400">Rejected: {stats.rejected}</span>
              <span className={stats.rate >= 50 ? "text-red-400 font-bold" : stats.rate >= 30 ? "text-yellow-400" : ""}>Rate: {stats.rate}%</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {["low", "medium", "high"].map(level => (
                <Button key={level} size="sm" variant={p.trust_level === level ? "default" : "outline"} onClick={() => updateTrust(p.id, level)} className="text-xs h-7 px-2">
                  {level}
                </Button>
              ))}
              <Button size="sm" variant="outline" onClick={() => toggleRestrict(p.id, p.is_restricted)} className={`text-xs h-7 px-2 ${p.is_restricted ? "border-orange-500 text-orange-400" : ""}`}>
                <AlertTriangle className="w-3 h-3 mr-1" />{p.is_restricted ? "Unrestrict" : "Restrict"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => toggleBan(p.id, p.is_banned)} className={`text-xs h-7 px-2 ${p.is_banned ? "border-red-500 text-red-400" : ""}`}>
                <Ban className="w-3 h-3 mr-1" />{p.is_banned ? "Unban" : "Ban"}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
