import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminSubmissions from "../components/admin/AdminSubmissions";
import AdminPayouts from "../components/admin/AdminPayouts";
import AdminMasterSwitch from "../components/admin/AdminMasterSwitch";
import AdminUsers from "../components/admin/AdminUsers";
import AdminFinalPayouts from "../components/admin/AdminFinalPayouts";
import AdminBroadcasts from "../components/admin/AdminBroadcasts";
import AdminTrustManager from "../components/admin/AdminTrustManager";
import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function Admin() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/Dashboard" className="p-2 rounded-xl hover:bg-accent transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <h1 className="font-orbitron text-xl font-bold tracking-wider">Admin Panel</h1>
      </div>
      <Tabs defaultValue="submissions">
        <TabsList className="bg-accent/50 mb-6 w-full justify-start flex-wrap rounded-xl p-1 gap-0.5">
          <TabsTrigger value="submissions" className="rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary text-xs">Submissions</TabsTrigger>
          <TabsTrigger value="trust" className="rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary text-xs">Trust</TabsTrigger>
          <TabsTrigger value="payouts" className="rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary text-xs">Payouts</TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary text-xs">Users</TabsTrigger>
          <TabsTrigger value="finalpayouts" className="rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary text-xs">Final</TabsTrigger>
          <TabsTrigger value="broadcasts" className="rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary text-xs">Broadcasts</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary text-xs">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="submissions"><AdminSubmissions /></TabsContent>
        <TabsContent value="trust"><AdminTrustManager /></TabsContent>
        <TabsContent value="payouts"><AdminPayouts /></TabsContent>
        <TabsContent value="users"><AdminUsers /></TabsContent>
        <TabsContent value="finalpayouts"><AdminFinalPayouts /></TabsContent>
        <TabsContent value="broadcasts"><AdminBroadcasts /></TabsContent>
        <TabsContent value="settings"><AdminMasterSwitch /></TabsContent>
      </Tabs>
    </div>
  );
}
