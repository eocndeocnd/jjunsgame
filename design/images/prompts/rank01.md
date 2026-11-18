# 제1격 잡졸 — 장비 31개 · 시트 4장

> 자동으로 만든 파일입니다 (`node tools/cli.js images`). 손으로 고치지 마세요. 쓰는 법은 같은 폴더의 `README.md`.

## 시트 1-A — 무기 · 보조무기 · 투구 (9개) ✅ 다 자름

저장할 이름: `design/images/sheets/rank01-A.png`

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
1. WEAPON 「보급형 합금 단검」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: aggressive, sharp. Hint (Korean): 협회 인증 입문용. 날보다 손잡이에 공을 들였다.
2. WEAPON 「수호자의 대검」 — loot from the monster 「던전 가디언」. the most ornate and imposing piece of this set; mood: sturdy, protective.
3. WEAPON 「고블린 손도끼」 — loot from the monster 「고블린」. plain look; mood: aggressive, sharp.
4. WEAPON 「녹슨 단검」 — loot from the monster 「슬라임」. plain look; mood: reinforced, built to last.
5. OFF-HAND (shield, book, lantern, orb ...) 「꺼지지 않는 수로 등」 — old treasure that was buried in a chest for a long time. plain look; mood: reinforced, built to last.
6. OFF-HAND (shield, book, lantern, orb ...) 「폴리카보네이트 방패」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: sturdy, protective. Hint (Korean): 투명해서 앞이 보인다 — 그게 장점인지는 써 봐야 안다.
7. OFF-HAND (shield, book, lantern, orb ...) 「작은 삼지창」 — loot from the monster 「임프」. plain look; mood: modest, well used.
8. HEADGEAR 「찌그러진 투구」 — loot from the monster 「고블린」. plain look; mood: aggressive, sharp.
9. HEADGEAR 「해골 투구」 — loot from the monster 「스켈레톤」. plain look; mood: pointed, piercing.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 보급형 합금 단검 | 무기 | 헌터백화점 | `assets/items/dept_knife.png` ✅ |
| 2 | 수호자의 대검 | 무기 | 던전 가디언 | `assets/items/dungeonguardian_0.png` ✅ |
| 3 | 고블린 손도끼 | 무기 | 고블린 | `assets/items/goblin_0.png` ✅ |
| 4 | 녹슨 단검 | 무기 | 슬라임 | `assets/items/slime_0.png` ✅ |
| 5 | 꺼지지 않는 수로 등 | 보조무기 | 보물상자 | `assets/items/chest_sewer_lamp.png` ✅ |
| 6 | 폴리카보네이트 방패 | 보조무기 | 헌터백화점 | `assets/items/dept_buckler.png` ✅ |
| 7 | 작은 삼지창 | 보조무기 | 임프 | `assets/items/imp_0.png` ✅ |
| 8 | 찌그러진 투구 | 투구 | 고블린 | `assets/items/goblin_1.png` ✅ |
| 9 | 해골 투구 | 투구 | 스켈레톤 | `assets/items/skeleton_1.png` ✅ |

## 시트 1-B — 갑옷 · 어깨 · 장갑 · 허리띠 · 각반 (9개) ✅ 다 자름

저장할 이름: `design/images/sheets/rank01-B.png`

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
1. BODY ARMOR / CLOTHING 「고철 판금」 — loot from the monster 「던전 가디언」. the most ornate and imposing piece of this set; mood: sturdy, protective.
2. BODY ARMOR / CLOTHING 「전리품 누더기」 — loot from the monster 「고블린 족장」. more refined and menacing; mood: heavy, blunt, massive.
3. BODY ARMOR / CLOTHING 「썩은 가죽」 — loot from the monster 「좀비」. plain look; mood: reinforced, built to last.
4. SHOULDER GUARD 「족장의 어깨뼈」 — loot from the monster 「고블린 족장」. more refined and menacing; mood: heavy, blunt, massive.
5. SHOULDER GUARD 「갈비뼈 견갑」 — loot from the monster 「스켈레톤」. plain look; mood: pointed, piercing.
6. GLOVES / GAUNTLETS 「늑대발 장갑」 — loot from the monster 「다크 울프」. plain look; mood: light, slim, built for speed.
7. GLOVES / GAUNTLETS 「이빨 달린 상자」 — loot from the monster 「미믹」. more refined and menacing; mood: a lucky charm, a hint of gold.
8. BELT / SASH 「코볼트 허리끈」 — loot from the monster 「코볼트」. plain look; mood: sturdy, protective.
9. LEG ARMOR 「비늘 각반」 — loot from the monster 「코볼트」. plain look; mood: sturdy, protective.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 고철 판금 | 갑옷 | 던전 가디언 | `assets/items/dungeonguardian_1.png` ✅ |
| 2 | 전리품 누더기 | 갑옷 | 고블린 족장 | `assets/items/goblinchief_1.png` ✅ |
| 3 | 썩은 가죽 | 갑옷 | 좀비 | `assets/items/zombie_0.png` ✅ |
| 4 | 족장의 어깨뼈 | 어깨 | 고블린 족장 | `assets/items/goblinchief_0.png` ✅ |
| 5 | 갈비뼈 견갑 | 어깨 | 스켈레톤 | `assets/items/skeleton_0.png` ✅ |
| 6 | 늑대발 장갑 | 장갑 | 다크 울프 | `assets/items/darkwolf_2.png` ✅ |
| 7 | 이빨 달린 상자 | 장갑 | 미믹 | `assets/items/mimic_0.png` ✅ |
| 8 | 코볼트 허리끈 | 허리띠 | 코볼트 | `assets/items/kobold_2.png` ✅ |
| 9 | 비늘 각반 | 각반 | 코볼트 | `assets/items/kobold_1.png` ✅ |

## 시트 1-C — 각반 · 신발 · 망토 · 반지 · 목걸이 · 팔찌 (9개) ✅ 다 자름

저장할 이름: `design/images/sheets/rank01-C.png`

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
- LEG ARMOR: a pair of shin guards, front view
- BOOTS / SHOES: a pair, side view facing right
- CLOAK / CAPE: front view, hanging open, empty (no body inside)
- RING: single ring, 3/4 view so the band is visible
- NECKLACE / AMULET: chain in a loop, pendant at the bottom center
- BRACELET / BANGLE / WRISTWATCH: single band, 3/4 view

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. LEG ARMOR 「무거운 발」 — loot from the monster 「좀비」. plain look; mood: reinforced, built to last.
2. BOOTS / SHOES 「발자국 없는 신」 — loot from the monster 「다크 울프」. plain look; mood: light, slim, built for speed.
3. BOOTS / SHOES 「쥐가죽 신」 — loot from the monster 「자이언트 랫」. plain look; mood: light, slim, built for speed.
4. CLOAK / CAPE 「박쥐날개 망토」 — loot from the monster 「임프」. plain look; mood: modest, well used.
5. RING 「독니 반지」 — loot from the monster 「자이언트 스파이더」. plain look; mood: sinister, a touch of blood red.
6. RING 「이빨 목걸이」 — loot from the monster 「자이언트 랫」. plain look; mood: light, slim, built for speed.
7. NECKLACE / AMULET 「지하수로의 열쇠」 — loot from the monster 「던전 가디언」. the most ornate and imposing piece of this set; mood: sturdy, protective.
8. NECKLACE / AMULET 「가짜 금화」 — loot from the monster 「미믹」. more refined and menacing; mood: a lucky charm, a hint of gold.
9. BRACELET / BANGLE / WRISTWATCH 「거미줄 팔찌」 — loot from the monster 「자이언트 스파이더」. plain look; mood: sinister, a touch of blood red.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 무거운 발 | 각반 | 좀비 | `assets/items/zombie_1.png` ✅ |
| 2 | 발자국 없는 신 | 신발 | 다크 울프 | `assets/items/darkwolf_1.png` ✅ |
| 3 | 쥐가죽 신 | 신발 | 자이언트 랫 | `assets/items/giantrat_0.png` ✅ |
| 4 | 박쥐날개 망토 | 망토 | 임프 | `assets/items/imp_2.png` ✅ |
| 5 | 독니 반지 | 반지 | 자이언트 스파이더 | `assets/items/cavespider_1.png` ✅ |
| 6 | 이빨 목걸이 | 반지 | 자이언트 랫 | `assets/items/giantrat_1.png` ✅ |
| 7 | 지하수로의 열쇠 | 목걸이 | 던전 가디언 | `assets/items/dungeonguardian_2.png` ✅ |
| 8 | 가짜 금화 | 목걸이 | 미믹 | `assets/items/mimic_1.png` ✅ |
| 9 | 거미줄 팔찌 | 팔찌 | 자이언트 스파이더 | `assets/items/cavespider_2.png` ✅ |

## 시트 1-D — 투구 · 갑옷 · 장갑 · 신발 (4개) ✅ 다 자름

저장할 이름: `design/images/sheets/rank01-D.png`

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

TIER LOOK: factory-new hunter gear sold in a modern department store — clean, unworn, manufactured; basic budget models, simple shapes.

FRAMING BY TYPE:
- HEADGEAR: 3/4 front view, empty (no head inside)
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)
- GLOVES / GAUNTLETS: a pair, backs of the hands, fingers up
- BOOTS / SHOES: a pair, side view facing right

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. HEADGEAR 「보급형 안전 헬멧」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: sturdy, protective. Hint (Korean): 협회 마크 스티커가 반쯤 떨어졌다. 턱끈은 새것.
2. BODY ARMOR / CLOTHING 「보급 방검 조끼」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: sturdy, protective. Hint (Korean): 찔리는 것만 막는다고 적혀 있다. 물리는 것은 안 적혀 있다.
3. GLOVES / GAUNTLETS 「미끄럼 방지 장갑」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: light, slim, built for speed. Hint (Korean): 손바닥의 오돌토돌한 고무가 칼자루를 붙잡는다.
4. BOOTS / SHOES 「강화 안전화」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: light, slim, built for speed. Hint (Korean): 앞코에 쇠가 들었다. 차면 아프다 — 양쪽 다.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 보급형 안전 헬멧 | 투구 | 헌터백화점 | `assets/items/dept_helm1.png` ✅ |
| 2 | 보급 방검 조끼 | 갑옷 | 헌터백화점 | `assets/items/dept_vest1.png` ✅ |
| 3 | 미끄럼 방지 장갑 | 장갑 | 헌터백화점 | `assets/items/dept_glove1.png` ✅ |
| 4 | 강화 안전화 | 신발 | 헌터백화점 | `assets/items/dept_boots1.png` ✅ |

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

- **보급형 합금 단검** → `assets/items/dept_knife.png`

  ```text
  WEAPON 「보급형 합금 단검」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: aggressive, sharp. Hint (Korean): 협회 인증 입문용. 날보다 손잡이에 공을 들였다. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **수호자의 대검** → `assets/items/dungeonguardian_0.png`

  ```text
  WEAPON 「수호자의 대검」 — loot from the monster 「던전 가디언」. the most ornate and imposing piece of this set; mood: sturdy, protective. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **고블린 손도끼** → `assets/items/goblin_0.png`

  ```text
  WEAPON 「고블린 손도끼」 — loot from the monster 「고블린」. plain look; mood: aggressive, sharp. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **녹슨 단검** → `assets/items/slime_0.png`

  ```text
  WEAPON 「녹슨 단검」 — loot from the monster 「슬라임」. plain look; mood: reinforced, built to last. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **꺼지지 않는 수로 등** → `assets/items/chest_sewer_lamp.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「꺼지지 않는 수로 등」 — old treasure that was buried in a chest for a long time. plain look; mood: reinforced, built to last. Framing: front view, slightly tilted.
  ```

- **폴리카보네이트 방패** → `assets/items/dept_buckler.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「폴리카보네이트 방패」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: sturdy, protective. Hint (Korean): 투명해서 앞이 보인다 — 그게 장점인지는 써 봐야 안다. Framing: front view, slightly tilted.
  ```

- **작은 삼지창** → `assets/items/imp_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「작은 삼지창」 — loot from the monster 「임프」. plain look; mood: modest, well used. Framing: front view, slightly tilted.
  ```

- **보급형 안전 헬멧** → `assets/items/dept_helm1.png`

  ```text
  HEADGEAR 「보급형 안전 헬멧」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: sturdy, protective. Hint (Korean): 협회 마크 스티커가 반쯤 떨어졌다. 턱끈은 새것. Framing: 3/4 front view, empty (no head inside).
  ```

- **찌그러진 투구** → `assets/items/goblin_1.png`

  ```text
  HEADGEAR 「찌그러진 투구」 — loot from the monster 「고블린」. plain look; mood: aggressive, sharp. Framing: 3/4 front view, empty (no head inside).
  ```

- **해골 투구** → `assets/items/skeleton_1.png`

  ```text
  HEADGEAR 「해골 투구」 — loot from the monster 「스켈레톤」. plain look; mood: pointed, piercing. Framing: 3/4 front view, empty (no head inside).
  ```

- **보급 방검 조끼** → `assets/items/dept_vest1.png`

  ```text
  BODY ARMOR / CLOTHING 「보급 방검 조끼」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: sturdy, protective. Hint (Korean): 찔리는 것만 막는다고 적혀 있다. 물리는 것은 안 적혀 있다. Framing: front view, torso piece only, empty (no body inside).
  ```

- **고철 판금** → `assets/items/dungeonguardian_1.png`

  ```text
  BODY ARMOR / CLOTHING 「고철 판금」 — loot from the monster 「던전 가디언」. the most ornate and imposing piece of this set; mood: sturdy, protective. Framing: front view, torso piece only, empty (no body inside).
  ```

- **전리품 누더기** → `assets/items/goblinchief_1.png`

  ```text
  BODY ARMOR / CLOTHING 「전리품 누더기」 — loot from the monster 「고블린 족장」. more refined and menacing; mood: heavy, blunt, massive. Framing: front view, torso piece only, empty (no body inside).
  ```

- **썩은 가죽** → `assets/items/zombie_0.png`

  ```text
  BODY ARMOR / CLOTHING 「썩은 가죽」 — loot from the monster 「좀비」. plain look; mood: reinforced, built to last. Framing: front view, torso piece only, empty (no body inside).
  ```

- **족장의 어깨뼈** → `assets/items/goblinchief_0.png`

  ```text
  SHOULDER GUARD 「족장의 어깨뼈」 — loot from the monster 「고블린 족장」. more refined and menacing; mood: heavy, blunt, massive. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **갈비뼈 견갑** → `assets/items/skeleton_0.png`

  ```text
  SHOULDER GUARD 「갈비뼈 견갑」 — loot from the monster 「스켈레톤」. plain look; mood: pointed, piercing. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **늑대발 장갑** → `assets/items/darkwolf_2.png`

  ```text
  GLOVES / GAUNTLETS 「늑대발 장갑」 — loot from the monster 「다크 울프」. plain look; mood: light, slim, built for speed. Framing: a pair, backs of the hands, fingers up.
  ```

- **미끄럼 방지 장갑** → `assets/items/dept_glove1.png`

  ```text
  GLOVES / GAUNTLETS 「미끄럼 방지 장갑」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: light, slim, built for speed. Hint (Korean): 손바닥의 오돌토돌한 고무가 칼자루를 붙잡는다. Framing: a pair, backs of the hands, fingers up.
  ```

- **이빨 달린 상자** → `assets/items/mimic_0.png`

  ```text
  GLOVES / GAUNTLETS 「이빨 달린 상자」 — loot from the monster 「미믹」. more refined and menacing; mood: a lucky charm, a hint of gold. Framing: a pair, backs of the hands, fingers up.
  ```

- **코볼트 허리끈** → `assets/items/kobold_2.png`

  ```text
  BELT / SASH 「코볼트 허리끈」 — loot from the monster 「코볼트」. plain look; mood: sturdy, protective. Framing: laid in a loop, buckle or knot at the front.
  ```

- **비늘 각반** → `assets/items/kobold_1.png`

  ```text
  LEG ARMOR 「비늘 각반」 — loot from the monster 「코볼트」. plain look; mood: sturdy, protective. Framing: a pair of shin guards, front view.
  ```

- **무거운 발** → `assets/items/zombie_1.png`

  ```text
  LEG ARMOR 「무거운 발」 — loot from the monster 「좀비」. plain look; mood: reinforced, built to last. Framing: a pair of shin guards, front view.
  ```

- **발자국 없는 신** → `assets/items/darkwolf_1.png`

  ```text
  BOOTS / SHOES 「발자국 없는 신」 — loot from the monster 「다크 울프」. plain look; mood: light, slim, built for speed. Framing: a pair, side view facing right.
  ```

- **강화 안전화** → `assets/items/dept_boots1.png`

  ```text
  BOOTS / SHOES 「강화 안전화」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: light, slim, built for speed. Hint (Korean): 앞코에 쇠가 들었다. 차면 아프다 — 양쪽 다. Framing: a pair, side view facing right.
  ```

- **쥐가죽 신** → `assets/items/giantrat_0.png`

  ```text
  BOOTS / SHOES 「쥐가죽 신」 — loot from the monster 「자이언트 랫」. plain look; mood: light, slim, built for speed. Framing: a pair, side view facing right.
  ```

- **박쥐날개 망토** → `assets/items/imp_2.png`

  ```text
  CLOAK / CAPE 「박쥐날개 망토」 — loot from the monster 「임프」. plain look; mood: modest, well used. Framing: front view, hanging open, empty (no body inside).
  ```

- **독니 반지** → `assets/items/cavespider_1.png`

  ```text
  RING 「독니 반지」 — loot from the monster 「자이언트 스파이더」. plain look; mood: sinister, a touch of blood red. Framing: single ring, 3/4 view so the band is visible.
  ```

- **이빨 목걸이** → `assets/items/giantrat_1.png`

  ```text
  RING 「이빨 목걸이」 — loot from the monster 「자이언트 랫」. plain look; mood: light, slim, built for speed. Framing: single ring, 3/4 view so the band is visible.
  ```

- **지하수로의 열쇠** → `assets/items/dungeonguardian_2.png`

  ```text
  NECKLACE / AMULET 「지하수로의 열쇠」 — loot from the monster 「던전 가디언」. the most ornate and imposing piece of this set; mood: sturdy, protective. Framing: chain in a loop, pendant at the bottom center.
  ```

- **가짜 금화** → `assets/items/mimic_1.png`

  ```text
  NECKLACE / AMULET 「가짜 금화」 — loot from the monster 「미믹」. more refined and menacing; mood: a lucky charm, a hint of gold. Framing: chain in a loop, pendant at the bottom center.
  ```

- **거미줄 팔찌** → `assets/items/cavespider_2.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「거미줄 팔찌」 — loot from the monster 「자이언트 스파이더」. plain look; mood: sinister, a touch of blood red. Framing: single band, 3/4 view.
  ```
