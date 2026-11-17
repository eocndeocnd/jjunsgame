// ============================================================
//  cut-sheets.js — 이미지 AI 로 뽑은 장비 시트(3×3)를 칸마다 잘라 assets/items/<id>.png 로 만듭니다.
//
//    node tools/cut-sheets.js            design/images/sheets/ 에 있는 시트를 모두 자름 (이미 있는 그림은 건너뜀)
//    node tools/cut-sheets.js --force    이미 있는 그림도 다시 자름
//    node tools/cut-sheets.js --preview <out.png>   자른 것을 어두운 · 밝은 바탕에 늘어놓은 확인용 그림도 만듦
//
//  · 칸 선으로 자르지 않고 물건 덩어리의 가운데가 든 칸으로 나눕니다 (옆 칸으로 넘어간 끝도 제 물건과 같이)
//  · 어느 칸이 어느 장비인지는 design/images/prompts/sheets.json (node tools/cli.js images 가 뽑음)
//  · 배경은 자홍색(#FF00FF) — 칸 네 귀퉁이에서 실제 배경색을 재서 걷어내고, 가장자리는 배경색을 빼서 분홍 테가 남지 않게 합니다
//  · 물건만 잘라 256×256 가운데에 (여백 약 10%). 줄일 때는 넓이 평균 — 도트가 뭉개지지 않게 정수 배 근처면 그 배로
//  · 시트는 PNG(8비트, 인터레이스 없음). webp 는 Windows 의 그림 변환기로 바꿔 읽습니다. 패키지 없이 Node 만으로 돕니다.
//  · 제미나이의 반짝이 표시(오른쪽 아래)는 덮인 정도(tools/gemini-mark.json)로 거꾸로 풀어 걷어냅니다 — 장비 위에 겹쳐도 원래 색으로
// ============================================================
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const OUT = 256, FIT = 230;          // 그림 크기 · 그 안에서 물건이 차지할 최대 변
const SMALL_PART = 0.04;     // 칸에서 가장 큰 덩어리의 이만큼보다 작은 조각은 버림 (글자 · 부스러기)
const CLEAR = 70, SOFT = 150;        // 배경색과의 거리 — CLEAR 아래는 투명, SOFT 아래는 반투명(가장자리)

// ---------- PNG 읽기 · 쓰기 ----------
function readPng(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error(`${file} — PNG 가 아닙니다 (webp 면 PNG 로 다시 저장하세요)`);
  let p = 8, w, h, depth, ctype, inter, idat = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p), type = b.toString('ascii', p + 4, p + 8), d = b.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); depth = d[8]; ctype = d[9]; inter = d[12]; }
    else if (type === 'IDAT') idat.push(d);
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  const ch = { 2: 3, 6: 4 }[ctype];
  if (depth !== 8 || !ch || inter) throw new Error(`${file} — 8비트 RGB/RGBA, 인터레이스 없는 PNG 만 읽습니다`);
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * ch, px = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? line[x - ch] : 0, up = prev[x], c = x >= ch ? prev[x - ch] : 0;
      let v = line[x];
      if (f === 1) v += a; else if (f === 2) v += up; else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) { const q = a + up - c, pa = Math.abs(q - a), pb = Math.abs(q - up), pc = Math.abs(q - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c; }
      line[x] = v & 255;
    }
    for (let x = 0; x < w; x++) for (let k = 0; k < 4; k++) px[(y * w + x) * 4 + k] = k < ch ? line[x * ch + k] : 255;
    prev = line;
  }
  return { w, h, px };
}
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
function crc(buf) { let c = -1; for (const x of buf) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii'), len = Buffer.alloc(4), c = Buffer.alloc(4);
  len.writeUInt32BE(data.length); c.writeUInt32BE(crc(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, c]);
}
function writePng(file, { w, h, px }) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) px.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]));
}

// 시트 읽기 — PNG 는 바로, webp(이름만 .png 인 것 포함)는 Windows 의 그림 변환기(WIC)로 PNG 로 바꿔서 읽습니다
function readSheet(file) {
  const head = fs.readFileSync(file).subarray(0, 4).toString('ascii');
  if (head !== 'RIFF') return readPng(file);
  if (process.platform !== 'win32') throw new Error(`${file} — webp 입니다. PNG 로 다시 저장해 넣으세요`);
  const tmp = path.join(require('os').tmpdir(), `jjunsgame-sheet-${process.pid}.png`);
  const ps = [
    'Add-Type -AssemblyName PresentationCore',
    `$fs = [IO.File]::OpenRead('${file.replace(/'/g, "''")}')`,
    '$d = [Windows.Media.Imaging.BitmapDecoder]::Create($fs, 0, [Windows.Media.Imaging.BitmapCacheOption]::OnLoad); $fs.Close()',
    '$c = New-Object Windows.Media.Imaging.FormatConvertedBitmap($d.Frames[0], [Windows.Media.PixelFormats]::Bgra32, $null, 0)',
    '$e = New-Object Windows.Media.Imaging.PngBitmapEncoder; $e.Frames.Add([Windows.Media.Imaging.BitmapFrame]::Create($c))',
    `$o = [IO.File]::Create('${tmp}'); $e.Save($o); $o.Close()`
  ].join('; ');
  require('child_process').execFileSync('powershell', ['-NoProfile', '-Command', ps], { stdio: 'pipe' });
  try { return readPng(tmp); } finally { fs.unlinkSync(tmp); }
}

// 제미나이 표시(오른쪽 아래의 반짝이)를 걷어냅니다 — 흰색을 반투명하게 덮어 그린 것이라, 덮인 정도(tools/gemini-mark.json)를 알면 거꾸로 풀 수 있습니다.
// 장비 위에 겹쳐도 원래 색이 돌아옵니다. 자리는 그림 크기에 따라 조금씩 달라서 오른쪽 아래 근처에서 모양이 가장 잘 맞는 곳을 찾습니다. 못 찾으면 그대로.
function removeMark(img) {
  const f = path.join(__dirname, 'gemini-mark.json');
  if (!fs.existsSync(f)) return null;
  const m = JSON.parse(fs.readFileSync(f, 'utf8')), S = m.size, A = Buffer.from(m.alpha, 'base64');
  const lum = (x, y) => { const i = (y * img.w + x) * 4; return img.px[i] * 0.3 + img.px[i + 1] * 0.59 + img.px[i + 2] * 0.11; };
  let ma = 0; for (const a of A) ma += a; ma /= A.length;
  let va = 0; for (const a of A) va += (a - ma) ** 2;
  // 표시 가운데는 오른쪽 · 아래에서 약 120px (1024 · 1408 그림에서 잰 값) — 그 둘레 ±40px 에서 찾음
  const px0 = img.w - 120, py0 = img.h - 120;
  let best = null;
  for (let cy = py0 - 40; cy <= py0 + 40; cy++) for (let cx = px0 - 40; cx <= px0 + 40; cx++) {
    const x0 = cx - (S >> 1), y0 = cy - (S >> 1);
    if (x0 < 0 || y0 < 0 || x0 + S > img.w || y0 + S > img.h) continue;
    let ml = 0;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) ml += lum(x0 + x, y0 + y);
    ml /= S * S;
    let cov = 0, vl = 0;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const d = lum(x0 + x, y0 + y) - ml; cov += d * (A[y * S + x] - ma); vl += d * d; }
    const score = cov / Math.sqrt(va * vl || 1);
    if (!best || score > best.score) best = { score, x0, y0 };
  }
  if (!best || best.score < 0.35) return null;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const a = A[y * S + x] / 255;
    if (a <= 0) continue;
    const i = ((best.y0 + y) * img.w + best.x0 + x) * 4;
    for (let k = 0; k < 3; k++) img.px[i + k] = Math.max(0, Math.min(255, Math.round((img.px[i + k] - a * 255) / (1 - a))));
  }
  return best;
}

// 칸 테두리 지우기 — 이미지 AI 가 칸마다 선을 그어 오는 일이 있습니다. 선이 모든 칸을 하나로 이어 버려서, 칸 경계 근처에서
// 위에서 아래까지(또는 왼쪽에서 오른쪽까지) 거의 다 배경이 아닌 줄을 찾아 배경색으로 칠합니다. 선이 없으면 아무것도 안 함. 지운 줄 수
function removeGridLines(img, cols, rows) {
  // 배경색 — 자홍빛(빨강 · 파랑이 높고 초록이 낮은) 픽셀의 중앙값
  const rs = [], gs = [], bs = [];
  for (let i = 0; i < img.px.length; i += 4 * 97) { const r = img.px[i], g = img.px[i + 1], b = img.px[i + 2]; if (r > 170 && b > 170 && g < 110) { rs.push(r); gs.push(g); bs.push(b); } }
  if (!rs.length) return 0;
  const med = a => a.sort((x, y) => x - y)[a.length >> 1], key = [med(rs), med(gs), med(bs)];
  const isBg = i => Math.hypot(img.px[i] - key[0], img.px[i + 1] - key[1], img.px[i + 2] - key[2]) <= SOFT;
  const paint = i => { img.px[i] = key[0]; img.px[i + 1] = key[1]; img.px[i + 2] = key[2]; };
  let n = 0;
  const near = (v, size, parts) => { for (let k = 0; k <= parts; k++) if (Math.abs(v - k * size / parts) <= 14) return true; return false; };
  for (let x = 0; x < img.w; x++) {
    if (!near(x, img.w, cols)) continue;
    let fg = 0; for (let y = 0; y < img.h; y++) if (!isBg((y * img.w + x) * 4)) fg++;
    if (fg > img.h * 0.6) { for (let y = 0; y < img.h; y++) paint((y * img.w + x) * 4); n++; }
  }
  for (let y = 0; y < img.h; y++) {
    if (!near(y, img.h, rows)) continue;
    let fg = 0; for (let x = 0; x < img.w; x++) if (!isBg((y * img.w + x) * 4)) fg++;
    if (fg > img.w * 0.6) { for (let x = 0; x < img.w; x++) paint((y * img.w + x) * 4); n++; }
  }
  return n;
}

// ---------- 한 칸 ----------
// 칸(x0, y0, cw, ch) → 배경을 걷어낸 RGBA (칸 크기)
function keyCell(img, x0, y0, cw, chh) {
  // 배경색 — 네 귀퉁이 8×8 의 중앙값
  const sample = [];
  for (const [cx, cy] of [[0, 0], [cw - 8, 0], [0, chh - 8], [cw - 8, chh - 8]])
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const i = ((y0 + cy + y) * img.w + x0 + cx + x) * 4; sample.push([img.px[i], img.px[i + 1], img.px[i + 2]]); }
  const key = [0, 1, 2].map(k => sample.map(s => s[k]).sort((a, b) => a - b)[sample.length >> 1]);
  const out = Buffer.alloc(cw * chh * 4);
  for (let y = 0; y < chh; y++) for (let x = 0; x < cw; x++) {
    const i = ((y0 + y) * img.w + x0 + x) * 4, o = (y * cw + x) * 4;
    const r = img.px[i], g = img.px[i + 1], b = img.px[i + 2];
    const d = Math.hypot(r - key[0], g - key[1], b - key[2]);
    let a = d <= CLEAR ? 0 : d >= SOFT ? 1 : (d - CLEAR) / (SOFT - CLEAR);
    // 자홍빛이 도는 가장자리(초록이 빨강 · 파랑보다 한참 낮음)만 반투명으로 — 물건 안의 보라 · 분홍은 그대로
    if (a > 0 && a < 1 && !(g < Math.min(r, b) - 40)) a = 1;
    if (a === 0) continue;
    // 배경색을 빼냄: 보이는 색 = a × 물건 + (1 − a) × 배경
    const un = (v, k) => Math.max(0, Math.min(255, Math.round((v - (1 - a) * key[k]) / a)));
    out[o] = un(r, 0); out[o + 1] = un(g, 1); out[o + 2] = un(b, 2); out[o + 3] = Math.round(a * 255);
  }
  // 작은 티끌(이웃과 이어지지 않은 30픽셀 미만 덩어리)은 지움
  const seen = new Uint8Array(cw * chh), comps = [];
  for (let s = 0; s < cw * chh; s++) {
    if (seen[s] || !out[s * 4 + 3]) continue;
    const q = [s]; seen[s] = 1;
    for (let k = 0; k < q.length; k++) {
      const j = q[k], x = j % cw, y = (j / cw) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, n = ny * cw + nx;
        if (nx < 0 || ny < 0 || nx >= cw || ny >= chh || seen[n] || !out[n * 4 + 3]) continue;
        seen[n] = 1; q.push(n);
      }
    }
    if (q.length < 30) for (const j of q) out[j * 4 + 3] = 0;
    else comps.push(q);
  }
  return { w: cw, h: chh, px: out, key, comps };
}

// 시트를 칸으로 — 칸 선으로 자르지 않고, 물건 덩어리마다 「가운데가 어느 칸에 있나」로 나눕니다.
// 시트가 정사각이 아니거나 물건이 커서 옆 칸으로 넘어가도, 넘어간 끝이 옆 칸 그림에 묻지 않고 제 물건과 같이 잘립니다.
// → 칸마다 { w, h, px, edge } (그 칸 덩어리들을 감싸는 네모만큼)
function splitSheet(img, cols, rows) {
  const all = keyCell(img, 0, 0, img.w, img.h), cw = img.w / cols, chh = img.h / rows;
  const groups = Array.from({ length: cols * rows }, () => []);
  for (const q of all.comps) {
    let sx = 0, sy = 0;
    for (const j of q) { sx += j % img.w; sy += (j / img.w) | 0; }
    const c = Math.min(cols - 1, Math.floor(sx / q.length / cw)), r = Math.min(rows - 1, Math.floor(sy / q.length / chh));
    groups[r * cols + c].push(q);
  }
  return groups.map(list => {
    // 한 칸에서 가장 큰 덩어리의 SMALL_PART 배보다 작은 조각은 버립니다 — 이미지 AI 가 장비 밑에 써 넣은 글자(이름) · 부스러기.
    // 짝으로 그린 장갑 · 신발처럼 큰 덩어리 둘은 그대로 남습니다
    const big = Math.max(0, ...list.map(q => q.length));
    list = list.filter(q => q.length >= big * SMALL_PART);
    // 가장 큰 덩어리보다 통째로 아래에 있는 작은 조각(그 크기의 1/4 미만)도 버림 — 장비 밑에 써 넣은 이름은 글자가 붙어 커지기도 해서
    const main = list.find(q => q.length === big);
    const topOf = q => { let t = Infinity; for (const j of q) t = Math.min(t, (j / img.w) | 0); return t; };
    if (main) {
      let bottom = 0; for (const j of main) bottom = Math.max(bottom, (j / img.w) | 0);   // (펼쳐 넘기면 큰 덩어리에서 넘침)
      const botOf = q => { let b = 0; for (const j of q) b = Math.max(b, (j / img.w) | 0); return b; };
      let top = Infinity; for (const j of main) top = Math.min(top, (j / img.w) | 0);
      // 위쪽도 — 칸 위에 써 넣은 부위 이름 · 장비 이름
      list = list.filter(q => q === main || q.length >= big / 4 || (topOf(q) < bottom - 4 && botOf(q) > top + 4));
    }
    if (!list.length) return null;
    let x0 = img.w, y0 = img.h, x1 = 0, y1 = 0;
    for (const q of list) for (const j of q) { const x = j % img.w, y = (j / img.w) | 0; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const w = x1 - x0 + 3, h = y1 - y0 + 3, px = Buffer.alloc(w * h * 4);
    for (const q of list) for (const j of q) {
      const x = j % img.w, y = (j / img.w) | 0;
      all.px.copy(px, ((y - y0 + 1) * w + x - x0 + 1) * 4, j * 4, j * 4 + 4);
    }
    return { w, h, px, edge: x0 <= 1 || y0 <= 1 || x1 >= img.w - 2 || y1 >= img.h - 2 };
  });
}

// 물건만 잘라 OUT×OUT 가운데에 — 넓이 평균으로 줄임 (알파를 곱한 색으로 섞어 가장자리가 어두워지지 않게)
function fitIcon(cell) {
  let x0 = cell.w, y0 = cell.h, x1 = -1, y1 = -1;
  for (let y = 0; y < cell.h; y++) for (let x = 0; x < cell.w; x++) if (cell.px[(y * cell.w + x) * 4 + 3]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  if (x1 < 0) return null;
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, s = Math.min(1, FIT / Math.max(bw, bh));
  const dw = Math.max(1, Math.round(bw * s)), dh = Math.max(1, Math.round(bh * s));
  const ox = (OUT - dw) >> 1, oy = (OUT - dh) >> 1, px = Buffer.alloc(OUT * OUT * 4);
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
    const sx0 = x0 + x / s, sx1 = x0 + (x + 1) / s, sy0 = y0 + y / s, sy1 = y0 + (y + 1) / s;
    let r = 0, g = 0, b = 0, a = 0, area = 0;
    for (let yy = Math.floor(sy0); yy < Math.ceil(sy1); yy++) for (let xx = Math.floor(sx0); xx < Math.ceil(sx1); xx++) {
      const wgt = (Math.min(xx + 1, sx1) - Math.max(xx, sx0)) * (Math.min(yy + 1, sy1) - Math.max(yy, sy0));
      if (wgt <= 0 || xx > x1 || yy > y1) continue;
      const i = (yy * cell.w + xx) * 4, al = cell.px[i + 3] / 255;
      r += cell.px[i] * al * wgt; g += cell.px[i + 1] * al * wgt; b += cell.px[i + 2] * al * wgt; a += al * wgt; area += wgt;
    }
    const o = ((oy + y) * OUT + ox + x) * 4;
    if (!a) continue;
    px[o] = Math.round(r / a); px[o + 1] = Math.round(g / a); px[o + 2] = Math.round(b / a); px[o + 3] = Math.round(a / area * 255);
  }
  return { img: { w: OUT, h: OUT, px }, size: [bw, bh] };
}

// 확인용 — 자른 아이콘을 어두운 줄 · 밝은 줄에 늘어놓음 (128px 로 줄여서)
function preview(file, icons) {
  const S = 128, n = icons.length, cols = Math.min(n, 9), rows = Math.ceil(n / cols), W = cols * S, H = rows * S * 2, px = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dark = ((y / S) | 0) % 2 === 0, o = (y * W + x) * 4, v = dark ? 40 : 225, chk = ((x >> 3) + (y >> 3)) & 1;
    px[o] = px[o + 1] = px[o + 2] = v + (chk ? 8 : 0); px[o + 3] = 255;
  }
  icons.forEach((ic, k) => {
    const cx = (k % cols) * S, cy = ((k / cols) | 0) * S * 2;
    for (const band of [0, S]) for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const i = ((y * 2) * OUT + x * 2) * 4, a = ic.px[i + 3] / 255, o = ((cy + band + y) * W + cx + x) * 4;
      for (let c = 0; c < 3; c++) px[o + c] = Math.round(ic.px[i + c] * a + px[o + c] * (1 - a));
    }
  });
  writePng(file, { w: W, h: H, px });
}

// ---------- 돌리기 ----------
if (require.main === module) {
  const args = process.argv.slice(2), force = args.includes('--force'), pv = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
  const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'design/images/prompts/sheets.json'), 'utf8'));
  const made = [];
  let cut = 0, skipped = 0, sheets = 0;
  for (const sh of index) {
    const file = path.join(ROOT, sh.sheet);
    if (!fs.existsSync(file)) continue;
    sheets++;
    const img = readSheet(file), [cols, rows] = sh.grid;
    const mark = removeMark(img);
    if (mark) console.log(`  ${sh.sheet} — 제미나이 표시를 걷어냄 (오른쪽 아래, 맞음 ${mark.score.toFixed(2)})`);
    const lines = removeGridLines(img, cols, rows);
    if (lines) console.log(`  ${sh.sheet} — 칸 테두리 선 ${lines}줄을 지움`);
    const cells = splitSheet(img, cols, rows);
    sh.cells.forEach((c, k) => {
      const out = path.join(ROOT, c.file);
      if (fs.existsSync(out) && !force) { skipped++; return; }
      const fit = cells[k] && fitIcon(cells[k]);
      if (!fit) { console.log(`  ⚠ ${sh.sheet} ${k + 1}칸 (${c.name}) — 비어 있음 (물건이 옆 칸 쪽으로 쏠렸거나 하나로 붙었을 수 있음)`); return; }
      if (cells[k].edge) console.log(`  ⚠ ${sh.sheet} ${k + 1}칸 (${c.name}) — 물건이 시트 가장자리에 닿음 (잘렸을 수 있음)`);
      writePng(out, fit.img);
      made.push(fit.img); cut++;
    });
  }
  if (pv && made.length) preview(pv, made);
  writeArtList();
  console.log(`시트 ${sheets}장 → 장비 그림 ${cut}개를 잘랐습니다${skipped ? ` (이미 있어 건너뜀 ${skipped}개 — 다시 자르려면 --force)` : ''}`);
}

// 게임이 읽는 그림 목록 — assets/items 에 그림이 있는 장비 id → 경로 (js/itemart.js, 자동 생성).
// 경로를 글자 그대로 적어 두면 한 파일 빌드(build.py)가 그림을 data: 주소로 바꿔 넣습니다.
function writeArtList() {
  const dir = path.join(ROOT, 'assets/items');
  const ids = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /\.png$/.test(f)).map(f => f.slice(0, -4)).sort() : [];
  const body = ids.map(id => `  '${id}': 'assets/items/${id}.png'`).join(',\n');
  fs.writeFileSync(path.join(ROOT, 'js/itemart.js'),
    '// 자동으로 만든 파일입니다 (node tools/cut-sheets.js) — 손으로 고치지 마세요.\n'
    + '// 그림이 있는 장비 → 그림 경로. 여기 없는 장비는 이모티콘(fromIcon)으로 그립니다 (ui.js 의 itemArt).\n'
    + `const ITEM_ART = {\n${body}\n};\n`, 'utf8');
  console.log(`js/itemart.js — 그림 있는 장비 ${ids.length}개`);
}

module.exports = { readPng, readSheet, removeMark, writePng, keyCell, splitSheet, fitIcon, writeArtList };
