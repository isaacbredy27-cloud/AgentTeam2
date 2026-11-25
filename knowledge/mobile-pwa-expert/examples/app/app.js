// Register the service worker and wire install UI for Android (prompt) and iOS (instructions).
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

const status = document.getElementById("status");
addEventListener("offline", () => { status.textContent = "You are offline. New questions need a connection."; });
addEventListener("online", () => { status.textContent = "Back online. Pick a topic to start."; });
if (!navigator.onLine) status.textContent = "You are offline. New questions need a connection.";

let deferredPrompt = null;
const installBtn = document.getElementById("install");
addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice; // { outcome: 'accepted' | 'dismissed' }
  deferredPrompt = null;
  installBtn.hidden = true;
});

const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
let tipDismissed = false;
try { tipDismissed = localStorage.getItem("iosTipDismissed") === "1"; } catch {}
if (isIOS && !standalone && !tipDismissed) document.getElementById("ios-tip").hidden = false;
