// ============================================================
//  동료 생김새 — 부위(피부 · 눈 · 입 · 얼굴 표시 · 머리 · 옷)를 코드로 그려 겹쳐 그림
//
//    rollLook(seed)        → 생김새(작은 객체 — 저장에 그대로 넣을 수 있음)
//    drawLook(look, view)  → 32×40 RGBA (view: 'front' 앞 · 'back' 뒤)
//
//  주인공 그림(design/hero, 한 칸 32×40)과 같은 몸 비율 — 머리가 크고, 발은 36줄, 37줄은 테두리.
//  머리 · 옷은 손으로 찍은 몇 장을 바꿔 끼우는 게 아니라 모양 조건(앞머리 · 옆머리 · 뒷머리 · 묶음 / 윗옷 · 아래옷 · 걸칠 것)을
//  조합해 그리므로, 색까지 곱하면 경우의 수가 아주 많음. 빛은 왼쪽 위.
//  node 와 브라우저 둘 다에서 씀 (게임에 넣을 때 js/ 로 옮김).
// ============================================================
(function (root) {
'use strict';
const W = 32, H = 40;

// ---------- 색 ----------
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgb2hex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
function rgb2hsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hsl2rgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const f = n => { const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); };
  return [f(0), f(8), f(4)];
}
// 기준색(2단계) → 0(가장 어두움) ~ 4(가장 밝음). 어두운 쪽은 푸른 보라로, 밝은 쪽은 노랑으로 틂 (design/mobs/lib2.js 와 같은 방식)
function ramp(base, step = 0.1) {
  const [h, s, l] = rgb2hsl(hex2rgb(base));
  const toward = (from, to, amt) => { const d = ((to - from + 540) % 360) - 180; return from + Math.sign(d) * Math.min(Math.abs(d), amt); };
  return [-2, -1, 0, 1, 2].map(k => {
    const hh = s < 0.06 ? h : k < 0 ? toward(h, 250, 12 * -k) : k > 0 ? toward(h, 55, 10 * k) : h;
    const ss = Math.min(1, s * (k < 0 ? 1 + 0.1 * -k : 1 - 0.07 * k));
    const ll = Math.max(0.05, Math.min(0.9, l + step * k * (k > 0 ? 0.85 : 1.1)));
    return rgb2hex(hsl2rgb(hh, ss, ll));
  });
}
const mix = (a, b, t) => rgb2hex(hex2rgb(a).map((v, i) => v + (hex2rgb(b)[i] - v) * t));

// ---------- 고를 수 있는 것 (이름은 미리보기 · 디버그용) ----------
const SKINS = [['아주 흰', '#f2d3c0'], ['흰', '#e8b996'], ['구릿빛', '#cf9a72'], ['갈색', '#a66e4c'], ['짙은 갈색', '#6e4632']];
const HAIR_COLORS = [['검정', '#2b2530', 4], ['짙은 갈색', '#4c3429', 4], ['갈색', '#7a5236', 2], ['금발', '#cfa955', 1], ['빨강', '#a3402e', 1], ['은색', '#a9adbb', 1],
  ['파랑', '#3b5796', 1], ['분홍', '#c97a98', 1], ['청록', '#367f78', 1], ['보라', '#644690', 1], ['흰색', '#dcd6cc', 1], ['주황', '#c0682c', 1]];
const EYE_COLORS = [['갈색', '#6a4430', 3], ['검정', '#2e2630', 3], ['파랑', '#3f6fb0', 1], ['초록', '#4a8a4a', 1], ['빨강', '#b03a3a', 1], ['금색', '#c99a2e', 1], ['보라', '#7a4ab0', 1], ['회색', '#7a8088', 1]];
const CLOTH_COLORS = [['검정', '#2e2b33'], ['먹색', '#4a4852'], ['남색', '#2f3b5e'], ['흰색', '#d6d2c8'], ['빨강', '#963434'], ['국방', '#5a6238'], ['베이지', '#a08a60'], ['밤색', '#6a4a32'],
  ['자주', '#5c3a6c'], ['청록', '#2f6a6a'], ['겨자', '#b38c2e'], ['하늘', '#6888ae'], ['와인', '#6a2a3c'], ['숲', '#2f5a3c']];
const SHOES = [['검정', '#2a2730'], ['흰색', '#d8d4cc'], ['갈색', '#5e4030'], ['남색', '#34425e']];
const BANGS = ['messy', 'straight', 'parted', 'side', 'spiky', 'short'];
const BANGS_KO = { messy: '덥수룩', straight: '일자', parted: '가르마', side: '옆으로', spiky: '삐죽', short: '이마 보임' };
const SIDES = [['short', 16, '귀 보임'], ['ear', 19, '귀 덮음'], ['cheek', 22, '볼까지'], ['chin', 25, '턱까지']];
const BACKS = [['none', 0, '없음', 5], ['shoulder', 28, '어깨까지', 2], ['long', 32, '길게', 2]];
const TIES = [['none', '없음', 6], ['ponytail', '포니테일', 2], ['twin', '양갈래', 1], ['bun', '올림머리', 1], ['ahoge', '바보털', 2], ['spikes', '뻗친 정수리', 1]];
const EYES = {   // 왼눈(x 10~12)과 오른눈(x 19~21)에 같은 모양을 옮겨 찍음 — 두 눈이 같은 곳을 봄. 줄은 y 17 부터. k 속눈썹 · i 눈동자 · j 밝은 눈동자 · h 빛
  round:  ['...', 'kkk', 'hii', 'iji'],
  sharp:  ['...', '...', 'kkk', 'hij'],
  sleepy: ['...', '...', 'kkk', 'iij'],
  big:    ['kkk', 'hii', 'iii', 'jjj'],
  dot:    ['...', '...', '.k.', '.k.'],
  smile:  ['...', '...', '.k.', 'k.k']
};
const EYES_KO = { round: '둥근', sharp: '날카로운', sleepy: '졸린', big: '큰', dot: '점', smile: '웃는' };
const MOUTHS = ['small', 'line', 'open', 'none'];
const MARKS = [['none', 10], ['blush', 2], ['scar', 1], ['bandage', 1], ['mole', 1]];
const TOPS = ['tee', 'long', 'hoodie', 'jacket', 'suit', 'robe', 'armor', 'dobok', 'sleeveless'];
const TOPS_KO = { tee: '반팔', long: '긴팔', hoodie: '후드', jacket: '재킷', suit: '정장', robe: '로브', armor: '갑옷', dobok: '도복', sleeveless: '민소매' };
const BOTTOMS = [['pants', 6], ['shorts', 1], ['skirt', 2]];
const EXTRAS = [['none', 5], ['scarf', 1], ['belt', 2], ['strap', 1], ['cape', 1]];

// ---------- 무작위 ----------
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pickI = (r, n) => Math.floor(r() * n);
function wpickI(r, list, wi) { const tot = list.reduce((s, x) => s + x[wi], 0); let v = r() * tot; for (let i = 0; i < list.length; i++) { v -= list[i][wi]; if (v < 0) return i; } return list.length - 1; }

function rollLook(seed) {
  const r = rng(seed);
  const top = TOPS[pickI(r, TOPS.length)];
  let c1 = pickI(r, CLOTH_COLORS.length), c2 = pickI(r, CLOTH_COLORS.length), c3 = pickI(r, CLOTH_COLORS.length);
  if (c2 === c1) c2 = (c2 + 5) % CLOTH_COLORS.length;          // 위아래 같은 색은 덜 나오게
  if (c3 === c1) c3 = (c3 + 3) % CLOTH_COLORS.length;
  return {
    v: 1, seed: seed >>> 0,
    skin: pickI(r, SKINS.length),
    hc: wpickI(r, HAIR_COLORS, 2), bangs: BANGS[pickI(r, BANGS.length)], side: pickI(r, SIDES.length), back: wpickI(r, BACKS, 3), tie: wpickI(r, TIES, 2), vol: 1 + pickI(r, 2), flip: r() < 0.5,
    eye: Object.keys(EYES)[pickI(r, 6)], ec: wpickI(r, EYE_COLORS, 2), mouth: MOUTHS[pickI(r, MOUTHS.length)], mark: MARKS[wpickI(r, MARKS, 1)][0],
    top, bottom: BOTTOMS[wpickI(r, BOTTOMS, 1)][0], extra: EXTRAS[wpickI(r, EXTRAS, 1)][0], c1, c2, c3, shoe: pickI(r, SHOES.length),
    hseed: Math.floor(r() * 1e9)                                     // 머리 가닥 나눔 — 같은 머리 모양이라도 가닥이 다름
  };
}

// ---------- 그리기 판 ----------
function Canvas() {
  const px = new Array(W * H).fill(null);   // { c: '#hex', g: 무리 }
  return {
    px,
    put(x, y, c, g) { if (x >= 0 && y >= 0 && x < W && y < H && c) px[y * W + x] = { c, g }; },
    at(x, y) { return x >= 0 && y >= 0 && x < W && y < H ? px[y * W + x] : null; },
    erase(x, y) { if (x >= 0 && y >= 0 && x < W && y < H) px[y * W + x] = null; }
  };
}
const OUTLINE = '#120c13';
const LASH = '#1a1016', SHINE = '#f4eee6', MOUTH = '#6e3434', TONGUE = '#b4504c';
const METAL = ramp('#8a8e9a', 0.12), GOLD = ramp('#b08a3a', 0.11), LEATHER = ramp('#5a3e2c', 0.09), WHITE = ramp('#d8d4ca', 0.07);
const clampT = t => Math.max(0, Math.min(4, t));

// ---------- 피부 (머리 · 귀 · 손 — 옷이 드러내는 팔 · 다리는 옷이 피부색으로 그림) ----------
const SKULL = { 7: [11, 20], 8: [9, 22], 9: [8, 23], 22: [8, 23], 23: [9, 22], 24: [11, 20] };   // 그 밖의 줄(10~21)은 7~24
const skullRow = y => SKULL[y] || (y >= 10 && y <= 21 ? [7, 24] : null);
function drawSkin(cv, S, view, hideEars) {
  for (let y = 7; y <= 24; y++) {
    const [a, b] = skullRow(y);
    for (let x = a; x <= b; x++) {
      let t = x <= 9 ? 3 : x >= 22 ? 1 : 2;
      if (y >= 23) t = Math.min(t, x >= (y === 23 ? 20 : 18) ? 1 : 2);   // 턱 밑 — 그늘 경계를 22 → 20 → 18 로 비스듬히 (네모로 꺾이지 않게)
      cv.put(x, y, S[t], 'skin');
    }
  }
  if (view === 'front') {
    cv.put(10, 21, S[3], 'skin'); cv.put(11, 21, S[3], 'skin');   // 왼볼 빛
  }
  if (!hideEars) for (let y = 18; y <= 20; y++) { cv.put(6, y, S[y === 19 ? 2 : 3], 'skin'); cv.put(25, y, S[y === 19 ? 1 : 2], 'skin'); }
  if (view === 'back') for (let y = 21; y <= 25; y++) for (let x = 12; x <= 19; x++) cv.put(x, y, S[x >= 17 ? 1 : 2], 'skin');   // 목덜미
  for (let y = 31; y <= 32; y++) { cv.put(7, y, S[3], 'skin'); cv.put(8, y, S[2], 'skin'); cv.put(23, y, S[2], 'skin'); cv.put(24, y, S[1], 'skin'); }   // 손
}

// ---------- 눈 · 입 · 얼굴 표시 (앞모습만) ----------
function drawFace(cv, L, S, HC, E) {
  // 눈썹 — 머리색. 앞머리가 덮으면 머리가 위에 그려져 가려짐
  for (const x0 of [10, 19]) for (let i = 0; i < 3; i++) cv.put(x0 + i, 16, HC[0], 'face');
  const rows = EYES[L.eye];
  const col = { k: LASH, i: E[1], j: E[3], h: SHINE };
  for (const x0 of [10, 19]) rows.forEach((row, j) => [...row].forEach((ch, i) => { if (col[ch]) cv.put(x0 + i, 17 + j, col[ch], 'face'); }));
  const m = L.mouth;
  if (m === 'small') cv.put(16, 22, MOUTH, 'face');
  else if (m === 'line') { cv.put(15, 22, MOUTH, 'face'); cv.put(16, 22, MOUTH, 'face'); }
  else if (m === 'open') { cv.put(15, 22, MOUTH, 'face'); cv.put(16, 22, MOUTH, 'face'); cv.put(16, 23, TONGUE, 'face'); cv.put(15, 23, MOUTH, 'face'); }
  const k = L.mark;
  if (k === 'blush') { const p = mix(S[2], '#d05a58', 0.38); [[9, 21], [10, 21], [21, 21], [22, 21]].forEach(([x, y]) => cv.put(x, y, p, 'face')); }
  else if (k === 'scar') { cv.put(21, 21, S[0], 'face'); cv.put(22, 22, S[0], 'face'); cv.put(20, 21, S[4], 'face'); }
  else if (k === 'bandage') { [[20, 21], [21, 21], [22, 21], [20, 22], [21, 22], [22, 22]].forEach(([x, y]) => cv.put(x, y, x === 21 ? WHITE[2] : y === 22 ? WHITE[1] : WHITE[3], 'face')); }
  else if (k === 'mole') cv.put(12, 22, S[0], 'face');
}

// ---------- 머리 ----------
const CX = 15.5, CY = 14.5;
// 앞머리 가닥 — x 8~23 을 폭 2~4 의 덩어리로 나눔
function clumps(hseed) {
  const r = rng(hseed), out = [];
  let x = 8;
  while (x <= 23) { let w = 2 + pickI(r, 3); if (23 - (x + w - 1) === 1) w++; w = Math.min(w, 24 - x); out.push([x, x + w - 1, r()]); x += w; }
  return out;
}
// 앞머리 끝 (그 줄부터는 얼굴) — 얼굴 칸 x 8~23
function bangsLine(L) {
  const out = {}, cl = clumps(L.hseed), r = rng(L.hseed ^ 0x9e37);
  for (const [a, b, rv] of cl) {
    const mid = (a + b) / 2, dx = Math.abs(mid - CX);
    let base;
    switch (L.bangs) {
      case 'straight': base = 16; break;
      case 'parted':   base = Math.round(16.4 - Math.max(0, 6.5 - dx) * 0.6); break;
      case 'side':     base = Math.round(12 + ((L.flip ? 23 - mid : mid - 8) / 15) * 5); break;
      case 'spiky':    base = 15 + pickI(r, 2); break;
      case 'short':    base = 11 + pickI(r, 2); break;
      default:         base = 15 + pickI(r, 3);   // messy
    }
    for (let x = a; x <= b; x++) {
      let y = base;
      const w = b - a + 1, pos = x - a;
      if (L.bangs === 'spiky') y += (pos === Math.floor((w - 1) / 2) || pos === Math.ceil((w - 1) / 2)) ? 2 : pos === 0 || pos === w - 1 ? 0 : 1;
      else if (L.bangs === 'messy' || L.bangs === 'side' || L.bangs === 'parted') y += (pos > 0 && pos < w - 1) || w <= 2 && pos === (L.flip ? 0 : 1) ? 1 : 0;
      else if (L.bangs === 'straight') y += rv < 0.3 && pos === w - 1 ? -1 : 0;
      out[x] = Math.min(y, 18);
    }
  }
  return { line: out, clumps: cl };
}
// 머리카락이 있는 칸 → 단계(0~4)
function hairMask(L, view) {
  if (view === 'side') return hairMaskSide(L);
  const vol = L.vol, rx = 9.2 + vol * 0.9, ry = 9 + vol * 0.9;
  const sideY = SIDES[L.side][1], backY = BACKS[L.back][1], sw = 1 + vol;   // 옆머리 폭 (얼굴 밖)
  const { line, clumps: cl } = bangsLine(L);
  const m = new Map(), key = (x, y) => y * W + x;
  const add = (x, y, part) => { if (x >= 0 && y >= 0 && x < W && y < H && !m.has(key(x, y))) m.set(key(x, y), part); };
  const inEll = (x, y) => ((x + 0.5 - CX - 0.5) / rx) ** 2 + ((y - CY) / ry) ** 2 <= 1;
  const behind = new Map(); const addB = (x, y, p) => { if (x >= 0 && y >= 0 && x < W && y < H && !behind.has(key(x, y))) behind.set(key(x, y), p); };
  // 정수리 · 앞머리 (앞) / 뒤통수 (뒤)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inEll(x, y)) continue;
    if (view === 'front') {
      if (x >= 8 && x <= 23) { if (y < line[x]) add(x, y, 'cap'); }
      else if (y <= sideY - (x === 8 - sw || x === 23 + sw ? 1 : 0)) add(x, y, 'cap');
    } else if (y <= Math.max(20, Math.min(sideY, 22)) || (x <= 8 || x >= 23) && y <= sideY) add(x, y, 'cap');
  }
  // 옆머리 — 얼굴 양옆으로 내려옴 (타원 아래까지)
  for (let y = 14; y <= sideY; y++) for (let i = 1; i <= sw; i++) {
    const taper = y >= sideY - 1 && i === sw ? 1 : 0;
    if (taper && y === sideY) continue;
    add(8 - i, y, 'side'); add(23 + i, y, 'side');
  }
  if (sideY >= 19) for (let y = 16; y <= sideY - 1; y++) { add(7, y, 'side'); add(24, y, 'side'); }
  // 뒷머리 (긴 머리) — 앞모습에서는 몸 뒤, 뒷모습에서는 몸 위
  if (backY) {
    const r = rng(L.hseed ^ 0x51);
    const x0 = view === 'front' ? 5 - (vol - 1) : 9 - (vol - 1), x1 = view === 'front' ? 26 + (vol - 1) : 22 + (vol - 1);
    for (let x = x0; x <= x1; x++) {
      const end = backY - (x <= x0 + 1 || x >= x1 - 1 ? 2 : 0) - pickI(r, 2);
      for (let y = 15; y <= end; y++) (view === 'front' ? addB : add)(x, y, 'back');
    }
  }
  // 묶음
  const top = Math.ceil(CY - ry), tie = TIES[L.tie][0];
  if (tie === 'ponytail') {
    if (view === 'front') { const s = L.flip ? -1 : 1; for (let y = 9; y <= 27; y++) { const w = y < 12 ? 2 : y > 23 ? 1 : 2; for (let i = 0; i <= w; i++) addB(s > 0 ? 25 + i : 6 - i, y, 'tail'); } }
    else { for (let y = 13; y <= 29; y++) { const w = y > 25 ? 1 : 2; for (let x = 15 - w + 1; x <= 16 + w - 1; x++) add(x, y, 'tail'); } }
  } else if (tie === 'twin') {
    // 양갈래 — 머리 옆에 붙어 아래로 가늘어짐 (위는 3칸, 가운데 2칸, 끝 1칸)
    const ax = 5 - (vol - 1), bx = 26 + (vol - 1), f = view === 'front' ? addB : add;
    for (let y = 12; y <= 28; y++) { const w = y < 17 ? 2 : y < 25 ? 1 : 0, drift = y > 20 ? 1 : 0; for (let i = 0; i <= w; i++) { f(ax - i + drift, y, 'tail'); f(bx + i - drift, y, 'tail'); } }
  } else if (tie === 'bun') {
    for (let y = top - 4; y <= top + 1; y++) for (let x = 12; x <= 19; x++) if (((x - 15.5) / 3.2) ** 2 + ((y - (top - 1.5)) / 2.7) ** 2 <= 1) add(x, y, 'bun');
  } else if (tie === 'ahoge') {
    [[16, top - 1], [17, top - 2], [17, top - 3], [16, top - 4]].forEach(([x, y]) => add(x + (L.flip ? -2 : 0), y, 'ahoge'));
  } else if (tie === 'spikes') {
    const r = rng(L.hseed ^ 0x77);
    for (const sx of [9, 13, 18, 22]) {
      const h = 2 + pickI(r, 2), lean = sx < 15 ? -1 : 1, base = top + 2 + Math.round(Math.abs(sx - CX) / 4);
      for (let k = 0; k < h; k++) for (let x = sx - 1 + (k ? 1 : 0); x <= sx + 1 - (k ? 1 : 0); x++) add(x + (k >= 2 ? lean : 0), base - 1 - k, 'spike');
    }
  }
  return { m, behind, line, clumps: cl, rx, ry, top };
}
// ---------- 머리 명암 — 가닥(덩어리)마다 따로 (사용자 요청 2026-11-25: 머리 전체에 대각선 하나만 깔린 명암은 별로) ----------
// 가닥은 정수리 근처에서 갈라져 내려옴: 앞머리 줄 위는 정수리 쪽 한 점에서 퍼지는 선, 그 아래는 곧게 내려가는 선.
// 각 칸을 「기준 줄에서의 x(xr)」로 옮겨, xr 을 가닥 경계로 나눔 → 가닥마다 빛 받는 쪽 · 가운데 · 그늘 쪽 + 가닥 사이 갈라짐 선.
// 머리 전체의 빛(왼쪽 위)은 가닥의 바탕 밝기에만 조금 섞음.
function lockField(L, info, view) {
  const r = rng(L.hseed ^ (view === 'front' ? 0x1f : view === 'side' ? 0x4d : 0x2e));
  const P = view === 'front' ? { x: CX, y: 2, ref: 16 } : view === 'side' ? { x: 14, y: 3, ref: 16 } : { x: CX, y: 4, ref: 18 };
  let bounds;
  if (view === 'front') {   // 얼굴 위 가닥은 앞머리 덩어리 그대로, 그 바깥은 폭 2~3 으로 이어 붙임
    bounds = [8, ...info.clumps.map(c => c[1] + 1)];
    for (let x = 8; x > -80;) { x -= 3 + pickI(r, 2); bounds.unshift(x); }
    for (let x = bounds[bounds.length - 1]; x < 110;) { x += 3 + pickI(r, 2); bounds.push(x); }
  } else {
    bounds = [];
    for (let x = -80 + pickI(r, 3); x < 110;) { bounds.push(x); x += 3 + pickI(r, 3); }
  }
  const locks = bounds.map(() => ({ j: r() < 0.2 ? -1 : r() < 0.18 ? 1 : 0, ring: pickI(r, 3) - 1, hard: r() < 0.5 }));
  const xr = (x, y) => y >= P.ref ? x + 0.5 : P.x + (x + 0.5 - P.x) * (P.ref - P.y) / Math.max(0.6, y + 0.5 - P.y);
  const scale = y => y >= P.ref ? 1 : (P.ref - P.y) / Math.max(0.6, y + 0.5 - P.y);   // 기준 줄 1칸이 이 줄에서 몇 칸인지의 역수
  const find = v => { let i = 0; while (i < bounds.length - 2 && bounds[i + 1] <= v) i++; return i; };
  return { xr, scale, bounds, locks, find };
}
// 한 줄에서 같은 무리(꼬리 · 뻗친 머리)가 이어진 범위
function runOf(m, x, y, part) {
  let a = x, b = x;
  while (m.get(y * W + a - 1) === part) a--;
  while (m.get(y * W + b + 1) === part) b++;
  return [a, b];
}
function drawHair(cv, L, HC, view, layer) {
  const info = hairMask(L, view), src = layer === 'behind' ? info.behind : info.m;
  const all = new Map([...info.m, ...info.behind]);
  const has = (x, y) => all.has(y * W + x);
  const F = lockField(L, info, view), r = rng(L.hseed ^ 0x3c);
  const topY = x => { for (let y = 0; y < H; y++) { const p = all.get(y * W + x); if (p === 'cap' || p === 'side' || p === 'back') return y; } return -1; };
  const tones = new Map();
  for (const [k, part] of src) {
    const x = k % W, y = (k / W) | 0;
    const d = -0.55 * (x - CX) / info.rx - 0.8 * Math.min(0.5, (y - CY) / info.ry);
    const g = d > 0.45 ? 1 : d < -0.3 ? -1 : 0;                       // 머리 전체 빛은 바탕에만 조금
    let t;
    if (part === 'tail' || part === 'spike') {                         // 꼬리 · 뻗친 머리 — 그 줄의 폭 안에서 왼쪽 밝음 · 오른쪽 그늘
      const [a, b] = runOf(src, x, y, part), w = b - a + 1, u = (x - a + 0.5) / w;
      t = 2 + (w >= 2 && u < 0.4 ? 1 : 0) - (w >= 2 && u > 0.67 ? 1 : 0) + (g < 0 ? -1 : 0);
      if (part === 'tail' && w >= 3 && x === a + 1 && (y * 7 + L.hseed) % 5 === 0) t--;   // 꼬리 가운데 가닥 선 (드문드문)
      if (!has(x, y + 1)) t--;
    } else if (part === 'bun') {                                       // 올림머리 — 둥근 덩어리
      const bx = info.bunX || CX, by = info.top - 1.5, dd = -0.55 * (x - bx) / 3.2 - 0.8 * (y - by) / 2.7;
      t = dd > 0.35 ? 3 : dd > -0.3 ? 2 : 1;
      if (y === Math.round(by) + 1 && Math.abs(x + 0.5 - bx) <= 2) t = Math.min(t, 1);   // 감은 자국
    } else if (part === 'ahoge') {
      t = 3;
    } else {                                                           // 정수리 · 앞머리 · 옆머리 · 뒷머리 — 가닥마다
      const v = F.xr(x, y), i = F.find(v), a = F.bounds[i], b = F.bounds[i + 1], lk = F.locks[i];
      const wpx = (b - a) / F.scale(y);                                // 이 줄에서 가닥의 폭 (칸)
      const u = (v - a) / (b - a);
      t = 2 + g + (wpx >= 1.8 ? lk.j : 0);                         // 정수리(가닥이 모이는 곳)는 가닥 밝기 차 없이 매끈하게
      if (wpx >= 3) t += u < 0.25 ? 1 : u > 0.8 ? -1 : 0;              // 가닥 안: 넓은 가닥만 빛 받는 쪽 · 그늘 쪽
      else if (wpx >= 2 && u > 0.75) t -= 1;
      const nx = F.find(F.xr(x + 1, y));
      const below = y >= topY(x) + 3 + L.vol;                           // 갈라짐 선은 빛 띠 아래에만 — 정수리는 매끈하게
      if (below && wpx >= 2 && nx !== i && has(x + 1, y) && lk.hard) t = Math.min(t, 1);   // 일부 가닥 사이에만 갈라짐 선
      t = Math.min(t, 3);
      // 빛 띠 — 가닥마다 높이가 조금씩 다름, 가닥의 밝은 쪽에만
      const ry = topY(x) + 2 + L.vol + lk.ring;
      if (part === 'cap' && y === ry && u < 0.62 && g >= 0 && wpx >= 1.2) t = x <= 14 || g > 0 ? 4 : 3;
      else if (part === 'cap' && y === ry + 1 && u < 0.3 && g >= 0 && wpx >= 1.6) t = Math.max(t, 3);
      if (!has(x, y + 1)) t -= 1;                                      // 가닥 끝
    }
    if (!has(x + 1, y) && t > 1) t -= 1;                               // 오른쪽 가장자리
    tones.set(k, clampT(t));
  }
  if (layer !== 'behind' && view === 'front') {
    // 앞머리 끝 — 덩어리 끝 칸은 어둡게 (왼쪽 덩어리는 덜)
    for (const [a, b] of info.clumps) for (let x = a; x <= b; x++) { const k = (info.line[x] - 1) * W + x; if (tones.has(k)) tones.set(k, Math.min(tones.get(k), x <= 11 ? 2 : 1)); }
  }
  if (layer !== 'behind' && view === 'side') {
    // 옆모습 앞머리 끝 — 이마 앞 덩어리 끝은 어둡게
    for (const x in info.line) { const k = (info.line[x] - 1) * W + +x; if (tones.has(k)) tones.set(k, Math.min(tones.get(k), 1)); }
  }
  if (layer !== 'behind' && TIES[L.tie][0] === 'ponytail' && view === 'back') for (let x2 = 14; x2 <= 17; x2++) { tones.delete(12 * W + x2); cv.put(x2, 12, x2 === 14 ? '#b4504c' : '#8a3434', 'hair'); }
  for (const [k, t] of tones) cv.put(k % W, (k / W) | 0, HC[t], 'hair');
  void r;
}

// ---------- 옷 ----------
function drawClothes(cv, L, S, view) {
  const A = ramp(CLOTH_COLORS[L.c1][1]), B = ramp(CLOTH_COLORS[L.c2][1]), C = ramp(CLOTH_COLORS[L.c3][1]), SH = ramp(SHOES[L.shoe][1], 0.08);
  const top = L.top, robe = top === 'robe', back = view === 'back';
  const torsoTone = (x, y) => { let t = x <= 10 ? 3 : x <= 19 ? 2 : 1; if (x === 9 && y >= 27 && y <= 31) t = 1; if (x === 22) t = 0 + 1; if (y === 32) t--; return clampT(t); };
  const put = (x, y, R, t, g = 'cloth') => cv.put(x, y, R[clampT(t)], g);
  // 아래옷
  if (!robe) {
    const legT = x => x === 10 ? 3 : x <= 13 ? 2 : x === 14 ? 1 : x <= 18 ? 2 : 1;
    const legs = y => y === 33 ? [[10, 21]] : [[10, 14], [17, 21]];
    if (L.bottom === 'pants') for (let y = 33; y <= 35; y++) for (const [a, b] of legs(y)) for (let x = a; x <= b; x++) put(x, y, B, y === 33 && (x === 15 || x === 16) ? 0 : legT(x));
    else if (L.bottom === 'shorts') for (let y = 33; y <= 35; y++) for (const [a, b] of legs(y)) for (let x = a; x <= b; x++) {
      if (y === 35) cv.put(x, y, S[x === 10 || x === 17 ? 3 : x === 14 || x === 21 ? 1 : 2], 'skin'); else put(x, y, B, y === 34 ? legT(x) - 1 : legT(x));
    } else for (let y = 33; y <= 35; y++) {   // 치마
      if (y === 35) { for (const [a, b] of [[10, 14], [17, 21]]) for (let x = a; x <= b; x++) cv.put(x, y, S[x === 10 || x === 17 ? 3 : x === 14 || x === 21 ? 1 : 2], 'skin'); continue; }
      for (let x = y === 34 ? 8 : 9; x <= (y === 34 ? 23 : 22); x++) put(x, y, B, (x <= 11 ? 3 : x >= 20 ? 1 : 2) - (y === 34 && (x === 12 || x === 17) ? 1 : 0) - (y === 34 && x % 4 === 1 && x > 9 && x < 21 ? 0 : 0));
    }
  }
  // 신발
  for (const [a, b] of [[9, 14], [17, 22]]) for (let x = a; x <= b; x++) put(x, 36, SH, x === a ? 3 : x === b ? 1 : x === a + 1 ? 3 : 2);
  // 몸통 · 팔
  const sleeve = top === 'tee' ? 27 : top === 'sleeveless' ? 24 : 30;
  for (let y = 25; y <= 32; y++) for (let x = y === 25 ? 10 : 9; x <= (y === 25 ? 21 : 22); x++) put(x, y, A, torsoTone(x, y));
  for (let y = 25; y <= 30; y++) for (const [x, t] of [[7, 3], [8, 2], [23, 2], [24, 1]]) {
    if (y === 25 && (x === 7 || x === 24)) continue;
    if (y <= sleeve) put(x, y, A, t - (y === sleeve && top === 'tee' ? 1 : 0) - (y === 30 && top !== 'tee' ? 1 : 0));
    else cv.put(x, y, S[t], 'skin');
  }
  if (robe) {
    for (let y = 33; y <= 35; y++) for (let x = y === 35 ? 8 : 9; x <= (y === 35 ? 23 : 22); x++) put(x, y, A, (x <= 10 ? 3 : x >= 20 ? 1 : 2) - (y === 35 ? 1 : 0) - (x === 15 && y >= 33 ? 1 : 0));
    for (let x = 9; x <= 22; x++) for (const y of [29, 30]) put(x, y, C, (x <= 10 ? 3 : x >= 20 ? 1 : 2) + (y === 29 ? 0 : -1));
    if (!back) for (let y = 31; y <= 35; y++) put(16, y, A, 0);
  }
  if (top === 'tee' && !back) for (let x = 14; x <= 17; x++) cv.put(x, 25, S[1], 'skin');
  if (top === 'sleeveless' && !back) { for (let x = 14; x <= 17; x++) cv.put(x, 25, S[1], 'skin'); cv.put(13, 26, S[1], 'skin'); cv.put(18, 26, S[1], 'skin'); }
  if (top === 'hoodie') {
    if (!back) {
      for (let x = 10; x <= 21; x++) put(x, 25, A, x <= 12 ? 4 : x >= 19 ? 2 : 3);
      for (let x = 12; x <= 19; x++) put(x, 26, A, 1);
      for (const x of [14, 17]) for (let y = 27; y <= 28; y++) cv.put(x, y, WHITE[y === 27 ? 3 : 2], 'cloth');
      for (let x = 11; x <= 20; x++) put(x, 30, A, 1); put(11, 31, A, 1); put(20, 31, A, 0);
    } else {
      for (let y = 25; y <= 29; y++) for (let x = 11; x <= 20; x++) {
        if (y === 29 && (x === 11 || x === 20)) continue;
        const edge = x === 11 || x === 20 || y === 29;
        put(x, y, A, edge ? 1 : x <= 13 ? 3 : 2);
      }
    }
  }
  if ((top === 'jacket' || top === 'suit') && !back) {
    const inner = top === 'suit' ? WHITE : C;
    for (let y = 25; y <= 32; y++) for (let x = 14; x <= 17; x++) cv.put(x, y, inner[x <= 15 ? 3 : 2], 'cloth');
    for (let y = 25; y <= 32; y++) { put(13, y, A, y <= 27 ? 3 : 1); put(18, y, A, 0); }
    if (top === 'suit') { for (let y = 26; y <= 30; y++) { put(15, y, C, y === 26 ? 1 : 3); put(16, y, C, y === 26 ? 0 : 2); } put(13, 30, GOLD, 3); }
  }
  if ((top === 'jacket' || top === 'suit') && back) for (let y = 29; y <= 32; y++) put(15, y, A, 1);
  if (top === 'armor') {
    for (let y = 26; y <= 31; y++) for (let x = 10; x <= 21; x++) cv.put(x, y, METAL[(x <= 12 ? 3 : x >= 19 ? 1 : 2) - (y === 31 ? 1 : 0) + (!back && x === 15 && y < 31 ? 1 : 0)], 'cloth');
    for (const [a, b, lt] of [[7, 10, 3], [21, 24, 1]]) for (let y = 25; y <= 26; y++) for (let x = a; x <= b; x++) cv.put(x, y, METAL[lt + (y === 25 ? 1 : 0) - (x === b && a === 21 ? 1 : 0)], 'cloth');
  }
  if (top === 'dobok') {
    if (!back) { for (let i = 0; i <= 4; i++) { put(19 - i, 25 + i, A, 0); } for (let i = 0; i <= 2; i++) put(12 + i, 25 + i, A, 1); }
    for (let x = 9; x <= 22; x++) for (const y of [30, 31]) put(x, y, C, (x <= 10 ? 3 : x >= 20 ? 1 : 2) - (y === 31 ? 1 : 0));
    if (!back) { put(14, 32, C, 2); put(14, 33, C, 1); put(16, 32, C, 1); put(16, 33, C, 0); }
  }
  // 걸칠 것
  const ex = L.extra;
  if (ex === 'belt' && !robe && top !== 'dobok') { for (let x = 9; x <= 22; x++) cv.put(x, 32, LEATHER[x <= 10 ? 3 : x >= 20 ? 1 : 2], 'cloth'); if (!back) { cv.put(15, 32, GOLD[3], 'cloth'); cv.put(16, 32, GOLD[2], 'cloth'); } }
  if (ex === 'strap') for (let i = 0; i <= 7; i++) { const x = back ? 21 - Math.round(i * 11 / 7) : 10 + Math.round(i * 11 / 7), y = 25 + i; cv.put(x, y, LEATHER[2], 'cloth'); }
  if (ex === 'scarf') {
    for (let x = 10; x <= 21; x++) for (const y of [24, 25]) put(x, y, C, (x <= 12 ? 3 : x >= 19 ? 1 : 2) - (y === 25 ? 1 : 0) + (y === 24 ? 1 : 0));
    if (!back) for (let y = 26; y <= 29; y++) { put(11, y, C, 3); put(12, y, C, 1 + (y === 29 ? 0 : 1)); }
  }
  if (ex === 'cape' && back) {
    const r = rng(L.seed ^ 0xca);
    const folds = [11 + pickI(r, 2), 15 + pickI(r, 2), 19 + pickI(r, 2)];
    for (let y = 25; y <= 35; y++) for (let x = y >= 33 ? 7 : 8; x <= (y >= 33 ? 24 : 23); x++) {
      let t = x <= 10 ? 3 : x >= 20 ? 1 : 2;
      if (folds.includes(x) && y >= 27 + (x % 3)) t--;
      if (y === 25) t++;
      put(x, y, C, t);
    }
  }
  if (ex === 'cape' && !back) { for (let x = 8; x <= 23; x++) put(x, 25, C, x <= 11 ? 3 : x >= 20 ? 1 : 2); cv.put(10, 26, GOLD[3], 'cloth'); cv.put(21, 26, GOLD[2], 'cloth'); }
}
function drawCapeBehind(cv, L) {
  const C = ramp(CLOTH_COLORS[L.c3][1]);
  for (let y = 26; y <= 35; y++) { const w = y >= 32 ? 2 : 1; for (let i = 1; i <= w; i++) { cv.put(7 - i, y, C[i === 1 ? 2 : 3], 'cloth'); cv.put(24 + i, y, C[i === 1 ? 1 : 0], 'cloth'); } }
}

// ============================================================
//  옆모습 — 오른쪽(화면 오른쪽)을 봄. 왼쪽을 보는 모습은 좌우로 뒤집음 (주인공 지도 걷기에 씀 — 2026-11-25)
//  비율은 주인공 옆모습(assets/hero/walk.png 의 셋째 줄)을 따름: 머리 x 5~25, 얼굴은 오른쪽, 몸통은 좁게, 다리는 겹쳐서
// ============================================================
const SKULL_SIDE = { 7: [11, 20], 8: [9, 22], 9: [8, 23], 20: [8, 24], 21: [10, 24], 22: [11, 23], 23: [13, 23], 24: [15, 21] };   // 그 밖(10~19)은 7~24 — 뒤통수 아래는 깎여 목으로, 턱은 앞으로
const skullRowSide = y => SKULL_SIDE[y] || (y >= 10 && y <= 19 ? [7, 24] : null);
function drawSkinSide(cv, S, hideEar) {
  for (let y = 7; y <= 24; y++) {
    const [a, b] = skullRowSide(y);
    for (let x = a; x <= b; x++) {
      let t = 2;
      if (x >= 19 && x <= 21 && y >= 19 && y <= 22) t = 3;           // 볼 — 작게만 빛
      if (y >= 22 && x <= 17) t = 1;                                 // 턱 밑 · 목 쪽 그늘
      if (y === 24) t = x >= 19 ? 2 : 1;
      cv.put(x, y, S[t], 'skin');
    }
  }
  for (let y = 24; y <= 25; y++) for (let x = 14; x <= 17; x++) cv.put(x, y, S[1], 'skin');   // 목
  if (!hideEar) for (let y = 17; y <= 19; y++) { cv.put(13, y, S[2], 'skin'); cv.put(14, y, S[y === 18 ? 1 : 3], 'skin'); }
  for (let y = 31; y <= 32; y++) { cv.put(14, y, S[3], 'skin'); cv.put(15, y, S[2], 'skin'); }   // 앞 손
}
function drawFaceSide(cv, L, S, HC, E) {
  for (let i = 0; i < 3; i++) cv.put(20 + i, 16, HC[0], 'face');   // 눈썹
  const rows = EYES[L.eye], col = { k: LASH, i: E[1], j: E[3], h: SHINE };
  rows.forEach((row, j) => [...row.slice(0, 2)].forEach((ch, i) => { if (col[ch]) cv.put(20 + i, 17 + j, col[ch], 'face'); }));   // 눈 하나 — 앞모습 눈의 앞 두 칸
  const m = L.mouth;
  if (m === 'small') cv.put(23, 22, MOUTH, 'face');
  else if (m === 'line') { cv.put(22, 22, MOUTH, 'face'); cv.put(23, 22, MOUTH, 'face'); }
  else if (m === 'open') { cv.put(22, 22, MOUTH, 'face'); cv.put(23, 22, MOUTH, 'face'); cv.put(23, 23, TONGUE, 'face'); }
  const k = L.mark;
  if (k === 'blush') { const p = mix(S[2], '#d05a58', 0.38); cv.put(20, 21, p, 'face'); cv.put(21, 21, p, 'face'); }
  else if (k === 'scar') { cv.put(19, 21, S[0], 'face'); cv.put(20, 22, S[0], 'face'); cv.put(18, 21, S[4], 'face'); }
  else if (k === 'bandage') { [[19, 21], [20, 21], [21, 21], [19, 22], [20, 22], [21, 22]].forEach(([x, y]) => cv.put(x, y, x === 20 ? WHITE[2] : y === 22 ? WHITE[1] : WHITE[3], 'face')); }
  else if (k === 'mole') cv.put(21, 23, S[0], 'face');
}
// 옆모습 머리 — 앞(x ≥ 17)은 앞머리 줄 위만, 뒤는 뒤통수 · 귀 둘레 옆머리 · 등 뒤로 긴 머리
function hairMaskSide(L) {
  const vol = L.vol, cx = 15, rx = 9.2 + vol * 0.9, ry = 9 + vol * 0.9;
  const sideY = SIDES[L.side][1], backY = BACKS[L.back][1], tie = TIES[L.tie][0];
  const r = rng(L.hseed ^ 0x5d);
  const base = { straight: 16, parted: 14, side: L.flip ? 13 : 16, spiky: 15, short: 11, messy: 15 }[L.bangs];
  // 이마 앞 앞머리 — 폭 2~3 덩어리, 가운데가 조금 더 내려옴
  const line = {};
  for (let x = 17; x <= 26;) {
    const w = 2 + pickI(r, 2), drop = L.bangs === 'spiky' ? 2 : L.bangs === 'straight' || L.bangs === 'short' ? 0 : 1;
    for (let i = 0; i < w && x + i <= 26; i++) line[x + i] = Math.min(18, base + (i > 0 && i < w - 1 || w === 2 && i === 1 ? drop : 0) + (L.bangs === 'messy' ? pickI(r, 2) - 0 : 0) - (x + i >= 24 ? 1 : 0));
    x += w;
  }
  const m = new Map(), behind = new Map(), key = (x, y) => y * W + x;
  const add = (x, y, p) => { if (x >= 0 && y >= 0 && x < W && y < H && !m.has(key(x, y))) m.set(key(x, y), p); };
  const addB = (x, y, p) => { if (x >= 0 && y >= 0 && x < W && y < H && !behind.has(key(x, y))) behind.set(key(x, y), p); };
  const inEll = (x, y) => ((x + 0.5 - cx - 0.5) / rx) ** 2 + ((y - CY) / ry) ** 2 <= 1;
  const nape = Math.max(20, Math.min(sideY, 22));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inEll(x, y)) continue;
    if (x >= 17) { if (y < line[x]) add(x, y, 'cap'); }
    else if (x <= 10) { if (y <= nape) add(x, y, 'cap'); }
    else if (y <= 15 || (x <= 12 && y <= nape)) add(x, y, 'cap');                    // 귀 위 · 뒤통수 (귀 앞 얼굴은 비워 둠)
  }
  // 귀 둘레 옆머리 — 타원 아래로 내려오는 부분 (턱까지면 목 앞으로)
  if (sideY >= 19) for (let y = 16; y <= sideY; y++) for (let x = 10; x <= 14 - (y >= sideY - 1 ? 1 : 0); x++) add(x, y, 'side');
  // 등 뒤 긴 머리 — 몸 뒤에 그림
  if (backY) for (let x = 5 - (vol - 1); x <= 12; x++) { const end = backY - (x <= 6 - (vol - 1) ? 2 : 0) - pickI(r, 2); for (let y = 14; y <= end; y++) addB(x, y, 'back'); }
  const top = Math.ceil(CY - ry);
  let bunX;
  if (tie === 'ponytail' || tie === 'twin') {   // 뒤로 묶은 꼬리 — 뒤통수에서 등 쪽으로 (양갈래는 가까운 쪽 하나만 보임)
    const y0 = tie === 'ponytail' ? 10 : 13;
    for (let y = y0; y <= 27; y++) { const w = y < y0 + 4 ? 2 : y > 23 ? 0 : 1, x0 = 5 - (vol - 1) - Math.floor((y - y0) / 5); for (let i = 0; i <= w; i++) addB(x0 - i, y, 'tail'); }
  } else if (tie === 'bun') {
    bunX = 11.5;
    for (let y = top - 4; y <= top + 2; y++) for (let x = 7; x <= 16; x++) if (((x + 0.5 - bunX) / 3.2) ** 2 + ((y - (top - 1)) / 2.7) ** 2 <= 1) add(x, y, 'bun');
  } else if (tie === 'ahoge') {
    [[16, top - 1], [17, top - 2], [17, top - 3], [16, top - 4]].forEach(([x, y]) => add(x, y, 'ahoge'));
  } else if (tie === 'spikes') {
    for (const sx of [7, 11, 16]) {   // 뒤쪽으로 뻗침
      const h = 2 + pickI(r, 2), base2 = top + 2 + Math.round(Math.abs(sx - 13) / 4);
      for (let k = 0; k < h; k++) for (let x = sx - 1 + (k ? 1 : 0); x <= sx + 1 - (k ? 1 : 0); x++) add(x - (k >= 1 ? 1 : 0), base2 - 1 - k, 'spike');
    }
  }
  return { m, behind, line, clumps: [], rx, ry, top, bunX };
}
function drawClothesSide(cv, L, S) {
  const A = ramp(CLOTH_COLORS[L.c1][1]), B = ramp(CLOTH_COLORS[L.c2][1]), C = ramp(CLOTH_COLORS[L.c3][1]), SH = ramp(SHOES[L.shoe][1], 0.08);
  const top = L.top, robe = top === 'robe';
  const put = (x, y, R, t, g = 'cloth') => cv.put(x, y, R[clampT(t)], g);
  const bodyT = x => x <= 11 ? 3 : x >= 18 ? 1 : 2;
  // 다리 · 아래옷 (두 다리가 겹침 — 걸을 때 걷기 단계가 벌림)
  if (!robe) for (let y = 33; y <= 35; y++) for (let x = 12; x <= 17; x++) {
    const t = x === 12 ? 3 : x >= 16 ? 1 : 2;
    if (L.bottom === 'shorts' && y === 35 || L.bottom === 'skirt' && y === 35) cv.put(x, y, S[t], 'skin');
    else put(x, y, B, t - (L.bottom === 'shorts' && y === 34 ? 1 : 0));
  }
  if (!robe && L.bottom === 'skirt') for (let y = 33; y <= 34; y++) for (let x = y === 34 ? 9 : 10; x <= (y === 34 ? 20 : 19); x++) put(x, y, B, bodyT(x) - (y === 34 && x === 14 ? 1 : 0));
  for (let x = 12; x <= 18; x++) put(x, 36, SH, x <= 13 ? 3 : x === 18 ? 2 : x >= 16 ? 1 : 2);   // 신발 — 앞코가 오른쪽
  // 몸통
  for (let y = 25; y <= 32; y++) for (let x = y === 25 ? 11 : 10; x <= (y === 25 ? 18 : 19); x++) put(x, y, A, bodyT(x) - (y === 32 ? 1 : 0) - (x === 12 && y >= 27 && y <= 30 ? 1 : 0));
  if (robe) {
    for (let y = 33; y <= 35; y++) for (let x = y === 35 ? 9 : 10; x <= (y === 35 ? 20 : 19); x++) put(x, y, A, bodyT(x) - (y === 35 ? 1 : 0));
    for (let x = 10; x <= 19; x++) for (const y of [29, 30]) put(x, y, C, bodyT(x) - (y === 30 ? 1 : 0));
  }
  // 앞 팔 — x 13~16, 소매 끝은 윗옷마다
  const sleeve = top === 'tee' ? 27 : top === 'sleeveless' ? 24 : 30;
  for (let y = 25; y <= 30; y++) for (const [x, t] of [[13, 3], [14, 2], [15, 2], [16, 1]]) {
    if (y === 25 && (x === 13 || x === 16)) continue;
    if (y <= sleeve) put(x, y, A, t - (y === sleeve && top === 'tee' ? 1 : 0) - (y === 30 && sleeve === 30 ? 1 : 0));
    else cv.put(x, y, S[t], 'skin');
  }
  if (top === 'tee' || top === 'sleeveless') { cv.put(18, 25, S[1], 'skin'); }
  if (top === 'hoodie') {
    for (let y = 23; y <= 27; y++) for (let x = 8; x <= 12; x++) { if ((y === 23 || y === 27) && (x === 8 || x === 12)) continue; put(x, y, A, x === 8 || y === 27 ? 1 : x <= 10 ? 3 : 2); }   // 등 뒤 모자
    cv.put(18, 26, WHITE[3], 'cloth'); cv.put(18, 27, WHITE[2], 'cloth');
    for (let x = 17; x <= 19; x++) put(x, 30, A, 0);
  }
  if (top === 'jacket' || top === 'suit') {
    const inner = top === 'suit' ? WHITE : C;
    for (let y = 25; y <= 32; y++) { cv.put(19, y, inner[2], 'cloth'); put(18, y, A, 0); }
    if (top === 'suit') for (let y = 26; y <= 30; y++) put(19, y, C, y === 26 ? 0 : 2);
  }
  if (top === 'armor') {
    for (let y = 26; y <= 31; y++) for (let x = 10; x <= 19; x++) if (x <= 11 || x >= 17) cv.put(x, y, METAL[(x <= 11 ? 3 : x === 19 ? 1 : 2) - (y === 31 ? 1 : 0)], 'cloth');
    for (let y = 24; y <= 26; y++) for (let x = 12; x <= 17; x++) cv.put(x, y, METAL[(x <= 13 ? 3 : x >= 16 ? 1 : 2) + (y === 24 ? 1 : 0)], 'cloth');   // 어깨받이
  }
  if (top === 'dobok') {
    [[19, 25], [18, 26], [17, 27]].forEach(([x, y]) => put(x, y, A, 0));
    for (let x = 10; x <= 19; x++) for (const y of [30, 31]) put(x, y, C, bodyT(x) - (y === 31 ? 1 : 0));
    put(19, 32, C, 1); put(19, 33, C, 0);
  }
  const ex = L.extra;
  if (ex === 'belt' && !robe && top !== 'dobok') { for (let x = 10; x <= 19; x++) cv.put(x, 32, LEATHER[x <= 11 ? 3 : x >= 18 ? 1 : 2], 'cloth'); cv.put(19, 32, GOLD[3], 'cloth'); }
  if (ex === 'strap') for (let i = 0; i <= 7; i++) cv.put(11 + Math.round(i * 7 / 7), 25 + i, LEATHER[2], 'cloth');
  if (ex === 'scarf') {
    for (let x = 12; x <= 19; x++) for (const y of [24, 25]) put(x, y, C, bodyT(x) + (y === 24 ? 1 : 0));
    for (let y = 25; y <= 28; y++) { put(10 - (y - 25 >> 1), y, C, 2); put(11 - (y - 25 >> 1), y, C, 3); }   // 뒤로 날리는 끝
  }
  if (ex === 'cape') { for (let x = 11; x <= 18; x++) put(x, 25, C, bodyT(x)); cv.put(18, 26, GOLD[3], 'cloth'); }
}
function drawCapeBehindSide(cv, L) {
  const C = ramp(CLOTH_COLORS[L.c3][1]);
  for (let y = 25; y <= 35; y++) { const x0 = 9 - Math.floor((y - 25) / 3); for (let x = x0; x <= 11; x++) cv.put(x, y, C[x === x0 ? 3 : 2], 'cloth'); }
}

// ---------- 합치기 ----------
// view: 'front' 앞 · 'back' 뒤 · 'side' 오른쪽을 봄 · 'sideL' 왼쪽을 봄 (옆모습을 뒤집음)
function drawLook(L, view = 'front') {
  if (view === 'sideL') {
    const src = drawLook(L, 'side'), out = new Uint8ClampedArray(W * H * 4);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let k = 0; k < 4; k++) out[(y * W + x) * 4 + k] = src[(y * W + (W - 1 - x)) * 4 + k];
    return out;
  }
  const cv = Canvas();
  const S = ramp(SKINS[L.skin][1], 0.085), HC = ramp(HAIR_COLORS[L.hc][1], 0.1), E = ramp(EYE_COLORS[L.ec][1], 0.12);
  const sideY = SIDES[L.side][1];
  if (view === 'side') {
    if (L.extra === 'cape') drawCapeBehindSide(cv, L);
    drawHair(cv, L, HC, 'side', 'behind');
    drawSkinSide(cv, S, sideY >= 18);
    drawClothesSide(cv, L, S);
    drawFaceSide(cv, L, S, HC, E);
    drawHair(cv, L, HC, 'side', 'front');
    for (let y = 1; y < 26; y++) for (let x = 0; x < W; x++) { const p = cv.at(x, y), up = cv.at(x, y - 1); if (p && p.g === 'skin' && up && up.g === 'hair') cv.put(x, y, S[1], 'skin'); }
  } else if (view === 'front') {
    if (L.extra === 'cape') drawCapeBehind(cv, L);
    drawHair(cv, L, HC, 'front', 'behind');
    drawSkin(cv, S, 'front', sideY >= 18);
    drawClothes(cv, L, S, 'front');
    drawFace(cv, L, S, HC, E);
    drawHair(cv, L, HC, 'front', 'front');
    // 머리카락 바로 밑 살은 그늘
    for (let y = 1; y < H; y++) for (let x = 0; x < W; x++) { const p = cv.at(x, y), up = cv.at(x, y - 1); if (p && p.g === 'skin' && up && up.g === 'hair' && y < 26) cv.put(x, y, S[1], 'skin'); }
  } else {
    drawSkin(cv, S, 'back', sideY >= 18);
    drawClothes(cv, L, S, 'back');
    drawHair(cv, L, HC, 'back', 'front');
  }
  // 바깥 테두리
  const out = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = cv.at(x, y) && cv.at(x, y).c;
    if (!c && (cv.at(x - 1, y) || cv.at(x + 1, y) || cv.at(x, y - 1) || cv.at(x, y + 1))) c = OUTLINE;
    if (!c) continue;
    const [r, g, b] = hex2rgb(c), i = (y * W + x) * 4;
    out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = 255;
  }
  return out;
}

// 주인공 기본 모습 — 예전 주인공 그림(design/hero)과 닮게: 짙은 갈색 덥수룩한 머리 · 갈색 둥근 눈 · 검은 재킷에 흰 속옷 · 검은 바지 · 흰 신발 (사용자 결정 2026-11-25 — 주인공도 조합 그림으로)
const HERO_LOOK = { v: 1, seed: 20261125, skin: 0, hc: 1, bangs: 'messy', side: 1, back: 0, tie: 0, vol: 2, flip: false, eye: 'round', ec: 0, mouth: 'small', mark: 'none', top: 'jacket', bottom: 'pants', extra: 'none', c1: 0, c2: 0, c3: 3, shoe: 1, hseed: 20261125 };

// 저장에서 읽은 생김새를 검사 — 모르는 값은 기본 주인공(HERO_LOOK)의 값으로 (주인공 꾸미기 · 저장본 손상 대비)
function cleanLook(o) {
  const L = { ...HERO_LOOK };
  if (!o || typeof o !== 'object') return L;
  const idx = (k, n) => { if (Number.isInteger(o[k]) && o[k] >= 0 && o[k] < n) L[k] = o[k]; };
  const one = (k, list) => { if (list.includes(o[k])) L[k] = o[k]; };
  idx('skin', SKINS.length); idx('hc', HAIR_COLORS.length); idx('side', SIDES.length); idx('back', BACKS.length); idx('tie', TIES.length); idx('ec', EYE_COLORS.length);
  idx('c1', CLOTH_COLORS.length); idx('c2', CLOTH_COLORS.length); idx('c3', CLOTH_COLORS.length); idx('shoe', SHOES.length);
  one('bangs', BANGS); one('eye', Object.keys(EYES)); one('mouth', MOUTHS); one('mark', MARKS.map(m => m[0])); one('top', TOPS); one('bottom', BOTTOMS.map(b => b[0])); one('extra', EXTRAS.map(e => e[0]));
  if (o.vol === 1 || o.vol === 2) L.vol = o.vol;
  if (typeof o.flip === 'boolean') L.flip = o.flip;
  if (Number.isInteger(o.hseed) && o.hseed >= 0 && o.hseed < 2 ** 31) L.hseed = o.hseed;
  L.seed = L.hseed;
  return L;
}

// 거울(주인공 꾸미기)에서 고를 수 있는 항목 — 무리(얼굴 · 머리 · 옷)마다. values 는 저장되는 값, labels 는 보이는 이름, swatch 는 색 견본
const idxs = n => Array.from({ length: n }, (_, i) => i);
const OPTIONS = [
  { group: '얼굴', key: 'skin', name: '피부', values: idxs(SKINS.length), labels: SKINS.map(s => s[0]), swatch: SKINS.map(s => s[1]) },
  { group: '얼굴', key: 'eye', name: '눈', values: Object.keys(EYES), labels: Object.keys(EYES).map(k => EYES_KO[k]) },
  { group: '얼굴', key: 'ec', name: '눈동자', values: idxs(EYE_COLORS.length), labels: EYE_COLORS.map(e => e[0]), swatch: EYE_COLORS.map(e => e[1]) },
  { group: '얼굴', key: 'mouth', name: '입', values: MOUTHS, labels: ['작게', '일자', '벌림', '없음'] },
  { group: '얼굴', key: 'mark', name: '얼굴 표시', values: MARKS.map(m => m[0]), labels: ['없음', '볼터치', '흉터', '반창고', '점'] },
  { group: '머리', key: 'bangs', name: '앞머리', values: BANGS, labels: BANGS.map(b => BANGS_KO[b]) },
  { group: '머리', key: 'flip', name: '가르마', values: [false, true], labels: ['왼쪽', '오른쪽'] },
  { group: '머리', key: 'side', name: '옆머리', values: idxs(SIDES.length), labels: SIDES.map(s => s[2]) },
  { group: '머리', key: 'back', name: '뒷머리', values: idxs(BACKS.length), labels: BACKS.map(b => b[2]) },
  { group: '머리', key: 'tie', name: '묶음', values: idxs(TIES.length), labels: TIES.map(t => t[1]) },
  { group: '머리', key: 'vol', name: '숱', values: [1, 2], labels: ['적게', '많이'] },
  { group: '머리', key: 'hc', name: '머리색', values: idxs(HAIR_COLORS.length), labels: HAIR_COLORS.map(h => h[0]), swatch: HAIR_COLORS.map(h => h[1]) },
  { group: '옷', key: 'top', name: '윗옷', values: TOPS, labels: TOPS.map(t => TOPS_KO[t]) },
  { group: '옷', key: 'c1', name: '윗옷 색', values: idxs(CLOTH_COLORS.length), labels: CLOTH_COLORS.map(c => c[0]), swatch: CLOTH_COLORS.map(c => c[1]) },
  { group: '옷', key: 'bottom', name: '아래옷', values: BOTTOMS.map(b => b[0]), labels: ['바지', '반바지', '치마'] },
  { group: '옷', key: 'c2', name: '아래옷 색', values: idxs(CLOTH_COLORS.length), labels: CLOTH_COLORS.map(c => c[0]), swatch: CLOTH_COLORS.map(c => c[1]) },
  { group: '옷', key: 'extra', name: '걸칠 것', values: EXTRAS.map(e => e[0]), labels: ['없음', '목도리', '허리띠', '가방끈', '망토'] },
  { group: '옷', key: 'c3', name: '포인트 색', values: idxs(CLOTH_COLORS.length), labels: CLOTH_COLORS.map(c => c[0]), swatch: CLOTH_COLORS.map(c => c[1]) },
  { group: '옷', key: 'shoe', name: '신발', values: idxs(SHOES.length), labels: SHOES.map(s => s[0]), swatch: SHOES.map(s => s[1]) }
];

// ---------- 걷기 시트 — 주인공 지도 걷기 (assets/hero/walk.png 와 같은 틀) ----------
// 한 줄에 한 방향: 앞 · 뒤 · 오른쪽을 봄 · 왼쪽을 봄. 한 줄 4칸 = 서기 · 걸음 A · 서기 · 걸음 B (한 칸 32×40 → 128×160).
// design/hero/walk.js 와 같은 방법 — 새 픽셀 없이 옮기기만: 앞 · 뒤는 한 다리가 들리고 몸이 1칸 위로, 옆은 두 다리가 벌어지고(먼 다리는 어둡게) 몸이 1칸 아래로
const WALK_FB = { split: 16, dup: 34, lift: 1 }, WALK_SIDE = { top: 33, rows: [33, 35, 36, 37], spread: [0, 1, 2, 2], far: 0.72 };
function walkSheet(L) {
  const SW = W * 4, out = new Uint8ClampedArray(SW * H * 4 * 4);
  ['front', 'back', 'side', 'sideL'].forEach((v, row) => {
    const src = drawLook(L, v);
    const get = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return null; const i = (y * W + x) * 4; return src[i + 3] ? [src[i], src[i + 1], src[i + 2]] : null; };
    const blank = () => new Array(W * H).fill(null);
    const stand = blank(); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) stand[y * W + x] = get(x, y);
    const stepFB = liftLeft => {
      const f = blank();
      for (let x = 0; x < W; x++) {
        const planted = liftLeft ? x >= WALK_FB.split : x < WALK_FB.split;
        for (let y = 0; y < H; y++) {
          let sy = y + 1;
          if (planted && y >= WALK_FB.dup) sy = y;
          if (!planted && y >= WALK_FB.dup - 1) sy = y + 1 + WALK_FB.lift;
          f[y * W + x] = get(x, sy);
        }
      }
      return f;
    };
    const stepSide = (face, nearForward) => {
      const f = blank(), R = WALK_SIDE.rows;
      for (let y = 0; y < WALK_SIDE.top; y++) for (let x = 0; x < W; x++) f[(y + 1) * W + x] = get(x, y);
      const leg = (dir, shade) => R.forEach((sy, k) => {
        const ty = H - R.length + k - (H - 1 - R[R.length - 1]), dx = dir * WALK_SIDE.spread[k];
        for (let x = 0; x < W; x++) {
          const c = get(x, sy); if (!c) continue;
          const tx = x + dx; if (tx < 0 || tx >= W) continue;
          f[ty * W + tx] = shade && Math.max(...c) > 30 ? c.map(q => Math.round(q * WALK_SIDE.far)) : c;
        }
      });
      const fwd = face * (nearForward ? 1 : -1);
      leg(-fwd, true); leg(fwd, false);
      return f;
    };
    const frames = row < 2 ? [stand, stepFB(true), stand, stepFB(false)] : [stand, stepSide(row === 2 ? 1 : -1, true), stand, stepSide(row === 2 ? 1 : -1, false)];
    frames.forEach((f, n) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = f[y * W + x]; if (!c) continue; const i = ((row * H + y) * SW + n * W + x) * 4; out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2]; out[i + 3] = 255; } });
  });
  return { width: SW, height: H * 4, data: out };
}

function describe(L) {
  return `피부 ${SKINS[L.skin][0]} · 머리 ${HAIR_COLORS[L.hc][0]} ${BANGS_KO[L.bangs]} / ${SIDES[L.side][2]} / 뒤 ${BACKS[L.back][2]} / ${TIES[L.tie][1]} · 눈 ${EYES_KO[L.eye]} ${EYE_COLORS[L.ec][0]} · ${TOPS_KO[L.top]} ${CLOTH_COLORS[L.c1][0]}`;
}
// 경우의 수 (색 포함, 대략)
const COUNT = SKINS.length * HAIR_COLORS.length * BANGS.length * SIDES.length * BACKS.length * TIES.length * 2 * Object.keys(EYES).length * EYE_COLORS.length * MOUTHS.length * MARKS.length
  * TOPS.length * BOTTOMS.length * EXTRAS.length * CLOTH_COLORS.length ** 3 * SHOES.length;

const api = { W, H, HERO_LOOK, OPTIONS, cleanLook, rollLook, drawLook, walkSheet, describe, COUNT, SKINS, HAIR_COLORS };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.AllyLook = api;
})(typeof window !== 'undefined' ? window : globalThis);
