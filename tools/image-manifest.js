// ============================================================
//  image-manifest.js — 게임 데이터(js/data.js)에서 「필요한 그림 목록」을 뽑습니다.
//  적이나 전리품이 바뀌면 다시 뽑아야 합니다 (build.py 가 목록이 옛것이면 경고합니다).
//
//  어떻게 돌리나
//    · 브라우저: tools/export-images.html 을 열고 내려받기
//    · Node    : node tools/cli.js images        → design/images/ 에 바로 씁니다
//
//  브라우저와 Node 양쪽에서 같은 파일이 돕니다. 게임 데이터를 인자(data)로 받기 때문에
//  이 파일 자체는 게임 전역을 건드리지 않습니다.
// ============================================================
(function (root) {
  'use strict';

  const SLOT_EN = {
    weapon: 'weapon (sword/axe/staff etc.)', offhand: 'off-hand (shield/book/lantern etc.)', helm: 'helmet/headgear',
    armor: 'body armor/clothing', shoulder: 'shoulder guards/pauldrons', gloves: 'gloves/gauntlets', belt: 'belt/sash',
    greaves: 'leg armor/shin guards', boots: 'boots/shoes', cloak: 'cloak/cape', ring: 'ring',
    necklace: 'necklace/amulet/pendant', bracelet: 'bracelet/bangle/wristwatch', special: 'special relic or gem (small precious object)'
  };
  const KIND_KO = { normal: '일반', elite: '정예', hidden: '히든', boss: '보스' };
  const GRADE_HINT = {
    normal: '평범한 외형', elite: '조금 더 정교하고 위압적인 외형', hidden: '신비롭고 은은히 빛나는 외형',
    boss: '화려하고 압도적인 외형(가장 공들인 그림)'
  };
  const STYLE = '16-bit pixel art, crisp 1px dark outline, limited color palette, centered, no text, transparent background';

  // 32비트 FNV-1a — 파이썬(build.py)에서도 같은 값을 내서 「목록이 옛것인가」를 비교합니다.
  // 줄바꿈(CRLF/LF) · 맨 앞 BOM 차이로 값이 달라지지 않게 맞춘 뒤 UTF-8 바이트로 셉니다.
  function dataHash(text) {
    const bytes = new TextEncoder().encode(String(text).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n'));
    let h = 0x811c9dc5;
    for (const b of bytes) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, '0');
  }

  function build(d, dataText) {
    const { ITEMS, ENEMIES, ZONES, RANKS, ARCHETYPES, SPECIAL_INFO, STAT_KEYS, SPECIAL_KEYS, SLOT_IDS, AVATAR_LINES, NAMELESS_ID, ENEMY_BY_ID, canBecomeAvatar } = d;

    const zones = ZONES.map((z, i) => {
      const r = RANKS.find(x => x.n === z.rank);
      return { index: i, id: z.id, rank: z.rank, rank_name: r.name, rank_desc: r.desc, name: z.name, flavor: z.flavor };
    });
    const archName = a => (a && ARCHETYPES[a] ? `${ARCHETYPES[a].name} — ${ARCHETYPES[a].desc}` : '');

    const allEnemies = ENEMIES.concat([ENEMY_BY_ID[NAMELESS_ID]]);
    const monsters = allEnemies.map(e => {
      const z = e.id === NAMELESS_ID ? null : zones[e.zoneIndex];
      const avatar = canBecomeAvatar(e);
      const prompt = e.id === NAMELESS_ID
        ? `${e.name} — ${e.title}. 얼굴과 이름이 없는 인물의 실루엣. 전신 도트 일러스트, 투명 배경. (정체를 암시하지 말 것)`
        : `${e.name}${e.title ? ' — ' + e.title : ''}. ${z.name}(제${z.rank}격 ${z.rank_name})의 ${KIND_KO[e.kind]} 적. 전신 도트 일러스트, 투명 배경. ${GRADE_HINT[e.kind]}.`;
      return {
        id: e.id, name: e.name, title: e.title || '', kind: e.kind, kind_ko: KIND_KO[e.kind],
        zone: z ? z.name : null, zone_index: z ? z.index : null, rank: z ? z.rank : 7, rank_name: z ? z.rank_name : '설화',
        level: e.level, archetype: e.arch || null, archetype_note: archName(e.arch), placeholder_emoji: e.icon,
        is_avatar: avatar, avatar_line: avatar ? (AVATAR_LINES[e.id] || '') : '',
        drop_item_ids: ITEMS.filter(i => i.from === e.id).map(i => i.id),
        file: `assets/monsters/${e.id}.png`, size: '512x512', prompt, style: STYLE
      };
    });

    const items = ITEMS.map(i => {
      const z = i.ware ? null : zones.find(x => x.rank === i.rank.n);
      const specials = SPECIAL_KEYS.filter(k => i[k]).map(k => SPECIAL_INFO[k].name);
      const gemOrRelic = i.special === 'gem' ? '보석(작고 빛나는 돌/결정)' : i.special === 'relic' ? '유물(오래된 작은 물건)' : '';
      const src = i.ware
        ? '떠돌이 상인이 파는 먼저 온 이들의 소지품(현대적 일상용품, 낡고 사연이 있어 보이게; 누구의 것인지는 암시하지 말 것)'
        : `${i.fromName}의 전리품(${z ? z.name : ''}, 제${i.rank.n}격 ${i.rank.name})`;
      const prompt = `${SLOT_EN[i.slot].split(' (')[0]} 아이템 아이콘: ${i.name}. ${src}. ${i.arch ? '성격: ' + archName(i.arch) + '. ' : ''}${gemOrRelic ? gemOrRelic + '. ' : ''}${i.note ? '메모: ' + i.note + ' ' : ''}${GRADE_HINT[i.grade] || '평범한 외형'}. 단일 물체, 도트 일러스트, 투명 배경.`;
      return {
        id: i.id, name: i.name, slot: i.slot, slot_en: SLOT_EN[i.slot], grade: i.grade, grade_ko: KIND_KO[i.grade] || i.grade,
        rank: i.rank.n, rank_name: i.rank.name, zone: z ? z.name : null,
        from_monster_id: i.ware ? null : i.from, from_monster: i.ware ? '떠돌이 상인' : i.fromName,
        archetype: i.arch || null, archetype_note: archName(i.arch), special_kind: i.special || null, specials, note: i.note || '',
        placeholder_emoji: i.fromIcon, file: `assets/items/${i.id}.png`, size: '256x256', prompt, style: STYLE
      };
    });

    const other = [
      { id: 'hero_fresh', what: '주인공 — 기본 차림 (재킷에 가방을 멘 헌터)', file: 'assets/hero/hunter.webp', status: '있음', note: '지금은 체크무늬 배경이 박힌 그림을 코드가 걷어냄. 진짜 투명 PNG 로 바꾸면 처리 불필요' },
      { id: 'hero_worn', what: '주인공 — 마왕을 지난 뒤 해진 차림', file: 'assets/hero/hunter-worn.webp', status: '있음', note: '위와 같은 포즈 · 같은 인물, 옷만 해진 것' },
      { id: 'merchant', what: '떠돌이 상인 초상 (아직 없음, 이모티콘 🎒)', file: 'assets/other/merchant.png', status: '필요', size: '512x512', prompt: '떠돌이 상인 — 큰 배낭을 멘 나그네. 누구인지·사연은 암시하지 말 것. 도트 일러스트, 투명 배경.' },
      { id: 'avatar_art_slot', what: '화신 그림 — 화신(몬스터) 그림을 그대로 씁니다. 화신 단추 · 화신 얻는 창의 그림 칸', file: '(monsters 의 그림 재사용)', status: '몬스터 그림과 같음', note: '7격 이상 적 113명 + 무명. 화신 창에서는 정사각 칸에 contain 으로 들어갑니다' }
    ];

    const counts = {
      monsters: monsters.length,
      items: items.length,
      items_by_slot: Object.fromEntries(SLOT_IDS.concat(['special']).map(s => [s, items.filter(i => i.slot === s).length])),
      monsters_by_kind: Object.fromEntries(['normal', 'elite', 'hidden', 'boss'].map(k => [k, monsters.filter(m => m.kind === k).length])),
      avatars: monsters.filter(m => m.is_avatar).length
    };
    const spec = {
      purpose: '게임에 들어갈 그림을 AI(이미지 생성기)로 뽑기 위한 목록. 각 항목의 prompt 와 style 을 그대로 쓰거나 다듬어 쓰고, 결과를 file 경로에 맞춰 저장하면 됩니다.',
      format: 'PNG 또는 WebP, 배경은 진짜 투명(체크무늬 무늬 넣지 말 것)',
      monsters: '512x512, 전신, 가운데 정렬, 발 밑 약한 그림자 가능. 전투 초상(정사각 칸)과 화신 그림으로 같이 씀. 작게 줄여도 알아볼 실루엣이 중요.',
      items: '256x256, 물건 하나만 가운데에. 화면에서는 58~72px 정사각 칸에 contain 으로 들어감 → 단순하고 굵은 실루엣. 64x64 격자로 그려 4배 확대(nearest-neighbor)를 권장.',
      style: STYLE,
      consistency: '같은 부위의 물건끼리 시점/비율을 통일(옆모습 또는 3/4 정면). 격이 높을수록 화려하게: 1~3격은 거칠고 소박, 4~6격은 금속·마석, 7격부터는 신화적 장식.',
      grade_note: '등급: 일반 < 정예 < 히든 < 보스(격). 보스 그림이 가장 공들인 것.',
      world_note: '현대 지구 위에 이상현상(균열 속 공간)이 생긴 세계. 소지품(상인 물건)은 현대 일상용품(안전모, 손전등, 등산화 등). 그 밖의 적/전리품은 판타지·신화풍.',
      caution: '누구의 소지품인지, 상인이 누구인지, 무명이 누구인지 등 정체를 설명하는 요소는 그림에 넣지 말 것. 다른 작품의 고유 용어나 요소는 넣지 말 것.',
      attach: '파일을 위 경로에 넣은 뒤 알려 주세요 — 이모티콘 대신 그림이 뜨도록 연결합니다(코드 쪽 작업은 별도).'
    };
    // 날짜는 일부러 안 적습니다 — 같은 데이터면 늘 같은 파일이 나와야 git 에 쓸데없는 변경이 안 남습니다.
    const head = { game: '아무도 안 시킨 세계 구하기', data_hash: dataText != null ? dataHash(dataText) : '', counts, spec, zones };
    const lines = a => '[\n' + a.map(x => '  ' + JSON.stringify(x)).join(',\n') + '\n]';
    const json = '{\n' + Object.entries(head).map(([k, v]) => `"${k}": ${JSON.stringify(v, null, 1)}`).join(',\n')
      + ',\n"monsters": ' + lines(monsters) + ',\n"items": ' + lines(items) + ',\n"other": ' + lines(other) + '\n}\n';
    JSON.parse(json);   // 깨진 JSON 이면 여기서 터집니다

    // ---- 사람이 읽는 안내 (같은 내용을 격마다 묶어서) ----
    let md = `# 그림 목록 (AI 이미지 생성용)\n\n> 이 문서와 \`image-manifest.json\` 은 \`tools/export-images.html\` (또는 \`node tools/cli.js images\`) 로 만든 것입니다. 손으로 고치지 마세요 — 적이나 전리품이 바뀌면 다시 뽑아야 합니다.\n\n게임에 필요한 그림 전부의 목록입니다. 기계가 읽는 전체 데이터는 \`image-manifest.json\` 이고, 이 문서는 같은 내용을 격(지역)별로 묶은 안내입니다.\n\n## 공통 규칙\n\n- **형식**: ${spec.format}\n- **몬스터**: ${spec.monsters}\n- **전리품**: ${spec.items}\n- **화풍**: ${STYLE}\n- **일관성**: ${spec.consistency}\n- **세계관**: ${spec.world_note}\n- **주의**: ${spec.caution}\n- **저장 경로**: 몬스터 \`assets/monsters/<id>.png\` · 전리품 \`assets/items/<id>.png\` (id 는 아래 표와 json 의 id)\n\n## 개수\n\n- 몬스터 ${counts.monsters}개 (일반 ${counts.monsters_by_kind.normal} · 정예 ${counts.monsters_by_kind.elite} · 히든 ${counts.monsters_by_kind.hidden} · 보스 ${counts.monsters_by_kind.boss}) — 이 중 **화신 ${counts.avatars}명**은 몬스터 그림을 화신 그림으로도 씁니다\n- 전리품 ${counts.items}개 — 부위별: ${Object.entries(counts.items_by_slot).map(([k, v]) => `${k} ${v}`).join(' · ')}\n\n## 그 밖의 그림\n\n`
      + other.map(o => `- **${o.id}** — ${o.what} (${o.status}) → \`${o.file}\`${o.note ? ' — ' + o.note : ''}`).join('\n') + '\n';
    for (const z of zones) {
      const ms = monsters.filter(m => m.zone_index === z.index);
      md += `\n---\n\n## 제${z.rank}격 ${z.rank_name} — ${z.name}\n\n> ${z.flavor}\n\n`;
      for (const m of ms) {
        md += `### ${m.name} \`${m.id}\` — ${m.kind_ko}${m.is_avatar ? ' · 화신' : ''}\n\n- 설명: ${m.title || '-'} / 성격: ${m.archetype_note || '-'}\n- 몬스터 그림: \`${m.file}\` (지금은 ${m.placeholder_emoji})\n- 프롬프트: ${m.prompt}\n${m.avatar_line ? `- 화신의 한마디: 「${m.avatar_line}」\n` : ''}- 전리품:\n`
          + m.drop_item_ids.map(id => { const it = items.find(x => x.id === id); return `  - \`${it.id}\` **${it.name}** (${it.slot}${it.special_kind ? '·' + it.special_kind : ''}) → \`${it.file}\``; }).join('\n') + '\n\n';
      }
    }
    const wares = items.filter(i => !i.from_monster_id);
    md += `\n---\n\n## 떠돌이 상인의 소지품 (몬스터 없음)\n\n` + wares.map(it => `- \`${it.id}\` **${it.name}** (${it.slot}, 제${it.rank}격 성능) → \`${it.file}\` — ${it.note}`).join('\n') + '\n';
    const nl = monsters.find(m => m.id === NAMELESS_ID);
    md += `\n---\n\n## 무명의 화신\n\n- \`${nl.id}\` → \`${nl.file}\` — ${nl.prompt}\n`;
    return { json, md, counts };
  }

  const api = { build, dataHash };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ImageManifest = api;
})(typeof window !== 'undefined' ? window : globalThis);
