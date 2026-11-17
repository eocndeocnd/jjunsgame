# 제12격 환수 — 장비 24개 · 시트 3장

> 자동으로 만든 파일입니다 (`node tools/cli.js images`). 손으로 고치지 마세요. 쓰는 법은 같은 폴더의 `README.md`.

## 시트 12-A — 무기 · 보조무기 · 투구 · 갑옷 (8개)

저장할 이름: `design/images/sheets/rank12-A.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 8 separate game item icons in a 3x3 grid.

STYLE — the same for every icon:
- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight
- one object per icon, a simple bold silhouette that still reads at 64 px
- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows

BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.
Do not use magenta or hot pink on the items themselves.

LAYOUT: 3 columns x 3 rows of equal square cells. Exactly one item per cell, centered, filling about 70% of its cell,
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed. Leave the last 1 cell empty (plain magenta).

TIER LOOK: high-tier gear — mythic and ornate: gold or silver trim, engraved patterns, gems, a soft glow.

FRAMING BY TYPE:
- WEAPON: whole weapon, diagonal, tip or head toward the upper right
- OFF-HAND (shield, book, lantern, orb ...): front view, slightly tilted
- HEADGEAR: 3/4 front view, empty (no head inside)
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)

ITEMS — the names are Korean. Draw what each name describes; never write the name in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. WEAPON 「용의 송곳니 검」 — loot from the monster 「성역의 수호룡」. the most ornate and imposing piece of this set; mood: spiked, thorny.
2. WEAPON 「일각수의 뿔」 — loot from the monster 「유니콘」. plain look; mood: reinforced, built to last.
3. OFF-HAND (shield, book, lantern, orb ...) 「황소 뿔 방패」 — loot from the monster 「크레타의 황소」. more refined and menacing; mood: aggressive, sharp.
4. HEADGEAR 「세 머리의 투구」 — loot from the monster 「케르베로스」. more refined and menacing; mood: aggressive, sharp.
5. HEADGEAR 「사자의 관」 — loot from the monster 「스핑크스」. more refined and menacing; mood: reinforced, built to last.
6. BODY ARMOR / CLOTHING 「열두 과업의 사자 가죽」 — old treasure that was buried in a chest for a long time. plain look; mood: spiked, thorny.
7. BODY ARMOR / CLOTHING 「세 몸을 두른 갑주」 — loot from the monster 「게리온」. more refined and menacing; mood: sturdy, protective.
8. BODY ARMOR / CLOTHING 「흡반 갑피」 — loot from the monster 「크라켄」. more refined and menacing; mood: sinister, a touch of blood red.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 용의 송곳니 검 | 무기 | 성역의 수호룡 | `assets/items/sanctdragon2_0.png` |
| 2 | 일각수의 뿔 | 무기 | 유니콘 | `assets/items/unicorn2_0.png` |
| 3 | 황소 뿔 방패 | 보조무기 | 크레타의 황소 | `assets/items/cretanbull_0.png` |
| 4 | 세 머리의 투구 | 투구 | 케르베로스 | `assets/items/cerberus2_0.png` |
| 5 | 사자의 관 | 투구 | 스핑크스 | `assets/items/sphinx2_1.png` |
| 6 | 열두 과업의 사자 가죽 | 갑옷 | 보물상자 | `assets/items/chest_sanct_armor.png` |
| 7 | 세 몸을 두른 갑주 | 갑옷 | 게리온 | `assets/items/geryon_0.png` |
| 8 | 흡반 갑피 | 갑옷 | 크라켄 | `assets/items/kraken2_1.png` |

## 시트 12-B — 갑옷 · 어깨 · 장갑 · 허리띠 · 각반 · 신발 (8개)

저장할 이름: `design/images/sheets/rank12-B.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 8 separate game item icons in a 3x3 grid.

STYLE — the same for every icon:
- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight
- one object per icon, a simple bold silhouette that still reads at 64 px
- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows

BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.
Do not use magenta or hot pink on the items themselves.

LAYOUT: 3 columns x 3 rows of equal square cells. Exactly one item per cell, centered, filling about 70% of its cell,
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed. Leave the last 1 cell empty (plain magenta).

TIER LOOK: high-tier gear — mythic and ornate: gold or silver trim, engraved patterns, gems, a soft glow.

FRAMING BY TYPE:
- BODY ARMOR / CLOTHING: front view, torso piece only, empty (no body inside)
- SHOULDER GUARD: one pauldron or a matching pair, 3/4 view
- GLOVES / GAUNTLETS: a pair, backs of the hands, fingers up
- BELT / SASH: laid in a loop, buckle or knot at the front
- LEG ARMOR: a pair of shin guards, front view
- BOOTS / SHOES: a pair, side view facing right

ITEMS — the names are Korean. Draw what each name describes; never write the name in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. BODY ARMOR / CLOTHING 「고룡 비늘 갑주」 — loot from the monster 「성역의 수호룡」. the most ornate and imposing piece of this set; mood: spiked, thorny.
2. SHOULDER GUARD 「거대 촉수」 — loot from the monster 「크라켄」. more refined and menacing; mood: sinister, a touch of blood red.
3. SHOULDER GUARD 「칼이 들지 않는 갈기」 — loot from the monster 「네메아의 사자」. more refined and menacing; mood: sturdy, protective.
4. GLOVES / GAUNTLETS 「그리핀의 앞발」 — loot from the monster 「히포그리프」. plain look; mood: light, slim, built for speed.
5. BELT / SASH 「쇠사슬 고삐」 — loot from the monster 「디오메데스의 말」. more refined and menacing; mood: heavy, blunt, massive.
6. LEG ARMOR 「멧돼지 엄니 각반」 — loot from the monster 「에리만토스의 멧돼지」. more refined and menacing; mood: heavy, blunt, massive.
7. BOOTS / SHOES 「청동 발굽」 — loot from the monster 「케리네이아의 사슴」. more refined and menacing; mood: a lucky charm, a hint of gold.
8. BOOTS / SHOES 「구름을 딛는 편자」 — loot from the monster 「페가수스」. plain look; mood: light, slim, built for speed.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 고룡 비늘 갑주 | 갑옷 | 성역의 수호룡 | `assets/items/sanctdragon2_1.png` |
| 2 | 거대 촉수 | 어깨 | 크라켄 | `assets/items/kraken2_0.png` |
| 3 | 칼이 들지 않는 갈기 | 어깨 | 네메아의 사자 | `assets/items/nemeanlion_0.png` |
| 4 | 그리핀의 앞발 | 장갑 | 히포그리프 | `assets/items/hippogriff_0.png` |
| 5 | 쇠사슬 고삐 | 허리띠 | 디오메데스의 말 | `assets/items/mares_0.png` |
| 6 | 멧돼지 엄니 각반 | 각반 | 에리만토스의 멧돼지 | `assets/items/erymanthianboar_0.png` |
| 7 | 청동 발굽 | 신발 | 케리네이아의 사슴 | `assets/items/ceryneianhind_0.png` |
| 8 | 구름을 딛는 편자 | 신발 | 페가수스 | `assets/items/pegasus2_0.png` |

## 시트 12-C — 망토 · 반지 · 목걸이 · 팔찌 · 특수장비 (8개)

저장할 이름: `design/images/sheets/rank12-C.png`

```text
Make ONE square image, 1024x1024: a sprite sheet of 8 separate game item icons in a 3x3 grid.

STYLE — the same for every icon:
- 16-bit pixel art, crisp 1px dark outline, limited color palette, flat shading with one highlight
- one object per icon, a simple bold silhouette that still reads at 64 px
- no text, no letters, no numbers, no labels, no frames, no grid lines, no drop shadows

BACKGROUND: one flat solid magenta (#FF00FF) everywhere. No gradient, no checkerboard, no floor.
Do not use magenta or hot pink on the items themselves.

LAYOUT: 3 columns x 3 rows of equal square cells. Exactly one item per cell, centered, filling about 70% of its cell,
never touching the cell edges. Fill the cells left to right, top to bottom, in the order listed. Leave the last 1 cell empty (plain magenta).

TIER LOOK: high-tier gear — mythic and ornate: gold or silver trim, engraved patterns, gems, a soft glow.

FRAMING BY TYPE:
- CLOAK / CAPE: front view, hanging open, empty (no body inside)
- RING: single ring, 3/4 view so the band is visible
- NECKLACE / AMULET: chain in a loop, pendant at the bottom center
- BRACELET / BANGLE / WRISTWATCH: single band, 3/4 view
- SMALL PRECIOUS OBJECT (gem or relic): single small object, 3/4 view

ITEMS — the names are Korean. Draw what each name describes; never write the name in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. CLOAK / CAPE 「재에서 난 깃옷」 — loot from the monster 「피닉스」. plain look; mood: modest, well used.
2. RING 「청동 깃 반지」 — loot from the monster 「스팀팔로스의 새」. more refined and menacing; mood: pointed, piercing.
3. NECKLACE / AMULET 「라돈의 비늘 목걸이」 — loot from the monster 「라돈」. more refined and menacing; mood: reinforced, built to last.
4. NECKLACE / AMULET 「풀리지 않는 수수께끼」 — loot from the monster 「스핑크스」. more refined and menacing; mood: reinforced, built to last.
5. BRACELET / BANGLE / WRISTWATCH 「날개의 고리」 — loot from the monster 「페가수스」. plain look; mood: light, slim, built for speed.
6. BRACELET / BANGLE / WRISTWATCH 「정화의 팔찌」 — loot from the monster 「유니콘」. plain look; mood: reinforced, built to last.
7. SMALL PRECIOUS OBJECT (gem or relic) 「다시 타오르는 잿불」 — loot from the monster 「피닉스」. a small ancient object; plain look.
8. SMALL PRECIOUS OBJECT (gem or relic) 「성역의 수호석」 — loot from the monster 「성역의 수호룡」. a small ancient object; the most ornate and imposing piece of this set.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 재에서 난 깃옷 | 망토 | 피닉스 | `assets/items/phoenix2_0.png` |
| 2 | 청동 깃 반지 | 반지 | 스팀팔로스의 새 | `assets/items/stymphalianbirds_0.png` |
| 3 | 라돈의 비늘 목걸이 | 목걸이 | 라돈 | `assets/items/ladon_0.png` |
| 4 | 풀리지 않는 수수께끼 | 목걸이 | 스핑크스 | `assets/items/sphinx2_0.png` |
| 5 | 날개의 고리 | 팔찌 | 페가수스 | `assets/items/pegasus2_1.png` |
| 6 | 정화의 팔찌 | 팔찌 | 유니콘 | `assets/items/unicorn2_1.png` |
| 7 | 다시 타오르는 잿불 | 특수장비 | 피닉스 | `assets/items/phoenix2_1.png` |
| 8 | 성역의 수호석 | 특수장비 | 성역의 수호룡 | `assets/items/sanctdragon2_2.png` |

## 하나씩 뽑기 (시트가 잘 안 될 때)

아래 「앞에 붙일 말」 뒤에 장비 한 줄을 붙여 보냅니다. 나온 그림은 표의 「잘라서 둘 곳」 이름으로 저장합니다 (배경은 나중에 도구가 걷어냅니다).

앞에 붙일 말:

```text
Make ONE square image, 1024x1024: a single game item icon.

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

- **용의 송곳니 검** → `assets/items/sanctdragon2_0.png`

  ```text
  WEAPON 「용의 송곳니 검」 — loot from the monster 「성역의 수호룡」. the most ornate and imposing piece of this set; mood: spiked, thorny. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **일각수의 뿔** → `assets/items/unicorn2_0.png`

  ```text
  WEAPON 「일각수의 뿔」 — loot from the monster 「유니콘」. plain look; mood: reinforced, built to last. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **황소 뿔 방패** → `assets/items/cretanbull_0.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「황소 뿔 방패」 — loot from the monster 「크레타의 황소」. more refined and menacing; mood: aggressive, sharp. Framing: front view, slightly tilted.
  ```

- **세 머리의 투구** → `assets/items/cerberus2_0.png`

  ```text
  HEADGEAR 「세 머리의 투구」 — loot from the monster 「케르베로스」. more refined and menacing; mood: aggressive, sharp. Framing: 3/4 front view, empty (no head inside).
  ```

- **사자의 관** → `assets/items/sphinx2_1.png`

  ```text
  HEADGEAR 「사자의 관」 — loot from the monster 「스핑크스」. more refined and menacing; mood: reinforced, built to last. Framing: 3/4 front view, empty (no head inside).
  ```

- **열두 과업의 사자 가죽** → `assets/items/chest_sanct_armor.png`

  ```text
  BODY ARMOR / CLOTHING 「열두 과업의 사자 가죽」 — old treasure that was buried in a chest for a long time. plain look; mood: spiked, thorny. Framing: front view, torso piece only, empty (no body inside).
  ```

- **세 몸을 두른 갑주** → `assets/items/geryon_0.png`

  ```text
  BODY ARMOR / CLOTHING 「세 몸을 두른 갑주」 — loot from the monster 「게리온」. more refined and menacing; mood: sturdy, protective. Framing: front view, torso piece only, empty (no body inside).
  ```

- **흡반 갑피** → `assets/items/kraken2_1.png`

  ```text
  BODY ARMOR / CLOTHING 「흡반 갑피」 — loot from the monster 「크라켄」. more refined and menacing; mood: sinister, a touch of blood red. Framing: front view, torso piece only, empty (no body inside).
  ```

- **고룡 비늘 갑주** → `assets/items/sanctdragon2_1.png`

  ```text
  BODY ARMOR / CLOTHING 「고룡 비늘 갑주」 — loot from the monster 「성역의 수호룡」. the most ornate and imposing piece of this set; mood: spiked, thorny. Framing: front view, torso piece only, empty (no body inside).
  ```

- **거대 촉수** → `assets/items/kraken2_0.png`

  ```text
  SHOULDER GUARD 「거대 촉수」 — loot from the monster 「크라켄」. more refined and menacing; mood: sinister, a touch of blood red. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **칼이 들지 않는 갈기** → `assets/items/nemeanlion_0.png`

  ```text
  SHOULDER GUARD 「칼이 들지 않는 갈기」 — loot from the monster 「네메아의 사자」. more refined and menacing; mood: sturdy, protective. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **그리핀의 앞발** → `assets/items/hippogriff_0.png`

  ```text
  GLOVES / GAUNTLETS 「그리핀의 앞발」 — loot from the monster 「히포그리프」. plain look; mood: light, slim, built for speed. Framing: a pair, backs of the hands, fingers up.
  ```

- **쇠사슬 고삐** → `assets/items/mares_0.png`

  ```text
  BELT / SASH 「쇠사슬 고삐」 — loot from the monster 「디오메데스의 말」. more refined and menacing; mood: heavy, blunt, massive. Framing: laid in a loop, buckle or knot at the front.
  ```

- **멧돼지 엄니 각반** → `assets/items/erymanthianboar_0.png`

  ```text
  LEG ARMOR 「멧돼지 엄니 각반」 — loot from the monster 「에리만토스의 멧돼지」. more refined and menacing; mood: heavy, blunt, massive. Framing: a pair of shin guards, front view.
  ```

- **청동 발굽** → `assets/items/ceryneianhind_0.png`

  ```text
  BOOTS / SHOES 「청동 발굽」 — loot from the monster 「케리네이아의 사슴」. more refined and menacing; mood: a lucky charm, a hint of gold. Framing: a pair, side view facing right.
  ```

- **구름을 딛는 편자** → `assets/items/pegasus2_0.png`

  ```text
  BOOTS / SHOES 「구름을 딛는 편자」 — loot from the monster 「페가수스」. plain look; mood: light, slim, built for speed. Framing: a pair, side view facing right.
  ```

- **재에서 난 깃옷** → `assets/items/phoenix2_0.png`

  ```text
  CLOAK / CAPE 「재에서 난 깃옷」 — loot from the monster 「피닉스」. plain look; mood: modest, well used. Framing: front view, hanging open, empty (no body inside).
  ```

- **청동 깃 반지** → `assets/items/stymphalianbirds_0.png`

  ```text
  RING 「청동 깃 반지」 — loot from the monster 「스팀팔로스의 새」. more refined and menacing; mood: pointed, piercing. Framing: single ring, 3/4 view so the band is visible.
  ```

- **라돈의 비늘 목걸이** → `assets/items/ladon_0.png`

  ```text
  NECKLACE / AMULET 「라돈의 비늘 목걸이」 — loot from the monster 「라돈」. more refined and menacing; mood: reinforced, built to last. Framing: chain in a loop, pendant at the bottom center.
  ```

- **풀리지 않는 수수께끼** → `assets/items/sphinx2_0.png`

  ```text
  NECKLACE / AMULET 「풀리지 않는 수수께끼」 — loot from the monster 「스핑크스」. more refined and menacing; mood: reinforced, built to last. Framing: chain in a loop, pendant at the bottom center.
  ```

- **날개의 고리** → `assets/items/pegasus2_1.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「날개의 고리」 — loot from the monster 「페가수스」. plain look; mood: light, slim, built for speed. Framing: single band, 3/4 view.
  ```

- **정화의 팔찌** → `assets/items/unicorn2_1.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「정화의 팔찌」 — loot from the monster 「유니콘」. plain look; mood: reinforced, built to last. Framing: single band, 3/4 view.
  ```

- **다시 타오르는 잿불** → `assets/items/phoenix2_1.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「다시 타오르는 잿불」 — loot from the monster 「피닉스」. a small ancient object; plain look. Framing: single small object, 3/4 view.
  ```

- **성역의 수호석** → `assets/items/sanctdragon2_2.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「성역의 수호석」 — loot from the monster 「성역의 수호룡」. a small ancient object; the most ornate and imposing piece of this set. Framing: single small object, 3/4 view.
  ```
