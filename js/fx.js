// ============================================================
//  fx.js  —  전투 이펙트 (임시 그림)
//  그림 두 장에서 프레임을 잘라 초상 가운데에 차례로 그립니다.
//    assets/fx/enemy-attacks.webp — 상대의 공격 여섯 가지. 내 초상 위에 뜹니다 (상대의 성격에 따라 골라서)
//    assets/fx/hero-attacks.webp  — 내 공격 다섯 가지. 상대 초상 가운데에 뜹니다
//
//  두 그림은 배경이 투명하지 않고 체크무늬가 그려져 있습니다. 그래서 열 때 한 번,
//  밝은 무채색(체크무늬)을 투명하게 걷어내고 프레임마다 작은 캔버스로 잘라둡니다.
//  나중에 진짜 투명 PNG 로 바꾸면 SHEETS 의 key 를 false 로 두면 됩니다.
//
//  도트 화면에 맞추려고 절반 해상도로 그린 뒤 크게 늘립니다 (image-rendering: pixelated).
// ============================================================
const FX = (() => {
  'use strict';

  // 프레임 자리 [x, y, 폭, 높이] — 그림에서 직접 재서 적었습니다 (줄마다 왼쪽부터 순서대로)
  const SHEETS = {
    foe: {
      src: 'assets/fx/enemy-attacks.webp', key: true,
      anims: {
        // 붉은 할퀴기 — 흉포 · 흡혈
        claw:   [[43, 101, 57, 48], [155, 84, 66, 63], [271, 80, 64, 68], [395, 62, 90, 98], [526, 58, 100, 139],
                 [676, 60, 148, 97], [832, 60, 134, 104], [980, 52, 192, 112], [1214, 43, 276, 149]],
        // 갈색 타격 — 번쩍 하고 비스듬히 튀는 파편. 관통 · 신속
        burst:  [[58, 265, 56, 31], [173, 242, 102, 96], [334, 206, 113, 147], [524, 204, 93, 185],
                 [684, 221, 123, 148], [879, 229, 138, 142], [1060, 234, 203, 129], [1319, 234, 170, 134]],
        // 땅에서 솟는 바위 — 분쇄
        quake:  [[52, 446, 29, 74], [163, 443, 52, 87], [297, 428, 92, 107], [444, 428, 159, 112],
                 [677, 435, 264, 120], [993, 428, 147, 128], [1144, 461, 160, 85], [1319, 458, 153, 84]],
        // 흙먼지 고리 — 내려찍어 퍼지는 충격. 수호
        sweep:  [[43, 604, 130, 50], [203, 600, 157, 101], [419, 614, 77, 84], [554, 597, 159, 102],
                 [779, 611, 221, 94], [1064, 616, 111, 80], [1202, 624, 289, 76]],
        // 보랏빛 반짝임 → 고리 — 행운 · 성장
        spark:  [[92, 778, 17, 18], [205, 748, 63, 69], [355, 749, 93, 83], [538, 747, 113, 83],
                 [744, 757, 112, 76], [943, 759, 131, 56]],
        // 솟는 수정 가시 — 반격 · 보호
        spikes: [[67, 867, 29, 81], [230, 881, 52, 92], [380, 884, 51, 95], [536, 871, 110, 109],
                 [752, 898, 117, 84], [895, 852, 239, 133], [1144, 861, 316, 123]]
      }
    },
    hero: {
      src: 'assets/fx/hero-attacks.webp', key: true,
      anims: {
        slash:    [[49, 116, 60, 56], [168, 112, 71, 64], [283, 103, 84, 73], [395, 94, 112, 84], [539, 69, 118, 112],
                   [686, 55, 188, 128], [873, 54, 188, 130], [1060, 54, 231, 136], [1314, 52, 190, 136]],   // 보통 타격
        crescent: [[54, 247, 182, 159], [272, 266, 127, 139], [433, 240, 223, 161], [739, 246, 191, 155],
                   [993, 238, 202, 166], [1211, 264, 287, 138]],                                          // 치명타
        star:     [[99, 516, 80, 47], [256, 488, 224, 104], [501, 460, 217, 157], [719, 456, 233, 173],
                   [973, 458, 238, 168], [1242, 472, 267, 128]],                                          // 일격
        ring:     [[37, 673, 187, 81], [241, 682, 183, 96], [456, 675, 263, 104], [736, 670, 256, 114],
                   [1022, 672, 226, 109], [1290, 681, 188, 96]],                                          // 반사
        bolt:     [[88, 841, 36, 152], [278, 835, 79, 157], [505, 832, 92, 161], [779, 831, 62, 165],
                   [1006, 832, 80, 161], [1338, 846, 109, 148]]                                           // 이중타격의 두 번째
      }
    }
  };

  // 상대의 성격(data.js 의 ARCHETYPES) → 그 상대가 때릴 때의 이펙트
  const FOE_BY_ARCH = {
    fierce: 'claw', leech: 'claw',
    pierce: 'burst', swift: 'burst',
    brutal: 'quake',
    guard: 'sweep',
    lucky: 'spark', growth: 'spark',
    thorn: 'spikes', ward: 'spikes'
  };

  const PIX = 2;            // 도트 크기 — 절반 해상도로 그려 두 배로 늘립니다
  const ready = {};         // 그림 이름 → { 이펙트 이름 → { frames: [캔버스], maxW, maxH } }

  // 가짜 체크무늬(밝은 무채색 두 톤)를 투명하게 — 어둡거나 색이 있을수록 불투명.
  // 섞여 있던 배경색(238 회색으로 봅니다)을 걷어내 가장자리가 하얗게 뜨지 않게 합니다.
  function keyOut(d) {
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const mn = Math.min(r, g, b), mx = Math.max(r, g, b);
      let a = Math.max(Math.max(0, 222 - mn) / 90, (mx - mn - 8) / 50);
      a = Math.max(0, Math.min(1, (a - 0.15) / 0.85));
      if (a <= 0) { d[i + 3] = 0; continue; }
      for (let k = 0; k < 3; k++) d[i + k] = Math.max(0, Math.min(255, (d[i + k] - (1 - a) * 238) / a));
      d[i + 3] = Math.round(a * 255);
    }
  }

  function prepare(name) {
    const s = SHEETS[name];
    if (!s || ready[name]) return;
    const im = new Image();
    im.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = im.width;
        c.height = im.height;
        const g = c.getContext('2d', { willReadFrequently: true });
        g.drawImage(im, 0, 0);
        const out = {};
        for (const [anim, boxes] of Object.entries(s.anims)) {
          const frames = boxes.map(([x, y, w, h]) => {
            const id = g.getImageData(x, y, w, h);
            if (s.key) keyOut(id.data);
            const f = document.createElement('canvas');
            f.width = w;
            f.height = h;
            f.getContext('2d').putImageData(id, 0, 0);
            return f;
          });
          out[anim] = { frames, maxW: Math.max(...boxes.map(b => b[2])), maxH: Math.max(...boxes.map(b => b[3])) };
        }
        ready[name] = out;
      } catch (e) { /* 그림을 못 쓰면 이펙트 없이 갑니다 */ }
    };
    im.src = s.src;
  }

  // target(초상) 가운데에 이펙트 하나. 크기는 초상 폭의 scale 배, 길이는 ms.
  function play(sheet, anim, target, opt) {
    const a = ready[sheet] && ready[sheet][anim];
    if (!a || !target || !target.isConnected) return;
    const o = opt || {};
    const size = Math.max(24, Math.round(target.clientWidth * (o.scale || 1.3)));
    const cv = document.createElement('canvas');
    cv.className = 'fx-sprite';
    cv.width = cv.height = Math.max(12, Math.round(size / PIX));
    cv.style.width = cv.style.height = `${size}px`;
    target.appendChild(cv);
    const g = cv.getContext('2d');
    const s = Math.min(cv.width / a.maxW, cv.height / a.maxH);
    const total = o.ms || 420;
    const n = a.frames.length;
    const t0 = performance.now();
    let last = -1;
    const step = now => {
      const i = Math.floor((now - t0) / total * n);
      if (i >= n || !cv.isConnected) { cv.remove(); return; }
      if (i !== last) {
        last = i;
        const f = a.frames[i];
        const w = f.width * s, h = f.height * s;
        g.clearRect(0, 0, cv.width, cv.height);
        g.drawImage(f, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function foeAnimFor(foe) { return (foe && FOE_BY_ARCH[foe.arch]) || 'burst'; }

  // ---------- 주인공 그림 ----------
  // 전리품 탭 사람 그림 자리에 들어가는 그림. 마왕을 지나면 해진 옷으로 바뀝니다 (ui.js 의 renderDoll).
  // 이 그림도 배경에 체크무늬가 박혀 있어서 열 때 한 번 걷어냅니다 — 다만 이펙트와 달리
  // 체크무늬 톤이 더 어둡고(회색 178) 몸 색과 겹치므로, 가장자리에서부터 번져 들어가는 것만 지우고
  // 다리 사이에 갇힌 것은 정확히 그 두 톤일 때만 지웁니다. 발밑 그림자는 한 가지 반투명 어둠으로 통일합니다.
  const HEROES = {
    fresh: 'assets/hero/hunter.webp',
    worn:  'assets/hero/hunter-worn.webp'
  };
  const HERO_CROP = [410, 45, 230, 500];     // 그림(1024×559) 가운데 사람이 선 자리
  const heroURL = {};                        // 이름 → blob 주소 (다 만들어지면)
  const heroWaiters = [];

  function keyHero(id, w, h) {
    const d = id.data;
    const neutral = (i, minMn, maxSpread) => {
      const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
      const mn = Math.min(r, g, b), mx = Math.max(r, g, b);
      return mn >= minMn && (mx - mn) <= maxSpread;
    };
    const bg = new Uint8Array(w * h);
    const stack = [];
    for (let x = 0; x < w; x++) stack.push(x, x + (h - 1) * w);
    for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
    while (stack.length) {
      const i = stack.pop();
      if (bg[i] || !neutral(i, 160, 16)) continue;
      bg[i] = 1;
      const x = i % w, y = (i / w) | 0;
      if (x > 0) stack.push(i - 1);
      if (x < w - 1) stack.push(i + 1);
      if (y > 0) stack.push(i - w);
      if (y < h - 1) stack.push(i + w);
    }
    for (let i = 0; i < w * h; i++) if (!bg[i] && neutral(i, 170, 10)) bg[i] = 1;   // 몸 사이에 갇힌 것
    for (let pass = 0; pass < 2; pass++) {                                           // 가장자리 한두 겹
      const mark = [];
      for (let i = 0; i < w * h; i++) {
        if (bg[i]) continue;
        const x = i % w, y = (i / w) | 0;
        const near = (x > 0 && bg[i - 1]) || (x < w - 1 && bg[i + 1]) || (y > 0 && bg[i - w]) || (y < h - 1 && bg[i + w]);
        if (near && neutral(i, 130, 30)) mark.push(i);
      }
      for (const i of mark) bg[i] = 1;
    }
    for (let i = 0; i < w * h; i++) {
      if (bg[i]) { d[i * 4 + 3] = 0; continue; }
      const y = (i / w) | 0;
      if (y >= 500 && neutral(i, 0, 16) && Math.min(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) < 165) {
        d[i * 4] = 24; d[i * 4 + 1] = 14; d[i * 4 + 2] = 8; d[i * 4 + 3] = 100;
      }
    }
  }

  function prepareHero(name) {
    const im = new Image();
    im.onload = () => {
      try {
        const [cx, cy, cw, ch] = HERO_CROP;
        const c = document.createElement('canvas');
        c.width = im.width;
        c.height = im.height;
        const g = c.getContext('2d', { willReadFrequently: true });
        g.drawImage(im, 0, 0);
        const id = g.getImageData(0, 0, c.width, c.height);
        keyHero(id, c.width, c.height);
        g.putImageData(id, 0, 0);
        const out = document.createElement('canvas');
        out.width = cw;
        out.height = ch;
        out.getContext('2d').drawImage(c, cx, cy, cw, ch, 0, 0, cw, ch);
        out.toBlob(blob => {
          if (!blob) return;
          heroURL[name] = URL.createObjectURL(blob);
          for (const fn of heroWaiters.splice(0)) fn(name);
        });
      } catch (e) { /* 그림을 못 쓰면 예전 실루엣으로 갑니다 */ }
    };
    im.src = HEROES[name];
  }

  // 주인공 그림 주소 — 아직 못 만들었으면 null. 만들어지면 fn 을 한 번 부릅니다.
  function heroPortrait(name, fn) {
    if (heroURL[name]) return heroURL[name];
    if (fn) heroWaiters.push(fn);
    return null;
  }

  // 첫 전투 전에 미리 잘라둡니다 — 첫 화면을 그리는 데 방해되지 않게 조금 뒤에
  setTimeout(() => { prepare('foe'); prepare('hero'); }, 400);
  prepareHero('fresh');
  prepareHero('worn');

  return { play, foeAnimFor, heroPortrait, isReady: name => !!ready[name] };
})();
