# 제3격 마수 — 장비 31개 · 시트 4장

> 자동으로 만든 파일입니다 (`node tools/cli.js images`). 손으로 고치지 마세요. 쓰는 법은 같은 폴더의 `README.md`.

## 시트 3-A — 무기 · 보조무기 · 투구 (9개) ✅ 다 자름

저장할 이름: `design/images/sheets/rank03-A.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 9 separate game item icons in a 3x3 grid.

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
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed.

TIER LOOK: low-tier gear — rough, worn, humble materials: rusty iron, bone, hide, cloth, wood. Muted colors, no glow.

FRAMING BY TYPE:
- WEAPON: whole weapon, diagonal, tip or head toward the upper right
- OFF-HAND (shield, book, lantern, orb ...): front view, slightly tilted
- HEADGEAR: 3/4 front view, empty (no head inside)

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. WEAPON 「진동 칼날」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: pointed, piercing. Hint (Korean): 켜 두면 낮게 운다. 단단한 껍데기에 권한다.
2. WEAPON 「왕의 세검」 — loot from the monster 「몰락한 왕」. the most ornate and imposing piece of this set; mood: sturdy, protective.
3. WEAPON 「아홉 머리의 이빨」 — loot from the monster 「히드라」. more refined and menacing; mood: reinforced, built to last.
4. WEAPON 「미궁의 전투도끼」 — loot from the monster 「미노타우로스」. plain look; mood: heavy, blunt, massive.
5. OFF-HAND (shield, book, lantern, orb ...) 「충격 흡수 방패」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: sturdy, protective. Hint (Korean): 맞은 자리가 하얗게 떴다가 천천히 돌아온다.
6. OFF-HAND (shield, book, lantern, orb ...) 「강철 방패」 — loot from the monster 「아이언 골렘」. plain look; mood: spiked, thorny.
7. HEADGEAR 「물에 잠긴 왕관」 — old treasure that was buried in a chest for a long time. plain look; mood: sturdy, protective.
8. HEADGEAR 「빈 투구」 — loot from the monster 「다크 나이트」. plain look; mood: aggressive, sharp.
9. HEADGEAR 「녹슨 왕관」 — loot from the monster 「몰락한 왕」. the most ornate and imposing piece of this set; mood: sturdy, protective.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 진동 칼날 | 무기 | 헌터백화점 | `assets/items/dept_vibro.png` ✅ |
| 2 | 왕의 세검 | 무기 | 몰락한 왕 | `assets/items/fallenking_0.png` ✅ |
| 3 | 아홉 머리의 이빨 | 무기 | 히드라 | `assets/items/hydra_0.png` ✅ |
| 4 | 미궁의 전투도끼 | 무기 | 미노타우로스 | `assets/items/minotaur_0.png` ✅ |
| 5 | 충격 흡수 방패 | 보조무기 | 헌터백화점 | `assets/items/dept_damper.png` ✅ |
| 6 | 강철 방패 | 보조무기 | 아이언 골렘 | `assets/items/irongolem_0.png` ✅ |
| 7 | 물에 잠긴 왕관 | 투구 | 보물상자 | `assets/items/chest_ruins_crown.png` ✅ |
| 8 | 빈 투구 | 투구 | 다크 나이트 | `assets/items/darkknight_2.png` ✅ |
| 9 | 녹슨 왕관 | 투구 | 몰락한 왕 | `assets/items/fallenking_1.png` ✅ |

## 시트 3-B — 갑옷 · 어깨 · 장갑 · 허리띠 · 각반 (9개) ✅ 다 자름

저장할 이름: `design/images/sheets/rank03-B.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 9 separate game item icons in a 3x3 grid.

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
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed.

TIER LOOK: low-tier gear — rough, worn, humble materials: rusty iron, bone, hide, cloth, wood. Muted colors, no glow.

FRAMING BY TYPE:
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)
- SHOULDER GUARD: one pauldron or a matching pair, 3/4 view
- GLOVES / GAUNTLETS: a pair, backs of the hands, fingers up
- BELT / SASH: laid in a loop, buckle or knot at the front
- LEG ARMOR: a pair of shin guards, front view

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. BODY ARMOR / CLOTHING 「깃털 흉갑」 — loot from the monster 「그리핀 로드」. more refined and menacing; mood: light, slim, built for speed.
2. BODY ARMOR / CLOTHING 「재생하는 비늘」 — loot from the monster 「히드라」. more refined and menacing; mood: reinforced, built to last.
3. SHOULDER GUARD 「세 짐승의 어깨」 — loot from the monster 「키메라」. plain look; mood: aggressive, sharp.
4. SHOULDER GUARD 「흑철 견갑」 — loot from the monster 「다크 나이트」. plain look; mood: aggressive, sharp.
5. GLOVES / GAUNTLETS 「무쇠 손」 — loot from the monster 「아이언 골렘」. plain look; mood: spiked, thorny.
6. BELT / SASH 「미궁의 허리띠」 — loot from the monster 「미노타우로스」. plain look; mood: heavy, blunt, massive.
7. BELT / SASH 「화강암 띠」 — loot from the monster 「스톤 골렘」. plain look; mood: sturdy, protective.
8. LEG ARMOR 「석화 방지 각반」 — loot from the monster 「코카트리스」. plain look; mood: pointed, piercing.
9. LEG ARMOR 「돌기둥 각반」 — loot from the monster 「스톤 골렘」. plain look; mood: sturdy, protective.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 깃털 흉갑 | 갑옷 | 그리핀 로드 | `assets/items/griffinlord_1.png` ✅ |
| 2 | 재생하는 비늘 | 갑옷 | 히드라 | `assets/items/hydra_1.png` ✅ |
| 3 | 세 짐승의 어깨 | 어깨 | 키메라 | `assets/items/chimera_0.png` ✅ |
| 4 | 흑철 견갑 | 어깨 | 다크 나이트 | `assets/items/darkknight_0.png` ✅ |
| 5 | 무쇠 손 | 장갑 | 아이언 골렘 | `assets/items/irongolem_2.png` ✅ |
| 6 | 미궁의 허리띠 | 허리띠 | 미노타우로스 | `assets/items/minotaur_2.png` ✅ |
| 7 | 화강암 띠 | 허리띠 | 스톤 골렘 | `assets/items/stonegolem_2.png` ✅ |
| 8 | 석화 방지 각반 | 각반 | 코카트리스 | `assets/items/cockatrice_0.png` ✅ |
| 9 | 돌기둥 각반 | 각반 | 스톤 골렘 | `assets/items/stonegolem_1.png` ✅ |

## 시트 3-C — 신발 · 망토 · 반지 · 목걸이 · 팔찌 (9개) ✅ 다 자름

저장할 이름: `design/images/sheets/rank03-C.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 9 separate game item icons in a 3x3 grid.

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
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed.

TIER LOOK: low-tier gear — rough, worn, humble materials: rusty iron, bone, hide, cloth, wood. Muted colors, no glow.

FRAMING BY TYPE:
- BOOTS / SHOES: a pair, side view facing right
- CLOAK / CAPE: front view, hanging open, empty (no body inside)
- RING: single ring, 3/4 view so the band is visible
- NECKLACE / AMULET: chain in a loop, pendant at the bottom center
- BRACELET / BANGLE / WRISTWATCH: single band, 3/4 view

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. BOOTS / SHOES 「창공의 발톱」 — loot from the monster 「그리핀 로드」. more refined and menacing; mood: light, slim, built for speed.
2. BOOTS / SHOES 「날개막 신」 — loot from the monster 「와이번」. plain look; mood: light, slim, built for speed.
3. CLOAK / CAPE 「만티코어 망토」 — loot from the monster 「만티코어」. plain look; mood: pointed, piercing.
4. CLOAK / CAPE 「와이번 가죽 망토」 — loot from the monster 「와이번」. plain look; mood: light, slim, built for speed.
5. RING 「여왕의 깃털」 — loot from the monster 「하피 퀸」. plain look; mood: a lucky charm, a hint of gold.
6. RING 「만티코어의 송곳니」 — loot from the monster 「만티코어」. plain look; mood: pointed, piercing.
7. NECKLACE / AMULET 「뒤섞인 심장」 — loot from the monster 「키메라」. plain look; mood: aggressive, sharp.
8. NECKLACE / AMULET 「무너진 옥새」 — loot from the monster 「몰락한 왕」. the most ornate and imposing piece of this set; mood: sturdy, protective.
9. BRACELET / BANGLE / WRISTWATCH 「여왕의 팔찌」 — loot from the monster 「하피 퀸」. plain look; mood: a lucky charm, a hint of gold.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 창공의 발톱 | 신발 | 그리핀 로드 | `assets/items/griffinlord_0.png` ✅ |
| 2 | 날개막 신 | 신발 | 와이번 | `assets/items/wyvern_0.png` ✅ |
| 3 | 만티코어 망토 | 망토 | 만티코어 | `assets/items/manticore_2.png` ✅ |
| 4 | 와이번 가죽 망토 | 망토 | 와이번 | `assets/items/wyvern_2.png` ✅ |
| 5 | 여왕의 깃털 | 반지 | 하피 퀸 | `assets/items/harpyqueen_0.png` ✅ |
| 6 | 만티코어의 송곳니 | 반지 | 만티코어 | `assets/items/manticore_1.png` ✅ |
| 7 | 뒤섞인 심장 | 목걸이 | 키메라 | `assets/items/chimera_1.png` ✅ |
| 8 | 무너진 옥새 | 목걸이 | 몰락한 왕 | `assets/items/fallenking_2.png` ✅ |
| 9 | 여왕의 팔찌 | 팔찌 | 하피 퀸 | `assets/items/harpyqueen_2.png` ✅ |

## 시트 3-D — 투구 · 갑옷 · 장갑 · 신발 (4개) ✅ 다 자름

저장할 이름: `design/images/sheets/rank03-D.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 4 separate game item icons in a 3x3 grid.

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
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed. Leave the last 5 cells empty (plain magenta).

TIER LOOK: factory-new hunter gear sold in a modern department store — clean, unworn, manufactured; mid-range models with a few glowing details.

FRAMING BY TYPE:
- HEADGEAR: 3/4 front view, empty (no head inside)
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)
- GLOVES / GAUNTLETS: a pair, backs of the hands, fingers up
- BOOTS / SHOES: a pair, side view facing right

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. HEADGEAR 「야간 투시 바이저」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: pointed, piercing. Hint (Korean): 어둠 속의 것이 초록빛으로 떠오른다. 저쪽도 나를 본다.
2. BODY ARMOR / CLOTHING 「세라믹 판 조끼」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: sturdy, protective. Hint (Korean): 판 하나가 깨지면 그 자리만 갈아 끼운다.
3. GLOVES / GAUNTLETS 「그립 강화 장갑」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: aggressive, sharp. Hint (Korean): 손가락 마디마다 작은 모터. 놓치는 일이 없다.
4. BOOTS / SHOES 「접지 부츠」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: light, slim, built for speed. Hint (Korean): 젖은 바위 위에서도 미끄러지지 않는다 — 점액 위는 보증 밖.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 야간 투시 바이저 | 투구 | 헌터백화점 | `assets/items/dept_helm3.png` |
| 2 | 세라믹 판 조끼 | 갑옷 | 헌터백화점 | `assets/items/dept_vest3.png` |
| 3 | 그립 강화 장갑 | 장갑 | 헌터백화점 | `assets/items/dept_glove3.png` |
| 4 | 접지 부츠 | 신발 | 헌터백화점 | `assets/items/dept_boots3.png` |

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

TIER LOOK: low-tier gear — rough, worn, humble materials: rusty iron, bone, hide, cloth, wood. Muted colors, no glow.

ITEM — the name is Korean. Draw what the name describes; never write the name in the image.
If the name describes a different kind of object than its type, draw the object from the name.
```

- **진동 칼날** → `assets/items/dept_vibro.png`

  ```text
  WEAPON 「진동 칼날」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: pointed, piercing. Hint (Korean): 켜 두면 낮게 운다. 단단한 껍데기에 권한다. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **왕의 세검** → `assets/items/fallenking_0.png`

  ```text
  WEAPON 「왕의 세검」 — loot from the monster 「몰락한 왕」. the most ornate and imposing piece of this set; mood: sturdy, protective. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **아홉 머리의 이빨** → `assets/items/hydra_0.png`

  ```text
  WEAPON 「아홉 머리의 이빨」 — loot from the monster 「히드라」. more refined and menacing; mood: reinforced, built to last. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **미궁의 전투도끼** → `assets/items/minotaur_0.png`

  ```text
  WEAPON 「미궁의 전투도끼」 — loot from the monster 「미노타우로스」. plain look; mood: heavy, blunt, massive. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **충격 흡수 방패** → `assets/items/dept_damper.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「충격 흡수 방패」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: sturdy, protective. Hint (Korean): 맞은 자리가 하얗게 떴다가 천천히 돌아온다. Framing: front view, slightly tilted.
  ```

- **강철 방패** → `assets/items/irongolem_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「강철 방패」 — loot from the monster 「아이언 골렘」. plain look; mood: spiked, thorny. Framing: front view, slightly tilted.
  ```

- **물에 잠긴 왕관** → `assets/items/chest_ruins_crown.png`

  ```text
  HEADGEAR 「물에 잠긴 왕관」 — old treasure that was buried in a chest for a long time. plain look; mood: sturdy, protective. Framing: 3/4 front view, empty (no head inside).
  ```

- **빈 투구** → `assets/items/darkknight_2.png`

  ```text
  HEADGEAR 「빈 투구」 — loot from the monster 「다크 나이트」. plain look; mood: aggressive, sharp. Framing: 3/4 front view, empty (no head inside).
  ```

- **야간 투시 바이저** → `assets/items/dept_helm3.png`

  ```text
  HEADGEAR 「야간 투시 바이저」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: pointed, piercing. Hint (Korean): 어둠 속의 것이 초록빛으로 떠오른다. 저쪽도 나를 본다. Framing: 3/4 front view, empty (no head inside).
  ```

- **녹슨 왕관** → `assets/items/fallenking_1.png`

  ```text
  HEADGEAR 「녹슨 왕관」 — loot from the monster 「몰락한 왕」. the most ornate and imposing piece of this set; mood: sturdy, protective. Framing: 3/4 front view, empty (no head inside).
  ```

- **세라믹 판 조끼** → `assets/items/dept_vest3.png`

  ```text
  BODY ARMOR / CLOTHING 「세라믹 판 조끼」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: sturdy, protective. Hint (Korean): 판 하나가 깨지면 그 자리만 갈아 끼운다. Framing: front view, torso piece only, empty (no body inside).
  ```

- **깃털 흉갑** → `assets/items/griffinlord_1.png`

  ```text
  BODY ARMOR / CLOTHING 「깃털 흉갑」 — loot from the monster 「그리핀 로드」. more refined and menacing; mood: light, slim, built for speed. Framing: front view, torso piece only, empty (no body inside).
  ```

- **재생하는 비늘** → `assets/items/hydra_1.png`

  ```text
  BODY ARMOR / CLOTHING 「재생하는 비늘」 — loot from the monster 「히드라」. more refined and menacing; mood: reinforced, built to last. Framing: front view, torso piece only, empty (no body inside).
  ```

- **세 짐승의 어깨** → `assets/items/chimera_0.png`

  ```text
  SHOULDER GUARD 「세 짐승의 어깨」 — loot from the monster 「키메라」. plain look; mood: aggressive, sharp. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **흑철 견갑** → `assets/items/darkknight_0.png`

  ```text
  SHOULDER GUARD 「흑철 견갑」 — loot from the monster 「다크 나이트」. plain look; mood: aggressive, sharp. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **그립 강화 장갑** → `assets/items/dept_glove3.png`

  ```text
  GLOVES / GAUNTLETS 「그립 강화 장갑」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: aggressive, sharp. Hint (Korean): 손가락 마디마다 작은 모터. 놓치는 일이 없다. Framing: a pair, backs of the hands, fingers up.
  ```

- **무쇠 손** → `assets/items/irongolem_2.png`

  ```text
  GLOVES / GAUNTLETS 「무쇠 손」 — loot from the monster 「아이언 골렘」. plain look; mood: spiked, thorny. Framing: a pair, backs of the hands, fingers up.
  ```

- **미궁의 허리띠** → `assets/items/minotaur_2.png`

  ```text
  BELT / SASH 「미궁의 허리띠」 — loot from the monster 「미노타우로스」. plain look; mood: heavy, blunt, massive. Framing: laid in a loop, buckle or knot at the front.
  ```

- **화강암 띠** → `assets/items/stonegolem_2.png`

  ```text
  BELT / SASH 「화강암 띠」 — loot from the monster 「스톤 골렘」. plain look; mood: sturdy, protective. Framing: laid in a loop, buckle or knot at the front.
  ```

- **석화 방지 각반** → `assets/items/cockatrice_0.png`

  ```text
  LEG ARMOR 「석화 방지 각반」 — loot from the monster 「코카트리스」. plain look; mood: pointed, piercing. Framing: a pair of shin guards, front view.
  ```

- **돌기둥 각반** → `assets/items/stonegolem_1.png`

  ```text
  LEG ARMOR 「돌기둥 각반」 — loot from the monster 「스톤 골렘」. plain look; mood: sturdy, protective. Framing: a pair of shin guards, front view.
  ```

- **접지 부츠** → `assets/items/dept_boots3.png`

  ```text
  BOOTS / SHOES 「접지 부츠」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: light, slim, built for speed. Hint (Korean): 젖은 바위 위에서도 미끄러지지 않는다 — 점액 위는 보증 밖. Framing: a pair, side view facing right.
  ```

- **창공의 발톱** → `assets/items/griffinlord_0.png`

  ```text
  BOOTS / SHOES 「창공의 발톱」 — loot from the monster 「그리핀 로드」. more refined and menacing; mood: light, slim, built for speed. Framing: a pair, side view facing right.
  ```

- **날개막 신** → `assets/items/wyvern_0.png`

  ```text
  BOOTS / SHOES 「날개막 신」 — loot from the monster 「와이번」. plain look; mood: light, slim, built for speed. Framing: a pair, side view facing right.
  ```

- **만티코어 망토** → `assets/items/manticore_2.png`

  ```text
  CLOAK / CAPE 「만티코어 망토」 — loot from the monster 「만티코어」. plain look; mood: pointed, piercing. Framing: front view, hanging open, empty (no body inside).
  ```

- **와이번 가죽 망토** → `assets/items/wyvern_2.png`

  ```text
  CLOAK / CAPE 「와이번 가죽 망토」 — loot from the monster 「와이번」. plain look; mood: light, slim, built for speed. Framing: front view, hanging open, empty (no body inside).
  ```

- **여왕의 깃털** → `assets/items/harpyqueen_0.png`

  ```text
  RING 「여왕의 깃털」 — loot from the monster 「하피 퀸」. plain look; mood: a lucky charm, a hint of gold. Framing: single ring, 3/4 view so the band is visible.
  ```

- **만티코어의 송곳니** → `assets/items/manticore_1.png`

  ```text
  RING 「만티코어의 송곳니」 — loot from the monster 「만티코어」. plain look; mood: pointed, piercing. Framing: single ring, 3/4 view so the band is visible.
  ```

- **뒤섞인 심장** → `assets/items/chimera_1.png`

  ```text
  NECKLACE / AMULET 「뒤섞인 심장」 — loot from the monster 「키메라」. plain look; mood: aggressive, sharp. Framing: chain in a loop, pendant at the bottom center.
  ```

- **무너진 옥새** → `assets/items/fallenking_2.png`

  ```text
  NECKLACE / AMULET 「무너진 옥새」 — loot from the monster 「몰락한 왕」. the most ornate and imposing piece of this set; mood: sturdy, protective. Framing: chain in a loop, pendant at the bottom center.
  ```

- **여왕의 팔찌** → `assets/items/harpyqueen_2.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「여왕의 팔찌」 — loot from the monster 「하피 퀸」. plain look; mood: a lucky charm, a hint of gold. Framing: single band, 3/4 view.
  ```
