import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { account, listDocs, createDoc, Query } from "@/lib/appwrite";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  const loadProfile = useCallback(async (authUser) => {
    try {
      const profiles = await listDocs("profiles", [Query.equal("user_id", authUser.$id)]);
      const profile = profiles[0];
      setUser({
        id: authUser.$id,
        email: authUser.email,
        full_name: profile?.full_name || authUser.name || "",
        ...profile
      });
    } catch {
      setUser({
        id: authUser.$id,
        email: authUser.email,
        full_name: authUser.name || ""
      });
    }
    setIsAuthenticated(true);
    setAuthError(null);
    setIsLoadingAuth(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    // Check for existing session via cookie (Appwrite uses cookies, not localStorage)
    account.get()
      .then((authUser) => {
        if (mounted) loadProfile(authUser);
      })
      .catch(() => {
        if (mounted) {
          setIsLoadingAuth(false);
          setAuthError({ type: "auth_required", message: "No session" });
        }
      });
    return () => { mounted = false; };
  }, [loadProfile]);

  const logout = useCallback(async () => {
    try { await account.deleteSession("current"); } catch {}
    setUser(null);
    setIsAuthenticated(false);
    setAuthError({ type: "auth_required", message: "Signed out" });
  }, []);

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, isLoadingAuth,
      isLoadingPublicSettings: false,
      authError, logout,
      navigateToLogin: () => {},
      checkAuth: async () => {},
      appPublicSettings: null
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
};
