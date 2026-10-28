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

  const rankColors = {};
  function rankColor(n) {
    if (!(n in rankColors)) {
      const css = getComputedStyle(document.documentElement).getPropertyValue(`--r${n}`).trim();
      rankColors[n] = css || RANK_FALLBACK[n] || '#777';
    }
    return rankColors[n];
  }

  // o: {
  //   canvas, stick(.knob 를 품은 조이스틱 — 없어도 됨), hooks(MapRules 가 게임에게 묻는 것),
  //   paused() → 지금은 세계를 멈출 때인가 (싸움 창 · 다른 창이 떠 있을 때),
  //   onEvents(events) → 한 틱에 일어난 일,
  //   marks() → [{ x, y, icon }] 지도에 더 얹을 것 (떠돌이 상인 같은), dots → 몬스터 성격 점을 찍을까 (맵 초안)
  // }
  function create(o) {
    const v = { world: null };
    const ctx = o.canvas.getContext('2d');
    const knob = o.stick && o.stick.querySelector('.knob');
    let T = 24, dpr = 1, cw = 0, ch = 0, last = 0;
    const held = [];
    let stickId = null, stickDir = null;

    v.start = (map, start, seed) => { v.world = MapRules.createWorld({ ...map, start: start || map.start }, o.hooks, seed); };
    v.resolve = outcome => { if (v.world) MapRules.resolve(v.world, outcome); };
    const shown = () => !!o.canvas.offsetParent;   // 탭을 옮겨 안 보이면 세계도 멈춥니다
    const live = () => v.world && shown() && !o.paused();

    // ---------- 부드럽게 ----------
    // 규칙은 칸 그대로(map.js) — 보이는 자리만 칸 사이를 미끄러져 따라갑니다. 걷는 동안은 살짝 들썩입니다.
    // 미끄러지는 빠르기는 그 걸음의 빠르기와 같게: 나는 초당 5칸, 몬스터는 초당 3칸 (어슬렁은 미끄러진 뒤 잠깐 섬).
    const glide = new WeakMap();   // 나 · 몬스터 → 보이는 자리 { x, y, phase }
    function seenAt(e, speed, dt) {
      let g = glide.get(e);
      if (!g || Math.abs(g.x - e.x) + Math.abs(g.y - e.y) > 2) {   // 처음 보거나 멀리 옮겨졌으면(문 · 불러오기) 그 자리에
        g = { x: e.x, y: e.y, phase: 0 };
        glide.set(e, g);
        return g;
      }
      const step = speed * dt;
      const toward = (from, to) => (Math.abs(to - from) <= step ? to : from + Math.sign(to - from) * step);
      const moving = g.x !== e.x || g.y !== e.y;
      g.x = toward(g.x, e.x);
      g.y = toward(g.y, e.y);
      g.phase = moving ? g.phase + dt * speed * Math.PI : 0;   // 한 칸에 한 번 들썩
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
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const k = y * m.w + x, px = ox + x * T, py = oy + y * T, t = m.tile[k];
        ctx.fillStyle = TILE_COLOR[t] || '#000';
        ctx.fillRect(px, py, T, T);
        const a = m.areaAt[k] >= 0 ? m.areas[m.areaAt[k]] : null;
        if (a && a.rank) { ctx.globalAlpha = 0.2; ctx.fillStyle = rankColor(a.rank); ctx.fillRect(px, py, T, T); ctx.globalAlpha = 1; }
        if (t === TREE) {
          ctx.fillStyle = '#4a5e2a'; ctx.beginPath(); ctx.arc(px + T / 2, py + T / 2, T * 0.42, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#5c7434'; ctx.beginPath(); ctx.arc(px + T * 0.42, py + T * 0.4, T * 0.2, 0, Math.PI * 2); ctx.fill();
        } else if (t === ROCK) {
          ctx.fillStyle = '#7a7062'; ctx.fillRect(px + T * 0.12, py + T * 0.22, T * 0.76, T * 0.66);
          ctx.fillStyle = '#968c7c'; ctx.fillRect(px + T * 0.12, py + T * 0.22, T * 0.76, T * 0.22);
        }
        if (m.secret[k]) { ctx.fillStyle = 'rgba(234,214,166,0.1)'; ctx.fillRect(px, py, T, T); }   // 아주 옅게 — 눈썰미 있는 사람만
      }
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

      // 문 — 열리면 초록, 닫히면 갈색. 이름이 있으면 문 위에 씁니다
      for (const port of m.ports) {
        if (!seen(port.x, port.y, port.w, port.h)) continue;
        const open = w.hooks.portOpen(port);
        ctx.fillStyle = open ? '#3fae4a' : '#5c3a1a';
        ctx.fillRect(ox + port.x * T + 2, oy + port.y * T + 2, port.w * T - 4, port.h * T - 4);
        if (port.label) {
          // 글은 문 바깥쪽(벽 쪽)에 — 문 앞에 선 나와 겹치지 않게
          const below = m.solid[Math.min(m.h - 1, port.y + port.h) * m.w + port.x];
          ctx.font = `bold ${Math.max(10, Math.round(T * 0.42))}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = below ? 'top' : 'bottom';
          const tx = ox + (port.x + port.w / 2) * T, ty = below ? oy + (port.y + port.h) * T + 3 : oy + port.y * T - 3;
          ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(28,16,7,0.85)';
          ctx.strokeText(port.label + (open ? '' : ' 🔒'), tx, ty);
          ctx.fillStyle = '#f6e7c3';
          ctx.fillText(port.label + (open ? '' : ' 🔒'), tx, ty);
        }
      }
      for (const mk of (o.marks ? o.marks() : [])) if (seen(mk.x, mk.y)) glyph(mk.x + 0.5, mk.y + 0.5, mk.icon);
      for (const post of m.posts) {
        if (!seen(post.x, post.y, post.w, post.h) || !w.hooks.postAlive(post.enemy)) continue;
        const f = getEnemy(post.enemy), pw = post.w * T, ph = post.h * T;
        if (post.w > 1) { ctx.fillStyle = 'rgba(28,16,7,0.18)'; ctx.fillRect(ox + post.x * T, oy + post.y * T, pw, ph); }   // 큰 자리 — 그림자
        ctx.strokeStyle = KIND_COLOR[f.kind] || '#000';
        ctx.lineWidth = line;
        ctx.strokeRect(ox + post.x * T + line / 2, oy + post.y * T + line / 2, pw - line, ph - line);
        glyph(post.x + post.w / 2, post.y + post.h / 2, f.icon, 0.72 * Math.min(post.w, post.h));
      }
      for (const mob of w.mobs) {
        const g = seenAt(mob, R.CHASE_SPEED, dt);
        if (!seen(Math.floor(g.x), Math.floor(g.y), 2, 2)) continue;
        const gy = g.y + bob(g) / T;                          // 들썩임까지 얹은 보이는 줄
        const cx = ox + (g.x + 0.5) * T, cy = oy + (gy + 0.5) * T;
        if (mob.aura) {   // 기운 — 그 색으로 빛남
          ctx.save();
          ctx.shadowColor = mob.aura.color; ctx.shadowBlur = T * 0.6;
          ctx.strokeStyle = mob.aura.color; ctx.lineWidth = line + 1;
          ctx.beginPath(); ctx.arc(cx, cy, T * 0.45, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
        }
        ctx.globalAlpha = mob.frozen > 0 ? 0.45 : 1;
        glyph(g.x + 0.5, gy + 0.5, getEnemy(mob.monster).icon);
        ctx.globalAlpha = 1;
        if (o.dots) {
          ctx.fillStyle = TEMPER_COLOR[mob.temper];
          ctx.beginPath(); ctx.arc(ox + (g.x + 0.18) * T, oy + (gy + 0.18) * T, T * 0.13, 0, Math.PI * 2); ctx.fill();
        }
        if (mob.mode === 'chase') {   // 쫓아오는 중
          ctx.fillStyle = '#d0473f';
          ctx.font = `bold ${Math.round(T * 0.55)}px sans-serif`;
          ctx.fillText('!', ox + (g.x + 0.85) * T, oy + (gy + 0.2) * T);
        }
      }
      // 나
      const py = gp.y + bob(gp) / T;
      ctx.fillStyle = '#1c1007'; ctx.strokeStyle = '#f6e7c3'; ctx.lineWidth = line + 1;
      ctx.beginPath(); ctx.arc(ox + (gp.x + 0.5) * T, oy + (py + 0.5) * T, T * 0.34, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
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
      MapRules.setInput(v.world, held[held.length - 1]);   // 나중에 누른 쪽으로
    });
    document.addEventListener('keyup', ev => {
      const d = KEYS[ev.key];
      if (!d || !held.includes(d)) return;
      held.splice(held.indexOf(d), 1);
      if (!v.world) return;
      MapRules.setInput(v.world, null);
      if (held.length) MapRules.setInput(v.world, held[held.length - 1]);
    });

    // ---------- 가상 조이스틱 ----------
    // 칸 단위라 상하좌우 넷으로 끊습니다. 누르고 있으면 계속 걷고, 떼면 섭니다.
    // 같은 쪽으로 누른 채로는 닿은 뒤 다시 걷지 않습니다 — 손을 떼거나 다른 쪽으로 밀어야.
    function stickMove(ev) {
      const r = o.stick.getBoundingClientRect();
      const dx = ev.clientX - (r.left + r.width / 2), dy = ev.clientY - (r.top + r.height / 2);
      const len = Math.hypot(dx, dy), max = r.width * 0.3, k = len > max ? max / len : 1;
      if (knob) knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
      const dir = len < r.width * 0.1 ? null : Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      if (v.world && dir !== stickDir) {
        MapRules.setInput(v.world, null);
        MapRules.setInput(v.world, dir);
      }
      stickDir = dir;
    }
    function stickEnd() {
      stickId = null;
      stickDir = null;
      if (knob) knob.style.transform = '';
      if (v.world) MapRules.setInput(v.world, null);
    }
    if (o.stick) {
      o.stick.addEventListener('pointerdown', ev => {
        ev.preventDefault();
        stickId = ev.pointerId;
        try { o.stick.setPointerCapture(ev.pointerId); } catch (e) { /* 가짜 포인터(시험)면 붙잡지 못해도 됩니다 */ }
        stickMove(ev);
      });
      o.stick.addEventListener('pointermove', ev => { if (ev.pointerId === stickId) stickMove(ev); });
      o.stick.addEventListener('pointerup', stickEnd);
      o.stick.addEventListener('pointercancel', stickEnd);
    }
    return v;
  }

  // 지도 규칙이 게임(data.js · game.js)에게 묻는 것들 — 게임과 맵 초안이 같은 것을 씁니다
  function gameHooks() {
    return {
      temper: id => MapRules.temperOf(getEnemy(id).arch),
      rollAura: () => rollAura(),
      postAlive: id => { const f = getEnemy(id); return !!f && !isDowned(id) && isRevealed(f); },   // 이 여정에 꺾었거나 아직 안 나타난 히든은 없음
      portOpen: p => !p.opensAfter || isDowned(p.opensAfter)
    };
  }

  return { create, gameHooks, VIEW, KIND_COLOR, TEMPER_COLOR };
})();
