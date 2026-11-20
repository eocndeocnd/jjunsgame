// 도트 그리기 1판 — 글자 격자 도형 · 바깥 테두리 · 행 옮기기 (1칸 손그림의 테두리 자동 · 프레임 B 들썩임에 씀)
// 재질 = 중간 글자. MAT[중간] = [밝음, 중간, 어둠]
function grid(n) { return Array.from({ length: n }, () => Array(n).fill('.')); }
function fromRows(rows) { return rows.map(r => [...r]); }
function toRows(g) { return g.map(r => r.join('')); }
function set(g, x, y, c) { if (y >= 0 && y < g.length && x >= 0 && x < g.length) g[y][x] = c; }
function get(g, x, y) { return y >= 0 && y < g.length && x >= 0 && x < g.length ? g[y][x] : '.'; }
function rect(g, x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(g, x + i, y + j, c); }
function ell(g, cx, cy, rx, ry, c) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
    if (dx * dx + dy * dy <= 1) set(g, x, y, c);
  }
}
function line(g, x0, y0, x1, y1, c, t = 1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
  for (let k = 0; k <= n; k++) { const x = Math.round(x0 + (x1 - x0) * k / n), y = Math.round(y0 + (y1 - y0) * k / n); rect(g, x - (t >> 1), y - (t >> 1), t, t, c); }
}
function poly(g, pts, c) {   // 채운 다각형
  const ys = pts.map(p => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
  for (let y = y0; y <= y1; y++) {
    const yy = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= yy && by > yy) || (by <= yy && ay > yy)) xs.push(ax + (yy - ay) / (by - ay) * (bx - ax)); }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.ceil(xs[i] - 0.5); x <= Math.floor(xs[i + 1] - 0.5); x++) set(g, x, y, c);
  }
}
// 빛 · 그림자 — 같은 재질 덩어리의 왼쪽 위 가장자리는 밝게, 오른쪽 아래 가장자리(두께 d)는 어둡게
function shade(g, MAT, d = 1) {
  const src = g.map(r => r.slice()), n = g.length;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const c = src[y][x], m = MAT[c]; if (!m) continue;
    const other = (dx, dy) => { const o = get(src, x + dx, y + dy); return o !== c; };
    let dark = false;
    for (let k = 1; k <= d; k++) if (other(k, 0) && other(0, k) || other(0, k) && k === 1 || other(k, k) && other(k, 0)) dark = true;
    if (dark) g[y][x] = m[2];
    else if (other(-1, 0) || other(0, -1)) g[y][x] = m[0];
  }
}
// 바깥 테두리 — 칠한 칸 옆(상하좌우)의 빈칸을 K 로
function outline(g, K = 'K') {
  const src = g.map(r => r.slice()), n = g.length;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (src[y][x] !== '.') continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const o = get(src, x + dx, y + dy); return o !== '.' && o !== K; })) g[y][x] = K;
  }
  return g;
}
// 행 묶음 옮기기 — rows y0..y1 을 dy 만큼 (프레임 B 들썩임)
function shiftRows(rows, y0, y1, dy) {
  const n = rows.length, out = rows.slice(), blank = '.'.repeat(n);
  for (let y = y0; y <= y1; y++) out[y] = blank;
  for (let y = y0; y <= y1; y++) if (y + dy >= 0 && y + dy < n) out[y + dy] = rows[y];
  return out;
}
// 부위 겹치기 — 부위(part)를 따로 칠하고 빛 · 그림자를 입혀 g 위에 올림. 이미 칠한 곳과 맞닿는 부위 가장자리는 안쪽 선(K)
function layer(g, MAT, draw, edge = 'K') {
  const n = g.length, p = grid(n);
  draw(p);
  shade(p, MAT);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (p[y][x] === '.') continue;
    const touch = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => get(p, x + dx, y + dy) === '.' && get(g, x + dx, y + dy) !== '.');
    g[y][x] = touch && edge ? edge : p[y][x];
  }
  return g;
}
module.exports = { layer, grid, fromRows, toRows, set, get, rect, ell, line, poly, shade, outline, shiftRows };
