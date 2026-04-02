import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import AppLayout from "./components/layout/AppLayout";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Submissions = lazy(() => import("./pages/Submissions"));
const Referrals = lazy(() => import("./pages/Referrals"));
const Admin = lazy(() => import("./pages/Admin"));
const Admin1 = lazy(() => import("./pages/Admin1"));
const Buyer = lazy(() => import("./pages/Buyer"));
const BuyerAdmin = lazy(() => import("./pages/BuyerAdmin"));
const Login = lazy(() => import("./pages/Login"));
const PageNotFound = lazy(() => import("./lib/PageNotFound"));
const UserNotRegisteredError = lazy(() => import("@/components/UserNotRegisteredError"));

const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="text-center">
      <h1 className="font-orbitron text-2xl font-bold mb-4 text-foreground">
        GMAIL<span className="text-primary">PAY</span>
      </h1>
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
    </div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) return <LoadingSpinner />;

  if (authError) {
    if (authError.type === "user_not_registered")
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <UserNotRegisteredError />
        </Suspense>
      );
    if (authError.type === "auth_required") return <Navigate to="/login" replace />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Navigate to="/Dashboard" replace />} />
        <Route element={<AppLayout />}>
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/Submissions" element={<Submissions />} />
          <Route path="/Referrals" element={<Referrals />} />
        </Route>
        <Route path="/Admin" element={<Admin />} />
        <Route path="/Admin1" element={<Admin1 />} />
        <Route path="/Buyer" element={<Buyer />} />

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/BuyerAdmin" element={<BuyerAdmin />} />
              <Route path="/*" element={<AuthenticatedApp />} />
            </Routes>
          </Suspense>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
