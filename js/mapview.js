// ============================================================
//  mapview.js — 월드맵 그리기 · 조이스틱 · 방향키 · 시간 흐름
//
//  규칙은 map.js(MapRules)에 있고, 여기는 그 세계를 캔버스에 그리고 손가락 · 키보드를 넘겨줄 뿐입니다.
//  게임(ui.js)과 맵 초안(tools/map-draft.html)이 같이 씁니다.
// ============================================================
const MapView = (function () {
  'use strict';

  const VIEW = MapRules.RULES.SIGHT * 2 + 1;              // 좁은 쪽에 이만큼 칸 — 나를 가운데 둔 보이는 범위
  // 바닥 · 벽 · 물 · 나무 · 바위 · 길 (maps/tiles.png 와 같은 순서) — 나무 · 바위는 바닥 위에 그 모양을 얹습니다
  const TILE_COLOR = ['#ead6a6', '#3f240f', '#1f5a96', '#ead6a6', '#ead6a6', '#f2e2b8'];
  const TREE = 3, ROCK = 4;
  const RANK_FALLBACK = { 1: '#6b6152', 2: '#4f6b30', 3: '#7a4f2a', 4: '#5c6570', 5: '#5e3a72', 6: '#8c1f24' };   // style.css 가 없을 때 (맵 초안)
  const KIND_COLOR = { elite: '#3f6d2a', boss: '#a8262b', hidden: '#5b2a86' };   // 무대 창 테두리와 같은 색
  const TEMPER_COLOR = { aggro: '#d0473f', passive: '#4a80b8', shy: '#5aa04f' };
  const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
                 w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
  // 나 — 걷기 그림 (design/hero/walk.js 가 만듦). 한 줄에 한 방향, 한 줄 4칸(서기 · 걸음 A · 서기 · 걸음 B), 한 칸 32×40, 발끝은 38줄.
  // 줄 순서는 앞 · 뒤 · 왼옆 · 오른옆 — 왼옆이 보이는 모습이 화면 오른쪽을 봅니다. 못 불러오면(맵 초안) 예전 동그라미로.
  const HERO = { w: 32, h: 40, foot: 38, body: 34, row: { down: 0, up: 1, right: 2, left: 3 } };
  const heroImg = new Image();
  heroImg.src = 'assets/hero/walk.png';

  const rankColors = {};
  function rankColor(n) {
    if (!(n in rankColors)) {
      const css = getComputedStyle(document.documentElement).getPropertyValue(`--r${n}`).trim();
      rankColors[n] = css || RANK_FALLBACK[n] || '#777';
    }
    return rankColors[n];
  }

  // o: {
  //   canvas, stick(.knob 를 품은 떠 있는 조이스틱 — 지도를 누른 자리에 생김, 없어도 됨), hooks(MapRules 가 게임에게 묻는 것),
  //   paused() → 지금은 세계를 멈출 때인가 (싸움 창 · 다른 창이 떠 있을 때),
  //   onEvents(events) → 한 틱에 일어난 일,
  //   marks() → [{ x, y, icon }] 지도에 더 얹을 것 (떠돌이 상인 같은), dots → 몬스터 성격 점을 찍을까 (맵 초안),
  //   tag(enemyId) → { text, hot } 머리 위에 쓸 글 (레벨 — hot 이면 나보다 셈),
  //   hideActors() → 땅만 그릴까 (싸움 창이 떠 있을 때 — 없어도 됨)
  // }
  function create(o) {
    const v = { world: null };
    const ctx = o.canvas.getContext('2d');
    const knob = o.stick && o.stick.querySelector('.knob');
    let T = 24, dpr = 1, cw = 0, ch = 0, last = 0;
    const held = [];
    let stickId = null, stickDir = null, face = 'down';

    // keep — 저장해 둔 몬스터 (없으면 모든 구역에 새로 섭니다, map.js 의 createWorld)
    v.start = (map, start, seed, keep) => { v.world = MapRules.createWorld({ ...map, start: start || map.start }, o.hooks, seed, keep); face = 'down'; };
    v.resolve = outcome => { if (v.world) MapRules.resolve(v.world, outcome); };
    const shown = () => o.canvas.getClientRects().length > 0;   // 숨어서 안 보이면 세계도 멈춥니다
    const live = () => v.world && shown() && !o.paused();

    // ---------- 부드럽게 ----------
    // 규칙은 칸 그대로(map.js) — 보이는 자리만 칸 사이를 미끄러져 따라갑니다. 걷는 동안은 살짝 들썩입니다.
    // 미끄러지는 빠르기는 그 걸음의 빠르기와 같게: 나는 초당 12칸, 몬스터는 초당 3칸 (어슬렁 · 달아나기는 미끄러진 뒤 잠깐 섬).
    const glide = new WeakMap();   // 나 · 몬스터 → 보이는 자리 { x, y, phase }
    function seenAt(e, speed, dt) {
      let g = glide.get(e);
      if (!g || Math.hypot(g.x - e.x, g.y - e.y) > 2.5) {   // 처음 보거나 멀리 옮겨졌으면(문 · 불러오기) 그 자리에 (대각선 한 걸음 뒤처진 것은 그대로 따라감)
        g = { x: e.x, y: e.y, phase: 0, moving: false, walked: 0, idle: 1 };
        glide.set(e, g);
        return g;
      }
      const step = speed * dt;
      const moving = g.x !== e.x || g.y !== e.y;
      const ddx = e.x - g.x, ddy = e.y - g.y, dd = Math.hypot(ddx, ddy);   // 곧은 줄로 따라감 — 대각선 걸음도 같은 빠르기로
      if (dd <= step) { g.x = e.x; g.y = e.y; } else { g.x += ddx / dd * step; g.y += ddy / dd * step; }
      g.phase = moving ? g.phase + dt * speed * Math.PI : 0;   // 한 칸에 한 번 들썩
      // 걸은 칸 수 — 칸과 칸 사이에 잠깐 멈춰도 이어서 세고(걸음 A · B 가 번갈아), 조금 서 있으면 처음부터
      g.moving = moving;
      g.idle = moving ? 0 : g.idle + dt;
      g.walked = moving ? g.walked + step : g.idle > 0.15 ? 0 : g.walked;
      return g;
    }
    v.seenAt = e => glide.get(e);   // 시험 · 살펴보기용

    // ---------- 시간 ----------
    function frame(now) {
      const dt = Math.min(0.1, (now - (last || now)) / 1000);
      last = now;
      if (live()) {
        const evs = MapRules.tick(v.world, dt);
        if (evs.length) o.onEvents(evs);
      }
      if (v.world && shown()) draw(dt);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // ---------- 그리기 ----------
    function fit() {
      const r = o.canvas.getBoundingClientRect();
      if (r.width === cw && r.height === ch) return;
      cw = r.width; ch = r.height;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      o.canvas.width = Math.max(1, Math.round(cw * dpr));
      o.canvas.height = Math.max(1, Math.round(ch * dpr));
      T = Math.max(16, Math.floor(Math.min(cw, ch) / VIEW));
    }

    function draw(dt) {
      fit();
      const w = v.world, m = w.map, p = w.player, R = MapRules.RULES;
      const gp = seenAt(p, R.PLAYER_SPEED, dt);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#1c1007';
      ctx.fillRect(0, 0, cw, ch);
      // 카메라는 보이는 내 자리를 따라갑니다 — 기기 픽셀에 맞춰 반올림해 칸 사이에 틈이 안 생기게
      const ox = Math.round((cw / 2 - (gp.x + 0.5) * T) * dpr) / dpr, oy = Math.round((ch / 2 - (gp.y + 0.5) * T) * dpr) / dpr;
      const bob = g => -Math.abs(Math.sin(g.phase)) * T * 0.08;
      const x0 = Math.max(0, Math.floor(-ox / T)), y0 = Math.max(0, Math.floor(-oy / T));
      const x1 = Math.min(m.w, Math.ceil((cw - ox) / T)), y1 = Math.min(m.h, Math.ceil((ch - oy) / T));
      // 땅 — 겉모습 층이 있는 지도는 도트 그림(js/mapart.js, 덩어리로 미리 그려 붙임), 없으면 예전 색칸.
      // 그림 덩어리가 아직 안 그려진 곳(한 장면에 몇 개씩만 새로 그림)은 그동안 색칸으로
      const art = typeof MapArt !== 'undefined' && MapArt.has(m);
      const flat = (xa, ya, xb, yb) => {
        for (let y = ya; y < yb; y++) for (let x = xa; x < xb; x++) {
          const k = y * m.w + x, px = ox + x * T, py = oy + y * T, t = m.tile[k];
          ctx.fillStyle = TILE_COLOR[t] || '#000';
          ctx.fillRect(px, py, T, T);
          if (t === TREE) {
            ctx.fillStyle = '#4a5e2a'; ctx.beginPath(); ctx.arc(px + T / 2, py + T / 2, T * 0.42, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#5c7434'; ctx.beginPath(); ctx.arc(px + T * 0.42, py + T * 0.4, T * 0.2, 0, Math.PI * 2); ctx.fill();
          } else if (t === ROCK) {
            ctx.fillStyle = '#7a7062'; ctx.fillRect(px + T * 0.12, py + T * 0.22, T * 0.76, T * 0.66);
            ctx.fillStyle = '#968c7c'; ctx.fillRect(px + T * 0.12, py + T * 0.22, T * 0.76, T * 0.22);
          }
        }
      };
      if (art) {
        const CHK = MapArt.CH;
        for (const [cx, cy] of MapArt.drawGround(ctx, m, ox, oy, T, x0, y0, x1, y1))
          flat(Math.max(x0, cx * CHK), Math.max(y0, cy * CHK), Math.min(x1, (cx + 1) * CHK), Math.min(y1, (cy + 1) * CHK));
      } else flat(x0, y0, x1, y1);
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const k = y * m.w + x, px = ox + x * T, py = oy + y * T;
        const a = m.areaAt[k] >= 0 ? m.areas[m.areaAt[k]] : null;
        if (a && a.rank) { ctx.globalAlpha = art ? 0.1 : 0.2; ctx.fillStyle = rankColor(a.rank); ctx.fillRect(px, py, T, T); ctx.globalAlpha = 1; }   // 구역 — 그림 위엔 더 옅게
        if (m.secret[k]) { ctx.fillStyle = 'rgba(234,214,166,0.1)'; ctx.fillRect(px, py, T, T); }   // 아주 옅게 — 눈썰미 있는 사람만
      }
      if (art) MapArt.drawTrees(ctx, m, ox, oy, T, x0, y0, x1, y1);
      const seen = (x, y, sw = 1, sh = 1) => x + sw >= x0 && y + sh >= y0 && x <= x1 && y <= y1;
      // cx · cy 는 칸 단위의 한가운데 (한 칸짜리면 x + 0.5)
      const glyph = (cx, cy, icon, size = 0.72) => {
        ctx.font = `${Math.round(T * size)}px system-ui, "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        ctx.fillText(icon, ox + cx * T, oy + (cy + 0.06) * T);
      };
      const line = Math.max(2, Math.round(T / 10));
      // 머리 위 레벨 — 나보다 센 상대는 붉게. cx · topY 는 픽셀
      const label = (id, cx, topY) => {
        const t = o.tag && o.tag(id);
        if (!t) return;
        ctx.font = `bold ${Math.max(9, Math.round(T * 0.36))}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(28,16,7,0.85)';
        ctx.strokeText(t.text, cx, topY);
        ctx.fillStyle = t.hot ? '#ff9a8a' : '#f6e7c3';
        ctx.fillText(t.text, cx, topY);
      };

      // 문 — 열리면 초록, 닫히면 갈색. 구멍(hole — 다른 지도로 내려가거나 나가는 곳)은 어두운 구멍. 이름이 있으면 문 위에 씁니다
      for (const port of m.ports) {
        if (!seen(port.x, port.y, port.w, port.h)) continue;
        const open = w.hooks.portOpen(port);
        if (port.appears && !open) continue;              // 열리기 전엔 없는 문 (보스를 꺾으면 나타나는 숨은 굴의 구멍)
        const revealed = port.hole && port.appears;       // 보스를 꺾어 나타난 숨은 굴 구멍 — 눈에 확 띄게 (사용자 요청)
        if (port.hole) {
          const cx = ox + (port.x + port.w / 2) * T, cy = oy + (port.y + port.h / 2) * T, rx = port.w * T / 2 - 1, ry = port.h * T / 2 + T * 0.1;
          const now = performance.now() / 1000, pulse = 0.5 + 0.5 * Math.sin(now * 3.2);
          if (revealed) {                                 // 둘레에 숨 쉬듯 번지는 금빛
            const g = ctx.createRadialGradient(cx, cy, rx * 0.4, cx, cy, rx * 1.9);
            g.addColorStop(0, `rgba(255, 214, 120, ${0.35 + 0.3 * pulse})`);
            g.addColorStop(1, 'rgba(255, 214, 120, 0)');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.ellipse(cx, cy, rx * 1.9, ry * 2.6, 0, 0, Math.PI * 2); ctx.fill();
            ctx.save(); ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = T * (0.4 + 0.5 * pulse);
          }
          ctx.fillStyle = revealed ? '#c8a24a' : '#5c3a1a';
          ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
          if (revealed) ctx.restore();
          ctx.fillStyle = '#0b0603';
          ctx.beginPath(); ctx.ellipse(cx, cy + T * 0.06, rx - T * 0.22, ry - T * 0.18, 0, 0, Math.PI * 2); ctx.fill();
          if (revealed) {
            ctx.fillStyle = `rgba(150, 90, 230, ${0.25 + 0.25 * pulse})`;   // 구멍 속 보랏빛
            ctx.beginPath(); ctx.ellipse(cx, cy + T * 0.1, (rx - T * 0.22) * 0.6, (ry - T * 0.18) * 0.5, 0, 0, Math.PI * 2); ctx.fill();
            for (let i = 0; i < 6; i++) {                 // 둘레를 도는 반짝이
              const a = now * 1.4 + i * Math.PI / 3, sx = cx + Math.cos(a) * rx * 1.25, sy = cy + Math.sin(a) * ry * 1.7, s = T * (0.07 + 0.05 * Math.sin(now * 5 + i));
              ctx.fillStyle = '#fff3c4';
              ctx.beginPath(); ctx.moveTo(sx, sy - s * 2); ctx.lineTo(sx + s, sy); ctx.lineTo(sx, sy + s * 2); ctx.lineTo(sx - s, sy); ctx.closePath(); ctx.fill();
            }
            const ay = cy - ry - T * 0.35 - Math.abs(Math.sin(now * 4)) * T * 0.25, aw = T * 0.28;   // 통통 튀는 ▼
            ctx.beginPath(); ctx.moveTo(cx - aw, ay - aw); ctx.lineTo(cx + aw, ay - aw); ctx.lineTo(cx, ay + aw * 0.4); ctx.closePath();
            ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(28,16,7,0.85)'; ctx.stroke();
            ctx.fillStyle = '#ffd76a'; ctx.fill();
          }
        } else if (!(port.door && art)) {                 // 건물 문(door)은 지도 그림이 성문 · 문간으로 그림
          ctx.fillStyle = open ? '#3fae4a' : '#5c3a1a';
          ctx.fillRect(ox + port.x * T + 2, oy + port.y * T + 2, port.w * T - 4, port.h * T - 4);
        }
        if (port.label) {
          // 글은 문 바깥쪽(벽 쪽)에 — 문 앞에 선 나와 겹치지 않게
          const below = m.solid[Math.min(m.h - 1, port.y + port.h) * m.w + port.x];
          ctx.font = `bold ${Math.max(10, Math.round(T * 0.42))}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = below ? 'top' : 'bottom';
          const tx = ox + (port.x + port.w / 2) * T, ty = below ? oy + (port.y + port.h) * T + 3 : oy + port.y * T - 3 - (revealed ? T * 0.9 : 0);   // 나타난 구멍은 ▼ 위에
          ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(28,16,7,0.85)';
          ctx.strokeText(port.label + (open ? '' : ' 🔒'), tx, ty);
          ctx.fillStyle = '#f6e7c3';
          ctx.fillText(port.label + (open ? '' : ' 🔒'), tx, ty);
        }
      }
      // 보물상자 — 닫힌 것은 뚜껑 덮인 나무 상자(상자 전용 장비가 든 큰 상자는 금테 · 은은한 빛), 연 것은 뚜껑이 젖혀진 빈 상자
      for (const c of m.chests) {
        if (!seen(c.x, c.y)) continue;
        const open = w.hooks.chestOpen(c.chest), big = !!c.big;
        const x = ox + c.x * T, y = oy + c.y * T, u = T / 16;
        if (big && !open) {
          ctx.save(); ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = T * 0.5;
          ctx.fillStyle = 'rgba(255, 215, 106, 0.25)'; ctx.fillRect(x + 1 * u, y + 3 * u, 14 * u, 12 * u);
          ctx.restore();
        }
        ctx.fillStyle = 'rgba(28,16,7,0.3)'; ctx.fillRect(x + 2 * u, y + 14 * u, 12 * u, 2 * u);   // 그림자
        ctx.fillStyle = '#3a2412'; ctx.fillRect(x + 2 * u, y + 7 * u, 12 * u, 7 * u);            // 몸통 테
        ctx.fillStyle = '#8a5428'; ctx.fillRect(x + 3 * u, y + 8 * u, 10 * u, 5 * u);            // 몸통
        if (open) {
          ctx.fillStyle = '#1c1007'; ctx.fillRect(x + 3 * u, y + 7 * u, 10 * u, 2 * u);          // 빈 속
          ctx.fillStyle = '#3a2412'; ctx.fillRect(x + 2 * u, y + 2 * u, 12 * u, 4 * u);          // 젖혀진 뚜껑
          ctx.fillStyle = '#6e4220'; ctx.fillRect(x + 3 * u, y + 3 * u, 10 * u, 2 * u);
        } else {
          ctx.fillStyle = '#3a2412'; ctx.fillRect(x + 2 * u, y + 4 * u, 12 * u, 4 * u);          // 뚜껑 테
          ctx.fillStyle = '#a8662f'; ctx.fillRect(x + 3 * u, y + 5 * u, 10 * u, 2 * u);          // 뚜껑
          ctx.fillStyle = big ? '#ffd76a' : '#d9b04a';
          ctx.fillRect(x + 7 * u, y + 7 * u, 2 * u, 3 * u);                                       // 자물쇠
          if (big) { ctx.fillRect(x + 2 * u, y + 7 * u, 12 * u, u); ctx.fillRect(x + 2 * u, y + 13 * u, 12 * u, u); }   // 금테
        }
      }
      // 싸움 창이 떠 있는 동안은 땅까지만 — 비치는 창 뒤에 지도 위의 나 · 몬스터 · 정예 자리 · 상인이 겹쳐 보이지 않게
      if (o.hideActors && o.hideActors()) return;
      for (const mk of (o.marks ? o.marks() : [])) {   // 상인 같은 표시 — 그림, 이름이 있으면 그 위에 작게
        if (!seen(mk.x, mk.y)) continue;
        glyph(mk.x + 0.5, mk.y + 0.5, mk.icon);
        if (mk.label) {
          ctx.font = `bold ${Math.max(9, Math.round(T * 0.36))}px system-ui, sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(28,16,7,0.85)';
          ctx.strokeText(mk.label, ox + (mk.x + 0.5) * T, oy + mk.y * T + 1);
          ctx.fillStyle = '#f6e7c3';
          ctx.fillText(mk.label, ox + (mk.x + 0.5) * T, oy + mk.y * T + 1);
        }
      }
      for (const post of m.posts) {
        if (!seen(post.x, post.y, post.w, post.h) || !w.hooks.postAlive(post.enemy)) continue;
        const f = getEnemy(post.enemy), pw = post.w * T, ph = post.h * T;
        if (post.w > 1) { ctx.fillStyle = 'rgba(28,16,7,0.18)'; ctx.fillRect(ox + post.x * T, oy + post.y * T, pw, ph); }   // 큰 자리 — 그림자
        ctx.strokeStyle = KIND_COLOR[f.kind] || '#000';
        ctx.lineWidth = line;
        ctx.strokeRect(ox + post.x * T + line / 2, oy + post.y * T + line / 2, pw - line, ph - line);
        glyph(post.x + post.w / 2, post.y + post.h / 2, f.icon, 0.72 * Math.min(post.w, post.h));
        label(post.enemy, ox + (post.x + post.w / 2) * T, oy + post.y * T - 1);
      }
      for (const mob of w.mobs) {
        const g = seenAt(mob, R.CHASE_SPEED, dt), n = mob.w || 1;   // 큰 몬스터는 n × n 칸 — 그림 · 기운도 그만큼
        if (!seen(Math.floor(g.x), Math.floor(g.y), n + 1, n + 1)) continue;
        const gy = g.y + bob(g) / T;                          // 들썩임까지 얹은 보이는 줄
        const cx = ox + (g.x + n / 2) * T, cy = oy + (gy + n / 2) * T;
        if (n > 1) {   // 차지한 칸 — 옅은 그림자 (어느 칸에 닿아도 싸움)
          ctx.fillStyle = 'rgba(28,16,7,0.16)';
          ctx.fillRect(ox + g.x * T + 1, oy + g.y * T + 1, n * T - 2, n * T - 2);
        }
        if (mob.aura) {   // 기운 — 그 색으로 빛남
          ctx.save();
          ctx.shadowColor = mob.aura.color; ctx.shadowBlur = T * 0.6;
          ctx.strokeStyle = mob.aura.color; ctx.lineWidth = line + 1;
          ctx.beginPath(); ctx.arc(cx, cy, T * 0.45 * n, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
        }
        ctx.globalAlpha = mob.frozen > 0 ? 0.45 : 1;
        glyph(g.x + n / 2, gy + n / 2, getEnemy(mob.monster).icon, 0.72 * n);
        ctx.globalAlpha = 1;
        if (o.dots) {
          ctx.fillStyle = TEMPER_COLOR[mob.temper];
          ctx.beginPath(); ctx.arc(ox + (g.x + 0.18) * T, oy + (gy + 0.18) * T, T * 0.13, 0, Math.PI * 2); ctx.fill();
        }
        if (mob.mode === 'chase') {   // 쫓아오는 중
          ctx.fillStyle = '#d0473f';
          ctx.font = `bold ${Math.round(T * 0.55)}px sans-serif`;
          ctx.fillText('!', ox + (g.x + n - 0.15) * T, oy + (gy + 0.2) * T);
        }
        label(mob.monster, cx, oy + gy * T + 1);
      }
      // 나 — 누른 쪽을 보고, 걷는 동안 한 칸에 한 장씩 넘김. 그림 1픽셀을 기기 픽셀의 정수 배로 키워 또렷하게
      // (몸 높이가 1.5칸에 가장 가까운 배 — 폰에서는 2배, 약 1.7칸)
      if (p.dir) face = p.dir;
      if (heroImg.complete && heroImg.naturalWidth) {
        const k = Math.max(1, Math.round(T * dpr * 1.5 / HERO.body)) / dpr;
        const fx = Math.round((ox + (gp.x + 0.5) * T) * dpr) / dpr, fy = Math.round((oy + (gp.y + 0.9) * T) * dpr) / dpr;   // 발끝 자리
        ctx.fillStyle = 'rgba(28,16,7,0.3)';
        ctx.beginPath(); ctx.ellipse(fx, fy - k, T * 0.3, T * 0.1, 0, 0, Math.PI * 2); ctx.fill();
        const n = gp.moving ? (Math.floor(gp.walked) + 1) % 4 : 0;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(heroImg, n * HERO.w, HERO.row[face] * HERO.h, HERO.w, HERO.h,
          fx - (HERO.w / 2) * k, fy - HERO.foot * k, HERO.w * k, HERO.h * k);
      } else {
        const py = gp.y + bob(gp) / T;
        ctx.fillStyle = '#1c1007'; ctx.strokeStyle = '#f6e7c3'; ctx.lineWidth = line + 1;
        ctx.beginPath(); ctx.arc(ox + (gp.x + 0.5) * T, oy + (py + 0.5) * T, T * 0.34, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }

    // ---------- 방향키 · WASD ----------
    // 꾹 누르면 계속 걷습니다. 닿은 뒤에는 한 번 떼야 다시 걷습니다 (map.js 의 setInput).
    const typing = t => t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    document.addEventListener('keydown', ev => {
      const d = KEYS[ev.key];
      if (!d || typing(ev.target) || !live()) return;
      ev.preventDefault();
      if (ev.repeat) return;
      if (!held.includes(d)) held.push(d);
      MapRules.setInput(v.world, null);
      MapRules.setInput(v.world, heldVec());
    });
    document.addEventListener('keyup', ev => {
      const d = KEYS[ev.key];
      if (!d || !held.includes(d)) return;
      held.splice(held.indexOf(d), 1);
      if (!v.world) return;
      MapRules.setInput(v.world, null);
      if (held.length) MapRules.setInput(v.world, heldVec());
    });
    // 같이 누른 쪽을 합침 — 위 + 오른쪽이면 대각선. 맞선 쪽(왼쪽 + 오른쪽)은 나중에 누른 쪽으로
    function heldVec() {
      let x = 0, y = 0;
      for (const d of held) { const [dx, dy] = MapRules.DIRS[d]; x += dx; y += dy; }
      if (!x && !y) { const [dx, dy] = MapRules.DIRS[held[held.length - 1]]; return { x: dx, y: dy }; }
      return { x, y };
    }

    // ---------- 떠 있는 조이스틱 ----------
    // 지도 어디든 누르면 그 자리에 조이스틱(o.stick — position: fixed, 켜면 .on)이 생기고, 끄는 쪽으로 걷고, 떼면 사라집니다.
    // (예전엔 화면 아래 가운데에 붙박인 조이스틱이었습니다 — 화면 틀을 지도 가득으로 바꾸며 바꿈, 사용자 결정)
    // 조이스틱이 향하는 쪽 그대로 걷습니다 (대각선 · 비스듬히도 — map.js 의 setInput, 사용자 결정. 예전엔 상하좌우 넷으로 끊었음).
    // 같은 쪽으로 누른 채로는 닿은 뒤 다시 걷지 않습니다 — 손을 떼거나 RETURN 넘게 다른 쪽으로 밀어야.
    const STICK_REACH = 40, STICK_DEAD = 10, RETURN = 0.6;   // 손잡이가 움직이는 거리 · 이만큼은 밀어야 걷기 시작 (px) · 다시 민 것으로 칠 만큼 돌린 각 (라디안)
    let sx = 0, sy = 0, pushed = null;
    function stickMove(ev) {
      if (ev.pointerId !== stickId) return;
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      const len = Math.hypot(dx, dy), k = len > STICK_REACH ? STICK_REACH / len : 1;
      if (knob) knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
      const dir = len < STICK_DEAD ? null : { x: dx / len, y: dy / len };
      if (v.world) {
        const turned = dir && pushed && Math.acos(Math.max(-1, Math.min(1, dir.x * pushed.x + dir.y * pushed.y))) > RETURN;
        if (!dir || !pushed || turned) { MapRules.setInput(v.world, null); pushed = dir; }   // 새로 밀었음 (닿은 뒤에도 다시 걸음)
        if (dir) MapRules.setInput(v.world, dir);
      }
      stickDir = dir;
    }
    function stickEnd(ev) {
      if (ev.pointerId !== stickId) return;
      stickId = null;
      stickDir = null;
      pushed = null;
      if (o.stick) o.stick.classList.remove('on');
      if (v.world) MapRules.setInput(v.world, null);
    }
    o.canvas.addEventListener('pointerdown', ev => {
      if (stickId !== null || !live()) return;
      ev.preventDefault();
      stickId = ev.pointerId; sx = ev.clientX; sy = ev.clientY;
      try { o.canvas.setPointerCapture(ev.pointerId); } catch (e) { /* 가짜 포인터(시험)면 붙잡지 못해도 됩니다 */ }
      if (knob) knob.style.transform = '';
      if (o.stick) { o.stick.style.left = `${sx}px`; o.stick.style.top = `${sy}px`; o.stick.classList.add('on'); }
    });
    o.canvas.addEventListener('pointermove', stickMove);
    o.canvas.addEventListener('pointerup', stickEnd);
    o.canvas.addEventListener('pointercancel', stickEnd);
    return v;
  }

  // 지도 규칙이 게임(data.js · game.js)에게 묻는 것들 — 게임과 맵 초안이 같은 것을 씁니다
  function gameHooks() {
    return {
      temper: id => MapRules.temperOf(getEnemy(id).arch),
      rollAura: () => rollAura(),
      postAlive: id => { const f = getEnemy(id); return !!f && !isDowned(id) && isRevealed(f); },   // 이 여정에 꺾었거나 아직 안 나타난 히든은 없음
      portOpen: p => !p.opensAfter || isDowned(p.opensAfter),
      size: id => (getEnemy(id) || {}).size || 1,  // 지도에서 차지하는 n × n 칸 (data.js ENEMY_SIZE)
      chestOpen: id => !!State.meta && State.meta.chestsOpened.includes(id),  // 연 보물상자 (game.js 의 openChest)
      merchantHere: n => { const m = State.run && State.run.merchant; return !!m && !State.run.over && !!ZONES[m.zone] && ZONES[m.zone].id === n.zone; }
    };
  }

  // 머리 위 레벨 — 지금 내 레벨보다 높으면 붉게 (게임과 맵 초안이 같이 씀)
  function gameTag(id) {
    const f = getEnemy(id);
    if (!f) return null;
    return { text: `Lv.${fmtLevel(f.level)}`, hot: !!State.run && f.level > State.run.level };
  }

  // 걷기 그림의 주소 — 싸움 화면의 나도 같은 그림을 씁니다 (한 파일 빌드에서는 그림 자체가 든 data: 주소)
  const heroSheet = () => heroImg.src;

  return { create, gameHooks, gameTag, heroSheet, VIEW, KIND_COLOR, TEMPER_COLOR };
})();
