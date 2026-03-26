import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const initialized = useRef(false);

  const loadProfile = useCallback(async (authUser) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      setUser({
        id: authUser.id,
        email: authUser.email,
        full_name: profile?.full_name || authUser.user_metadata?.full_name || '',
        ...profile
      });
    } catch {
      setUser({
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || ''
      });
    }
    setIsAuthenticated(true);
    setAuthError(null);
    setIsLoadingAuth(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    // PRIMARY: Explicitly check stored session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        initialized.current = true;
        loadProfile(session.user);
      } else if (!initialized.current) {
        // No stored session - wait briefly for onAuthStateChange before giving up
        setTimeout(() => {
          if (mounted && !initialized.current) {
            initialized.current = true;
            setIsLoadingAuth(false);
            setAuthError({ type: 'auth_required', message: 'No session' });
          }
        }, 2000);
      }
    });

    // SECONDARY: Listen for real-time auth events (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'INITIAL_SESSION') {
        // Only handle if getSession() hasn't already initialized
        if (!initialized.current) {
          initialized.current = true;
          if (session?.user) {
            await loadProfile(session.user);
          } else {
            setIsLoadingAuth(false);
            setAuthError({ type: 'auth_required', message: 'No session' });
          }
        }
        return;
      }

      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        initialized.current = true;
        await loadProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        initialized.current = true;
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({ type: 'auth_required', message: 'Signed out' });
        setIsLoadingAuth(false);
      }
    });

    // Fallback timeout - if nothing resolves in 10s, show login
    const timer = setTimeout(() => {
      if (mounted && !initialized.current) {
        initialized.current = true;
        setIsLoadingAuth(false);
        setAuthError({ type: 'auth_required', message: 'timeout' });
      }
    }, 10000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [loadProfile]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // signOut might fail on slow network, still clear local state
    }
    setUser(null);
    setIsAuthenticated(false);
    setAuthError({ type: 'auth_required', message: 'Signed out' });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      logout,
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
  if (!c) throw new Error('useAuth must be used within AuthProvider');
  return c;
};
