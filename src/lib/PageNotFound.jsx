import{useLocation}from'react-router-dom';
export default function PageNotFound(){const loc=useLocation();const p=loc.pathname.substring(1);
  return(<div className="min-h-screen flex items-center justify-center p-6 bg-background"><div className="max-w-md w-full text-center space-y-6">
    <h1 className="text-7xl font-light text-muted-foreground">404</h1><div className="h-0.5 w-16 bg-border mx-auto"></div>
    <h2 className="text-2xl font-medium text-foreground">Page Not Found</h2>
    <button onClick={()=>window.location.href='/'} className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Go Home</button>
  </div></div>);}