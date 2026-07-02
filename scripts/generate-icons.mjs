// Генерация PNG-иконок без внешних зависимостей (штанга на тёмном фоне с сиянием).
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

// ── CRC32 ──
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function drawIcon(size, maskable) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;

  // геометрия штанги
  const barH = size * 0.09;
  const barX0 = size * 0.26;
  const barX1 = size * 0.74;
  const plateW = size * 0.075;
  const plateH = size * 0.34;
  const plate2H = size * 0.22;
  const innerGap = size * 0.02;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;

      // фон: вертикальный градиент
      const t = y / size;
      let r = lerp(14, 6, t);
      let g = lerp(20, 8, t);
      let b = lerp(32, 15, t);

      // сияние по центру
      const d = Math.hypot(x - cx, y - cy) / (size * 0.55);
      const glow = Math.max(0, 1 - d);
      r = lerp(r, 59, glow * 0.35);
      g = lerp(g, 130, glow * 0.35);
      b = lerp(b, 246, glow * 0.35);

      // штанга: гриф (светлый)
      const inBar = x >= barX0 && x <= barX1 && Math.abs(y - cy) <= barH / 2;
      // блины (акцентные)
      const inPlateL =
        x >= barX0 - plateW && x < barX0 && Math.abs(y - cy) <= plateH / 2;
      const inPlateR =
        x > barX1 && x <= barX1 + plateW && Math.abs(y - cy) <= plateH / 2;
      const inPlateL2 =
        x >= barX0 - plateW * 2 - innerGap &&
        x < barX0 - plateW - innerGap &&
        Math.abs(y - cy) <= plate2H / 2;
      const inPlateR2 =
        x > barX1 + plateW + innerGap &&
        x <= barX1 + plateW * 2 + innerGap &&
        Math.abs(y - cy) <= plate2H / 2;

      if (inBar) {
        r = 235; g = 240; b = 248;
      } else if (inPlateL || inPlateR) {
        r = 59; g = 130; b = 246;
      } else if (inPlateL2 || inPlateR2) {
        r = 96; g = 165; b = 250;
      }

      buf[i] = r;
      buf[i + 1] = g;
      buf[i + 2] = b;
      buf[i + 3] = 255;
    }
  }
  return encodePNG(size, size, buf);
}

const targets = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "maskable-512.png", size: 512, maskable: true },
  { name: "apple-touch-icon.png", size: 180 },
];

for (const t of targets) {
  const png = drawIcon(t.size, !!t.maskable);
  writeFileSync(join(outDir, t.name), png);
  console.log(`✓ ${t.name} (${t.size}px, ${png.length} bytes)`);
}

// apple-touch в корень public тоже (iOS ищет /apple-touch-icon.png)
writeFileSync(join(__dirname, "..", "public", "apple-touch-icon.png"), drawIcon(180, false));
console.log("✓ public/apple-touch-icon.png");
