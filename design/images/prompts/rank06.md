# 제6격 마왕 — 장비 33개 · 시트 4장

> 자동으로 만든 파일입니다 (`node tools/cli.js images`). 손으로 고치지 마세요. 쓰는 법은 같은 폴더의 `README.md`.

## 시트 6-A — 무기 · 보조무기 · 투구 (9개)

저장할 이름: `design/images/sheets/rank06-A.png`

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

TIER LOOK: mid-tier gear — solid forged metal, good leather, small magic stones. Cleaner shapes, a little shine, at most a faint glow.

FRAMING BY TYPE:
- WEAPON: whole weapon, diagonal, tip or head toward the upper right
- OFF-HAND (shield, book, lantern, orb ...): front view, slightly tilted
- HEADGEAR: 3/4 front view, empty (no head inside)

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. WEAPON 「심연의 대검」 — loot from the monster 「아크데몬」. plain look; mood: aggressive, sharp.
2. WEAPON 「마왕의 검」 — loot from the monster 「마왕」. the most ornate and imposing piece of this set; mood: aggressive, sharp.
3. WEAPON 「플라즈마 절단검」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: aggressive, sharp. Hint (Korean): 매장에서 가장 비싼 칼. 시연은 유리 너머로만 한다.
4. WEAPON 「격을 삼키는 검」 — loot from the monster 「관측자」. mysterious, faintly glowing. Hint (Korean): 정예·보스를 처음 꺾을 때마다 그 격을 삼켜 에너지로 바꾼다. 삼킨 에너지는 다음 회차부터 시작과 함께 주어진다. 싸움에는 아무 도움이 되지 않는다.
5. WEAPON 「손잡이만 감긴 쇠파이프」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: heavy, blunt, massive. Hint (Korean): 테이프는 새것이고, 쇠는 닳아 있다.
6. OFF-HAND (shield, book, lantern, orb ...) 「이동식 방벽」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: reinforced, built to last. Hint (Korean): 등에 지고 가서 발로 차면 펴진다.
7. OFF-HAND (shield, book, lantern, orb ...) 「졸음의 방패」 — loot from the monster 「칠죄종 · 나태」. more refined and menacing; mood: sturdy, protective.
8. HEADGEAR 「일곱 뿔의 관」 — loot from the monster 「종말의 짐승」. plain look; mood: heavy, blunt, massive.
9. HEADGEAR 「마장의 투구」 — loot from the monster 「마신장」. plain look; mood: pointed, piercing.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 심연의 대검 | 무기 | 아크데몬 | `assets/items/archdemon_0.png` |
| 2 | 마왕의 검 | 무기 | 마왕 | `assets/items/demonking_0.png` |
| 3 | 플라즈마 절단검 | 무기 | 헌터백화점 | `assets/items/dept_plasma.png` |
| 4 | 격을 삼키는 검 | 무기 | 관측자 | `assets/items/observer_0.png` |
| 5 | 손잡이만 감긴 쇠파이프 | 무기 | 떠돌이 상인 | `assets/items/ware_bat.png` |
| 6 | 이동식 방벽 | 보조무기 | 헌터백화점 | `assets/items/dept_barrier.png` |
| 7 | 졸음의 방패 | 보조무기 | 칠죄종 · 나태 | `assets/items/sinsloth_1.png` |
| 8 | 일곱 뿔의 관 | 투구 | 종말의 짐승 | `assets/items/apocalypsebeast_0.png` |
| 9 | 마장의 투구 | 투구 | 마신장 | `assets/items/demongeneral_2.png` |

## 시트 6-B — 투구 · 갑옷 · 어깨 · 장갑 (8개)

저장할 이름: `design/images/sheets/rank06-B.png`

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
- GLOVES / GAUNTLETS: a pair, backs of the hands, fingers up

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. HEADGEAR 「전면 차폐 헬멧」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: reinforced, built to last. Hint (Korean): 얼굴이 보이지 않는다. 매장 직원도 누가 샀는지 모른다.
2. HEADGEAR 「오만의 관」 — loot from the monster 「칠죄종 · 오만」. more refined and menacing; mood: spiked, thorny.
3. BODY ARMOR / CLOTHING 「마왕의 갑주」 — loot from the monster 「마왕」. the most ornate and imposing piece of this set; mood: aggressive, sharp.
4. BODY ARMOR / CLOTHING 「역장 내장 갑주」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: reinforced, built to last. Hint (Korean): 가슴판 안쪽에서 얇은 빛막이 몸을 감싼다.
5. BODY ARMOR / CLOTHING 「고룡의 비늘」 — loot from the monster 「고대룡」. plain look; mood: heavy, blunt, massive.
6. SHOULDER GUARD 「분노의 견갑」 — loot from the monster 「칠죄종 · 분노」. more refined and menacing; mood: aggressive, sharp.
7. SHOULDER GUARD 「색 바랜 목도리」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: sinister, a touch of blood red. Hint (Korean): 누가 떠 준 것인지 모르는 채 두르게 된다.
8. GLOVES / GAUNTLETS 「마장의 건틀릿」 — loot from the monster 「마신장」. plain look; mood: pointed, piercing.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 전면 차폐 헬멧 | 투구 | 헌터백화점 | `assets/items/dept_helm6.png` |
| 2 | 오만의 관 | 투구 | 칠죄종 · 오만 | `assets/items/sinpride_0.png` |
| 3 | 마왕의 갑주 | 갑옷 | 마왕 | `assets/items/demonking_1.png` |
| 4 | 역장 내장 갑주 | 갑옷 | 헌터백화점 | `assets/items/dept_vest6.png` |
| 5 | 고룡의 비늘 | 갑옷 | 고대룡 | `assets/items/elderdragon_1.png` |
| 6 | 분노의 견갑 | 어깨 | 칠죄종 · 분노 | `assets/items/sinwrath_0.png` |
| 7 | 색 바랜 목도리 | 어깨 | 떠돌이 상인 | `assets/items/ware_scarf.png` |
| 8 | 마장의 건틀릿 | 장갑 | 마신장 | `assets/items/demongeneral_3.png` |

## 시트 6-C — 장갑 · 허리띠 · 각반 · 신발 · 망토 (8개)

저장할 이름: `design/images/sheets/rank06-C.png`

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
1. GLOVES / GAUNTLETS 「파쇄 건틀릿」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: heavy, blunt, massive. Hint (Korean): 주먹을 쥐면 마디의 돌기가 바깥으로 선다.
2. GLOVES / GAUNTLETS 「훔쳐 낀 장갑」 — loot from the monster 「칠죄종 · 질투」. more refined and menacing; mood: light, slim, built for speed.
3. BELT / SASH 「부푼 허리띠」 — loot from the monster 「칠죄종 · 폭식」. more refined and menacing; mood: reinforced, built to last.
4. LEG ARMOR 「짓밟는 각반」 — loot from the monster 「종말의 짐승」. plain look; mood: heavy, blunt, massive.
5. LEG ARMOR 「무릎보호대」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: reinforced, built to last. Hint (Korean): 한쪽만 심하게 닳았다.
6. BOOTS / SHOES 「바닥 없는 신」 — loot from the monster 「심연의 촉수」. plain look; mood: sinister, a touch of blood red.
7. BOOTS / SHOES 「중력 완충 부츠」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: sturdy, protective. Hint (Korean): 높은 데서 떨어져도 사뿐히 — 떨어지는 동안은 그대로 무섭다.
8. CLOAK / CAPE 「군단장의 망토」 — loot from the monster 「아크데몬」. plain look; mood: aggressive, sharp.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 파쇄 건틀릿 | 장갑 | 헌터백화점 | `assets/items/dept_glove6.png` |
| 2 | 훔쳐 낀 장갑 | 장갑 | 칠죄종 · 질투 | `assets/items/sinenvy_0.png` |
| 3 | 부푼 허리띠 | 허리띠 | 칠죄종 · 폭식 | `assets/items/singluttony_0.png` |
| 4 | 짓밟는 각반 | 각반 | 종말의 짐승 | `assets/items/apocalypsebeast_1.png` |
| 5 | 무릎보호대 | 각반 | 떠돌이 상인 | `assets/items/ware_greaves.png` |
| 6 | 바닥 없는 신 | 신발 | 심연의 촉수 | `assets/items/abysstentacle_1.png` |
| 7 | 중력 완충 부츠 | 신발 | 헌터백화점 | `assets/items/dept_boots6.png` |
| 8 | 군단장의 망토 | 망토 | 아크데몬 | `assets/items/archdemon_2.png` |

## 시트 6-D — 망토 · 반지 · 목걸이 · 팔찌 · 특수장비 (8개)

저장할 이름: `design/images/sheets/rank06-D.png`

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
- CLOAK / CAPE: front view, hanging open, empty (no body inside)
- RING: single ring, 3/4 view so the band is visible
- NECKLACE / AMULET: chain in a loop, pendant at the bottom center
- BRACELET / BANGLE / WRISTWATCH: single band, 3/4 view
- SMALL PRECIOUS OBJECT (gem or relic): single small object, 3/4 view

ITEMS — the names below are for you to read, NOT to write. Draw what each name describes. Never put any of these words in the image.
If a name describes a different kind of object than its type, draw the object from the name.
1. CLOAK / CAPE 「비단 망토」 — loot from the monster 「칠죄종 · 색욕」. more refined and menacing; mood: sinister, a touch of blood red.
2. RING 「왕좌 아래 떨어진 반지」 — old treasure that was buried in a chest for a long time. plain look; mood: aggressive, sharp.
3. RING 「탐욕의 반지」 — loot from the monster 「칠죄종 · 탐욕」. more refined and menacing; mood: sinister, a touch of blood red.
4. RING 「안쪽에 날짜가 새겨진 반지」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: a lucky charm, a hint of gold. Hint (Korean): 날짜는 오늘보다 한참 전이다.
5. NECKLACE / AMULET 「마왕의 관」 — loot from the monster 「마왕」. the most ornate and imposing piece of this set; mood: aggressive, sharp.
6. NECKLACE / AMULET 「세계수의 파편」 — loot from the monster 「세계수를 먹는 벌레」. more refined and menacing; mood: sinister, a touch of blood red.
7. BRACELET / BANGLE / WRISTWATCH 「갉는 팔찌」 — loot from the monster 「세계수를 먹는 벌레」. more refined and menacing; mood: sinister, a touch of blood red.
8. SMALL PRECIOUS OBJECT (gem or relic) 「고룡의 심장석」 — loot from the monster 「고대룡」. a small shining stone or crystal; plain look.
```

| 칸 | 장비 | 부위 | 나온 곳 | 잘라서 둘 곳 |
|---|---|---|---|---|
| 1 | 비단 망토 | 망토 | 칠죄종 · 색욕 | `assets/items/sinlust_0.png` |
| 2 | 왕좌 아래 떨어진 반지 | 반지 | 보물상자 | `assets/items/chest_abyss_ring.png` |
| 3 | 탐욕의 반지 | 반지 | 칠죄종 · 탐욕 | `assets/items/singreed_0.png` |
| 4 | 안쪽에 날짜가 새겨진 반지 | 반지 | 떠돌이 상인 | `assets/items/ware_ring.png` |
| 5 | 마왕의 관 | 목걸이 | 마왕 | `assets/items/demonking_2.png` |
| 6 | 세계수의 파편 | 목걸이 | 세계수를 먹는 벌레 | `assets/items/worldworm_2.png` |
| 7 | 갉는 팔찌 | 팔찌 | 세계수를 먹는 벌레 | `assets/items/worldworm_3.png` |
| 8 | 고룡의 심장석 | 특수장비 | 고대룡 | `assets/items/elderdragon_4.png` |

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

- **심연의 대검** → `assets/items/archdemon_0.png`

  ```text
  WEAPON 「심연의 대검」 — loot from the monster 「아크데몬」. plain look; mood: aggressive, sharp. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **마왕의 검** → `assets/items/demonking_0.png`

  ```text
  WEAPON 「마왕의 검」 — loot from the monster 「마왕」. the most ornate and imposing piece of this set; mood: aggressive, sharp. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **플라즈마 절단검** → `assets/items/dept_plasma.png`

  ```text
  WEAPON 「플라즈마 절단검」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: aggressive, sharp. Hint (Korean): 매장에서 가장 비싼 칼. 시연은 유리 너머로만 한다. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **격을 삼키는 검** → `assets/items/observer_0.png`

  ```text
  WEAPON 「격을 삼키는 검」 — loot from the monster 「관측자」. mysterious, faintly glowing. Hint (Korean): 정예·보스를 처음 꺾을 때마다 그 격을 삼켜 에너지로 바꾼다. 삼킨 에너지는 다음 회차부터 시작과 함께 주어진다. 싸움에는 아무 도움이 되지 않는다. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **손잡이만 감긴 쇠파이프** → `assets/items/ware_bat.png`

  ```text
  WEAPON 「손잡이만 감긴 쇠파이프」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: heavy, blunt, massive. Hint (Korean): 테이프는 새것이고, 쇠는 닳아 있다. Framing: whole weapon, diagonal, tip or head toward the upper right.
  ```

- **이동식 방벽** → `assets/items/dept_barrier.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「이동식 방벽」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: reinforced, built to last. Hint (Korean): 등에 지고 가서 발로 차면 펴진다. Framing: front view, slightly tilted.
  ```

- **졸음의 방패** → `assets/items/sinsloth_1.png`

  ```text
  OFF-HAND (shield, book, lantern, orb ...) 「졸음의 방패」 — loot from the monster 「칠죄종 · 나태」. more refined and menacing; mood: sturdy, protective. Framing: front view, slightly tilted.
  ```

- **일곱 뿔의 관** → `assets/items/apocalypsebeast_0.png`

  ```text
  HEADGEAR 「일곱 뿔의 관」 — loot from the monster 「종말의 짐승」. plain look; mood: heavy, blunt, massive. Framing: 3/4 front view, empty (no head inside).
  ```

- **마장의 투구** → `assets/items/demongeneral_2.png`

  ```text
  HEADGEAR 「마장의 투구」 — loot from the monster 「마신장」. plain look; mood: pointed, piercing. Framing: 3/4 front view, empty (no head inside).
  ```

- **전면 차폐 헬멧** → `assets/items/dept_helm6.png`

  ```text
  HEADGEAR 「전면 차폐 헬멧」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: reinforced, built to last. Hint (Korean): 얼굴이 보이지 않는다. 매장 직원도 누가 샀는지 모른다. Framing: 3/4 front view, empty (no head inside).
  ```

- **오만의 관** → `assets/items/sinpride_0.png`

  ```text
  HEADGEAR 「오만의 관」 — loot from the monster 「칠죄종 · 오만」. more refined and menacing; mood: spiked, thorny. Framing: 3/4 front view, empty (no head inside).
  ```

- **마왕의 갑주** → `assets/items/demonking_1.png`

  ```text
  BODY ARMOR / CLOTHING 「마왕의 갑주」 — loot from the monster 「마왕」. the most ornate and imposing piece of this set; mood: aggressive, sharp. Framing: front view, torso piece only, empty (no body inside).
  ```

- **역장 내장 갑주** → `assets/items/dept_vest6.png`

  ```text
  BODY ARMOR / CLOTHING 「역장 내장 갑주」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: reinforced, built to last. Hint (Korean): 가슴판 안쪽에서 얇은 빛막이 몸을 감싼다. Framing: front view, torso piece only, empty (no body inside).
  ```

- **고룡의 비늘** → `assets/items/elderdragon_1.png`

  ```text
  BODY ARMOR / CLOTHING 「고룡의 비늘」 — loot from the monster 「고대룡」. plain look; mood: heavy, blunt, massive. Framing: front view, torso piece only, empty (no body inside).
  ```

- **분노의 견갑** → `assets/items/sinwrath_0.png`

  ```text
  SHOULDER GUARD 「분노의 견갑」 — loot from the monster 「칠죄종 · 분노」. more refined and menacing; mood: aggressive, sharp. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **색 바랜 목도리** → `assets/items/ware_scarf.png`

  ```text
  SHOULDER GUARD 「색 바랜 목도리」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: sinister, a touch of blood red. Hint (Korean): 누가 떠 준 것인지 모르는 채 두르게 된다. Framing: one pauldron or a matching pair, 3/4 view.
  ```

- **마장의 건틀릿** → `assets/items/demongeneral_3.png`

  ```text
  GLOVES / GAUNTLETS 「마장의 건틀릿」 — loot from the monster 「마신장」. plain look; mood: pointed, piercing. Framing: a pair, backs of the hands, fingers up.
  ```

- **파쇄 건틀릿** → `assets/items/dept_glove6.png`

  ```text
  GLOVES / GAUNTLETS 「파쇄 건틀릿」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: heavy, blunt, massive. Hint (Korean): 주먹을 쥐면 마디의 돌기가 바깥으로 선다. Framing: a pair, backs of the hands, fingers up.
  ```

- **훔쳐 낀 장갑** → `assets/items/sinenvy_0.png`

  ```text
  GLOVES / GAUNTLETS 「훔쳐 낀 장갑」 — loot from the monster 「칠죄종 · 질투」. more refined and menacing; mood: light, slim, built for speed. Framing: a pair, backs of the hands, fingers up.
  ```

- **부푼 허리띠** → `assets/items/singluttony_0.png`

  ```text
  BELT / SASH 「부푼 허리띠」 — loot from the monster 「칠죄종 · 폭식」. more refined and menacing; mood: reinforced, built to last. Framing: laid in a loop, buckle or knot at the front.
  ```

- **짓밟는 각반** → `assets/items/apocalypsebeast_1.png`

  ```text
  LEG ARMOR 「짓밟는 각반」 — loot from the monster 「종말의 짐승」. plain look; mood: heavy, blunt, massive. Framing: a pair of shin guards, front view.
  ```

- **무릎보호대** → `assets/items/ware_greaves.png`

  ```text
  LEG ARMOR 「무릎보호대」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: reinforced, built to last. Hint (Korean): 한쪽만 심하게 닳았다. Framing: a pair of shin guards, front view.
  ```

- **바닥 없는 신** → `assets/items/abysstentacle_1.png`

  ```text
  BOOTS / SHOES 「바닥 없는 신」 — loot from the monster 「심연의 촉수」. plain look; mood: sinister, a touch of blood red. Framing: a pair, side view facing right.
  ```

- **중력 완충 부츠** → `assets/items/dept_boots6.png`

  ```text
  BOOTS / SHOES 「중력 완충 부츠」 — near-future manufactured hunter gear made by human technology — new, clean metal, thin glowing lines. plain look; mood: sturdy, protective. Hint (Korean): 높은 데서 떨어져도 사뿐히 — 떨어지는 동안은 그대로 무섭다. Framing: a pair, side view facing right.
  ```

- **군단장의 망토** → `assets/items/archdemon_2.png`

  ```text
  CLOAK / CAPE 「군단장의 망토」 — loot from the monster 「아크데몬」. plain look; mood: aggressive, sharp. Framing: front view, hanging open, empty (no body inside).
  ```

- **비단 망토** → `assets/items/sinlust_0.png`

  ```text
  CLOAK / CAPE 「비단 망토」 — loot from the monster 「칠죄종 · 색욕」. more refined and menacing; mood: sinister, a touch of blood red. Framing: front view, hanging open, empty (no body inside).
  ```

- **왕좌 아래 떨어진 반지** → `assets/items/chest_abyss_ring.png`

  ```text
  RING 「왕좌 아래 떨어진 반지」 — old treasure that was buried in a chest for a long time. plain look; mood: aggressive, sharp. Framing: single ring, 3/4 view so the band is visible.
  ```

- **탐욕의 반지** → `assets/items/singreed_0.png`

  ```text
  RING 「탐욕의 반지」 — loot from the monster 「칠죄종 · 탐욕」. more refined and menacing; mood: sinister, a touch of blood red. Framing: single ring, 3/4 view so the band is visible.
  ```

- **안쪽에 날짜가 새겨진 반지** → `assets/items/ware_ring.png`

  ```text
  RING 「안쪽에 날짜가 새겨진 반지」 — a modern everyday item left behind by someone who came before — worn and used; do not hint whose it was. plain look; mood: a lucky charm, a hint of gold. Hint (Korean): 날짜는 오늘보다 한참 전이다. Framing: single ring, 3/4 view so the band is visible.
  ```

- **마왕의 관** → `assets/items/demonking_2.png`

  ```text
  NECKLACE / AMULET 「마왕의 관」 — loot from the monster 「마왕」. the most ornate and imposing piece of this set; mood: aggressive, sharp. Framing: chain in a loop, pendant at the bottom center.
  ```

- **세계수의 파편** → `assets/items/worldworm_2.png`

  ```text
  NECKLACE / AMULET 「세계수의 파편」 — loot from the monster 「세계수를 먹는 벌레」. more refined and menacing; mood: sinister, a touch of blood red. Framing: chain in a loop, pendant at the bottom center.
  ```

- **갉는 팔찌** → `assets/items/worldworm_3.png`

  ```text
  BRACELET / BANGLE / WRISTWATCH 「갉는 팔찌」 — loot from the monster 「세계수를 먹는 벌레」. more refined and menacing; mood: sinister, a touch of blood red. Framing: single band, 3/4 view.
  ```

- **고룡의 심장석** → `assets/items/elderdragon_4.png`

  ```text
  SMALL PRECIOUS OBJECT (gem or relic) 「고룡의 심장석」 — loot from the monster 「고대룡」. a small shining stone or crystal; plain look. Framing: single small object, 3/4 view.
  ```
