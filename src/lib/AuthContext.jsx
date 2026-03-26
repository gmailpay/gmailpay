import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

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

    const timer = setTimeout(() => {
      if (mounted && !isAuthenticated) {
        setIsLoadingAuth(false);
        setAuthError({ type: 'auth_required', message: 'timeout' });
      }
    }, 8000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
        await loadProfile(session.user);
        clearTimeout(timer);
      } else if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({ type: 'auth_required', message: event === 'SIGNED_OUT' ? 'Signed out' : 'No session' });
        setIsLoadingAuth(false);
        clearTimeout(timer);
      }
    });

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
