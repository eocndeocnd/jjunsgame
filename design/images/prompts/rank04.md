# 제4격 거인 — 장비 32개 · 시트 4장

> 자동으로 만든 파일입니다 (`node tools/cli.js images`). 손으로 고치지 마세요. 쓰는 법은 같은 폴더의 `README.md`.

## 시트 4-A — 무기 · 보조무기 · 투구 (8개)

저장할 이름: `design/images/sheets/rank04-A.png`

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
- HEADGEAR: 3/4 front view, empty (no head inside)

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. WEAPON 「열선 대검」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: sinister, a touch of blood red. Hint (Korean): 날 가운데 붉은 줄이 달아오른다. 장갑 필수.
2. WEAPON 「고개를 막은 대검」 — loot from the monster 「거인왕」. the most ornate and imposing piece of this set; mood: spiked, thorny.
3. WEAPON 「베틀채 같은 창」 — loot from the monster 「골리앗」. plain look; mood: heavy, blunt, massive.
4. WEAPON 「뽑아 든 통바위」 — loot from the monster 「언덕 거인」. plain look; mood: heavy, blunt, massive.
5. OFF-HAND (shield, book, lantern, orb ...) 「반응 장갑판」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: reinforced, built to last. Hint (Korean): 맞는 순간 바깥쪽으로 터져 충격을 민다. 판은 갈아 끼운다.
6. OFF-HAND (shield, book, lantern, orb ...) 「두 머리가 다투는 방패」 — loot from the monster 「에틴」. plain look; mood: aggressive, sharp.
7. OFF-HAND (shield, book, lantern, orb ...) 「아직 켜지는 손전등」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: light, slim, built for speed. Hint (Korean): 건전지는 새것이다. 누가 갈아 끼웠는지는 모른다.
8. HEADGEAR 「외눈 투구」 — loot from the monster 「사이클롭스」. plain look; mood: pointed, piercing.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 열선 대검 | 무기 | 헌터백화점 | `assets/items/dept_heatblade.png` |
| 2 | 고개를 막은 대검 | 무기 | 거인왕 | `assets/items/giantking_0.png` |
| 3 | 베틀채 같은 창 | 무기 | 골리앗 | `assets/items/goliath2_0.png` |
| 4 | 뽑아 든 통바위 | 무기 | 언덕 거인 | `assets/items/hillgiant_0.png` |
| 5 | 반응 장갑판 | 보조무기 | 헌터백화점 | `assets/items/dept_plate.png` |
| 6 | 두 머리가 다투는 방패 | 보조무기 | 에틴 | `assets/items/ettin_0.png` |
| 7 | 아직 켜지는 손전등 | 보조무기 | 떠돌이 상인 | `assets/items/ware_flashlight.png` |
| 8 | 외눈 투구 | 투구 | 사이클롭스 | `assets/items/cyclops_0.png` |

## 시트 4-B — 투구 · 갑옷 · 어깨 (8개)

저장할 이름: `design/images/sheets/rank04-B.png`

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
1. HEADGEAR 「열 차단 헬멧」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: reinforced, built to last. Hint (Korean): 불길 속에서도 숨이 시원하다. 필터는 석 달마다.
2. HEADGEAR 「산맥의 왕관」 — loot from the monster 「거인왕」. the most ornate and imposing piece of this set; mood: spiked, thorny.
3. HEADGEAR 「이름이 번진 안전모」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: sturdy, protective. Hint (Korean): 안쪽에 매직으로 쓴 이름이 땀에 번져 읽히지 않는다.
4. BODY ARMOR / CLOTHING 「냉각 슈트」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: sinister, a touch of blood red. Hint (Korean): 안쪽에 찬 액이 돈다. 겨울엔 반품이 많다.
5. BODY ARMOR / CLOTHING 「청동 비늘 갑옷」 — loot from the monster 「골리앗」. plain look; mood: heavy, blunt, massive.
6. BODY ARMOR / CLOTHING 「바위산 갑주」 — loot from the monster 「돌 거인」. more refined and menacing; mood: sturdy, protective.
7. BODY ARMOR / CLOTHING 「구겨진 협회 점퍼」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: sturdy, protective. Hint (Korean): 왼쪽 가슴에 붙은 번호표가 반쯤 뜯겼다.
8. SHOULDER GUARD 「바위를 지는 어깨받이」 — loot from the monster 「언덕 거인」. plain look; mood: heavy, blunt, massive.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 열 차단 헬멧 | 투구 | 헌터백화점 | `assets/items/dept_helm4.png` |
| 2 | 산맥의 왕관 | 투구 | 거인왕 | `assets/items/giantking_1.png` |
| 3 | 이름이 번진 안전모 | 투구 | 떠돌이 상인 | `assets/items/ware_hardhat.png` |
| 4 | 냉각 슈트 | 갑옷 | 헌터백화점 | `assets/items/dept_vest4.png` |
| 5 | 청동 비늘 갑옷 | 갑옷 | 골리앗 | `assets/items/goliath2_1.png` |
| 6 | 바위산 갑주 | 갑옷 | 돌 거인 | `assets/items/stonegiant_0.png` |
| 7 | 구겨진 협회 점퍼 | 갑옷 | 떠돌이 상인 | `assets/items/ware_jacket.png` |
| 8 | 바위를 지는 어깨받이 | 어깨 | 언덕 거인 | `assets/items/hillgiant_1.png` |

## 시트 4-C — 장갑 · 허리띠 · 각반 (8개)

저장할 이름: `design/images/sheets/rank04-C.png`

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

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. GLOVES / GAUNTLETS 「거인의 손마디 장갑」 — old treasure that was buried in a chest for a long time. plain look; mood: heavy, blunt, massive.
2. GLOVES / GAUNTLETS 「벼락을 벼리던 손」 — loot from the monster 「사이클롭스」. plain look; mood: pointed, piercing.
3. GLOVES / GAUNTLETS 「전도 장갑」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: spiked, thorny. Hint (Korean): 붙잡은 것에 약한 전기가 흐른다. 악수는 사양.
4. GLOVES / GAUNTLETS 「용암을 주무르는 손」 — loot from the monster 「불의 거인」. more refined and menacing; mood: aggressive, sharp.
5. GLOVES / GAUNTLETS 「한 짝뿐인 작업 장갑」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: aggressive, sharp. Hint (Korean): 나머지 한 짝을 찾는 사람은 없었다.
6. BELT / SASH 「둘이 나눠 맨 허리띠」 — loot from the monster 「에틴」. plain look; mood: aggressive, sharp.
7. LEG ARMOR 「서리 내린 각반」 — loot from the monster 「서리 거인」. more refined and menacing; mood: reinforced, built to last.
8. LEG ARMOR 「눈길을 다지는 각반」 — loot from the monster 「털매머드」. plain look; mood: reinforced, built to last.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 거인의 손마디 장갑 | 장갑 | 보물상자 | `assets/items/chest_giant_knuckle.png` |
| 2 | 벼락을 벼리던 손 | 장갑 | 사이클롭스 | `assets/items/cyclops_1.png` |
| 3 | 전도 장갑 | 장갑 | 헌터백화점 | `assets/items/dept_glove4.png` |
| 4 | 용암을 주무르는 손 | 장갑 | 불의 거인 | `assets/items/firegiant_0.png` |
| 5 | 한 짝뿐인 작업 장갑 | 장갑 | 떠돌이 상인 | `assets/items/ware_glove.png` |
| 6 | 둘이 나눠 맨 허리띠 | 허리띠 | 에틴 | `assets/items/ettin_1.png` |
| 7 | 서리 내린 각반 | 각반 | 서리 거인 | `assets/items/frostgiant_0.png` |
| 8 | 눈길을 다지는 각반 | 각반 | 털매머드 | `assets/items/mammoth_0.png` |

## 시트 4-D — 신발 · 망토 · 반지 · 목걸이 · 팔찌 · 특수장비 (8개)

저장할 이름: `design/images/sheets/rank04-D.png`

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
- BOOTS / SHOES: a pair, side view facing right
- CLOAK / CAPE: front view, hanging open, empty (no body inside)
- RING: single ring, 3/4 view so the band is visible
- NECKLACE / AMULET: chain in a loop, pendant at the bottom center
- BRACELET / BANGLE / WRISTWATCH: single band, 3/4 view
- SMALL PRECIOUS OBJECT (gem or relic): single small object, 3/4 view

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. BOOTS / SHOES 「자세 제어 부츠」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: light, slim, built for speed. Hint (Korean): 넘어지려 하면 발목이 먼저 버틴다.
2. BOOTS / SHOES 「끈이 해진 등산화」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: light, slim, built for speed. Hint (Korean): 밑창에 아직 진흙이 마르지 않았다.
3. BOOTS / SHOES 「큰 발자국 털신」 — loot from the monster 「설인」. plain look; mood: light, slim, built for speed.
4. CLOAK / CAPE 「눈보라 털가죽」 — loot from the monster 「설인」. plain look; mood: light, slim, built for speed.
5. RING 「구름 성의 열쇠고리」 — loot from the monster 「구름 거인」. more refined and menacing; mood: a lucky charm, a hint of gold.
6. NECKLACE / AMULET 「로크의 알 껍데기」 — loot from the monster 「로크」. plain look; mood: light, slim, built for speed.
7. BRACELET / BANGLE / WRISTWATCH 「매머드 털 팔찌」 — loot from the monster 「털매머드」. plain look; mood: reinforced, built to last.
8. SMALL PRECIOUS OBJECT (gem or relic) 「고개의 쐐기돌」 — loot from the monster 「거인왕」. a small ancient object; the most ornate and imposing piece of this set.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 자세 제어 부츠 | 신발 | 헌터백화점 | `assets/items/dept_boots4.png` |
| 2 | 끈이 해진 등산화 | 신발 | 떠돌이 상인 | `assets/items/ware_boots.png` |
| 3 | 큰 발자국 털신 | 신발 | 설인 | `assets/items/yeti_0.png` |
| 4 | 눈보라 털가죽 | 망토 | 설인 | `assets/items/yeti_1.png` |
| 5 | 구름 성의 열쇠고리 | 반지 | 구름 거인 | `assets/items/cloudgiant_0.png` |
| 6 | 로크의 알 껍데기 | 목걸이 | 로크 | `assets/items/roc_0.png` |
| 7 | 매머드 털 팔찌 | 팔찌 | 털매머드 | `assets/items/mammoth_1.png` |
| 8 | 고개의 쐐기돌 | 특수장비 | 거인왕 | `assets/items/giantking_2.png` |

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

- **열선 대검** → `assets/items/dept_heatblade.png`

  ```text
  WEAPON 「열선 대검」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: sinister, a touch of blood red. Hint (Korean): 날 가운데 붉은 줄이 달아오른다. 장갑 필수. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **고개를 막은 대검** → `assets/items/giantking_0.png`

  ```text
  WEAPON 「고개를 막은 대검」 — loot from the monster 「거인왕」. the most ornate and imposing piece of this set; mood: spiked, thorny. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **베틀채 같은 창** → `assets/items/goliath2_0.png`

  ```text
  WEAPON 「베틀채 같은 창」 — loot from the monster 「골리앗」. plain look; mood: heavy, blunt, massive. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **뽑아 든 통바위** → `assets/items/hillgiant_0.png`

  ```text
  WEAPON 「뽑아 든 통바위」 — loot from the monster 「언덕 거인」. plain look; mood: heavy, blunt, massive. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **반응 장갑판** → `assets/items/dept_plate.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「반응 장갑판」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: reinforced, built to last. Hint (Korean): 맞는 순간 바깥쪽으로 터져 충격을 민다. 판은 갈아 끼운다. Framing: front view, slightly tilted.
  ```

- **두 머리가 다투는 방패** → `assets/items/ettin_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「두 머리가 다투는 방패」 — loot from the monster 「에틴」. plain look; mood: aggressive, sharp. Framing: front view, slightly tilted.
  ```

- **아직 켜지는 손전등** → `assets/items/ware_flashlight.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「아직 켜지는 손전등」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: light, slim, built for speed. Hint (Korean): 건전지는 새것이다. 누가 갈아 끼웠는지는 모른다. Framing: front view, slightly tilted.
  ```

- **외눈 투구** → `assets/items/cyclops_0.png`

  ```text
  HEADGEAR 「외눈 투구」 — loot from the monster 「사이클롭스」. plain look; mood: pointed, piercing. Framing: 3/4 front view, empty (no head inside).
  ```

- **열 차단 헬멧** → `assets/items/dept_helm4.png`

  ```text
  HEADGEAR 「열 차단 헬멧」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: reinforced, built to last. Hint (Korean): 불길 속에서도 숨이 시원하다. 필터는 석 달마다. Framing: 3/4 front view, empty (no head inside).
  ```

- **산맥의 왕관** → `assets/items/giantking_1.png`

  ```text
  HEADGEAR 「산맥의 왕관」 — loot from the monster 「거인왕」. the most ornate and imposing piece of this set; mood: spiked, thorny. Framing: 3/4 front view, empty (no head inside).
  ```

- **이름이 번진 안전모** → `assets/items/ware_hardhat.png`

  ```text
  HEADGEAR 「이름이 번진 안전모」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: sturdy, protective. Hint (Korean): 안쪽에 매직으로 쓴 이름이 땀에 번져 읽히지 않는다. Framing: 3/4 front view, empty (no head inside).
  ```

- **냉각 슈트** → `assets/items/dept_vest4.png`

  ```text
  BODY ARMOR / CLOTHING 「냉각 슈트」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: sinister, a touch of blood red. Hint (Korean): 안쪽에 찬 액이 돈다. 겨울엔 반품이 많다. Framing: front view, torso piece only, empty (no body inside).
  ```

- **청동 비늘 갑옷** → `assets/items/goliath2_1.png`

  ```text
  BODY ARMOR / CLOTHING 「청동 비늘 갑옷」 — loot from the monster 「골리앗」. plain look; mood: heavy, blunt, massive. Framing: front view, torso piece only, empty (no body inside).
  ```

- **바위산 갑주** → `assets/items/stonegiant_0.png`

  ```text
  BODY ARMOR / CLOTHING 「바위산 갑주」 — loot from the monster 「돌 거인」. more refined and menacing; mood: sturdy, protective. Framing: front view, torso piece only, empty (no body inside).
  ```

- **구겨진 협회 점퍼** → `assets/items/ware_jacket.png`

  ```text
  BODY ARMOR / CLOTHING 「구겨진 협회 점퍼」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: sturdy, protective. Hint (Korean): 왼쪽 가슴에 붙은 번호표가 반쯤 뜯겼다. Framing: front view, torso piece only, empty (no body inside).
  ```

- **바위를 지는 어깨받이** → `assets/items/hillgiant_1.png`

  ```text
  SHOULDER GUARD 「바위를 지는 어깨받이」 — loot from the monster 「언덕 거인」. plain look; mood: heavy, blunt, massive. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **거인의 손마디 장갑** → `assets/items/chest_giant_knuckle.png`

  ```text
  GLOVES / GAUNTLETS 「거인의 손마디 장갑」 — old treasure that was buried in a chest for a long time. plain look; mood: heavy, blunt, massive. Framing: a pair, backs of the hands, fingers up.
  ```

- **벼락을 벼리던 손** → `assets/items/cyclops_1.png`

  ```text
  GLOVES / GAUNTLETS 「벼락을 벼리던 손」 — loot from the monster 「사이클롭스」. plain look; mood: pointed, piercing. Framing: a pair, backs of the hands, fingers up.
  ```

- **전도 장갑** → `assets/items/dept_glove4.png`

  ```text
  GLOVES / GAUNTLETS 「전도 장갑」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: spiked, thorny. Hint (Korean): 붙잡은 것에 약한 전기가 흐른다. 악수는 사양. Framing: a pair, backs of the hands, fingers up.
  ```

- **용암을 주무르는 손** → `assets/items/firegiant_0.png`

  ```text
  GLOVES / GAUNTLETS 「용암을 주무르는 손」 — loot from the monster 「불의 거인」. more refined and menacing; mood: aggressive, sharp. Framing: a pair, backs of the hands, fingers up.
  ```

- **한 짝뿐인 작업 장갑** → `assets/items/ware_glove.png`

  ```text
  GLOVES / GAUNTLETS 「한 짝뿐인 작업 장갑」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: aggressive, sharp. Hint (Korean): 나머지 한 짝을 찾는 사람은 없었다. Framing: a pair, backs of the hands, fingers up.
  ```

- **둘이 나눠 맨 허리띠** → `assets/items/ettin_1.png`

  ```text
  BELT / SASH 「둘이 나눠 맨 허리띠」 — loot from the monster 「에틴」. plain look; mood: aggressive, sharp. Framing: laid in a loop, buckle or knot at the front.
  ```

- **서리 내린 각반** → `assets/items/frostgiant_0.png`

  ```text
  LEG ARMOR 「서리 내린 각반」 — loot from the monster 「서리 거인」. more refined and menacing; mood: reinforced, built to last. Framing: a pair of shin guards, front view.
  ```

- **눈길을 다지는 각반** → `assets/items/mammoth_0.png`

  ```text
  LEG ARMOR 「눈길을 다지는 각반」 — loot from the monster 「털매머드」. plain look; mood: reinforced, built to last. Framing: a pair of shin guards, front view.
  ```

- **자세 제어 부츠** → `assets/items/dept_boots4.png`

  ```text
  BOOTS / SHOES 「자세 제어 부츠」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: light, slim, built for speed. Hint (Korean): 넘어지려 하면 발목이 먼저 버틴다. Framing: a pair, side view facing right.
  ```

- **끈이 해진 등산화** → `assets/items/ware_boots.png`

  ```text
  BOOTS / SHOES 「끈이 해진 등산화」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: light, slim, built for speed. Hint (Korean): 밑창에 아직 진흙이 마르지 않았다. Framing: a pair, side view facing right.
  ```

- **큰 발자국 털신** → `assets/items/yeti_0.png`

  ```text
  BOOTS / SHOES 「큰 발자국 털신」 — loot from the monster 「설인」. plain look; mood: light, slim, built for speed. Framing: a pair, side view facing right.
  ```

- **눈보라 털가죽** → `assets/items/yeti_1.png`

  ```text
  CLOAK / CAPE 「눈보라 털가죽」 — loot from the monster 「설인」. plain look; mood: light, slim, built for speed. Framing: front view, hanging open, empty (no body inside).
  ```

- **구름 성의 열쇠고리** → `assets/items/cloudgiant_0.png`

  ```text
  RING 「구름 성의 열쇠고리」 — loot from the monster 「구름 거인」. more refined and menacing; mood: a lucky charm, a hint of gold. Framing: single ring, 3/4 view so the band is visible.
  ```

- **로크의 알 껍데기** → `assets/items/roc_0.png`

  ```text
  NECKLACE / AMULET 「로크의 알 껍데기」 — loot from the monster 「로크」. plain look; mood: light, slim, built for speed. Framing: chain in a loop, pendant at the bottom center.
  ```

- **매머드 털 팔찌** → `assets/items/mammoth_1.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「매머드 털 팔찌」 — loot from the monster 「털매머드」. plain look; mood: reinforced, built to last. Framing: single band, 3/4 view.
  ```

- **고개의 쐐기돌** → `assets/items/giantking_2.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「고개의 쐐기돌」 — loot from the monster 「거인왕」. a small ancient object; the most ornate and imposing piece of this set. Framing: single small object, 3/4 view.
  ```
