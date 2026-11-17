# 제10격 무림 — 장비 26개 · 시트 3장

> 자동으로 만든 파일입니다 (`node tools/cli.js images`). 손으로 고치지 마세요. 쓰는 법은 같은 폴더의 `README.md`.

## 시트 10-A — 무기 · 보조무기 · 투구 · 갑옷 (9개)

저장할 이름: `design/images/sheets/rank10-A.png`

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

TIER LOOK: high-tier gear — mythic and ornate: gold or silver trim, engraved patterns, gems, a soft glow.

FRAMING BY TYPE:
- WEAPON: whole weapon, diagonal, tip or head toward the upper right
- OFF-HAND (shield, book, lantern, orb ...): front view, slightly tilted
- HEADGEAR: 3/4 front view, empty (no head inside)
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. WEAPON 「천마검」 — loot from the monster 「천마」. the most ornate and imposing piece of this set; mood: aggressive, sharp.
2. WEAPON 「팽가의 대도」 — loot from the monster 「하북팽가 도객」. more refined and menacing; mood: heavy, blunt, massive.
3. WEAPON 「송문고검」 — loot from the monster 「무당 도사」. plain look; mood: reinforced, built to last.
4. OFF-HAND (shield, book, lantern, orb ...) 「세수경」 — loot from the monster 「달마」. more refined and menacing; mood: modest, well used.
5. OFF-HAND (shield, book, lantern, orb ...) 「동냥 바가지」 — loot from the monster 「개방 장로」. plain look; mood: a lucky charm, a hint of gold.
6. OFF-HAND (shield, book, lantern, orb ...) 「백우선」 — loot from the monster 「제갈세가 군사」. more refined and menacing; mood: sturdy, protective.
7. HEADGEAR 「서리 투구」 — loot from the monster 「북해빙궁 무사」. plain look; mood: sturdy, protective.
8. HEADGEAR 「매화 두건」 — loot from the monster 「화산파 매화검수」. plain look; mood: light, slim, built for speed.
9. BODY ARMOR / CLOTHING 「한빙 갑의」 — loot from the monster 「북해빙궁 무사」. plain look; mood: sturdy, protective.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 천마검 | 무기 | 천마 | `assets/items/cheonma2_0.png` |
| 2 | 팽가의 대도 | 무기 | 하북팽가 도객 | `assets/items/paeng_0.png` |
| 3 | 송문고검 | 무기 | 무당 도사 | `assets/items/wudang2_0.png` |
| 4 | 세수경 | 보조무기 | 달마 | `assets/items/dalma2_0.png` |
| 5 | 동냥 바가지 | 보조무기 | 개방 장로 | `assets/items/gaebang2_1.png` |
| 6 | 백우선 | 보조무기 | 제갈세가 군사 | `assets/items/jegal_0.png` |
| 7 | 서리 투구 | 투구 | 북해빙궁 무사 | `assets/items/bukhae2_1.png` |
| 8 | 매화 두건 | 투구 | 화산파 매화검수 | `assets/items/hwasan2_0.png` |
| 9 | 한빙 갑의 | 갑옷 | 북해빙궁 무사 | `assets/items/bukhae2_0.png` |

## 시트 10-B — 갑옷 · 어깨 · 장갑 · 허리띠 · 각반 · 신발 (9개)

저장할 이름: `design/images/sheets/rank10-B.png`

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

TIER LOOK: high-tier gear — mythic and ornate: gold or silver trim, engraved patterns, gems, a soft glow.

FRAMING BY TYPE:
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)
- SHOULDER GUARD: one pauldron or a matching pair, 3/4 view
- GLOVES / GAUNTLETS: a pair, backs of the hands, fingers up
- BELT / SASH: laid in a loop, buckle or knot at the front
- LEG ARMOR: a pair of shin guards, front view
- BOOTS / SHOES: a pair, side view facing right

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. BODY ARMOR / CLOTHING 「천마흑포」 — loot from the monster 「천마」. the most ornate and imposing piece of this set; mood: aggressive, sharp.
2. BODY ARMOR / CLOTHING 「철포삼」 — loot from the monster 「소림 나한」. plain look; mood: sturdy, protective.
3. SHOULDER GUARD 「암기 견대」 — loot from the monster 「사천당가 독수」. more refined and menacing; mood: sinister, a touch of blood red.
4. GLOVES / GAUNTLETS 「되돌리는 손」 — loot from the monster 「모용세가 공자」. more refined and menacing; mood: spiked, thorny.
5. GLOVES / GAUNTLETS 「금강 권갑」 — loot from the monster 「소림 나한」. plain look; mood: sturdy, protective.
6. BELT / SASH 「아홉 매듭 띠」 — loot from the monster 「개방 장로」. plain look; mood: a lucky charm, a hint of gold.
7. LEG ARMOR 「구름 위를 걷는 각반」 — loot from the monster 「장삼봉」. more refined and menacing; mood: spiked, thorny.
8. BOOTS / SHOES 「비무대 모래 묻은 신」 — old treasure that was buried in a chest for a long time. plain look; mood: light, slim, built for speed.
9. BOOTS / SHOES 「암향 신」 — loot from the monster 「화산파 매화검수」. plain look; mood: light, slim, built for speed.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 천마흑포 | 갑옷 | 천마 | `assets/items/cheonma2_1.png` |
| 2 | 철포삼 | 갑옷 | 소림 나한 | `assets/items/shaolin2_1.png` |
| 3 | 암기 견대 | 어깨 | 사천당가 독수 | `assets/items/tangga2_0.png` |
| 4 | 되돌리는 손 | 장갑 | 모용세가 공자 | `assets/items/moyong_0.png` |
| 5 | 금강 권갑 | 장갑 | 소림 나한 | `assets/items/shaolin2_0.png` |
| 6 | 아홉 매듭 띠 | 허리띠 | 개방 장로 | `assets/items/gaebang2_0.png` |
| 7 | 구름 위를 걷는 각반 | 각반 | 장삼봉 | `assets/items/zhangsanfeng2_1.png` |
| 8 | 비무대 모래 묻은 신 | 신발 | 보물상자 | `assets/items/chest_murim_boots.png` |
| 9 | 암향 신 | 신발 | 화산파 매화검수 | `assets/items/hwasan2_1.png` |

## 시트 10-C — 신발 · 망토 · 반지 · 목걸이 · 팔찌 · 특수장비 (8개)

저장할 이름: `design/images/sheets/rank10-C.png`

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

TIER LOOK: high-tier gear — mythic and ornate: gold or silver trim, engraved patterns, gems, a soft glow.

FRAMING BY TYPE:
- BOOTS / SHOES: a pair, side view facing right
- CLOAK / CAPE: front view, hanging open, empty (no body inside)
- RING: single ring, 3/4 view so the band is visible
- NECKLACE / AMULET: chain in a loop, pendant at the bottom center
- BRACELET / BANGLE / WRISTWATCH: single band, 3/4 view
- SMALL PRECIOUS OBJECT (gem or relic): single small object, 3/4 view

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. BOOTS / SHOES 「떠돌이 짚신」 — loot from the monster 「흑도 낭인」. plain look; mood: aggressive, sharp.
2. CLOAK / CAPE 「태극 도포」 — loot from the monster 「무당 도사」. plain look; mood: reinforced, built to last.
3. RING 「아미자」 — loot from the monster 「아미파 사태」. plain look; mood: pointed, piercing.
4. NECKLACE / AMULET 「면벽의 염주」 — loot from the monster 「달마」. more refined and menacing; mood: modest, well used.
5. NECKLACE / AMULET 「세가의 옥패」 — loot from the monster 「남궁세가 가주」. more refined and menacing; mood: heavy, blunt, massive.
6. BRACELET / BANGLE / WRISTWATCH 「백팔 염주」 — loot from the monster 「아미파 사태」. plain look; mood: pointed, piercing.
7. BRACELET / BANGLE / WRISTWATCH 「태극 팔찌」 — loot from the monster 「장삼봉」. more refined and menacing; mood: spiked, thorny.
8. SMALL PRECIOUS OBJECT (gem or relic) 「천마의 비급」 — loot from the monster 「천마」. a small ancient object; the most ornate and imposing piece of this set.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 떠돌이 짚신 | 신발 | 흑도 낭인 | `assets/items/nangin2_0.png` |
| 2 | 태극 도포 | 망토 | 무당 도사 | `assets/items/wudang2_1.png` |
| 3 | 아미자 | 반지 | 아미파 사태 | `assets/items/emei2_0.png` |
| 4 | 면벽의 염주 | 목걸이 | 달마 | `assets/items/dalma2_1.png` |
| 5 | 세가의 옥패 | 목걸이 | 남궁세가 가주 | `assets/items/namgung2_0.png` |
| 6 | 백팔 염주 | 팔찌 | 아미파 사태 | `assets/items/emei2_1.png` |
| 7 | 태극 팔찌 | 팔찌 | 장삼봉 | `assets/items/zhangsanfeng2_0.png` |
| 8 | 천마의 비급 | 특수장비 | 천마 | `assets/items/cheonma2_2.png` |

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

TIER LOOK: high-tier gear — mythic and ornate: gold or silver trim, engraved patterns, gems, a soft glow.

ITEM — the name is Korean. Draw what the name describes; never write the name in the image.
If the name describes a different kind of object than its type, draw the object from the name.
```

- **천마검** → `assets/items/cheonma2_0.png`

  ```text
  WEAPON 「천마검」 — loot from the monster 「천마」. the most ornate and imposing piece of this set; mood: aggressive, sharp. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **팽가의 대도** → `assets/items/paeng_0.png`

  ```text
  WEAPON 「팽가의 대도」 — loot from the monster 「하북팽가 도객」. more refined and menacing; mood: heavy, blunt, massive. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **송문고검** → `assets/items/wudang2_0.png`

  ```text
  WEAPON 「송문고검」 — loot from the monster 「무당 도사」. plain look; mood: reinforced, built to last. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **세수경** → `assets/items/dalma2_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「세수경」 — loot from the monster 「달마」. more refined and menacing; mood: modest, well used. Framing: front view, slightly tilted.
  ```

- **동냥 바가지** → `assets/items/gaebang2_1.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「동냥 바가지」 — loot from the monster 「개방 장로」. plain look; mood: a lucky charm, a hint of gold. Framing: front view, slightly tilted.
  ```

- **백우선** → `assets/items/jegal_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「백우선」 — loot from the monster 「제갈세가 군사」. more refined and menacing; mood: sturdy, protective. Framing: front view, slightly tilted.
  ```

- **서리 투구** → `assets/items/bukhae2_1.png`

  ```text
  HEADGEAR 「서리 투구」 — loot from the monster 「북해빙궁 무사」. plain look; mood: sturdy, protective. Framing: 3/4 front view, empty (no head inside).
  ```

- **매화 두건** → `assets/items/hwasan2_0.png`

  ```text
  HEADGEAR 「매화 두건」 — loot from the monster 「화산파 매화검수」. plain look; mood: light, slim, built for speed. Framing: 3/4 front view, empty (no head inside).
  ```

- **한빙 갑의** → `assets/items/bukhae2_0.png`

  ```text
  BODY ARMOR / CLOTHING 「한빙 갑의」 — loot from the monster 「북해빙궁 무사」. plain look; mood: sturdy, protective. Framing: front view, torso piece only, empty (no body inside).
  ```

- **천마흑포** → `assets/items/cheonma2_1.png`

  ```text
  BODY ARMOR / CLOTHING 「천마흑포」 — loot from the monster 「천마」. the most ornate and imposing piece of this set; mood: aggressive, sharp. Framing: front view, torso piece only, empty (no body inside).
  ```

- **철포삼** → `assets/items/shaolin2_1.png`

  ```text
  BODY ARMOR / CLOTHING 「철포삼」 — loot from the monster 「소림 나한」. plain look; mood: sturdy, protective. Framing: front view, torso piece only, empty (no body inside).
  ```

- **암기 견대** → `assets/items/tangga2_0.png`

  ```text
  SHOULDER GUARD 「암기 견대」 — loot from the monster 「사천당가 독수」. more refined and menacing; mood: sinister, a touch of blood red. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **되돌리는 손** → `assets/items/moyong_0.png`

  ```text
  GLOVES / GAUNTLETS 「되돌리는 손」 — loot from the monster 「모용세가 공자」. more refined and menacing; mood: spiked, thorny. Framing: a pair, backs of the hands, fingers up.
  ```

- **금강 권갑** → `assets/items/shaolin2_0.png`

  ```text
  GLOVES / GAUNTLETS 「금강 권갑」 — loot from the monster 「소림 나한」. plain look; mood: sturdy, protective. Framing: a pair, backs of the hands, fingers up.
  ```

- **아홉 매듭 띠** → `assets/items/gaebang2_0.png`

  ```text
  BELT / SASH 「아홉 매듭 띠」 — loot from the monster 「개방 장로」. plain look; mood: a lucky charm, a hint of gold. Framing: laid in a loop, buckle or knot at the front.
  ```

- **구름 위를 걷는 각반** → `assets/items/zhangsanfeng2_1.png`

  ```text
  LEG ARMOR 「구름 위를 걷는 각반」 — loot from the monster 「장삼봉」. more refined and menacing; mood: spiked, thorny. Framing: a pair of shin guards, front view.
  ```

- **비무대 모래 묻은 신** → `assets/items/chest_murim_boots.png`

  ```text
  BOOTS / SHOES 「비무대 모래 묻은 신」 — old treasure that was buried in a chest for a long time. plain look; mood: light, slim, built for speed. Framing: a pair, side view facing right.
  ```

- **암향 신** → `assets/items/hwasan2_1.png`

  ```text
  BOOTS / SHOES 「암향 신」 — loot from the monster 「화산파 매화검수」. plain look; mood: light, slim, built for speed. Framing: a pair, side view facing right.
  ```

- **떠돌이 짚신** → `assets/items/nangin2_0.png`

  ```text
  BOOTS / SHOES 「떠돌이 짚신」 — loot from the monster 「흑도 낭인」. plain look; mood: aggressive, sharp. Framing: a pair, side view facing right.
  ```

- **태극 도포** → `assets/items/wudang2_1.png`

  ```text
  CLOAK / CAPE 「태극 도포」 — loot from the monster 「무당 도사」. plain look; mood: reinforced, built to last. Framing: front view, hanging open, empty (no body inside).
  ```

- **아미자** → `assets/items/emei2_0.png`

  ```text
  RING 「아미자」 — loot from the monster 「아미파 사태」. plain look; mood: pointed, piercing. Framing: single ring, 3/4 view so the band is visible.
  ```

- **면벽의 염주** → `assets/items/dalma2_1.png`

  ```text
  NECKLACE / AMULET 「면벽의 염주」 — loot from the monster 「달마」. more refined and menacing; mood: modest, well used. Framing: chain in a loop, pendant at the bottom center.
  ```

- **세가의 옥패** → `assets/items/namgung2_0.png`

  ```text
  NECKLACE / AMULET 「세가의 옥패」 — loot from the monster 「남궁세가 가주」. more refined and menacing; mood: heavy, blunt, massive. Framing: chain in a loop, pendant at the bottom center.
  ```

- **백팔 염주** → `assets/items/emei2_1.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「백팔 염주」 — loot from the monster 「아미파 사태」. plain look; mood: pointed, piercing. Framing: single band, 3/4 view.
  ```

- **태극 팔찌** → `assets/items/zhangsanfeng2_0.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「태극 팔찌」 — loot from the monster 「장삼봉」. more refined and menacing; mood: spiked, thorny. Framing: single band, 3/4 view.
  ```

- **천마의 비급** → `assets/items/cheonma2_2.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「천마의 비급」 — loot from the monster 「천마」. a small ancient object; the most ornate and imposing piece of this set. Framing: single small object, 3/4 view.
  ```
