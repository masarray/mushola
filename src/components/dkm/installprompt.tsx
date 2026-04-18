import { useEffect, useMemo, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import { isIosDevice, isIosSafari } from "@/lib/mobile";

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  }
}

const DISMISS_KEY = "dkm_install_prompt_dismissed_v1";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const showIosHint = useMemo(
    () => !installed && !dismissed && !deferredPrompt && isIosDevice(),
    [dismissed, deferredPrompt, installed],
  );

  const showInstallCard = !installed && !dismissed && Boolean(deferredPrompt);

  if (!showInstallCard && !showIosHint) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="fixed inset-x-0 bottom-24 z-30 px-4">
      <div className="mx-auto max-w-[520px] rounded-[24px] border border-primary/10 bg-card/96 p-4 shadow-[0_18px_46px_rgba(15,23,42,0.14)] backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
              Install App
            </div>
            <div className="mt-1 text-base font-black tracking-tight text-foreground">
              Simpan Mushola di layar utama
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Buka lebih cepat seperti aplikasi, langsung dari home screen HP.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition hover:bg-muted"
            aria-label="Tutup prompt install"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          {showInstallCard && (
            <button
              type="button"
              onClick={handleInstall}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-[0_10px_22px_rgba(22,101,52,0.22)] transition hover:brightness-105 active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              Install Sekarang
            </button>
          )}

          {showIosHint && (
            <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              <Share2 className="h-4 w-4" />
              {isIosSafari()
                ? "Di iPhone Safari: tekan Share lalu Add to Home Screen"
                : "Di iPhone: buka dulu lewat Safari, lalu Share > Add to Home Screen"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
