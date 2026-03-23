import React,{createContext,useState,useContext,useEffect,useRef}from'react';
import{supabase}from'@/lib/supabaseClient';
const AuthContext=createContext();
export const AuthProvider=({children})=>{
  const[user,setUser]=useState(null);const[isAuthenticated,setIsAuthenticated]=useState(false);
  const[isLoadingAuth,setIsLoadingAuth]=useState(true);const[isLoadingPublicSettings]=useState(false);
  const[authError,setAuthError]=useState(null);
  const[debugLog,setDebugLog]=useState([]);
  const addLog=(msg)=>{console.log('[AUTH]',msg);setDebugLog(prev=>[...prev,new Date().toLocaleTimeString()+': '+msg]);};

  useEffect(()=>{
    addLog('Starting auth check...');
    const timer=setTimeout(()=>{
      addLog('TIMEOUT: Auth check took >8s, forcing complete');
      setIsLoadingAuth(false);
      if(!user)setAuthError({type:'auth_required',message:'Auth timed out'});
    },8000);
    checkAuth().finally(()=>clearTimeout(timer));
    const{data:{subscription}}=supabase.auth.onAuthStateChange(async(ev,session)=>{
      addLog('Auth state change: '+ev);
      if(ev==='SIGNED_IN'&&session?.user){try{await loadProfile(session.user);addLog('Profile loaded via state change');}catch(e){addLog('State change profile error: '+e.message);}}
      else if(ev==='SIGNED_OUT'){setUser(null);setIsAuthenticated(false);}});
    return()=>{subscription.unsubscribe();clearTimeout(timer);};
  },[]);

  const checkAuth=async()=>{try{
    addLog('getSession...');
    const{data:{session},error}=await supabase.auth.getSession();
    if(error){addLog('getSession error: '+error.message);setAuthError({type:'auth_required',message:error.message});return;}
    if(session?.user){
      addLog('Session found for: '+session.user.email);
      try{await loadProfile(session.user);addLog('Profile loaded OK');}
      catch(e){addLog('Profile error (using fallback): '+e.message);setUser({id:session.user.id,email:session.user.email,full_name:session.user.user_metadata?.full_name||''});setIsAuthenticated(true);setAuthError(null);}
    }else{addLog('No session found');setIsAuthenticated(false);setAuthError({type:'auth_required',message:'No session'});}
  }catch(e){addLog('checkAuth crash: '+e.message);setAuthError({type:'auth_required',message:e.message});}finally{addLog('Auth check done, loading=false');setIsLoadingAuth(false);}};

  const loadProfile=async(au)=>{addLog('Loading profile for '+au.id.slice(0,8)+'...');
    const{data:p,error}=await supabase.from('profiles').select('*').eq('id',au.id).single();
    if(error){addLog('Profile query error: '+JSON.stringify(error));throw error;}
    addLog('Profile found: '+(p?.full_name||'no name'));
    setUser({id:au.id,email:au.email,full_name:p?.full_name||au.user_metadata?.full_name||'',...p});setIsAuthenticated(true);setAuthError(null);};

  const logout=async()=>{await supabase.auth.signOut();setUser(null);setIsAuthenticated(false);window.location.href='/login';};
  return(<AuthContext.Provider value={{user,isAuthenticated,isLoadingAuth,isLoadingPublicSettings,authError,logout,navigateToLogin:()=>{window.location.href='/login';},checkAuth,appPublicSettings:null,debugLog}}>{children}</AuthContext.Provider>);
};
export const useAuth=()=>{const c=useContext(AuthContext);if(!c)throw new Error('useAuth must be used within AuthProvider');return c;};
