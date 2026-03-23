import React,{createContext,useState,useContext,useEffect}from'react';
import{supabase}from'@/lib/supabaseClient';
const AuthContext=createContext();
export const AuthProvider=({children})=>{
  const[user,setUser]=useState(null);const[isAuthenticated,setIsAuthenticated]=useState(false);
  const[isLoadingAuth,setIsLoadingAuth]=useState(true);const[isLoadingPublicSettings]=useState(false);
  const[authError,setAuthError]=useState(null);
  useEffect(()=>{checkAuth();
    const{data:{subscription}}=supabase.auth.onAuthStateChange(async(ev,session)=>{
      if(ev==='SIGNED_IN'&&session?.user)await loadProfile(session.user);
      else if(ev==='SIGNED_OUT'){setUser(null);setIsAuthenticated(false);}});return()=>subscription.unsubscribe();},[]);
  const checkAuth=async()=>{try{setIsLoadingAuth(true);
    const{data:{session}}=await supabase.auth.getSession();
    if(session?.user)await loadProfile(session.user);
    else{setIsAuthenticated(false);setAuthError({type:'auth_required',message:'Authentication required'});}
  }catch(e){setAuthError({type:'unknown',message:e.message});}finally{setIsLoadingAuth(false);}};
  const loadProfile=async(au)=>{const{data:p}=await supabase.from('profiles').select('*').eq('id',au.id).single();
    setUser({id:au.id,email:au.email,full_name:p?.full_name||au.user_metadata?.full_name||'',...p});setIsAuthenticated(true);setAuthError(null);};
  const logout=async()=>{await supabase.auth.signOut();setUser(null);setIsAuthenticated(false);window.location.href='/login';};
  const navigateToLogin=()=>{window.location.href='/login';};
  return(<AuthContext.Provider value={{user,isAuthenticated,isLoadingAuth,isLoadingPublicSettings,authError,logout,navigateToLogin,checkAuth,appPublicSettings:null}}>{children}</AuthContext.Provider>);
};
export const useAuth=()=>{const c=useContext(AuthContext);if(!c)throw new Error('useAuth must be used within AuthProvider');return c;};