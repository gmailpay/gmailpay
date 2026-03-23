import React,{createContext,useState,useContext,useEffect}from'react';
import{supabase}from'@/lib/supabaseClient';
const AuthContext=createContext();
export const AuthProvider=({children})=>{
  const[user,setUser]=useState(null);const[isAuthenticated,setIsAuthenticated]=useState(false);
  const[isLoadingAuth,setIsLoadingAuth]=useState(true);const[isLoadingPublicSettings]=useState(false);
  const[authError,setAuthError]=useState(null);
  useEffect(()=>{checkAuth();
    const{data:{subscription}}=supabase.auth.onAuthStateChange(async(ev,session)=>{
      if(ev==='SIGNED_IN'&&session?.user){try{await loadProfile(session.user);}catch(e){console.error('Profile load error:',e);}}
      else if(ev==='SIGNED_OUT'){setUser(null);setIsAuthenticated(false);}});return()=>subscription.unsubscribe();},[]);
  const checkAuth=async()=>{try{setIsLoadingAuth(true);
    const{data:{session},error}=await supabase.auth.getSession();
    if(error){console.error('getSession error:',error);setAuthError({type:'auth_required',message:'Authentication required'});return;}
    if(session?.user){try{await loadProfile(session.user);}catch(e){console.error('loadProfile error:',e);setUser({id:session.user.id,email:session.user.email,full_name:session.user.user_metadata?.full_name||''});setIsAuthenticated(true);setAuthError(null);}}
    else{setIsAuthenticated(false);setAuthError({type:'auth_required',message:'Authentication required'});}
  }catch(e){console.error('checkAuth error:',e);setAuthError({type:'auth_required',message:e.message});}finally{setIsLoadingAuth(false);}};
  const loadProfile=async(au)=>{const{data:p,error}=await supabase.from('profiles').select('*').eq('id',au.id).single();
    if(error){console.error('Profile query error:',error);throw error;}
    setUser({id:au.id,email:au.email,full_name:p?.full_name||au.user_metadata?.full_name||'',...p});setIsAuthenticated(true);setAuthError(null);};
  const logout=async()=>{await supabase.auth.signOut();setUser(null);setIsAuthenticated(false);window.location.href='/login';};
  const navigateToLogin=()=>{window.location.href='/login';};
  return(<AuthContext.Provider value={{user,isAuthenticated,isLoadingAuth,isLoadingPublicSettings,authError,logout,navigateToLogin,checkAuth,appPublicSettings:null}}>{children}</AuthContext.Provider>);
};
export const useAuth=()=>{const c=useContext(AuthContext);if(!c)throw new Error('useAuth must be used within AuthProvider');return c;};
