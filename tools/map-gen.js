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
  for (let y = 0; y < H; y++) px.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// ---------- 들판 배치로 지도 짜기 ----------
// 들판 하나는 20×14칸, 들판 사이 틈은 4칸. 아래 그림에서 들판은 두 글자, 그 사이의 한 글자가 잇는 방법입니다.
//   들판    S. 첫 공간 · .. 지나가는 곳 · Nn N격 구역 · NE N격 정예의 홀 · NB N격 보스의 자리 · NH N격 숨은 곳
//           (N 은 그 지도가 품은 격 목록에서 몇 번째인가 — overworld 는 1~6격이라 격 번호 그대로)
//   잇기    - | 트인 길(8~10칸) · ~ 강(건너편이 보이기만) · ? 숨은 샛길 · b 보스가 막은 고갯길 · e 정예가 막은 고갯길 · = 들판을 터서 하나로
// 좁은 곳은 고갯길(3칸)뿐입니다 — 3×3 크기의 보스(또는 길막 정예)가 막고 섭니다.
const FIELD_W = 20, FIELD_H = 14, GAP = 4, PITCH_X = FIELD_W + GAP, PITCH_Y = FIELD_H + GAP;
const OPEN = 10, PASS = 3, BIG = 3, CLUMPS = 6;

// 1~6격 — 첫 공간에서 1격(위)과 4격(아래). 1격 보스 너머로 2 · 3격, 4격 보스(거인왕) 너머로 5 · 6격.
// 4격의 첫 구역은 첫 공간 · 1격 들판과 강으로 갈려 보이기만 하고, 걸어서는 고갯길 어귀를 돌아가야 합니다.
// 길을 막는 것은 보스와 6격의 세계수를 먹는 벌레뿐 — 다른 정예는 들판 한가운데 서서 골라 잡습니다.
const OVERWORLD = [
  '                              3B',
  '                              |',
  '   2B-2n-2n-2n-2n-2n-2n-2n-2n 3n-3n-3n-3n',
  '                           |        ?  |',
  '                           2n       3H 3n',
  '                           |           |',
  '1n-1n-1n-1n-1n-1n-1n-1n-1nb..-3n-3n-3n-3n',
  '|  ~',
  'S.~4n',
  '|  |',
  '..-4n-4n-4n-4n-4n-4n-4Eb..-6n-6n',
  '                        |     |',
  '                        5n    6n-6n-6n-6E=6Ee..b6H',
  '                        |',
  '5B-5n-5n-5n-5n-5n-5n-5n-5n',
  '      ?        |',
  '      5H       5E'
];

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
// ranks: 그림의 N 번째 = 몇 격인가 · opts: { seed, obstacle(rank) → 그 격 들판에 흩어질 장애물 타일, exit(rank, boss, hRoom) → 문 }
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
  areas.push({ name: '첫 공간', x: so.x, y: so.y, w: FIELD_W, h: FIELD_H });
  npcs.push({ name: 'start', x: sc.x, y: sc.y }, { name: 'avatarDoor', x: sc.x + 5, y: sc.y - 4 });
  fill(sc.x - 2, sc.y - 2, 5, 5, null, true);

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
      const exit = opts.exit && opts.exit(rank, boss, hRoom, origin(hRoom));
      if (exit) { ports.push(exit); fill(exit.x - 2, exit.y - 2, 5, 5, null, true); }
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

function overworld(data) {
  return generate(OVERWORLD, [1, 2, 3, 4, 5, 6], data, {
    seed: 1,
    obstacle: rank => (rank === 2 ? TREE : ROCK),             // 이끼 낀 숲길은 나무, 나머지는 바위
    // 마왕 뒤 — 관측자 곁에 문의 광장으로 가는 문 (마왕을 꺾어야 열림)
    exit: (rank, boss, room, o) => rank === 6 && { name: 'hub', label: '문의 광장', x: o.x + FIELD_W - 4, y: o.y + (FIELD_H >> 1) - 1, w: 1, h: 2, to: 'hub.overworld', opensAfter: boss.id }
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

module.exports = { TILE, FLOOR, WALL, WATER, TREE, ROCK, ROAD, buildTmj, tilesPng, generate, overworld, hub, layoutFromPlan, HUB_DOORS };
