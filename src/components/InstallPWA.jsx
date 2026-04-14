import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("pwa-dismissed")) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); setShowBanner(true); };
    window.addEventListener("beforeinstallprompt", handler);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS && !navigator.standalone) setShowBanner(true);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShowBanner(false);
    setDeferredPrompt(null);
    setInstalling(false);
  };

  const dismiss = () => { setShowBanner(false); localStorage.setItem("pwa-dismissed", "1"); };
  if (!showBanner) return null;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  return (
    <div className="mx-4 mt-2 max-w-6xl lg:mx-auto w-auto">
      <div className="flex items-center gap-3 glass-card glass-card-hover rounded-2xl px-4 py-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Install GmailPay App</p>
          <p className="text-xs text-muted-foreground truncate">{isIOS ? "Tap Share \u2192 Add to Home Screen" : "Get the full app experience"}</p>
        </div>
        {!isIOS && deferredPrompt && (
          <button onClick={handleInstall} disabled={installing} className="px-4 py-2 gold-gradient text-black rounded-xl text-xs font-bold shrink-0">
            {installing ? "..." : "Install"}
          </button>
        )}
        <button onClick={dismiss} className="p-1.5 rounded-lg hover:bg-accent shrink-0">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
