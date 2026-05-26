import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Zap, Smartphone, BellRing, Share, Plus } from "lucide-react";
import logo from "@/assets/logo.png";

const SEEN_KEY = "wt_install_prompt_seen";
const SHOW_DELAY_MS = 8000;

type DeferredPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  // iOS
  (window.navigator as any).standalone === true;

const isPreviewHost = () => {
  const h = window.location.hostname;
  return (
    h.includes("id-preview--") ||
    h.includes("lovableproject.com") ||
    h.includes("lovable.app")
  );
};

const isInIframe = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

const isIosSafari = () => {
  const ua = window.navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const webkit = /WebKit/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  return iOS && webkit;
};

interface Props {
  /** When true, opens the modal ignoring the "seen" flag (for manual re-trigger). */
  forceOpen?: boolean;
  onClose?: () => void;
}

const InstallAppModal = ({ forceOpen, onClose }: Props) => {
  const [open, setOpen] = useState(false);
  const [deferred, setDeferred] = useState<DeferredPromptEvent | null>(null);
  const [iosMode, setIosMode] = useState(false);

  // Listen for the captured prompt
  useEffect(() => {
    const sync = () => {
      const e = (window as any).__wtDeferredInstallPrompt as DeferredPromptEvent | null;
      if (e) setDeferred(e);
    };
    sync();
    window.addEventListener("wt-install-available", sync);
    return () => window.removeEventListener("wt-install-available", sync);
  }, []);

  // Auto-show once per user
  useEffect(() => {
    if (forceOpen) return;
    if (typeof window === "undefined") return;
    if (isStandalone() || isPreviewHost() || isInIframe()) return;

    let seen = false;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "1";
    } catch {}
    if (seen) return;

    const ios = isIosSafari();
    setIosMode(ios);

    const tryShow = () => {
      // Re-check the seen flag in case another tab set it.
      try {
        if (localStorage.getItem(SEEN_KEY) === "1") return;
      } catch {}
      const hasPrompt = !!(window as any).__wtDeferredInstallPrompt;
      if (hasPrompt || ios) {
        setOpen(true);
        try {
          localStorage.setItem(SEEN_KEY, "1");
        } catch {}
      }
    };

    const timer = window.setTimeout(tryShow, SHOW_DELAY_MS);
    const onAvail = () => {
      window.clearTimeout(timer);
      window.setTimeout(tryShow, SHOW_DELAY_MS);
    };
    window.addEventListener("wt-install-available", onAvail);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("wt-install-available", onAvail);
    };
  }, [forceOpen]);

  // Manual force-open support
  useEffect(() => {
    if (forceOpen) {
      setIosMode(isIosSafari());
      setOpen(true);
    }
  }, [forceOpen]);

  const handleClose = (next: boolean) => {
    setOpen(next);
    if (!next) onClose?.();
  };

  const handleInstall = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {}
    (window as any).__wtDeferredInstallPrompt = null;
    setDeferred(null);
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm sm:max-w-md p-0 overflow-hidden">
        <div className="relative bg-gradient-to-br from-primary/15 via-card to-accent/10 p-6 sm:p-8">
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-accent/15 blur-3xl" />
          <div className="relative flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-primary/40 shadow-2xl bg-background flex items-center justify-center mb-4">
              <img src={logo} alt="Webtuto" className="w-full h-full object-contain p-2" />
            </div>
            <DialogHeader className="space-y-2 text-center">
              <DialogTitle className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
                Get the Webtuto app
              </DialogTitle>
              <DialogDescription className="text-sm text-foreground/70">
                Install Webtuto on your phone for instant access — no app store needed.
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="p-6 sm:p-7 space-y-5">
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-semibold">Lightning fast</div>
                <div className="text-muted-foreground text-xs">Opens in one tap from your home screen.</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-semibold">Full-screen experience</div>
                <div className="text-muted-foreground text-xs">Distraction-free, just like a native app.</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <BellRing className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-semibold">Stay in the loop</div>
                <div className="text-muted-foreground text-xs">Never miss a live class or new lesson.</div>
              </div>
            </li>
          </ul>

          {iosMode ? (
            <div className="rounded-xl bg-muted/50 p-4 text-sm space-y-2">
              <div className="font-semibold flex items-center gap-2">
                <Share className="w-4 h-4 text-primary" /> Install on iPhone
              </div>
              <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal pl-4">
                <li>
                  Tap the <span className="font-semibold text-foreground">Share</span> icon in Safari's bottom bar.
                </li>
                <li>
                  Scroll and tap <span className="font-semibold text-foreground">"Add to Home Screen"</span>
                  <Plus className="w-3 h-3 inline ml-1" />
                </li>
                <li>
                  Tap <span className="font-semibold text-foreground">"Add"</span> in the top right.
                </li>
              </ol>
            </div>
          ) : (
            <Button
              size="lg"
              onClick={handleInstall}
              disabled={!deferred}
              className="w-full gap-2 font-bold"
            >
              <Download className="w-4 h-4" />
              Install Webtuto
            </Button>
          )}

          <button
            onClick={() => handleClose(false)}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstallAppModal;