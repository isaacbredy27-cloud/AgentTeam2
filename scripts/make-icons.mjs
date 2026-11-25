// Render the app icon SVG to PNGs with headless Chromium. Run: npm run icons
// Design: Sable. Sizes and maskable safe zone: Rowan (doc 02).
import { chromium } from "@playwright/test";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const out = new URL("../public/icons/", import.meta.url).pathname;
mkdirSync(out, { recursive: true });

// scale < 1 keeps the glyph inside the maskable safe zone (inner 80%).
const svg = ({ rounded, scale }) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2563eb"/><stop offset="1" stop-color="#4c1d95"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.45"/><stop offset="1" stop-color="#ffffff" stop-opacity="0.08"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${rounded ? 112 : 0}" fill="url(#bg)"/>
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <circle cx="256" cy="256" r="178" fill="url(#sheen)" stroke="#ffffff" stroke-opacity="0.55" stroke-width="6"/>
    <path d="M190 206 C190 160 222 132 258 132 C296 132 324 158 324 194 C324 228 300 242 280 256 C264 268 256 280 256 304"
      fill="none" stroke="#ffffff" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="256" cy="378" r="27" fill="#ffffff"/>
  </g>
</svg>`;

const targets = [
  ["icon-192.png", 192, { rounded: false, scale: 1 }],
  ["icon-512.png", 512, { rounded: false, scale: 1 }],
  ["icon-maskable-512.png", 512, { rounded: false, scale: 0.78 }],
  ["apple-touch-icon-180.png", 180, { rounded: false, scale: 0.9 }],
  ["favicon-32.png", 32, { rounded: true, scale: 1.05 }],
];

const exe = undefined;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage();
for (const [file, size, opts] of targets) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{width:${size}px;height:${size}px;display:block}</style>${svg(opts)}`);
  writeFileSync(out + file, await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } }));
  console.log("wrote", file);
}
writeFileSync(out + "icon.svg", svg({ rounded: true, scale: 1 }).trim() + "\n");
await browser.close();
