import { useLocation } from "react-router-dom";
import { Home } from "lucide-react";

export default function PageNotFound() {
  const loc = useLocation();
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="font-orbitron text-7xl font-bold gradient-text">404</h1>
        <div className="h-0.5 w-16 bg-primary/30 mx-auto rounded-full"></div>
        <h2 className="text-xl font-medium text-foreground font-space">Page Not Found</h2>
        <p className="text-sm text-muted-foreground">The page you\u2019re looking for doesn\u2019t exist.</p>
        <button onClick={() => window.location.href = "/"} className="inline-flex items-center gap-2 px-6 py-3 gold-gradient text-black font-bold rounded-xl text-sm">
          <Home className="w-4 h-4" />Go Home
        </button>
      </div>
    </div>
  );
}
