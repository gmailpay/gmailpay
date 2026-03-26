import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listDocs, updateDoc, createDoc, Query } from "@/lib/appwrite";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Power, Loader2 } from "lucide-react";
import { useState } from "react";
export default function AdminMasterSwitch() {
  const qc = useQueryClient();
  const [toggling, setToggling] = useState(false);
  const { data: settings = [], isLoading } = useQuery({ queryKey: ["admin-settings"], queryFn: () => listDocs("app_settings", [Query.equal("setting_key", "main")]) });
  const cur = settings[0];
  const isOpen = cur?.submissions_open ?? true;
  const toggle = async checked => {
    setToggling(true);
    if (cur) await updateDoc("app_settings", cur.$id, { submissions_open: checked });
    else await createDoc("app_settings", { setting_key: "main", submissions_open: checked });
    toast.success(checked ? "Opened!" : "Closed.");
    qc.invalidateQueries({ queryKey: ["admin-settings"] });
    qc.invalidateQueries({ queryKey: ["app-settings"] });
    setToggling(false);
  };
  if (isLoading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  return <div className="bg-card border border-border rounded-xl p-6"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><Power className={`w-6 h-6 ${isOpen ? "text-green-400" : "text-red-400"}`} /><div><Label className="text-base font-semibold">Master Switch</Label><p className="text-sm text-muted-foreground">{isOpen ? "OPEN" : "CLOSED"}</p></div></div><div className="flex items-center gap-2">{toggling && <Loader2 className="w-4 h-4 animate-spin text-primary" />}<Switch checked={isOpen} onCheckedChange={toggle} disabled={toggling} /></div></div></div>;
}
