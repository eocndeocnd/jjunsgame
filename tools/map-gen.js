// ============================================================
//  map-gen.js — 임시 지도를 Tiled 형식(.tmj)으로 뽑는 도구 (node tools/cli.js maps)
//
//  지도는 나중에 사람이 Tiled 로 손으로 짭니다. 그 전까지 규칙을 시험할 수 있게
//  「들판 하나 = 구역 하나」인 단순한 배치로 뽑아 둡니다 (docs/MAP-REFERENCE-PLAN.md 2번).
//  그래도 오픈월드처럼 — 같은 격 들판 사이는 넓게 트이고, 가장자리는 들쭉날쭉, 들판 안에 나무 · 바위가 흩어집니다.
//  이미 있는 지도는 덮어쓰지 않습니다 — 손으로 고친 것을 지우지 않게 (--force 로만).
//
//  buildTmj 는 시험(tests/map.test.js)에서 작은 지도를 만들 때도 씁니다.
// ============================================================
'use strict';
const zlib = require('zlib');
const { mulberry } = require('../js/map.js');

const TILE = 16;
// 타일셋 tiles.png 의 칸 순서. 벽 · 물 · 나무 · 바위는 못 지나갑니다 (Tiled 타일 속성 solid).
const FLOOR = 0, WALL = 1, WATER = 2, TREE = 3, ROCK = 4, ROAD = 5;
const TILE_KINDS = 6;
const SOLID = [WALL, WATER, TREE, ROCK];

// ---------- Tiled JSON ----------
function tiledProps(o) {
  return Object.entries(o).filter(([, v]) => v !== undefined).map(([name, value]) => ({
    name, value, type: typeof value === 'boolean' ? 'bool' : Number.isInteger(value) ? 'int' : typeof value === 'number' ? 'float' : 'string'
  }));
}

// spec: { w, h, tiles(칸마다 위의 타일 번호), areas, posts, ports, secrets, npcs } — 좌표는 칸 단위
// posts 는 w · h 가 있으면 사각형(큰 보스), 없으면 점(한 칸)으로 적습니다.
function buildTmj(spec) {
  let nextId = 1;
  const rectObj = ({ name = '', x, y, w, h, ...p }) =>
    ({ id: nextId++, name, type: '', x: x * TILE, y: y * TILE, width: w * TILE, height: h * TILE, rotation: 0, visible: true, properties: tiledProps(p) });
  const pointObj = ({ name = '', x, y, ...p }) =>
    ({ id: nextId++, name, type: '', point: true, x: (x + 0.5) * TILE, y: (y + 0.5) * TILE, width: 0, height: 0, rotation: 0, visible: true, properties: tiledProps(p) });
  const postObj = o => (o.w ? rectObj(o) : pointObj(o));
  const group = (id, name, objects) => ({ id, name, type: 'objectgroup', draworder: 'topdown', opacity: 1, visible: true, x: 0, y: 0, objects });
  const layers = [
    { id: 1, name: 'ground', type: 'tilelayer', width: spec.w, height: spec.h, x: 0, y: 0, opacity: 1, visible: true, data: Array.from(spec.tiles, t => t + 1) },
    group(2, 'areas', (spec.areas || []).map(rectObj)),
    group(3, 'posts', (spec.posts || []).map(postObj)),
    group(4, 'ports', (spec.ports || []).map(rectObj)),
    group(5, 'secrets', (spec.secrets || []).map(rectObj)),
    group(6, 'npc', (spec.npcs || []).map(pointObj))
  ];
  return {
    compressionlevel: -1, type: 'map', version: '1.10', tiledversion: '1.10.2', orientation: 'orthogonal', renderorder: 'right-down', infinite: false,
    width: spec.w, height: spec.h, tilewidth: TILE, tileheight: TILE, nextlayerid: 7, nextobjectid: nextId, layers,
    properties: tiledProps(spec.props || {}),
    tilesets: [{
      firstgid: 1, name: 'draft', image: 'tiles.png', imagewidth: TILE * TILE_KINDS, imageheight: TILE, tilewidth: TILE, tileheight: TILE,
      tilecount: TILE_KINDS, columns: TILE_KINDS, margin: 0, spacing: 0,
      tiles: SOLID.map(id => ({ id, properties: tiledProps({ solid: true, water: id === WATER || undefined }) }))
    }]
  };
}

// 타일셋 그림 — 바닥 · 벽 · 물 · 나무 · 바위 · 길 (Tiled 가 지도를 열 때 필요합니다)
function tilesPng() {
  const W = TILE * TILE_KINDS, H = TILE;
  const px = Buffer.alloc(W * H * 4);
  const put = (x, y, [r, g, b]) => { const i = (y * W + x) * 4; px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255; };
  const PAPER = [234, 214, 166];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = Math.floor(x / TILE), lx = x % TILE;
    const r = Math.hypot(lx - 7.5, y - 7.5);
    if (t === FLOOR) put(x, y, lx === 0 || y === 0 ? [227, 204, 149] : PAPER);
    else if (t === WALL) put(x, y, y < 2 ? [92, 56, 26] : [63, 36, 15]);
    else if (t === WATER) put(x, y, (y + (lx >> 2)) % 6 === 0 ? [74, 128, 184] : [31, 90, 150]);
    else if (t === TREE) put(x, y, r < 6.5 ? (r < 3 ? [92, 116, 52] : [74, 94, 42]) : PAPER);
    else if (t === ROCK) put(x, y, r < 6.5 && y > 2 ? (y < 7 ? [150, 140, 124] : [122, 112, 98]) : PAPER);
    else put(x, y, (lx + y) % 7 === 0 ? [224, 200, 150] : [242, 226, 184]);
  }
  return encodePng(W, H, px);
}

// RGBA 버퍼 → PNG (그림 도구들이 같이 씁니다 — design/map-concept 도)
function encodePng(W, H, px) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = buf => { let c = 0xFFFFFFFF; for (const b of buf) c = crcTable[(c ^ b) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((W * 4 + 1) * H);
  const src = Buffer.from(px.buffer, px.byteOffset, px.byteLength);
  for (let y = 0; y < H; y++) src.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// ---------- 들판 배치로 지도 짜기 ----------
// 들판 하나는 20×14칸, 들판 사이 틈은 4칸. 아래 그림에서 들판은 두 글자, 그 사이의 한 글자가 잇는 방법입니다.
//   들판    S. 어귀 · .. 지나가는 곳 · Nn N격 구역 · NE N격 정예의 홀 · NB N격 보스의 자리 · NH N격 숨은 곳
//           (N 은 그 지도가 품은 격 목록에서 몇 번째인가)
// 7~20격 일곱 장이 씁니다 — 1~6격(overworld)은 시안 배치를 그대로 옮긴 것이라 아래 overworld() 가 따로 짭니다.
//   잇기    - | 트인 길(8~10칸) · ~ 강(건너편이 보이기만) · ? 숨은 샛길 · b 보스가 막은 고갯길 · e 정예가 막은 고갯길 · = 들판을 터서 하나로
// 좁은 곳은 고갯길(3칸)뿐입니다 — 3×3 크기의 보스(또는 길막 정예)가 막고 섭니다.
const FIELD_W = 20, FIELD_H = 14, GAP = 4, PITCH_X = FIELD_W + GAP, PITCH_Y = FIELD_H + GAP;
const OPEN = 10, PASS = 3, BIG = 3, CLUMPS = 6;

function layoutFromPlan(plan) {
  // 들판 줄은 짝수 줄, 그 아래 홀수 줄은 세로 잇기. 들판은 3글자 간격, 가로 잇기는 들판 바로 뒤 글자.
  const rooms = [], links = [];
  const at = new Map();
  for (let r = 0; r < plan.length; r += 2) {
    const line = plan[r];
    for (let c = 0; c * 3 < line.length; c++) {
      const tok = line.slice(c * 3, c * 3 + 2);
      if (!tok.trim()) continue;
      const room = { c, r: r / 2, tok, slot: /^\d/.test(tok) ? Number(tok[0]) : 0, kind: /^\d/.test(tok) ? tok[1] : tok };
      rooms.push(room);
      at.set(`${c},${r / 2}`, room);
    }
  }
  for (const room of rooms) {
    const line = plan[room.r * 2], below = plan[room.r * 2 + 1] || '';
    const h = line[room.c * 3 + 2], v = below[room.c * 3];
    const east = at.get(`${room.c + 1},${room.r}`), south = at.get(`${room.c},${room.r + 1}`);
    if (h && h !== ' ' && east) links.push({ a: room, b: east, how: h, dir: 'h' });
    if (v && v !== ' ' && south) links.push({ a: room, b: south, how: v, dir: 'v' });
  }
  return { rooms, links, cols: Math.max(...rooms.map(o => o.c)) + 1, rows: Math.max(...rooms.map(o => o.r)) + 1 };
}

// 부드러운 값 잡음 (0~1) — 들판 가장자리를 들쭉날쭉하게
function valueNoise(seed) {
  const hash = (x, y) => {
    let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ seed;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const s = t => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), tx = s(x - xi), ty = s(y - yi);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  };
}

// data: js/data.js 에서 꺼낸 { ENEMIES, ZONES }
// ranks: 그림의 N 번째 = 몇 격인가 · opts: { seed, plaza(어귀 이름), obstacle(rank) → 그 격 들판에 흩어질 장애물 타일, entry(어귀) → 문의 광장으로 가는 문 }
function generate(plan, ranks, data, opts) {
  const { rooms, links, cols, rows } = layoutFromPlan(plan);
  const rng = mulberry(opts.seed);
  const noise = valueNoise(opts.seed);
  const w = GAP + cols * PITCH_X, h = GAP + rows * PITCH_Y;
  const tiles = new Uint8Array(w * h).fill(WALL);
  const keep = new Uint8Array(w * h);   // 장애물을 두지 않을 칸 — 길목 · 정해진 자리 곁 · 시작점
  const idx = (x, y) => y * w + x;
  const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  const fill = (x, y, rw, rh, t, guard) => {
    for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) {
      if (!inside(x + i, y + j)) continue;
      if (t !== null) tiles[idx(x + i, y + j)] = t;
      if (guard) keep[idx(x + i, y + j)] = 1;
    }
  };
  const origin = room => ({ x: GAP + room.c * PITCH_X, y: GAP + room.r * PITCH_Y });
  const center = room => { const o = origin(room); return { x: o.x + (FIELD_W >> 1), y: o.y + (FIELD_H >> 1) }; };
  for (const room of rooms) room.rank = room.slot ? ranks[room.slot - 1] : 0;

  // 1) 들판 — 가장자리는 0~2칸 들쭉날쭉, 모서리는 둥글게
  for (const room of rooms) {
    const o = origin(room);
    for (let y = 0; y < FIELD_H; y++) for (let x = 0; x < FIELD_W; x++) {
      const ex = Math.min(x, FIELD_W - 1 - x), ey = Math.min(y, FIELD_H - 1 - y);
      const m = Math.floor(noise((o.x + x) * 0.22, (o.y + y) * 0.22) * 3);
      if (ex >= m && ey >= m && ex + ey >= 3) tiles[idx(o.x + x, o.y + y)] = FLOOR;
    }
  }

  // 2) 잇기 — 틈(4칸)을 뚫고 양쪽 들판 안으로 몇 칸 더 파서 들쭉날쭉한 가장자리에 막히지 않게
  const posts = [], secrets = [], gates = [];
  for (const l of links) {
    const o = origin(l.a), H = l.dir === 'h';
    const len = H ? FIELD_H : FIELD_W;                       // 맞닿은 변의 길이
    const g0 = H ? o.x + FIELD_W : o.y + FIELD_H;            // 틈이 시작하는 칸
    const span = (from, width, depth, t, guard) => H        // 맞닿은 변을 따라 from 부터 width 칸, 틈 양쪽으로 depth 칸 더
      ? fill(g0 - depth, o.y + from, GAP + depth * 2, width, t, guard)
      : fill(o.x + from, g0 - depth, width, GAP + depth * 2, t, guard);
    if (l.how === '~') {
      span(1, len - 2, 0, WATER);                            // 강 — 틈을 다 메우고
      if (H) { fill(g0 - 2, o.y + 1, 2, len - 2, FLOOR); fill(g0 + GAP, o.y + 1, 2, len - 2, FLOOR); }   // 양쪽은 곧은 강둑
      else { fill(o.x + 1, g0 - 2, len - 2, 2, FLOOR); fill(o.x + 1, g0 + GAP, len - 2, 2, FLOOR); }
    } else if (l.how === '=') {
      span(1, len - 2, 3, FLOOR, true);
    } else if (l.how === '?') {
      const from = (len - 2) >> 1;
      span(from, 2, 3, FLOOR, true);
      span(from, 2, 0, WALL);                                // 틈 안은 벽으로 그려 두고 지나갈 수 있게
      secrets.push(H ? { name: '숨은 샛길', x: g0, y: o.y + from, w: GAP, h: 2 } : { name: '숨은 샛길', x: o.x + from, y: g0, w: 2, h: GAP });
    } else if (l.how === 'b' || l.how === 'e') {
      const from = (len - PASS) >> 1;
      span(from, PASS, 3, FLOOR, true);
      span(from, PASS, 0, ROAD);
      gates.push({ how: l.how, rank: l.a.rank || l.b.rank, x: H ? g0 : o.x + from, y: H ? o.y + from : g0 });
    } else {
      const open = Math.min(OPEN, len - 4);
      const from = 2 + Math.floor(rng() * (len - 4 - open + 1));
      span(from, open, 3, FLOOR, true);
    }
  }

  // 3) 첫 공간에서 걸어서 몇 번째 들판인가 — 약한 일반부터 가까운 들판에 세웁니다
  const start = rooms.find(o => o.kind === 'S.');
  const dist = new Map([[start, 0]]);
  for (const q = [start]; q.length;) {
    const a = q.shift();
    for (const l of links) {
      if (l.how === '~') continue;
      const b = l.a === a ? l.b : l.b === a ? l.a : null;
      if (b && !dist.has(b)) { dist.set(b, dist.get(a) + 1); q.push(b); }
    }
  }
  const byDist = list => list.slice().sort((p, q) => dist.get(p) - dist.get(q) || p.r - q.r || p.c - q.c);

  const areas = [], npcs = [], ports = [];
  const so = origin(start), sc = center(start);
  // 어귀(S.) — 몬스터 없는 이름뿐인 곳. 그 지도 첫 격의 지역으로 칩니다
  const firstZone = data.ZONES.find(z => z.rank === ranks[0]);
  areas.push({ name: opts.plaza || '첫 공간', x: so.x, y: so.y, w: FIELD_W, h: FIELD_H, zone: firstZone.id });
  npcs.push({ name: 'start', x: sc.x, y: sc.y }, { name: 'avatarDoor', x: sc.x + 5, y: sc.y - 4 });
  fill(sc.x - 2, sc.y - 2, 5, 5, null, true);
  if (opts.entry) {                                          // 문의 광장으로 돌아가는 문 — 어귀 서쪽 가장자리
    const e = opts.entry(so);
    ports.push(e);
    fill(e.x - 2, e.y - 2, e.w + 4, e.h + 4, null, true);
  }

  const post = (e, x, y, size, blocks) => {
    posts.push(size > 1 ? { name: e.name, x, y, w: size, h: size, enemy: e.id, blocks } : { name: e.name, x, y, enemy: e.id, blocks });
    fill(x - 2, y - 2, size + 4, size + 4, null, true);
  };
  for (const rank of ranks) {
    const zi = data.ZONES.findIndex(z => z.rank === rank);
    const zone = data.ZONES[zi];
    const foes = data.ENEMIES.filter(e => e.zoneIndex === zi);
    const normals = foes.filter(e => e.kind === 'normal');
    const mine = kind => byDist(rooms.filter(o => o.rank === rank && o.kind === kind));
    const fields = mine('n');
    if (fields.length !== normals.length) throw new Error(`${rank}격 — 구역 ${fields.length}개, 일반 ${normals.length}종`);
    fields.forEach((room, i) => {
      const o = origin(room), c = center(room);
      areas.push({ name: normals[i].name, x: o.x, y: o.y, w: FIELD_W, h: FIELD_H, rank, monster: normals[i].id, zone: zone.id });
      fill(c.x - 1, c.y - 1, 3, 3, null, true);             // 한가운데는 비워 둠 — 불러오면 그 지역 들머리(첫 구역 한가운데)에 섭니다
    });
    const fo = origin(fields[0]);
    npcs.push({ name: 'merchant', x: fo.x + 3, y: fo.y + 3, zone: zone.id });
    fill(fo.x + 2, fo.y + 2, 3, 3, null, true);

    // 정해진 자리 — 묶음 정예는 홀에 둥글게, 묶음 밖 정예는 길막(e)부터 채우고 남으면 들판 한가운데
    const sets = foes.filter(e => e.kind === 'elite' && e.set);
    const loose = foes.filter(e => e.kind === 'elite' && !e.set);
    const boss = foes.find(e => e.kind === 'boss'), hidden = foes.find(e => e.kind === 'hidden');
    const mineGates = gates.filter(g => g.rank === rank);
    for (const g of mineGates.filter(g => g.how === 'e')) { const e = loose.shift(); if (e) post(e, g.x, g.y, BIG, true); }
    loose.forEach((e, i) => {
      const c = center(fields[Math.round((i + 1) * fields.length / (loose.length + 1)) - 1]);
      post(e, c.x, c.y, 1, false);
    });
    const halls = mine('E');
    if (sets.length) {
      const hall = halls[0], o = origin(hall);
      const wide = halls.length > 1;                         // 들판 둘을 튼 큰 홀 — 가운데 길을 비우고 위아래를 따라
      sets.forEach((e, i) => {
        if (wide) {
          const top = i < Math.ceil(sets.length / 2), k = top ? i : i - Math.ceil(sets.length / 2), n = top ? Math.ceil(sets.length / 2) : Math.floor(sets.length / 2);
          post(e, o.x + Math.round((k + 1) * (FIELD_W * 2 + GAP) / (n + 1)), top ? o.y + 2 : o.y + FIELD_H - 3, 1, false);
        } else {                                             // 홀 한가운데를 둘러 둥글게
          const c = center(hall), t = (i + 0.5) / sets.length * Math.PI * 2;
          post(e, c.x + Math.round(Math.cos(t) * 6), c.y + Math.round(Math.sin(t) * 4), 1, false);
        }
      });
    }
    const bossGate = mineGates.find(g => g.how === 'b');
    if (bossGate) post(boss, bossGate.x, bossGate.y, BIG, true);
    else { const c = center(mine('B')[0]); post(boss, c.x - 1, c.y - 1, BIG, false); }
    if (hidden) {
      const hRoom = mine('H')[0], c = center(hRoom);
      post(hidden, c.x, c.y, 1, false);
    }
  }

  // 4) 장애물 — 지나가는 곳과 구역 들판에만, 작은 덤불처럼 몇 무더기
  for (const room of rooms) {
    if (room.kind !== 'n' && room.kind !== '..') continue;
    const o = origin(room), t = opts.obstacle(room.rank);
    for (let k = 0; k < CLUMPS; k++) {
      let x = o.x + 2 + Math.floor(rng() * (FIELD_W - 4)), y = o.y + 2 + Math.floor(rng() * (FIELD_H - 4));
      const size = 1 + Math.floor(rng() * 4);
      for (let s = 0; s < size; s++) {
        if (inside(x, y) && tiles[idx(x, y)] === FLOOR && !keep[idx(x, y)]) tiles[idx(x, y)] = t;
        if (rng() < 0.5) x += rng() < 0.5 ? 1 : -1; else y += rng() < 0.5 ? 1 : -1;
      }
    }
  }

  // 5) 시작점에서 닿지 않는 칸은 벽으로 — 갇힌 빈칸에 몬스터가 서지 않게
  const secretAt = new Uint8Array(w * h);
  for (const s of secrets) for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) secretAt[idx(s.x + i, s.y + j)] = 1;
  const open = k => tiles[k] === FLOOR || tiles[k] === ROAD || secretAt[k];
  const seen = new Uint8Array(w * h), q = [idx(sc.x, sc.y)];
  seen[q[0]] = 1;
  for (let n = 0; n < q.length; n++) {
    const k = q[n], x = k % w, y = (k / w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const j = idx(x + dx, y + dy);
      if (inside(x + dx, y + dy) && !seen[j] && open(j)) { seen[j] = 1; q.push(j); }
    }
  }
  for (let k = 0; k < w * h; k++) if (!seen[k] && (tiles[k] === FLOOR || tiles[k] === ROAD)) tiles[k] = WALL;

  return buildTmj({ w, h, tiles, areas, posts, ports, secrets, npcs });
}

// ---------- 1~6격 한 장 (overworld) — design/map-concept 시안 배치 그대로, OVERWORLD_SCALE 배로 크게 ----------
// 땅 모양 · 격 나누기 · 물 · 흙길 · 다리 · 성벽은 tools/overworld-layout.js 가 정하고 (시안 그림과 같이 씀),
// 여기서는 그 칸을 게임 칸으로 바꾸고 구역 · 정해진 자리 · 상인 · 문을 시안 그림의 같은 자리에 둡니다.
//   어둠 → 벽 · 물 · 수로 · 용암 → 물 · 바위 등성이 · 흑요석 벼랑 · 바위턱 → 바위 · 처음의 방을 두른 통바위 → 벽
// 다음 격은 보스(3×3)가 세 칸 틈을 막고 서서 엽니다 — 1 → 2 (수문의 던전 가디언) · 2 → 3 · 4 (숲에서 그대로 이어짐, 3격은 막다른 곳)
// · 4 → 5 (쐐기돌 아치의 거인왕) · 5 → 6 (대성당 뒤 묘실 통로의 불사의 왕) · 왕좌의 방 (벌레의 굴). 트롤 킹은 숲 속 굴에서 막지 않고 기다림
// 아래 좌표는 모두 시안 칸 (176×112) — 배율을 바꿔도 그대로 둡니다.
const OVERWORLD_SCALE = 2.5;
const AREA_INSET = 0.2;   // 구역은 제 자리의 가운데만 — 가장자리 이만큼(변마다)은 몬스터가 없는 빈 땅으로 남겨 쉴 곳을 둠

// 구역의 자리 [x0, y0, x1, y1] (끝 칸 포함) — 어느 몬스터가 어디 서는지는 길을 따라 정합니다:
// 그 격에 들어오는 곳(OVERWORLD_ENTRY)에서 멀어지고 보스에 가까워질수록 센 몬스터 (보스 쪽으로 갈수록 강하게, 사용자 결정).
// 가장 약한 몬스터의 구역 한가운데가 그 지역 들머리입니다 (불러오면 거기 섭니다).
const OVERWORLD_AREAS = {
  1: [[31, 84, 45, 91], [9, 84, 28, 91], [48, 84, 65, 91], [31, 74, 45, 81], [9, 74, 28, 81],      // 수로가 가른 아홉 구역 — 계단 앞에서 수문 쪽으로
      [48, 74, 65, 81], [9, 64, 28, 71], [48, 64, 65, 71], [31, 64, 45, 71]],
  2: [[26, 52, 45, 61], [6, 52, 25, 61], [46, 52, 62, 61], [26, 42, 45, 51], [6, 42, 25, 51],      // 수문 앞에서 왕국 성벽 쪽으로
      [46, 42, 62, 51], [6, 32, 25, 41], [46, 32, 62, 41], [26, 32, 45, 41]],
  3: [[31, 21, 46, 28], [47, 21, 64, 28], [9, 21, 30, 28], [37, 12, 50, 20], [23, 12, 36, 20],     // 성문 앞에서 성 쪽으로 (성 안은 구역 밖)
      [51, 12, 64, 20], [37, 3, 50, 11], [51, 3, 64, 11], [23, 3, 36, 11]],
  4: [[66, 40, 80, 58], [68, 59, 86, 74], [81, 40, 100, 56], [72, 22, 86, 39], [87, 22, 100, 39],  // 숲 가장자리 → 남쪽 · 가운데 → 북쪽 눈밭 → 동쪽 아치 앞
      [87, 57, 109, 74], [101, 36, 109, 56]],
  5: [[116, 44, 132, 58], [116, 59, 132, 73], [116, 74, 132, 89], [133, 74, 149, 89], [133, 59, 149, 73],   // 아치 앞에서 대성당 쪽으로
      [150, 74, 167, 89], [150, 59, 167, 73], [150, 44, 167, 58], [133, 44, 149, 58]],
  6: [[131, 33, 146, 40], [114, 33, 130, 40], [113, 5, 123, 32], [124, 19, 143, 32], [124, 5, 146, 18]]   // 묘실 입구 → 용암 강 → 칠죄종 홀 → 북쪽
};
// 정해진 자리 — 시안 그림의 그 그림 조각 자리 (앞에 서는 것은 한 칸 아래)
//   [이름, x, y] 그 칸에 한 칸짜리 · [이름, x, y, 3] 그 칸을 가운데로 3×3 (길을 막지 않는 보스)
//   [이름, 'gate'] 길을 막는 3×3 — 자리는 overworld-layout.js 의 GATES (어느 배율에서도 세 칸 틈을 막도록)
const OVERWORLD_POSTS = [
  ['던전 가디언', 'gate'],                                              // 지하수로 수문
  ['고블린 족장', 38, 79], ['미믹', 60, 89],                            // 가운데 석상 · 구석의 보물상자
  ['트롤 킹', 12, 38, 3],                                               // 숲 북서쪽 시내 상류의 굴 앞 (길은 막지 않음)
  ['오크 장군', 13, 46], ['숲의 마녀', 54, 41],                         // 야영지 · 오두막
  ['몰락한 왕', 14, 13, 3],                                             // 성 안 왕좌
  ['그리핀 로드', 56, 15], ['히드라', 28, 25], ['카벙클', 60, 11],      // 탑 자리 · 물에 잠긴 안뜰 · 바위턱 폭포 밑
  ['돌 거인', 98, 39], ['서리 거인', 101, 41], ['불의 거인', 98, 43], ['구름 거인', 95, 41],   // 돌 고리
  ['거인왕', 'gate'],                                                   // 쐐기돌 아치
  ['흰 말의 기사', 128, 60], ['붉은 말의 기사', 132, 60], ['검은 말의 기사', 128, 63], ['창백한 말의 기사', 132, 63],   // 네 말의 기사 광장
  ['데스 나이트', 122, 77], ['리치', 160, 55], ['까마귀 왕', 158, 81],  // 영묘 둘 · 숨은 묘실
  ['불사의 왕', 'gate'],                                                // 대성당 — 그 뒤 벼랑의 묘실 통로
  ['칠죄종 · 탐욕', 127, 21], ['칠죄종 · 질투', 133, 21], ['칠죄종 · 색욕', 139, 21], ['칠죄종 · 폭식', 127, 30],
  ['칠죄종 · 오만', 133, 30], ['칠죄종 · 분노', 139, 30], ['칠죄종 · 나태', 142, 25],          // 홀의 불꽃 받침
  ['세계수를 먹는 벌레', 'gate'],                                       // 왕좌의 방으로 가는 굴
  ['마왕', 155, 23, 3], ['관측자', 158, 30]                             // 왕좌 · 문 곁
];
const OVERWORLD_ENTRY = { 1: [39, 91], 2: [38, 60], 3: [44, 28], 4: [66, 50], 5: [116, 48], 6: [136, 39] };   // 계단 위 · 수문 너머 · 옛 성문 자리 · 숲 가장자리 · 아치 너머 · 묘실 입구
const OVERWORLD_MERCHANTS = { sewer: [33, 86], forest: [34, 58], ruins: [40, 26], giantpass: [70, 46], necropolis: [120, 50], abyss: [128, 37] };

function overworld(data) {
  const L = require('./overworld-layout.js').build(OVERWORLD_SCALE);
  const w = L.W, h = L.H, idx = L.idx;
  const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  const tiles = new Uint8Array(w * h);
  const keep = new Uint8Array(w * h);                        // 장애물을 두지 않을 칸 — 정해진 자리 곁 · 들머리 · 상인 · 시작점 · 문 · 길가
  const guard = (x, y, rw, rh, pad) => { for (let j = -pad; j < rh + pad; j++) for (let i = -pad; i < rw + pad; i++) if (inside(x + i, y + j)) keep[idx(x + i, y + j)] = 1; };
  const rectOf = (x0, y0, x1, y1) => { const [a, b] = L.span(x0, x1), [c, d] = L.span(y0, y1); return { x: a, y: c, w: b - a + 1, h: d - c + 1 }; };

  // 1) 땅 → 칸
  for (let i = 0; i < w * h; i++) {
    const t = L.ter[i];
    tiles[i] = t === L.VOID || L.wallMask[i] ? WALL
      : t === L.WATER || t === L.CANAL || t === L.LAVA ? WATER
      : L.hgt[i] === 3 ? ROCK
      : t === L.ROCKY && L.bio[i] === 7 ? WALL
      : FLOOR;
  }
  // 흙길 — 시안 길의 폭 그대로 (숲 시내를 건너는 곳은 통나무 다리). ROADS 는 시안 픽셀 좌표
  for (const r of L.ROADS) {
    const pad = r.hw + 2, px = v => (v - 8) / L.T;            // 시안 픽셀 → 시안 칸
    const x0 = Math.max(0, Math.floor(L.fc(px(Math.min(r.ax, r.bx) - pad)))), x1 = Math.min(w - 1, Math.ceil(L.fc(px(Math.max(r.ax, r.bx) + pad))));
    const y0 = Math.max(0, Math.floor(L.fc(px(Math.min(r.ay, r.by) - pad)))), y1 = Math.min(h - 1, Math.ceil(L.fc(px(Math.max(r.ay, r.by) + pad))));
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const X = L.toC(tx) * L.T + 8, Y = L.toC(ty) * L.T + 8, vx = r.bx - r.ax, vy = r.by - r.ay, l2 = vx * vx + vy * vy || 1;
      const k = Math.max(0, Math.min(1, ((X - r.ax) * vx + (Y - r.ay) * vy) / l2));
      const i = idx(tx, ty);
      if (Math.hypot(X - (r.ax + vx * k), Y - (r.ay + vy * k)) <= pad && (tiles[i] === FLOOR || tiles[i] === WATER)) { tiles[i] = ROAD; keep[i] = 1; }
    }
  }
  const fillRect = (r, t) => { for (let j = 0; j < r.h; j++) for (let i = 0; i < r.w; i++) tiles[idx(r.x + i, r.y + j)] = t; };
  for (const b of L.BRIDGES) fillRect(b.vertical ? rectOf(b.x, b.y, b.x + b.wide - 1, b.y + b.len - 1) : rectOf(b.x, b.y, b.x + b.len - 1, b.y + b.wide - 1), ROAD);
  for (const [x, y] of L.CASTLE.columns) fillRect(rectOf(x, y, x, y), ROCK);

  // 2) 구역 · 정해진 자리 · 상인 · 시작점 · 문
  const areas = [], posts = [], npcs = [], ports = [], gates = [];
  const sewer = data.ZONES.find(z => z.rank === 1);
  areas.push({ name: '첫 공간', ...rectOf(30, 95, 48, 107), zone: sewer.id });
  const [sx, sy] = L.spot1(39, 101), [dx, dy] = L.spot1(45, 98);
  npcs.push({ name: 'start', x: sx, y: sy }, { name: 'avatarDoor', x: dx, y: dy });
  guard(sx, sy, 1, 1, 2); guard(dx, dy, 1, 1, 1);
  const foes = data.ENEMIES.filter(e => e.rank.n <= 6 && e.kind !== 'normal');
  for (const [name, x, y, size = 1] of OVERWORLD_POSTS) {
    const e = foes.find(f => f.name === name);
    if (!e) throw new Error(`정해진 자리 — ${name} 이(가) 1~6격에 없음`);
    const blocks = x === 'gate', big = blocks || size > 1;
    if (blocks && !L.GATES[e.id]) throw new Error(`길막 자리 — ${name}(${e.id}) 이(가) GATES 에 없음`);
    const [px, py] = blocks ? L.GATES[e.id] : big ? L.spot3(x, y) : L.spot1(x, y);
    posts.push(big ? { name, x: px, y: py, w: 3, h: 3, enemy: e.id, blocks } : { name, x: px, y: py, enemy: e.id, blocks });
    guard(px, py, big ? 3 : 1, big ? 3 : 1, 2);
  }
  const missing = foes.filter(e => !posts.some(p => p.enemy === e.id));
  if (missing.length) throw new Error(`정해진 자리가 없는 정예 · 보스 — ${missing.map(e => e.name).join(', ')}`);
  // 구역 — 길을 따라 약한 것부터: 들어오는 곳에서의 거리 − 보스까지의 거리가 작은 구역부터 (장애물을 두기 전 칸으로 잼)
  const walkFrom = cells => {
    const d = new Int32Array(w * h).fill(-1), q = [];
    for (const k of cells) if (d[k] < 0) { d[k] = 0; q.push(k); }
    for (let n = 0; n < q.length; n++) {
      const k = q[n], x = k % w, y = (k / w) | 0;
      for (const [ex, ey] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const j = idx(x + ex, y + ey);
        if (inside(x + ex, y + ey) && d[j] < 0 && (tiles[j] === FLOOR || tiles[j] === ROAD)) { d[j] = d[k] + 1; q.push(j); }
      }
    }
    return d;
  };
  for (let rank = 1; rank <= 6; rank++) {
    const zi = data.ZONES.findIndex(z => z.rank === rank), zone = data.ZONES[zi];
    const normals = data.ENEMIES.filter(e => e.zoneIndex === zi && e.kind === 'normal');
    const rects = OVERWORLD_AREAS[rank];
    if (rects.length !== normals.length) throw new Error(`${rank}격 — 구역 ${rects.length}개, 일반 ${normals.length}종`);
    const boss = posts.find(q => q.enemy === data.ENEMIES.find(e => e.zoneIndex === zi && e.kind === 'boss').id);
    const fromEntry = walkFrom([idx(...L.spot1(...OVERWORLD_ENTRY[rank]))]);
    const toBoss = walkFrom([...Array(9).keys()].map(k => idx(boss.x + k % 3, boss.y + ((k / 3) | 0))));
    const spots = rects.map(([x0, y0, x1, y1]) => {
      const r = rectOf(x0, y0, x1, y1), ix = Math.max(2, Math.round(r.w * AREA_INSET)), iy = Math.max(2, Math.round(r.h * AREA_INSET));
      const a = { x: r.x + ix, y: r.y + iy, w: r.w - ix * 2, h: r.h - iy * 2 };
      let sum = 0, n = 0;
      for (let y = a.y; y < a.y + a.h; y++) for (let x = a.x; x < a.x + a.w; x++) {
        const k = idx(x, y);
        if (fromEntry[k] >= 0 && toBoss[k] >= 0) { sum += fromEntry[k] - toBoss[k]; n++; }
      }
      if (!n) throw new Error(`${rank}격 구역 자리 [${x0}, ${y0}] — 들어오는 곳이나 보스에서 걸어서 닿지 않음`);
      return { ...a, score: sum / n };
    }).sort((p, q) => p.score - q.score);
    spots.forEach((sp, k) => {
      const a = { name: normals[k].name, x: sp.x, y: sp.y, w: sp.w, h: sp.h, rank, monster: normals[k].id, zone: zone.id };
      areas.push(a);
      if (k === 0) { gates.push(a); guard(a.x + (a.w >> 1) - 1, a.y + (a.h >> 1) - 1, 3, 3, 0); }   // 들머리는 비워 둠
    });
    const [mx, my] = L.spot1(...OVERWORLD_MERCHANTS[zone.id]);
    npcs.push({ name: 'merchant', x: mx, y: my, zone: zone.id });
    guard(mx, my, 1, 1, 1);
  }
  // 마왕 뒤 — 관측자 곁에 문의 광장으로 가는 문 (마왕을 꺾어야 열림) · 시안의 문 그림은 155 · 156 칸 사이가 가운데
  const king = foes.find(e => e.rank.n === 6 && e.kind === 'boss');
  const hub = { name: 'hub', label: '문의 광장', x: Math.round(L.fc(155.5)) - 1, y: L.spot1(0, 31)[1], w: 2, h: 1, to: 'hub.overworld', opensAfter: king.id };
  ports.push(hub);
  guard(hub.x, hub.y, 2, 1, 2);

  // 3) 나무 · 바위 무더기 — 시안의 숲덩이 잡음이 짙은 자리에만 (덩어리 숲 — 사이는 넓게 트임)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = idx(x, y);
    if (tiles[i] !== FLOOR || keep[i]) continue;
    const b = L.bio[i], grove = L.fbm(L.toC(x) * 0.16, L.toC(y) * 0.16, 83), r = L.hash(x, y, 80);
    if ((b === 2 && grove > 0.6 && r < 0.8) || (b === 3 && grove > 0.64 && r < 0.6) || (b === 4 && grove > 0.6 && r < 0.55) || (b === 5 && grove > 0.62 && r < 0.3)) tiles[i] = TREE;
    else if ((b === 4 && r < 0.012) || (b === 6 && r < 0.035)) tiles[i] = ROCK;
  }

  // 4) 시작점에서 닿는 칸 — 나무 · 바위 무더기에 갇힌 정해진 자리 · 들머리 · 상인은 가까운 길까지 나무를 베어 이음
  const STEP = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const open = k => tiles[k] === FLOOR || tiles[k] === ROAD;
  const seen = new Uint8Array(w * h);
  const flood = from => {
    const q = [from];
    seen[from] = 1;
    for (let n = 0; n < q.length; n++) {
      const k = q[n], x = k % w, y = (k / w) | 0;
      for (const [ex, ey] of STEP) {
        const j = idx(x + ex, y + ey);
        if (inside(x + ex, y + ey) && !seen[j] && open(j)) { seen[j] = 1; q.push(j); }
      }
    }
  };
  flood(idx(sx, sy));
  const carve = from => {                                    // 나무 · 바위만 지나 가장 가까운 닿는 칸까지 — 그 길의 나무 · 바위를 바닥으로
    const back = new Int32Array(w * h).fill(-2), q = [from];
    back[from] = -1;
    for (let n = 0; n < q.length; n++) {
      const k = q[n], x = k % w, y = (k / w) | 0;
      if (seen[k]) { for (let c = back[k]; c >= 0; c = back[c]) if (tiles[c] === TREE || tiles[c] === ROCK) tiles[c] = FLOOR; return; }
      for (const [ex, ey] of STEP) {
        const j = idx(x + ex, y + ey);
        if (inside(x + ex, y + ey) && back[j] === -2 && [FLOOR, ROAD, TREE, ROCK].includes(tiles[j])) { back[j] = k; q.push(j); }
      }
    }
  };
  const stand = [...posts.flatMap(p => { const out = []; for (let j = 0; j < (p.h || 1); j++) for (let i = 0; i < (p.w || 1); i++) out.push([p.name, p.x + i, p.y + j]); return out; }),
    ...npcs.map(n => [n.name, n.x, n.y]), ...gates.map(a => [`${a.name} 구역 한가운데(들머리)`, a.x + (a.w >> 1), a.y + (a.h >> 1)])];
  for (const [, x, y] of stand) {
    const k = idx(x, y);
    if (seen[k] || !open(k)) continue;
    carve(k);
    flood(k);
  }
  for (let k = 0; k < w * h; k++) {                         // 그래도 갇힌 빈칸은 둘레의 나무 · 바위로 메움 — 몬스터가 서지 않게
    if (seen[k] || !open(k)) continue;
    const nb = [k - 1, k + 1, k - w, k + w].map(j => tiles[j]);
    tiles[k] = nb.includes(TREE) ? TREE : nb.includes(ROCK) ? ROCK : WALL;
  }
  // 서는 자리는 모두 걸을 수 있는 칸이어야 — 시안을 고쳐 어긋나면 여기서 알림
  const bad = stand.filter(([, x, y]) => !seen[idx(x, y)]);
  if (bad.length) throw new Error(`걸을 수 없는 자리 — ${bad.map(([n, x, y]) => `${n}(${x},${y})`).join(', ')}`);

  return buildTmj({ w, h, tiles, areas, posts, ports, npcs });
}

// ---------- 7~20격 — 비슷한 것끼리 일곱 장 (docs/MAP-REFERENCE-PLAN.md 2-2) ----------
// 어귀(S.)에 문의 광장으로 돌아가는 문이 있고, 광장의 그 장 문으로 들어오면 그 앞에 섭니다.
// 바로 앞 격이 같은 장에 있으면 그 보스가 고갯길(b)을 막고, 앞 격이 다른 장에 있는 먼 격(①의 13격 · ②의 12격)은
// 어귀 아래 지나가는 곳(..)으로 처음부터 들어갈 수 있되, 지금 격의 들판과는 강(~)으로 갈려 보이기만 합니다.
const REALMS = [
  { name: 'legends', title: '인간의 전설', ranks: [7, 13], obstacle: ROCK, plan: [
    '         1E          1H',
    '         |           ?',
    'S.-1n-1n-1n-1n-1n-1n-1n-1n-1n-1B',
    '|  ~  ~  ~  ~  ~  ~  ~  ~  ~',
    '..-2n-2n-2n-2n-2n-2n-2n-2n-2n',
    '                           |',
    '                           2n-2B'
  ] },
  { name: 'arthurian', title: '원탁과 마법', ranks: [8, 9, 12], obstacle: TREE, plan: [
    '         1E       1H                   2E',
    '         |        ?                    |',
    'S.-1n-1n-1n-1n-1n-1n-1n-1n-1nb2n-2n-2n-2n-2n-2n-2n-2n-2n-2B',
    '|  ~  ~  ~  ~  ~  ~',
    '..-3n-3n-3n-3n-3E-3B'
  ] },
  { name: 'east', title: '동방', ranks: [10, 11], obstacle: TREE, plan: [
    '      1E                         2E       2H',
    '      |                          |        ?',
    'S.-1n-1n-1n-1n-1n-1n-1nb2n-2n-2n-2n-2n-2n-2n-2n-2n-2B'
  ] },
  { name: 'heavenhell', title: '천국과 지옥', ranks: [14, 15], obstacle: ROCK, plan: [
    '            1E',
    '            |',
    'S.-1n-1n-1n-1n-1n-1n-1n-1n-1n',
    '         ~  ~  ~  ~  ~  ~  b',
    '   2B-2E-2n-2n-2n-2n-2n-2n-2n'
  ] },
  { name: 'gods', title: '신들의 시대', ranks: [16, 17, 18], obstacle: ROCK, plan: [
    '      1E=1E                2E                   3E',
    '      |                    |                    |',
    'S.-1n-1n-1n-1n-1n-1nb2n-2n-2n-2n-2n-2nb3n-3n-3n-3n-3n-3n-3n-3B'
  ] },
  { name: 'oldones', title: '르뤼에', ranks: [19], obstacle: ROCK, plan: [
    '            1E',
    '            |',
    'S.-1n-1n-1n-1n-1n-1n-1n-1B'
  ] },
  { name: 'outer', title: '바깥', ranks: [20], obstacle: ROCK, plan: [
    'S.-1n-1n-1n-1n-1n-1n-1n-1n-1n-1B'
  ] }
];
function realm(data, r, i) {
  return generate(r.plan, r.ranks, data, {
    seed: 11 + i * 7,
    plaza: `${r.title} 어귀`,
    obstacle: () => r.obstacle,
    entry: o => ({ name: 'in', label: '문의 광장', x: o.x + 2, y: o.y + (FIELD_H >> 1) - 1, w: 1, h: 2, to: `hub.${r.name}` })
  });
}

// ---------- 문의 광장 (hub) ----------
// 지도끼리 오가는 넓은 광장. 북쪽 가장자리에 7~20격 일곱 장의 문, 남쪽에 마왕의 성(overworld)으로 돌아가는 문.
// 장마다 문은 그 앞 격의 보스를 꺾으면 열립니다 (docs/MAP-REFERENCE-PLAN.md 2-2 표).
// first — 그 장이 시작하는 격 (그 지도가 아직 없으면 그 격의 지역으로 지도 밖에 나섭니다) · after — 그 격의 보스를 꺾어야 열림
const HUB_DOORS = [
  { name: 'legends',    label: '① 인간의 전설', first: 7,  after: 6 },
  { name: 'arthurian',  label: '② 원탁과 마법', first: 8,  after: 7 },
  { name: 'east',       label: '③ 동방',        first: 10, after: 9 },
  { name: 'heavenhell', label: '④ 천국과 지옥', first: 14, after: 13 },
  { name: 'gods',       label: '⑤ 신들의 시대', first: 16, after: 15 },
  { name: 'oldones',    label: '⑥ 르뤼에',      first: 19, after: 18 },
  { name: 'outer',      label: '⑦ 바깥',        first: 20, after: 19 }
];
function hub(data) {
  const W = 84, H = 44, cx = W >> 1, cy = (H >> 1) + 2, rx = 38, ry = 17;
  const noise = valueNoise(7);
  const tiles = new Uint8Array(W * H).fill(WALL);
  const set = (x, y, t) => { tiles[y * W + x] = t; };
  // 둥근 광장 — 가장자리만 살짝 들쭉날쭉
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
    if (d < 1 - noise(x * 0.25, y * 0.25) * 0.12) set(x, y, FLOOR);
  }
  // 가운데 샘과 그 둘레 길, 남쪽 문에서 샘까지 길
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const r = Math.hypot((x - cx) / 1.6, y - cy);
    if (r < 3) set(x, y, WATER);
    else if (r < 5) set(x, y, ROAD);
  }
  for (let y = cy + 5; y < cy + ry; y++) for (let x = cx - 1; x <= cx + 1; x++) if (tiles[y * W + x] === FLOOR) set(x, y, ROAD);

  const boss = rank => data.ENEMIES.find(e => e.rank.n === rank && e.kind === 'boss');
  const zoneOf = rank => data.ZONES.find(z => z.rank === rank);
  const ports = HUB_DOORS.map((d, i) => {
    const x = Math.round(cx - rx * 0.78 + (rx * 1.56) * i / (HUB_DOORS.length - 1)) - 1;
    let y = 0;
    while (tiles[y * W + x] !== FLOOR || tiles[y * W + x + 1] !== FLOOR) y++;   // 북쪽 가장자리의 첫 바닥 칸
    for (let j = y; j < y + 4; j++) { set(x, j, ROAD); set(x + 1, j, ROAD); }   // 문 앞 짧은 길
    return { name: d.name, label: d.label, x, y, w: 2, h: 1, to: `${d.name}.in`, opensAfter: boss(d.after).id, zone: zoneOf(d.first).id };
  });
  // 남쪽 — 마왕의 성으로 돌아가는 문 (늘 열림)
  let sy = H - 1;
  while (tiles[sy * W + cx] !== ROAD && tiles[sy * W + cx] !== FLOOR) sy--;
  ports.push({ name: 'overworld', label: '마왕의 성으로', x: cx - 1, y: sy, w: 3, h: 1, to: 'overworld.hub' });
  const npcs = [{ name: 'start', x: cx, y: sy - 2 }];
  return buildTmj({ w: W, h: H, tiles, ports, npcs, props: { title: '문의 광장' } });
}

// 뽑을 지도 전부 — { 파일 이름: 만드는 함수 }
function allMaps(data) {
  const out = { overworld: overworld(data), hub: hub(data) };
  REALMS.forEach((r, i) => { out[r.name] = realm(data, r, i); });
  return out;
}

module.exports = { TILE, FLOOR, WALL, WATER, TREE, ROCK, ROAD, buildTmj, tilesPng, encodePng, generate, overworld, hub, allMaps, layoutFromPlan, HUB_DOORS, REALMS };
