// ============================================================
//  map-gen.js — 임시 지도를 Tiled 형식(.tmj)으로 뽑는 도구 (node tools/cli.js maps)
//
//  지도는 나중에 사람이 Tiled 로 손으로 짭니다. 그 전까지 규칙을 시험할 수 있게
//  「방 하나 = 구역 하나」인 단순한 모양으로 뽑아 둡니다 (docs/MAP-REFERENCE-PLAN.md 2번).
//  이미 있는 지도는 덮어쓰지 않습니다 — 손으로 고친 것을 지우지 않게 (--force 로만).
//
//  buildTmj 는 시험(tests/map.test.js)에서 작은 지도를 만들 때도 씁니다.
// ============================================================
'use strict';
const zlib = require('zlib');

const TILE = 16;
const FLOOR = 0, WALL = 1, WATER = 2;   // 타일셋 tiles.png 의 칸 순서

// ---------- Tiled JSON ----------
function tiledProps(o) {
  return Object.entries(o).filter(([, v]) => v !== undefined).map(([name, value]) => ({
    name, value, type: typeof value === 'boolean' ? 'bool' : Number.isInteger(value) ? 'int' : typeof value === 'number' ? 'float' : 'string'
  }));
}

// spec: { w, h, tiles(칸마다 FLOOR/WALL/WATER), areas, posts, ports, secrets, npcs } — 좌표는 칸 단위
function buildTmj(spec) {
  let nextId = 1;
  const rectObj = ({ name = '', x, y, w, h, ...p }) =>
    ({ id: nextId++, name, type: '', x: x * TILE, y: y * TILE, width: w * TILE, height: h * TILE, rotation: 0, visible: true, properties: tiledProps(p) });
  const pointObj = ({ name = '', x, y, ...p }) =>
    ({ id: nextId++, name, type: '', point: true, x: (x + 0.5) * TILE, y: (y + 0.5) * TILE, width: 0, height: 0, rotation: 0, visible: true, properties: tiledProps(p) });
  const group = (id, name, objects) => ({ id, name, type: 'objectgroup', draworder: 'topdown', opacity: 1, visible: true, x: 0, y: 0, objects });
  const layers = [
    { id: 1, name: 'ground', type: 'tilelayer', width: spec.w, height: spec.h, x: 0, y: 0, opacity: 1, visible: true, data: Array.from(spec.tiles, t => t + 1) },
    group(2, 'areas', (spec.areas || []).map(rectObj)),
    group(3, 'posts', (spec.posts || []).map(pointObj)),
    group(4, 'ports', (spec.ports || []).map(rectObj)),
    group(5, 'secrets', (spec.secrets || []).map(rectObj)),
    group(6, 'npc', (spec.npcs || []).map(pointObj))
  ];
  return {
    compressionlevel: -1, type: 'map', version: '1.10', tiledversion: '1.10.2', orientation: 'orthogonal', renderorder: 'right-down', infinite: false,
    width: spec.w, height: spec.h, tilewidth: TILE, tileheight: TILE, nextlayerid: 7, nextobjectid: nextId, layers,
    tilesets: [{
      firstgid: 1, name: 'draft', image: 'tiles.png', imagewidth: TILE * 3, imageheight: TILE, tilewidth: TILE, tileheight: TILE,
      tilecount: 3, columns: 3, margin: 0, spacing: 0,
      tiles: [{ id: WALL, properties: tiledProps({ solid: true }) }, { id: WATER, properties: tiledProps({ solid: true, water: true }) }]
    }]
  };
}

// 타일셋 그림 — 바닥 · 벽 · 물 세 칸 (Tiled 가 지도를 열 때 필요합니다)
function tilesPng() {
  const W = TILE * 3, H = TILE;
  const px = Buffer.alloc(W * H * 4);
  const put = (x, y, [r, g, b]) => { const i = (y * W + x) * 4; px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = Math.floor(x / TILE), lx = x % TILE;
    if (t === FLOOR) put(x, y, lx === 0 || y === 0 ? [227, 204, 149] : [234, 214, 166]);
    else if (t === WALL) put(x, y, y < 2 ? [92, 56, 26] : [63, 36, 15]);
    else put(x, y, (y + (lx >> 2)) % 6 === 0 ? [74, 128, 184] : [31, 90, 150]);
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

// ---------- 방 배치로 지도 짜기 ----------
// 칸(방) 하나는 안쪽 8×6, 방 사이 틈은 3칸. 아래 그림에서 방은 두 글자, 방 사이의 한 글자가 잇는 방법입니다.
//   방      S. 첫 공간 · .. 지나가는 방 · Nn N격 구역 · NE N격 정예의 홀 · NB N격 보스의 방 · NH N격 숨은 방
//   잇기    - | 통로 · ~ 물(건너편이 보이기만) · ? 숨은 통로 · b 보스가 막은 통로 · e 정예가 막은 통로 · = 방을 터서 하나로
const ROOM_W = 8, ROOM_H = 6, PITCH_X = ROOM_W + 3, PITCH_Y = ROOM_H + 3;

// 1~6격 — 첫 공간에서 1격(위)과 4격(아래). 1격 보스 너머로 2 · 3격, 4격 보스(거인왕) 너머로 5 · 6격.
// 4격의 첫 구역은 첫 공간 · 1격 방과 물로 갈려 보이기만 하고, 걸어서는 고갯길 어귀를 돌아가야 합니다.
// 길을 막는 것은 보스와 6격의 세계수를 먹는 벌레뿐 — 다른 정예는 방 안 탁 트인 곳에 서서 골라 잡습니다.
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
  // 방 줄은 짝수 줄, 그 아래 홀수 줄은 세로 잇기. 방은 3글자 간격, 가로 잇기는 방 바로 뒤 글자.
  const rooms = [], links = [];
  const at = new Map();
  for (let r = 0; r < plan.length; r += 2) {
    const line = plan[r];
    for (let c = 0; c * 3 < line.length; c++) {
      const tok = line.slice(c * 3, c * 3 + 2);
      if (!tok.trim()) continue;
      const room = { c, r: r / 2, tok, rank: /^\d/.test(tok) ? Number(tok[0]) : 0, kind: /^\d/.test(tok) ? tok[1] : tok };
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

// data: js/data.js 에서 꺼낸 { ENEMIES, ZONES }
function overworld(data) {
  const { rooms, links, cols, rows } = layoutFromPlan(OVERWORLD);
  const w = 1 + cols * PITCH_X, h = 1 + rows * PITCH_Y;
  const tiles = new Uint8Array(w * h).fill(WALL);
  const set = (x, y, t) => { tiles[y * w + x] = t; };
  const fill = (x, y, rw, rh, t) => { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) set(x + i, y + j, t); };
  const origin = room => ({ x: 1 + room.c * PITCH_X, y: 1 + room.r * PITCH_Y });
  for (const room of rooms) { const o = origin(room); fill(o.x, o.y, ROOM_W, ROOM_H, FLOOR); }

  const posts = [], secrets = [], gatePosts = [];
  for (const l of links) {
    const o = origin(l.a);
    const rank = l.a.rank || l.b.rank;
    // 통로 세 칸 — 가로는 방의 셋째 줄, 세로는 방의 넷째 칸
    const cells = l.dir === 'h' ? [0, 1, 2].map(i => ({ x: o.x + ROOM_W + i, y: o.y + 2 })) : [0, 1, 2].map(i => ({ x: o.x + 3, y: o.y + ROOM_H + i }));
    if (l.how === '~') {
      if (l.dir === 'h') fill(o.x + ROOM_W, o.y, 3, ROOM_H, WATER); else fill(o.x, o.y + ROOM_H, ROOM_W, 3, WATER);
    } else if (l.how === '=') {
      if (l.dir === 'h') fill(o.x + ROOM_W, o.y, 3, ROOM_H, FLOOR); else fill(o.x, o.y + ROOM_H, ROOM_W, 3, FLOOR);
    } else if (l.how === '?') {
      secrets.push({ name: '숨은 통로', x: cells[0].x, y: cells[0].y, w: l.dir === 'h' ? 3 : 1, h: l.dir === 'h' ? 1 : 3 });
    } else {
      for (const c of cells) set(c.x, c.y, FLOOR);
      if (l.how === 'b' || l.how === 'e') gatePosts.push({ rank, how: l.how, cell: cells[1], link: l });
    }
  }

  // 첫 공간에서 걸어서 몇 번째 방인가 — 약한 일반부터 가까운 방에 세웁니다
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
  const so = origin(start);
  areas.push({ name: '첫 공간', x: so.x, y: so.y, w: ROOM_W, h: ROOM_H });
  npcs.push({ name: 'start', x: so.x + 2, y: so.y + 3 }, { name: 'avatarDoor', x: so.x + 6, y: so.y + 1 });

  for (let rank = 1; rank <= 6; rank++) {
    const zi = data.ZONES.findIndex(z => z.rank === rank);
    const zone = data.ZONES[zi];
    const foes = data.ENEMIES.filter(e => e.zoneIndex === zi);
    const normals = foes.filter(e => e.kind === 'normal');
    const mine = kind => byDist(rooms.filter(o => o.rank === rank && o.kind === kind));
    const areaRooms = mine('n');
    if (areaRooms.length !== normals.length) throw new Error(`${rank}격 — 구역 ${areaRooms.length}개, 일반 ${normals.length}종`);
    areaRooms.forEach((room, i) => {
      const o = origin(room);
      areas.push({ name: normals[i].name, x: o.x, y: o.y, w: ROOM_W, h: ROOM_H, rank, monster: normals[i].id, zone: zone.id });
    });
    const fo = origin(areaRooms[0]);
    npcs.push({ name: 'merchant', x: fo.x, y: fo.y, zone: zone.id });

    // 정해진 자리 — 묶음 정예는 홀에, 묶음 밖 정예는 길목부터 채우고 남으면 구역 안 탁 트인 곳에
    const post = (e, x, y, blocks) => posts.push({ name: e.name, x, y, enemy: e.id, blocks });
    const sets = foes.filter(e => e.kind === 'elite' && e.set);
    const loose = foes.filter(e => e.kind === 'elite' && !e.set);
    const boss = foes.find(e => e.kind === 'boss'), hidden = foes.find(e => e.kind === 'hidden');
    const gates = gatePosts.filter(g => g.rank === rank);
    for (const g of gates.filter(g => g.how === 'e')) { const e = loose.shift(); if (e) post(e, g.cell.x, g.cell.y, true); }
    loose.forEach((e, i) => {
      const room = areaRooms[Math.round((i + 1) * areaRooms.length / (loose.length + 1)) - 1];
      const o = origin(room);
      post(e, o.x + 4, o.y + 3, false);
    });
    const halls = mine('E');
    if (sets.length) {
      const hall = halls[0], o = origin(hall);
      const wide = rooms.some(r => r.rank === rank && r.kind === 'E' && r !== hall);   // 방 둘을 튼 큰 홀
      const spots = wide
        ? [[2, 0], [7, 0], [12, 0], [17, 0], [4, 5], [9, 5], [14, 5]]   // 지나가는 길(가운데 줄)을 비우고 위아래 벽을 따라
        : [[1, 1], [6, 1], [1, 4], [6, 4], [3, 0], [3, 5]];
      sets.forEach((e, i) => post(e, o.x + spots[i][0], o.y + spots[i][1], false));
    }
    const bossGate = gates.find(g => g.how === 'b');
    if (bossGate) post(boss, bossGate.cell.x, bossGate.cell.y, true);
    else { const o = origin(mine('B')[0]); post(boss, o.x + 4, o.y + 3, false); }
    if (hidden) {
      const o = origin(mine('H')[0]);
      post(hidden, o.x + 4, o.y + 3, false);
      // 마왕 뒤 — 관측자 곁에 문의 광장으로 가는 문 (마왕을 꺾어야 열림)
      if (rank === 6) ports.push({ name: '문의 광장', x: o.x + ROOM_W - 1, y: o.y + 2, w: 1, h: 1, to: 'hub', opensAfter: boss.id });
    }
  }
  return buildTmj({ w, h, tiles, areas, posts, ports, secrets, npcs });
}

module.exports = { TILE, FLOOR, WALL, WATER, buildTmj, tilesPng, overworld, layoutFromPlan };
