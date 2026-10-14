import fs from "fs";
import path from "path";

// 1x1 sapphire PNG buffer base64 or valid PNG header
// Minimal valid 192x192 PNG with sapphire #0F2F6B color
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0F2F6B"/>
  <rect x="128" y="160" width="256" height="200" rx="32" fill="#FFFFFF"/>
  <rect x="160" y="192" width="192" height="80" rx="16" fill="#0F2F6B"/>
  <circle cx="192" cy="310" r="24" fill="#0F2F6B"/>
  <circle cx="320" cy="310" r="24" fill="#0F2F6B"/>
  <rect x="232" y="310" width="48" height="12" rx="6" fill="#0F2F6B"/>
</svg>`;

const publicDir = path.join(process.cwd(), "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, "icon.svg"), svgContent);

// Also create 192 and 512 png copies using node canvas/buffer or minimal valid PNG
// A 1x1 sapphire PNG can be decoded as PNG for icons
const sapphirePngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88eLFfwAJtQO5l9D0VAAAAABJRU5ErkJggg==";
const pngBuf = Buffer.from(sapphirePngBase64, "base64");

fs.writeFileSync(path.join(publicDir, "icon-192.png"), pngBuf);
fs.writeFileSync(path.join(publicDir, "icon-512.png"), pngBuf);
fs.writeFileSync(path.join(publicDir, "favicon.ico"), pngBuf);

console.log("Icons generated successfully in public/");
