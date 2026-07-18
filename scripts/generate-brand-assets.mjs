import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const pathFromModule = (relativePath) => fileURLToPath(new URL(relativePath, import.meta.url));
const symbolSvg = await readFile(pathFromModule("../public/brand/bogunon-symbol.svg"));
const simplifiedSymbolSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#fff"/><path fill="#3FB7A7" d="M151 112h112c75 0 116 28 116 83 0 34-19 59-52 70 42 9 66 37 66 76 0 64-49 95-132 95H151a34 34 0 0 1-34-34V146a34 34 0 0 1 34-34Zm38 57v72h69c31 0 47-12 47-36 0-25-17-36-51-36h-65Zm0 126v84h73c38 0 57-14 57-42 0-29-20-42-61-42h-69Z"/></svg>`);
const wordmarkSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="520" height="120" viewBox="0 0 520 120"><rect width="520" height="120" fill="transparent"/><text x="4" y="91" font-family="Arial,sans-serif" font-size="80" font-weight="700" letter-spacing="4"><tspan fill="#243247">BOGUN</tspan><tspan fill="#F07F8C">O</tspan><tspan fill="#5CCFBE">N</tspan></text></svg>`);

await mkdir(pathFromModule("../public/brand/"), { recursive: true });
await sharp(symbolSvg).resize(512, 512).png().toFile(pathFromModule("../public/brand/bogunon-symbol.png"));
await sharp(wordmarkSvg).png().toFile(pathFromModule("../public/brand/bogunon-wordmark.png"));

const symbol = await sharp(symbolSvg).resize(168, 168).png().toBuffer();
const wordmark = await sharp(wordmarkSvg).resize({ width: 308 }).png().toBuffer();
const logoCanvas = sharp({ create: { width: 520, height: 192, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0 } } });
await logoCanvas.composite([{ input: symbol, left: 0, top: 12 }, { input: wordmark, left: 196, top: 58 }]).png().toFile(pathFromModule("../public/brand/bogunon-logo.png"));

async function createIcon(size, destination, inset) {
  const inner = Math.round(size * (1 - inset * 2));
  const icon = await sharp(symbolSvg).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 244, g: 251, b: 249, alpha: 1 } } })
    .composite([{ input: icon, left: Math.round((size - inner) / 2), top: Math.round((size - inner) / 2) }])
    .png()
    .toFile(destination);
}

await createIcon(192, pathFromModule("../public/icon-192.png"), 0.08);
await createIcon(512, pathFromModule("../public/icon-512.png"), 0.08);
await createIcon(192, pathFromModule("../public/icon-maskable-192.png"), 0.2);
await createIcon(512, pathFromModule("../public/icon-maskable-512.png"), 0.2);
await createIcon(180, pathFromModule("../public/apple-touch-icon.png"), 0.08);
await createIcon(512, pathFromModule("../app/icon.png"), 0.08);
await createIcon(180, pathFromModule("../app/apple-icon.png"), 0.08);

const faviconSizes = [16, 32, 48];
const faviconImages = await Promise.all(faviconSizes.map((size) => sharp(simplifiedSymbolSvg).resize(size, size).png().toBuffer()));
await Promise.all(faviconImages.map((image, index) => writeFile(pathFromModule(`../public/favicon-${faviconSizes[index]}.png`), image)));
const directorySize = 6 + faviconImages.length * 16;
const header = Buffer.alloc(directorySize);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(faviconImages.length, 4);
let offset = directorySize;
faviconImages.forEach((image, index) => {
  const entry = 6 + index * 16;
  const size = faviconSizes[index];
  if (!size) throw new Error("Favicon size is required.");
  header.writeUInt8(size, entry);
  header.writeUInt8(size, entry + 1);
  header.writeUInt8(0, entry + 2);
  header.writeUInt8(0, entry + 3);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(image.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});
await writeFile(pathFromModule("../app/favicon.ico"), Buffer.concat([header, ...faviconImages]));
