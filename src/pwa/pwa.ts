// Service worker, update prompt, install UX and offline banner. Owner: Rowan.
function safeGet(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } }
function safeSet(key: string, v: string) { try { localStorage.setItem(key, v); } catch { /* ignore */ } }

export function isStandalone(): boolean {
  return matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}
export function isIOS(ua = navigator.userAgent, maxTouch = navigator.maxTouchPoints): boolean {
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && maxTouch > 1);
}

export function setupOfflineBanner(): void {
  const banner = document.getElementById("offline-banner");
  if (!banner) return;
  const update = () => { banner.hidden = navigator.onLine !== false; };
  addEventListener("online", update);
  addEventListener("offline", update);
  update();
}

export function setupInstall(): void {
  const btn = document.getElementById("install-btn") as HTMLButtonElement | null;
  const tip = document.getElementById("ios-tip");
  if (isStandalone()) return;
  let deferred: (Event & { prompt(): Promise<void>; userChoice: Promise<unknown> }) | null = null;
  addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as typeof deferred;
    if (btn) btn.hidden = false;
  });
  btn?.addEventListener("click", async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    deferred = null;
    btn.hidden = true;
  });
  addEventListener("appinstalled", () => { if (btn) btn.hidden = true; });

  if (tip && isIOS() && safeGet("trivia.iosTipDismissed") !== "1") {
    tip.hidden = false;
    tip.querySelector("button")?.addEventListener("click", () => {
      tip.hidden = true;
      safeSet("trivia.iosTipDismissed", "1");
    });
  }
}

export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;
  const banner = document.getElementById("update-banner");
  // Reload only after the user taps Reload. The first install also fires controllerchange
  // (clients.claim), and that must not reload the page under the player.
  let userAskedReload = false;
  const showUpdate = (worker: ServiceWorker) => {
    if (!banner) return;
    banner.hidden = false;
    banner.querySelector("button")?.addEventListener("click", () => {
      userAskedReload = true;
      worker.postMessage("SKIP_WAITING");
    }, { once: true });
  };
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!userAskedReload) return;
    userAskedReload = false;
    location.reload();
  });
  addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const w = reg.installing;
        w?.addEventListener("statechange", () => {
          if (w.state === "installed" && navigator.serviceWorker.controller) showUpdate(w);
        });
      });
      navigator.storage?.persist?.().catch(() => {});
    } catch { /* no worker: the app still works online */ }
  });
}

export function setupPwa(): void {
  setupOfflineBanner();
  setupInstall();
  registerServiceWorker();
}
