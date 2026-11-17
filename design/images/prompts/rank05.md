# 제5격 마족 — 장비 38개 · 시트 5장

> 자동으로 만든 파일입니다 (`node tools/cli.js images`). 손으로 고치지 마세요. 쓰는 법은 같은 폴더의 `README.md`.

## 시트 5-A — 무기 · 보조무기 (8개)

저장할 이름: `design/images/sheets/rank05-A.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 8 separate game item icons in a 3x3 grid.

HARD RULES — breaking any of these makes the image unusable:
1. NO TEXT ANYWHERE. Do not write item names, type names, captions, labels or numbers — not in Korean, not in English.
2. NO LINES. No grid lines, no cell borders, no frames, no dividers between items.
3. The whole background is one flat magenta (#FF00FF). Items float on it with empty space around each one.

STYLE — the same for every icon:
- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight
- one object per icon, a simple bold silhouette that still reads at 64 px
- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows

BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.
Do not use magenta or hot pink on the items themselves.

LAYOUT: an invisible 3 x 3 grid of equal square cells (do not draw it). Exactly one item per cell, centered, filling about 70% of its cell,
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed. Leave the last 1 cell empty (plain magenta).

TIER LOOK: mid-tier gear — solid forged metal, good leather, small magic stones. Cleaner shapes, a little shine, at most a faint glow.

FRAMING BY TYPE:
- WEAPON: whole weapon, diagonal, tip or head toward the upper right
- OFF-HAND (shield, book, lantern, orb ...): front view, slightly tilted

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. WEAPON 「서약의 대검」 — loot from the monster 「데스 나이트」. more refined and menacing; mood: sturdy, protective.
2. WEAPON 「전도 합금 창」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: heavy, blunt, massive. Hint (Korean): 몬스터 핵에서 뽑은 선이 심으로 들어 있다.
3. WEAPON 「서리한」 — loot from the monster 「불사의 왕」. the most ornate and imposing piece of this set; mood: reinforced, built to last.
4. WEAPON 「평화를 거두는 큰 칼」 — loot from the monster 「붉은 말의 기사」. more refined and menacing; mood: heavy, blunt, massive.
5. OFF-HAND (shield, book, lantern, orb ...) 「그림자 방패」 — loot from the monster 「발록」. plain look; mood: aggressive, sharp.
6. OFF-HAND (shield, book, lantern, orb ...) 「기근의 저울」 — loot from the monster 「검은 말의 기사」. more refined and menacing; mood: sinister, a touch of blood red.
7. OFF-HAND (shield, book, lantern, orb ...) 「휴대용 역장기」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: spiked, thorny. Hint (Korean): 켜면 팔뚝 앞에 얇은 빛막이 선다. 배터리 별매.
8. OFF-HAND (shield, book, lantern, orb ...) 「방패 대신 든 표지판」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: spiked, thorny. Hint (Korean): 「공사중 · 우회하세요」
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 서약의 대검 | 무기 | 데스 나이트 | `assets/items/deathknight_0.png` |
| 2 | 전도 합금 창 | 무기 | 헌터백화점 | `assets/items/dept_lance.png` |
| 3 | 서리한 | 무기 | 불사의 왕 | `assets/items/lichking_0.png` |
| 4 | 평화를 거두는 큰 칼 | 무기 | 붉은 말의 기사 | `assets/items/redhorse_0.png` |
| 5 | 그림자 방패 | 보조무기 | 발록 | `assets/items/balrog_2.png` |
| 6 | 기근의 저울 | 보조무기 | 검은 말의 기사 | `assets/items/blackhorse_0.png` |
| 7 | 휴대용 역장기 | 보조무기 | 헌터백화점 | `assets/items/dept_field.png` |
| 8 | 방패 대신 든 표지판 | 보조무기 | 떠돌이 상인 | `assets/items/ware_sign.png` |

## 시트 5-B — 투구 · 갑옷 · 어깨 (8개)

저장할 이름: `design/images/sheets/rank05-B.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 8 separate game item icons in a 3x3 grid.

HARD RULES — breaking any of these makes the image unusable:
1. NO TEXT ANYWHERE. Do not write item names, type names, captions, labels or numbers — not in Korean, not in English.
2. NO LINES. No grid lines, no cell borders, no frames, no dividers between items.
3. The whole background is one flat magenta (#FF00FF). Items float on it with empty space around each one.

STYLE — the same for every icon:
- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight
- one object per icon, a simple bold silhouette that still reads at 64 px
- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows

BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.
Do not use magenta or hot pink on the items themselves.

LAYOUT: an invisible 3 x 3 grid of equal square cells (do not draw it). Exactly one item per cell, centered, filling about 70% of its cell,
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed. Leave the last 1 cell empty (plain magenta).

TIER LOOK: mid-tier gear — solid forged metal, good leather, small magic stones. Cleaner shapes, a little shine, at most a faint glow.

FRAMING BY TYPE:
- HEADGEAR: 3/4 front view, empty (no head inside)
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)
- SHOULDER GUARD: one pauldron or a matching pair, 3/4 view

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. HEADGEAR 「통곡의 두건」 — loot from the monster 「밴시」. plain look; mood: aggressive, sharp.
2. HEADGEAR 「학자의 관」 — loot from the monster 「리치」. more refined and menacing; mood: pointed, piercing.
3. HEADGEAR 「승리의 면류관」 — loot from the monster 「흰 말의 기사」. more refined and menacing; mood: pointed, piercing.
4. BODY ARMOR / CLOTHING 「뼈 갑주」 — loot from the monster 「본 드래곤」. plain look; mood: pointed, piercing.
5. BODY ARMOR / CLOTHING 「사자의 판금」 — loot from the monster 「데스 나이트」. more refined and menacing; mood: sturdy, protective.
6. BODY ARMOR / CLOTHING 「불사의 판금」 — loot from the monster 「불사의 왕」. the most ornate and imposing piece of this set; mood: reinforced, built to last.
7. SHOULDER GUARD 「계약의 낙인」 — loot from the monster 「데몬 로드」. plain look; mood: heavy, blunt, massive.
8. SHOULDER GUARD 「악몽의 어깨」 — loot from the monster 「인큐버스」. plain look; mood: sinister, a touch of blood red.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 통곡의 두건 | 투구 | 밴시 | `assets/items/banshee_0.png` |
| 2 | 학자의 관 | 투구 | 리치 | `assets/items/lich_2.png` |
| 3 | 승리의 면류관 | 투구 | 흰 말의 기사 | `assets/items/whitehorse_0.png` |
| 4 | 뼈 갑주 | 갑옷 | 본 드래곤 | `assets/items/bonedragon_0.png` |
| 5 | 사자의 판금 | 갑옷 | 데스 나이트 | `assets/items/deathknight_1.png` |
| 6 | 불사의 판금 | 갑옷 | 불사의 왕 | `assets/items/lichking_1.png` |
| 7 | 계약의 낙인 | 어깨 | 데몬 로드 | `assets/items/demonlord_0.png` |
| 8 | 악몽의 어깨 | 어깨 | 인큐버스 | `assets/items/incubus_0.png` |

## 시트 5-C — 장갑 · 허리띠 · 각반 · 신발 · 망토 (8개)

저장할 이름: `design/images/sheets/rank05-C.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 8 separate game item icons in a 3x3 grid.

HARD RULES — breaking any of these makes the image unusable:
1. NO TEXT ANYWHERE. Do not write item names, type names, captions, labels or numbers — not in Korean, not in English.
2. NO LINES. No grid lines, no cell borders, no frames, no dividers between items.
3. The whole background is one flat magenta (#FF00FF). Items float on it with empty space around each one.

STYLE — the same for every icon:
- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight
- one object per icon, a simple bold silhouette that still reads at 64 px
- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows

BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.
Do not use magenta or hot pink on the items themselves.

LAYOUT: an invisible 3 x 3 grid of equal square cells (do not draw it). Exactly one item per cell, centered, filling about 70% of its cell,
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed. Leave the last 1 cell empty (plain magenta).

TIER LOOK: mid-tier gear — solid forged metal, good leather, small magic stones. Cleaner shapes, a little shine, at most a faint glow.

FRAMING BY TYPE:
- GLOVES / GAUNTLETS: a pair, backs of the hands, fingers up
- BELT / SASH: laid in a loop, buckle or knot at the front
- LEG ARMOR: a pair of shin guards, front view
- BOOTS / SHOES: a pair, side view facing right
- CLOAK / CAPE: front view, hanging open, empty (no body inside)

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. GLOVES / GAUNTLETS 「갈퀴손」 — loot from the monster 「구울」. plain look; mood: sinister, a touch of blood red.
2. BELT / SASH 「수의 허리끈」 — loot from the monster 「구울」. plain look; mood: sinister, a touch of blood red.
3. BELT / SASH 「탄창이 빈 전술 벨트」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: sturdy, protective. Hint (Korean): 고리마다 누군가의 손때가 있다.
4. LEG ARMOR 「용암 정강이」 — loot from the monster 「발록」. plain look; mood: aggressive, sharp.
5. BOOTS / SHOES 「해골 발톱」 — loot from the monster 「본 드래곤」. plain look; mood: pointed, piercing.
6. CLOAK / CAPE 「죽음이 걸친 창백한 망토」 — loot from the monster 「창백한 말의 기사」. more refined and menacing; mood: spiked, thorny.
7. CLOAK / CAPE 「귀족의 망토」 — loot from the monster 「뱀파이어」. plain look; mood: sinister, a touch of blood red.
8. CLOAK / CAPE 「찢긴 방수 망토」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: reinforced, built to last. Hint (Korean): 후드를 쓰면 빗소리 같은 것이 들린다.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 갈퀴손 | 장갑 | 구울 | `assets/items/ghoul_0.png` |
| 2 | 수의 허리끈 | 허리띠 | 구울 | `assets/items/ghoul_2.png` |
| 3 | 탄창이 빈 전술 벨트 | 허리띠 | 떠돌이 상인 | `assets/items/ware_belt.png` |
| 4 | 용암 정강이 | 각반 | 발록 | `assets/items/balrog_1.png` |
| 5 | 해골 발톱 | 신발 | 본 드래곤 | `assets/items/bonedragon_1.png` |
| 6 | 죽음이 걸친 창백한 망토 | 망토 | 창백한 말의 기사 | `assets/items/palehorse_0.png` |
| 7 | 귀족의 망토 | 망토 | 뱀파이어 | `assets/items/vampire_1.png` |
| 8 | 찢긴 방수 망토 | 망토 | 떠돌이 상인 | `assets/items/ware_raincoat.png` |

## 시트 5-D — 망토 · 반지 · 목걸이 (7개)

저장할 이름: `design/images/sheets/rank05-D.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 7 separate game item icons in a 3x3 grid.

HARD RULES — breaking any of these makes the image unusable:
1. NO TEXT ANYWHERE. Do not write item names, type names, captions, labels or numbers — not in Korean, not in English.
2. NO LINES. No grid lines, no cell borders, no frames, no dividers between items.
3. The whole background is one flat magenta (#FF00FF). Items float on it with empty space around each one.

STYLE — the same for every icon:
- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight
- one object per icon, a simple bold silhouette that still reads at 64 px
- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows

BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.
Do not use magenta or hot pink on the items themselves.

LAYOUT: an invisible 3 x 3 grid of equal square cells (do not draw it). Exactly one item per cell, centered, filling about 70% of its cell,
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed. Leave the last 2 cells empty (plain magenta).

TIER LOOK: mid-tier gear — solid forged metal, good leather, small magic stones. Cleaner shapes, a little shine, at most a faint glow.

FRAMING BY TYPE:
- CLOAK / CAPE: front view, hanging open, empty (no body inside)
- RING: single ring, 3/4 view so the band is visible
- NECKLACE / AMULET: chain in a loop, pendant at the bottom center

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. CLOAK / CAPE 「안개 수의」 — loot from the monster 「레이스」. plain look; mood: light, slim, built for speed.
2. RING 「피로 쓴 서명」 — loot from the monster 「데몬 로드」. plain look; mood: heavy, blunt, massive.
3. RING 「유혹의 반지」 — loot from the monster 「서큐버스」. plain look; mood: a lucky charm, a hint of gold.
4. NECKLACE / AMULET 「장례 종 목걸이」 — old treasure that was buried in a chest for a long time. plain look; mood: sinister, a touch of blood red.
5. NECKLACE / AMULET 「성물함」 — loot from the monster 「리치」. more refined and menacing; mood: pointed, piercing.
6. NECKLACE / AMULET 「훔친 꿈」 — loot from the monster 「서큐버스」. plain look; mood: a lucky charm, a hint of gold.
7. NECKLACE / AMULET 「번호만 남은 인식표」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: a lucky charm, a hint of gold. Hint (Korean): 체인에 묻은 얼룩은 닦이지 않는다.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 안개 수의 | 망토 | 레이스 | `assets/items/wraith_0.png` |
| 2 | 피로 쓴 서명 | 반지 | 데몬 로드 | `assets/items/demonlord_2.png` |
| 3 | 유혹의 반지 | 반지 | 서큐버스 | `assets/items/succubus_0.png` |
| 4 | 장례 종 목걸이 | 목걸이 | 보물상자 | `assets/items/chest_necro_bell.png` |
| 5 | 성물함 | 목걸이 | 리치 | `assets/items/lich_1.png` |
| 6 | 훔친 꿈 | 목걸이 | 서큐버스 | `assets/items/succubus_1.png` |
| 7 | 번호만 남은 인식표 | 목걸이 | 떠돌이 상인 | `assets/items/ware_tag.png` |

## 시트 5-E — 팔찌 · 특수장비 (7개)

저장할 이름: `design/images/sheets/rank05-E.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 7 separate game item icons in a 3x3 grid.

HARD RULES — breaking any of these makes the image unusable:
1. NO TEXT ANYWHERE. Do not write item names, type names, captions, labels or numbers — not in Korean, not in English.
2. NO LINES. No grid lines, no cell borders, no frames, no dividers between items.
3. The whole background is one flat magenta (#FF00FF). Items float on it with empty space around each one.

STYLE — the same for every icon:
- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight
- one object per icon, a simple bold silhouette that still reads at 64 px
- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows

BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.
Do not use magenta or hot pink on the items themselves.

LAYOUT: an invisible 3 x 3 grid of equal square cells (do not draw it). Exactly one item per cell, centered, filling about 70% of its cell,
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed. Leave the last 2 cells empty (plain magenta).

TIER LOOK: mid-tier gear — solid forged metal, good leather, small magic stones. Cleaner shapes, a little shine, at most a faint glow.

FRAMING BY TYPE:
- BRACELET / BANGLE / WRISTWATCH: single band, 3/4 view
- SMALL PRECIOUS OBJECT (gem or relic): single small object, 3/4 view

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. BRACELET / BANGLE / WRISTWATCH 「예고의 고리」 — loot from the monster 「밴시」. plain look; mood: aggressive, sharp.
2. BRACELET / BANGLE / WRISTWATCH 「멈춘 손목시계」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: light, slim, built for speed. Hint (Korean): 바늘은 새벽 네 시 십 분에서 움직이지 않는다.
3. BRACELET / BANGLE / WRISTWATCH 「원한의 고리」 — loot from the monster 「레이스」. plain look; mood: light, slim, built for speed.
4. SMALL PRECIOUS OBJECT (gem or relic) 「죽지 않는 성물함」 — loot from the monster 「불사의 왕」. a small ancient object; the most ornate and imposing piece of this set.
5. SMALL PRECIOUS OBJECT (gem or relic) 「까마귀가 물어 온 청옥」 — loot from the monster 「까마귀 왕」. a small shining stone or crystal; mysterious, faintly glowing.
6. SMALL PRECIOUS OBJECT (gem or relic) 「검은 깃 부적」 — loot from the monster 「까마귀 왕」. a small ancient object; mysterious, faintly glowing.
7. SMALL PRECIOUS OBJECT (gem or relic) 「흡혈귀의 송곳니」 — loot from the monster 「뱀파이어」. a small ancient object; plain look.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 예고의 고리 | 팔찌 | 밴시 | `assets/items/banshee_1.png` |
| 2 | 멈춘 손목시계 | 팔찌 | 떠돌이 상인 | `assets/items/ware_watch.png` |
| 3 | 원한의 고리 | 팔찌 | 레이스 | `assets/items/wraith_1.png` |
| 4 | 죽지 않는 성물함 | 특수장비 | 불사의 왕 | `assets/items/lichking_4.png` |
| 5 | 까마귀가 물어 온 청옥 | 특수장비 | 까마귀 왕 | `assets/items/ravenking_0.png` |
| 6 | 검은 깃 부적 | 특수장비 | 까마귀 왕 | `assets/items/ravenking_1.png` |
| 7 | 흡혈귀의 송곳니 | 특수장비 | 뱀파이어 | `assets/items/vampire_4.png` |

## 하나씩 뽑기 (시트가 잘 안 될 때)

아래 「앞에 붙일 말」 뒤에 장비 한 줄을 붙여 보냅니다. 나온 그림은 표의 「잘라서 둘 곳」 이름으로 저장합니다 (배경은 나중에 도구가 걷어냅니다).

앞에 붙일 말:

```text
Make ONE square image, 1024x1024: a single game item icon.

HARD RULES — breaking any of these makes the image unusable:
1. NO TEXT ANYWHERE. Do not write item names, type names, captions, labels or numbers — not in Korean, not in English.
2. NO LINES. No grid lines, no cell borders, no frames, no dividers between items.
3. The whole background is one flat magenta (#FF00FF). Items float on it with empty space around each one.

STYLE — the same for every icon:
- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight
- one object per icon, a simple bold silhouette that still reads at 64 px
- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows

BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.
Do not use magenta or hot pink on the items themselves.

LAYOUT: one object, centered, filling about 75% of the image, never touching the edges.

TIER LOOK: mid-tier gear — solid forged metal, good leather, small magic stones. Cleaner shapes, a little shine, at most a faint glow.

ITEM — the name is Korean. Draw what the name describes; never write the name in the image.
If the name describes a different kind of object than its type, draw the object from the name.
```

- **서약의 대검** → `assets/items/deathknight_0.png`

  ```text
  WEAPON 「서약의 대검」 — loot from the monster 「데스 나이트」. more refined and menacing; mood: sturdy, protective. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **전도 합금 창** → `assets/items/dept_lance.png`

  ```text
  WEAPON 「전도 합금 창」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: heavy, blunt, massive. Hint (Korean): 몬스터 핵에서 뽑은 선이 심으로 들어 있다. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **서리한** → `assets/items/lichking_0.png`

  ```text
  WEAPON 「서리한」 — loot from the monster 「불사의 왕」. the most ornate and imposing piece of this set; mood: reinforced, built to last. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **평화를 거두는 큰 칼** → `assets/items/redhorse_0.png`

  ```text
  WEAPON 「평화를 거두는 큰 칼」 — loot from the monster 「붉은 말의 기사」. more refined and menacing; mood: heavy, blunt, massive. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **그림자 방패** → `assets/items/balrog_2.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「그림자 방패」 — loot from the monster 「발록」. plain look; mood: aggressive, sharp. Framing: front view, slightly tilted.
  ```

- **기근의 저울** → `assets/items/blackhorse_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「기근의 저울」 — loot from the monster 「검은 말의 기사」. more refined and menacing; mood: sinister, a touch of blood red. Framing: front view, slightly tilted.
  ```

- **휴대용 역장기** → `assets/items/dept_field.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「휴대용 역장기」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: spiked, thorny. Hint (Korean): 켜면 팔뚝 앞에 얇은 빛막이 선다. 배터리 별매. Framing: front view, slightly tilted.
  ```

- **방패 대신 든 표지판** → `assets/items/ware_sign.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「방패 대신 든 표지판」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: spiked, thorny. Hint (Korean): 「공사중 · 우회하세요」 Framing: front view, slightly tilted.
  ```

- **통곡의 두건** → `assets/items/banshee_0.png`

  ```text
  HEADGEAR 「통곡의 두건」 — loot from the monster 「밴시」. plain look; mood: aggressive, sharp. Framing: 3/4 front view, empty (no head inside).
  ```

- **학자의 관** → `assets/items/lich_2.png`

  ```text
  HEADGEAR 「학자의 관」 — loot from the monster 「리치」. more refined and menacing; mood: pointed, piercing. Framing: 3/4 front view, empty (no head inside).
  ```

- **승리의 면류관** → `assets/items/whitehorse_0.png`

  ```text
  HEADGEAR 「승리의 면류관」 — loot from the monster 「흰 말의 기사」. more refined and menacing; mood: pointed, piercing. Framing: 3/4 front view, empty (no head inside).
  ```

- **뼈 갑주** → `assets/items/bonedragon_0.png`

  ```text
  BODY ARMOR / CLOTHING 「뼈 갑주」 — loot from the monster 「본 드래곤」. plain look; mood: pointed, piercing. Framing: front view, torso piece only, empty (no body inside).
  ```

- **사자의 판금** → `assets/items/deathknight_1.png`

  ```text
  BODY ARMOR / CLOTHING 「사자의 판금」 — loot from the monster 「데스 나이트」. more refined and menacing; mood: sturdy, protective. Framing: front view, torso piece only, empty (no body inside).
  ```

- **불사의 판금** → `assets/items/lichking_1.png`

  ```text
  BODY ARMOR / CLOTHING 「불사의 판금」 — loot from the monster 「불사의 왕」. the most ornate and imposing piece of this set; mood: reinforced, built to last. Framing: front view, torso piece only, empty (no body inside).
  ```

- **계약의 낙인** → `assets/items/demonlord_0.png`

  ```text
  SHOULDER GUARD 「계약의 낙인」 — loot from the monster 「데몬 로드」. plain look; mood: heavy, blunt, massive. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **악몽의 어깨** → `assets/items/incubus_0.png`

  ```text
  SHOULDER GUARD 「악몽의 어깨」 — loot from the monster 「인큐버스」. plain look; mood: sinister, a touch of blood red. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **갈퀴손** → `assets/items/ghoul_0.png`

  ```text
  GLOVES / GAUNTLETS 「갈퀴손」 — loot from the monster 「구울」. plain look; mood: sinister, a touch of blood red. Framing: a pair, backs of the hands, fingers up.
  ```

- **수의 허리끈** → `assets/items/ghoul_2.png`

  ```text
  BELT / SASH 「수의 허리끈」 — loot from the monster 「구울」. plain look; mood: sinister, a touch of blood red. Framing: laid in a loop, buckle or knot at the front.
  ```

- **탄창이 빈 전술 벨트** → `assets/items/ware_belt.png`

  ```text
  BELT / SASH 「탄창이 빈 전술 벨트」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: sturdy, protective. Hint (Korean): 고리마다 누군가의 손때가 있다. Framing: laid in a loop, buckle or knot at the front.
  ```

- **용암 정강이** → `assets/items/balrog_1.png`

  ```text
  LEG ARMOR 「용암 정강이」 — loot from the monster 「발록」. plain look; mood: aggressive, sharp. Framing: a pair of shin guards, front view.
  ```

- **해골 발톱** → `assets/items/bonedragon_1.png`

  ```text
  BOOTS / SHOES 「해골 발톱」 — loot from the monster 「본 드래곤」. plain look; mood: pointed, piercing. Framing: a pair, side view facing right.
  ```

- **죽음이 걸친 창백한 망토** → `assets/items/palehorse_0.png`

  ```text
  CLOAK / CAPE 「죽음이 걸친 창백한 망토」 — loot from the monster 「창백한 말의 기사」. more refined and menacing; mood: spiked, thorny. Framing: front view, hanging open, empty (no body inside).
  ```

- **귀족의 망토** → `assets/items/vampire_1.png`

  ```text
  CLOAK / CAPE 「귀족의 망토」 — loot from the monster 「뱀파이어」. plain look; mood: sinister, a touch of blood red. Framing: front view, hanging open, empty (no body inside).
  ```

- **찢긴 방수 망토** → `assets/items/ware_raincoat.png`

  ```text
  CLOAK / CAPE 「찢긴 방수 망토」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: reinforced, built to last. Hint (Korean): 후드를 쓰면 빗소리 같은 것이 들린다. Framing: front view, hanging open, empty (no body inside).
  ```

- **안개 수의** → `assets/items/wraith_0.png`

  ```text
  CLOAK / CAPE 「안개 수의」 — loot from the monster 「레이스」. plain look; mood: light, slim, built for speed. Framing: front view, hanging open, empty (no body inside).
  ```

- **피로 쓴 서명** → `assets/items/demonlord_2.png`

  ```text
  RING 「피로 쓴 서명」 — loot from the monster 「데몬 로드」. plain look; mood: heavy, blunt, massive. Framing: single ring, 3/4 view so the band is visible.
  ```

- **유혹의 반지** → `assets/items/succubus_0.png`

  ```text
  RING 「유혹의 반지」 — loot from the monster 「서큐버스」. plain look; mood: a lucky charm, a hint of gold. Framing: single ring, 3/4 view so the band is visible.
  ```

- **장례 종 목걸이** → `assets/items/chest_necro_bell.png`

  ```text
  NECKLACE / AMULET 「장례 종 목걸이」 — old treasure that was buried in a chest for a long time. plain look; mood: sinister, a touch of blood red. Framing: chain in a loop, pendant at the bottom center.
  ```

- **성물함** → `assets/items/lich_1.png`

  ```text
  NECKLACE / AMULET 「성물함」 — loot from the monster 「리치」. more refined and menacing; mood: pointed, piercing. Framing: chain in a loop, pendant at the bottom center.
  ```

- **훔친 꿈** → `assets/items/succubus_1.png`

  ```text
  NECKLACE / AMULET 「훔친 꿈」 — loot from the monster 「서큐버스」. plain look; mood: a lucky charm, a hint of gold. Framing: chain in a loop, pendant at the bottom center.
  ```

- **번호만 남은 인식표** → `assets/items/ware_tag.png`

  ```text
  NECKLACE / AMULET 「번호만 남은 인식표」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: a lucky charm, a hint of gold. Hint (Korean): 체인에 묻은 얼룩은 닦이지 않는다. Framing: chain in a loop, pendant at the bottom center.
  ```

- **예고의 고리** → `assets/items/banshee_1.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「예고의 고리」 — loot from the monster 「밴시」. plain look; mood: aggressive, sharp. Framing: single band, 3/4 view.
  ```

- **멈춘 손목시계** → `assets/items/ware_watch.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「멈춘 손목시계」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: light, slim, built for speed. Hint (Korean): 바늘은 새벽 네 시 십 분에서 움직이지 않는다. Framing: single band, 3/4 view.
  ```

- **원한의 고리** → `assets/items/wraith_1.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「원한의 고리」 — loot from the monster 「레이스」. plain look; mood: light, slim, built for speed. Framing: single band, 3/4 view.
  ```

- **죽지 않는 성물함** → `assets/items/lichking_4.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「죽지 않는 성물함」 — loot from the monster 「불사의 왕」. a small ancient object; the most ornate and imposing piece of this set. Framing: single small object, 3/4 view.
  ```

- **까마귀가 물어 온 청옥** → `assets/items/ravenking_0.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「까마귀가 물어 온 청옥」 — loot from the monster 「까마귀 왕」. a small shining stone or crystal; mysterious, faintly glowing. Framing: single small object, 3/4 view.
  ```

- **검은 깃 부적** → `assets/items/ravenking_1.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「검은 깃 부적」 — loot from the monster 「까마귀 왕」. a small ancient object; mysterious, faintly glowing. Framing: single small object, 3/4 view.
  ```

- **흡혈귀의 송곳니** → `assets/items/vampire_4.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「흡혈귀의 송곳니」 — loot from the monster 「뱀파이어」. a small ancient object; plain look. Framing: single small object, 3/4 view.
  ```
