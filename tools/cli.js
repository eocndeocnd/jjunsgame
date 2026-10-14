// 명령줄 도구 — Node 가 있을 때만 씁니다 (없으면 같은 일을 하는 tools/*.html 을 브라우저로 여세요).
//
//   node tools/cli.js images      그림 목록(design/images/*)을 다시 뽑는다
//   node tools/cli.js check-ids   전리품 번호가 몰래 바뀌지 않았는지 검사한다 (build.py 가 자동으로 부릅니다)
//   node tools/cli.js snapshot    전리품 번호표(tools/item-snapshot.json)를 지금 상태로 갱신한다 — 의도한 변경 뒤에만
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const write = (p, s) => { const f = path.join(ROOT, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s, 'utf8'); };

// js/data.js 를 게임 밖에서 읽어 필요한 값만 꺼냅니다 (data.js 는 화면을 건드리지 않습니다)
function loadData() {
  const text = read('js/data.js');
  const names = ['ITEMS', 'ENEMIES', 'ZONES', 'RANKS', 'ARCHETYPES', 'SPECIAL_INFO', 'STAT_KEYS', 'SPECIAL_KEYS', 'SLOT_IDS',
    'AVATAR_LINES', 'NAMELESS_ID', 'ENEMY_BY_ID', 'canBecomeAvatar', 'RETIRED_ITEMS'];
  return { data: vm.runInNewContext(`${text}\n;({ ${names.join(', ')} })`, {}, { filename: 'data.js' }), text };
}

const cmd = process.argv[2];
if (cmd === 'images') {
  const { data, text } = loadData();
  const out = require('./image-manifest.js').build(data, text);
  write('design/images/image-manifest.json', out.json);
  write('design/images/IMAGE_GUIDE.md', out.md);
  console.log(`그림 목록을 다시 뽑았습니다 — 몬스터 ${out.counts.monsters} · 전리품 ${out.counts.items}`);
} else if (cmd === 'check-ids' || cmd === 'snapshot') {
  const { data } = loadData();
  const ids = require('./id-check.js');
  if (cmd === 'snapshot') {
    const s = ids.snapshot(data);
    write('tools/item-snapshot.json', JSON.stringify(s, null, 1) + '\n');
    console.log(`전리품 번호표를 갱신했습니다 — ${s.count}개`);
  } else {
    const snap = JSON.parse(read('tools/item-snapshot.json'));
    const r = ids.compare(snap, data);
    for (const i of r.infos) console.log('  · ' + i);
    if (!r.ok) {
      console.error('전리품 번호 검사 실패 — 옛 저장본이 있는 사람의 장비가 몰래 바뀔 수 있습니다:');
      for (const e of r.errors) console.error('  ✗ ' + e);
      console.error('의도한 변경이면 RETIRED_ITEMS 로 정리하거나, 확인한 뒤 `node tools/cli.js snapshot` 으로 번호표를 갱신하세요.');
      process.exit(1);
    }
    console.log('  전리품 번호 검사 통과');
  }
} else {
  console.log('사용법: node tools/cli.js images | check-ids | snapshot');
  process.exit(cmd ? 1 : 0);
}
