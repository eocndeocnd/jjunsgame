// ============================================================
//  prompt-batches.js — 그림 목록(image-manifest)의 장비를, 이미지 AI 에 바로 붙여 넣을 프롬프트 묶음으로 나눕니다.
//  한 번에 다 만들지 않게: 격마다 한 파일(design/images/prompts/rankNN.md), 그 안에서 한 장에 9개까지(3×3 시트).
//
//  어떻게 돌리나: node tools/cli.js images  (그림 목록을 뽑을 때 같이 다시 뽑습니다 — 손으로 고치지 마세요)
//
//  · 배경은 한 가지 자홍색(#FF00FF) — 이미지 AI 의 「투명 배경」은 체크무늬가 박혀 나오는 일이 잦아서, 나중에 도구로 걷어냅니다.
//  · 어느 칸이 어느 장비인지는 sheets.json 에 — 시트를 잘라 assets/items/<id>.png 로 만드는 도구가 읽을 자리입니다 (아직 안 만듦).
// ============================================================
'use strict';

const PER_SHEET = 9;                        // 3×3 — 1024px 한 장에서 한 칸이 약 341px (아이콘은 256px)
const SLOT_ORDER = ['weapon', 'offhand', 'helm', 'armor', 'shoulder', 'gloves', 'belt', 'greaves', 'boots', 'cloak', 'ring', 'necklace', 'bracelet', 'special'];
const SLOT_KO = { weapon: '무기', offhand: '보조무기', helm: '투구', armor: '갑옷', shoulder: '어깨', gloves: '장갑', belt: '허리띠', greaves: '각반',
                  boots: '신발', cloak: '망토', ring: '반지', necklace: '목걸이', bracelet: '팔찌', special: '특수장비' };
// 부위마다 같은 시점 — 같은 부위끼리 비율이 맞아야 칸에 나란히 놓였을 때 어색하지 않습니다
const SLOT_EN = {
  weapon:   ['WEAPON', 'whole weapon, diagonal, tip or head toward the upper right'],
  offhand:  ['OFF-HAND (shield, book, lantern, orb ...)', 'front view, slightly tilted'],
  helm:     ['HEADGEAR', '3/4 front view, empty (no head inside)'],
  armor:    ['BODY ARMOR / CLOTHING', 'front view, torso piece only, empty (no body inside)'],
  shoulder: ['SHOULDER GUARD', 'one pauldron or a matching pair, 3/4 view'],
  gloves:   ['GLOVES / GAUNTLETS', 'a pair, backs of the hands, fingers up'],
  belt:     ['BELT / SASH', 'laid in a loop, buckle or knot at the front'],
  greaves:  ['LEG ARMOR', 'a pair of shin guards, front view'],
  boots:    ['BOOTS / SHOES', 'a pair, side view facing right'],
  cloak:    ['CLOAK / CAPE', 'front view, hanging open, empty (no body inside)'],
  ring:     ['RING', 'single ring, 3/4 view so the band is visible'],
  necklace: ['NECKLACE / AMULET', 'chain in a loop, pendant at the bottom center'],
  bracelet: ['BRACELET / BANGLE / WRISTWATCH', 'single band, 3/4 view'],
  special:  ['SMALL PRECIOUS OBJECT (gem or relic)', 'single small object, 3/4 view']
};
// 격이 높을수록 화려하게 (design/images/IMAGE_GUIDE.md 의 「일관성」)
const TIERS = [
  [3,  'low-tier gear — rough, worn, humble materials: rusty iron, bone, hide, cloth, wood. Muted colors, no glow.'],
  [6,  'mid-tier gear — solid forged metal, good leather, small magic stones. Cleaner shapes, a little shine, at most a faint glow.'],
  [12, 'high-tier gear — mythic and ornate: gold or silver trim, engraved patterns, gems, a soft glow.'],
  [99, 'top-tier gear — divine or otherworldly: radiant, strange materials, a strong glow, elaborate but still one clear silhouette.']
];
const GRADE_EN = { normal: 'plain look', elite: 'more refined and menacing', hidden: 'mysterious, faintly glowing', boss: 'the most ornate and imposing piece of this set' };
// 성격(이름으로 찾습니다 — archetype_note 의 앞머리) → 분위기 한마디
const MOOD_EN = { '흉포': 'aggressive, sharp', '수호': 'sturdy, protective', '흡혈': 'sinister, a touch of blood red', '신속': 'light, slim, built for speed',
                  '관통': 'pointed, piercing', '반격': 'spiked, thorny', '행운': 'a lucky charm, a hint of gold', '성장': 'modest, well used',
                  '분쇄': 'heavy, blunt, massive', '보호': 'reinforced, built to last' };

const STYLE = [
  'STYLE — the same for every icon:',
  '- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight',
  '- one object per icon, a simple bold silhouette that still reads at 64 px',
  '- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows',
  '',
  'BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.',
  'Do not use magenta or hot pink on the items themselves.'
].join('\n');

const tierOf = rank => TIERS.find(t => rank <= t[0])[1];
const pad = n => String(n).padStart(2, '0');

// 장비 한 줄 — 이름은 우리말 그대로 (그리는 쪽이 뜻을 읽습니다), 나머지는 영어
function itemLine(it, withFraming) {
  const src = it.from_monster === '헌터백화점'
    ? 'near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines'
    : it.from_monster === '떠돌이 상인'
      ? 'a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was'
      : !it.from_monster_id
        ? 'old treasure that was buried in a chest for a long time'
        : `loot from the monster 「${it.from_monster}」`;
  const kind = it.special_kind === 'gem' ? 'a small shining stone or crystal; ' : it.special_kind === 'relic' ? 'a small ancient object; ' : '';
  const mood = MOOD_EN[String(it.archetype_note || '').split(' — ')[0]];
  return `${SLOT_EN[it.slot][0]} 「${it.name}」 — ${src}. ${kind}${GRADE_EN[it.grade] || GRADE_EN.normal}${mood ? `; mood: ${mood}` : ''}.`
    + (it.note ? ` Hint (Korean): ${it.note}` : '')
    + (withFraming ? ` Framing: ${SLOT_EN[it.slot][1]}.` : '');
}

function sheetPrompt(items, rank) {
  const slots = SLOT_ORDER.filter(s => items.some(i => i.slot === s));
  const empty = PER_SHEET - items.length;
  return [
    `Make ONE square image, 1024x1024: a sprite sheet of ${items.length} separate game item icons in a 3x3 grid.`,
    '',
    STYLE,
    '',
    'LAYOUT: 3 columns x 3 rows of equal square cells. Exactly one item per cell, centered, filling about 70% of its cell,',
    'never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed.'
      + (empty ? ` Leave the last ${empty} cell${empty > 1 ? 's' : ''} empty (plain magenta).` : ''),
    '',
    `TIER LOOK: ${tierOf(rank)}`,
    '',
    'FRAMING BY TYPE:',
    ...slots.map(s => `- ${SLOT_EN[s][0]}: ${SLOT_EN[s][1]}`),
    '',
    'ITEMS — the names are Korean. Draw what each name describes; never write the name in the image.',
    'If a name describes a different kind of object than its type, draw the object from the name.',
    ...items.map((it, k) => `${k + 1}. ${itemLine(it, false)}`)
  ].join('\n');
}

function singleHead(rank) {
  return [
    'Make ONE square image, 1024x1024: a single game item icon.',
    '',
    STYLE,
    '',
    'LAYOUT: one object, centered, filling about 75% of the image, never touching the edges.',
    '',
    `TIER LOOK: ${tierOf(rank)}`,
    '',
    'ITEM — the name is Korean. Draw what the name describes; never write the name in the image.',
    'If the name describes a different kind of object than its type, draw the object from the name.'
  ].join('\n');
}

// n개를 한 장에 PER_SHEET 개까지, 장마다 고르게 (28개 → 7·7·7·7 — 마지막 장에 하나만 남지 않게)
function chunk(list) {
  const k = Math.ceil(list.length / PER_SHEET), base = Math.floor(list.length / k), extra = list.length % k, out = [];
  for (let i = 0, at = 0; i < k; i++) { const n = base + (i < extra ? 1 : 0); out.push(list.slice(at, at + n)); at += n; }
  return out;
}

// manifest — image-manifest.json 을 읽은 것. exists(path) — 그 그림 파일이 이미 있나 (진행 표시용).
// → { files: { 'README.md': 글, 'rank01.md': 글, …, 'sheets.json': 글 }, sheets: 장 수, items: 개수 }
function build(manifest, exists = () => false) {
  const files = {}, sheetIndex = [], rows = [];
  const ranks = [...new Set(manifest.items.map(i => i.rank))].sort((a, b) => a - b);
  for (const rank of ranks) {
    const items = manifest.items.filter(i => i.rank === rank)
      .sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot) || (a.id < b.id ? -1 : 1));
    const sheets = chunk(items), name = `rank${pad(rank)}.md`, rankName = items[0].rank_name;
    const done = items.filter(i => exists(i.file)).length;
    rows.push({ rank, rankName, n: items.length, sheets: sheets.length, name, done });
    const out = [
      `# 제${rank}격 ${rankName} — 장비 ${items.length}개 · 시트 ${sheets.length}장`,
      '',
      '> 자동으로 만든 파일입니다 (`node tools/cli.js images`). 손으로 고치지 마세요. 쓰는 법은 같은 폴더의 `README.md`.',
      ''
    ];
    sheets.forEach((list, s) => {
      const letter = String.fromCharCode(65 + s), file = `design/images/sheets/rank${pad(rank)}-${letter}.png`;
      const kinds = SLOT_ORDER.filter(x => list.some(i => i.slot === x)).map(x => SLOT_KO[x]).join(' · ');
      sheetIndex.push({ sheet: file, rank, grid: [3, 3], cells: list.map(i => ({ id: i.id, name: i.name, file: i.file })) });
      out.push(
        `## 시트 ${rank}-${letter} — ${kinds} (${list.length}개)`,
        '',
        `저장할 이름: \`${file}\``,
        '',
        '```text',
        sheetPrompt(list, rank),
        '```',
        '',
        '| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |',
        '|---|---|---|---|---|',
        ...list.map((it, k) => `| ${k + 1} | ${it.name} | ${SLOT_KO[it.slot]} | ${it.from_monster || '보물상자'} | \`${it.file}\`${exists(it.file) ? ' ✅' : ''} |`),
        ''
      );
    });
    out.push(
      '## 하나씩 뽑기 (시트가 잘 안 될 때)',
      '',
      '아래 「앞에 붙일 말」 뒤에 장비 한 줄을 붙여 보냅니다. 나온 그림은 표의 「잘라서 둘 곳」 이름으로 저장합니다 (배경은 나중에 도구가 걷어냅니다).',
      '',
      '앞에 붙일 말:',
      '',
      '```text',
      singleHead(rank),
      '```',
      '',
      ...items.flatMap(it => [`- **${it.name}** → \`${it.file}\``, '', '  ```text', `  ${itemLine(it, true)}`, '  ```', ''])
    );
    files[name] = out.join('\n');
  }

  // 차수 — 한 번에 다 만들지 않게 격을 묶습니다 (1차 = 처음 몇 시간 동안 보는 것)
  const waves = [[1, 3], [4, 6], [7, 10], [11, 15], [16, 20]].map(([a, b], w) => {
    const rs = rows.filter(r => r.rank >= a && r.rank <= b);
    const sum = k => rs.reduce((n, r) => n + r[k], 0);
    return `| ${w + 1}차 | ${a}~${b}격 | ${sum('n')} | ${sum('sheets')} | ${rs.map(r => `\`${r.name}\``).join(' · ')} | ${sum('done')}/${sum('n')} |`;
  });
  const total = rows.reduce((n, r) => n + r.n, 0), totalSheets = rows.reduce((n, r) => n + r.sheets, 0);
  files['README.md'] = [
    '# 장비 그림 프롬프트 묶음',
    '',
    '> 자동으로 만든 폴더입니다 (`node tools/cli.js images`). 손으로 고치지 마세요 — 장비가 바뀌면 다시 뽑습니다.',
    '',
    `장비 ${total}개를 **격마다 한 파일**, 그 안에서 **한 장에 ${PER_SHEET}개까지(3×3 시트)** 로 묶었습니다. 시트는 모두 ${totalSheets}장입니다.`,
    '',
    '## 차례 — 한 번에 다 만들지 않습니다',
    '',
    '| 차수 | 격 | 장비 | 시트 | 파일 | 그림 있음 |',
    '|---|---|---|---|---|---|',
    ...waves,
    '',
    '- 1차(처음 몇 시간 동안 보는 장비)를 끝내면 게임에 넣어 보고, 남에게 보여 준 다음 2차로 갑니다.',
    '- 「그림 있음」은 `assets/items/<id>.png` 파일이 있는 수입니다 — 이 폴더를 다시 뽑으면 갱신됩니다.',
    '',
    '## 쓰는 법',
    '',
    '1. **먼저 한 장만.** `rank01.md` 의 「시트 1-A」 회색 상자 안을 통째로 복사해 이미지 AI 에 붙여 넣습니다.',
    '2. 나온 그림을 봅니다 — 3×3 으로 나뉘었나 · 배경이 한 가지 자홍색인가 · 글자가 없나 · 도트 그림인가.',
    '   안 맞으면 그 대화에서 고쳐 달라고 하거나 다시 뽑습니다. 계속 안 되면 그 파일 아래 「하나씩 뽑기」를 씁니다.',
    '3. 시트 위에 적힌 이름(`design/images/sheets/rank01-A.png`)으로 저장합니다.',
    '4. 같은 대화에서 다음 시트를 이어 보내면 화풍이 덜 흔들립니다.',
    '',
    '## 프롬프트에 이미 들어 있는 규칙',
    '',
    '- **배경은 한 가지 자홍색(#FF00FF)** — 나중에 도구가 걷어내 투명하게 만듭니다. 이미지 AI 의 「투명 배경」은 체크무늬가 박혀 나오는 일이 잦습니다.',
    '- **1024×1024 한 장에 3×3** — 한 칸이 약 341px 이고, 게임에서는 256px 아이콘으로 줄여 씁니다.',
    '- 16비트 도트 · 1px 어두운 외곽선 · 글자 없음 · 같은 부위는 같은 시점.',
    '- 격이 높을수록 화려하게 — 1~3격 거칠고 소박 · 4~6격 금속과 마석 · 7~12격 신화적 장식 · 13~20격 빛나고 낯선 것.',
    '- 이름은 우리말 그대로 넣었습니다 (그리는 쪽이 뜻을 읽습니다). 이름을 그림에 쓰지 말라고 적어 두었습니다.',
    '',
    '## 그 다음 (아직 안 만듦)',
    '',
    '- 시트를 칸마다 잘라 `assets/items/<id>.png` (256×256 · 투명)로 만드는 도구 — 어느 칸이 어느 장비인지는 `sheets.json` 에 있습니다.',
    '- 그림 파일이 있으면 이모티콘 대신 그 그림이 뜨게 하는 연결.',
    ''
  ].join('\n');
  files['sheets.json'] = JSON.stringify(sheetIndex, null, 1) + '\n';
  return { files, sheets: totalSheets, items: total };
}

module.exports = { build };
