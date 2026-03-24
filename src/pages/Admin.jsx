import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminSubmissions from "../components/admin/AdminSubmissions";
import AdminPayouts from "../components/admin/AdminPayouts";
import AdminMasterSwitch from "../components/admin/AdminMasterSwitch";
import AdminUsers from "../components/admin/AdminUsers";
import AdminFinalPayouts from "../components/admin/AdminFinalPayouts";
import AdminBroadcasts from "../components/admin/AdminBroadcasts";
import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function Admin() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/Dashboard" className="p-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="font-orbitron text-xl font-bold tracking-wider">
          Admin Panel
        </h1>
      </div>
      <Tabs defaultValue="submissions">
        <TabsList className="bg-secondary mb-6 w-full justify-start flex-wrap">
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="finalpayouts">Final Payouts</TabsTrigger>
          <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="submissions"><AdminSubmissions /></TabsContent>
        <TabsContent value="payouts"><AdminPayouts /></TabsContent>
        <TabsContent value="users"><AdminUsers /></TabsContent>
        <TabsContent value="finalpayouts"><AdminFinalPayouts /></TabsContent>
        <TabsContent value="broadcasts"><AdminBroadcasts /></TabsContent>
        <TabsContent value="settings"><AdminMasterSwitch /></TabsContent>
      </Tabs>
    </div>
  );
}
