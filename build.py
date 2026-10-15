# -*- coding: utf-8 -*-
"""
한 파일짜리 빌드.

안드로이드 크롬에서 HTML 파일을 직접 열면 주소가 content:// 로 잡히는데,
그 상태에서는 css/style.css 나 js/*.js 같은 상대 경로를 아예 못 불러옵니다.
그래서 스타일도 스크립트도 없는 맨 HTML만 보입니다.

이 스크립트는 CSS 와 JS 를 index.html 안에 통째로 밀어넣어
jjunsgame.html 하나로 만듭니다. 그 파일은 어디서 열든 돌아갑니다 —
폰 다운로드 폴더, 메일 첨부, USB, 뭐든.

    python build.py
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).parent
OUT = ROOT / "jjunsgame.html"

def read(p):
    # utf-8-sig 로 읽어야 BOM(U+FEFF)이 걷힙니다.
    #
    # 이게 왜 중요하냐면 — PowerShell 의 Set-Content -Encoding UTF8 은 BOM 을 붙입니다.
    # 그 파일을 그냥 utf-8 로 읽으면 맨 앞에 ﻿ 가 문자로 남고,
    # 그대로 <style> 안에 들어가면 CSS 파서가 그걸 선택자로 잘못 읽어서
    # **첫 규칙을 통째로 버립니다.** 첫 규칙이 :root 라서 색 변수가 전부 날아가고
    # 화면이 흰 바탕으로 깨집니다. 파일을 따로 둘 때는 브라우저가 BOM 을
    # 알아서 걷어내기 때문에 합친 파일에서만 터집니다.
    return (ROOT / p).read_text(encoding="utf-8-sig")

# 쪽지 — index.html 이 가리키는 css · js 주소에 빌드마다 ?v=시각 을 붙입니다.
# 깃허브 페이지는 파일마다 따로 캐시(약 10분)를 해서, 새로 올린 직후 폰이 **옛 index.html + 새 js** 를 섞어 받는 일이
# 있었습니다 (새 js 가 찾는 요소가 옛 html 에 없어 초기화면이 안 뜨고 탭이 죽음). 주소가 버전마다 다르면
# 옛 html 은 옛 js 를, 새 html 은 새 js 를 받아서 섞이지 않습니다.
import time
VER = time.strftime("%Y%m%d%H%M%S")
_raw = (ROOT / "index.html").read_text(encoding="utf-8")
_stamped = re.sub(r'((?:src|href)="(?:js|css)/[^"?]+)(?:\?v=\d+)?"', lambda m: f'{m.group(1)}?v={VER}"', _raw)
if _stamped != _raw:
    (ROOT / "index.html").write_text(_stamped, encoding="utf-8")

html = read("index.html")

# <link rel="stylesheet" href="..."> → <style>...</style>
# 단, http(s) 로 시작하는 건 **그대로 둡니다** — 웹폰트처럼 바깥에서
# 받아와야 하는 것들입니다. 읽으려 들면 경로가 없어서 터집니다.
n_css = 0
n_kept = 0
def inline_css(m):
    global n_css, n_kept
    href = m.group(1)
    if href.startswith(("http://", "https://", "//")):
        n_kept += 1
        return m.group(0)
    n_css += 1
    return "<style>\n" + read(href.split("?")[0]) + "\n</style>"

html = re.sub(
    r'<link[^>]*rel=["\']stylesheet["\'][^>]*href=["\']([^"\']+)["\'][^>]*>',
    inline_css, html)

# 스크립트 안에서 'assets/….webp' 처럼 그림을 가리키는 글자는 그림 자체(data: 주소)로 바꿉니다.
# 한 파일로 열면 상대 경로를 못 불러오는 건 그림도 마찬가지라서요 (전투 이펙트 — js/fx.js).
import base64
MIME = {".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif"}
n_assets = 0
def inline_asset(m):
    global n_assets
    q, path = m.group(1), m.group(2)
    f = ROOT / path
    if not f.exists():
        raise SystemExit(f"그림이 없습니다 — {path}")
    n_assets += 1
    data = base64.b64encode(f.read_bytes()).decode("ascii")
    return f"{q}data:{MIME[f.suffix.lower()]};base64,{data}{q}"

# <script src="..."></script> → <script>...</script>
def inline_js(m):
    src = m.group(1).split("?")[0]
    code = read(src)
    code = re.sub(r'([\'"])(assets/[^\'"]+\.(?:webp|png|jpe?g|gif))\1', inline_asset, code)
    # 혹시 코드 안에 </script> 문자열이 있으면 파서가 거기서 끊깁니다
    code = code.replace("</script>", "<\\/script>")
    return "<script>\n" + code + "\n</script>"

html, n_js = re.subn(
    r'<script[^>]*src=["\']([^"\']+)["\'][^>]*>\s*</script>',
    inline_js, html)

# 어딘가에서 또 새어 들어왔을지 모르니 마지막에 한 번 더 훑습니다
stray = html.count("﻿")
html = html.replace("﻿", "")

OUT.write_text(html, encoding="utf-8")   # BOM 없이 씁니다

# 스스로 검사 — 색 변수가 살아있어야 정상입니다
assert ":root" in html, "치명적: :root 블록이 사라졌습니다"
assert "--bg:" in html, "치명적: 색 변수가 사라졌습니다"

# JS 문법 검사.
# 쉼표 하나 빠뜨려서 data.js 가 통째로 죽은 적이 있습니다. 그러면 화면은
# 멀쩡히 뜨는데 게임만 안 돌아서, 브라우저 콘솔을 보기 전에는 모릅니다.
import shutil, subprocess
_node = shutil.which("node")
if _node:
    for f in ("js/backdrop.js", "js/sound.js", "js/fx.js", "js/data.js", "js/game.js", "js/ui.js"):
        r = subprocess.run([_node, "--check", str(ROOT / f)], capture_output=True, text=True)
        if r.returncode != 0:
            raise SystemExit(f"문법 오류 — {f}\n{r.stderr.strip()}")
    print("  문법 검사 통과")
    # 전리품 번호 검사 — 적을 옮기거나 목록 순서를 바꿔 옛 저장본의 장비가 몰래 바뀌면 빌드를 멈춥니다 (tools/id-check.js)
    r = subprocess.run([_node, str(ROOT / "tools" / "cli.js"), "check-ids"], capture_output=True, text=True, encoding="utf-8")
    sys.stdout.write(r.stdout)
    if r.returncode != 0:
        sys.stderr.write(r.stderr)
        raise SystemExit("빌드를 멈춥니다 — 위 전리품 번호 문제를 먼저 해결하세요.")
    # 전리품 분포 검사 — 몬스터마다 개수 규칙 · 격마다 열세 부위 · 전체 예산 (tools/loot-check.js)
    r = subprocess.run([_node, str(ROOT / "tools" / "cli.js"), "check-loot"], capture_output=True, text=True, encoding="utf-8")
    sys.stdout.write(r.stdout)
    if r.returncode != 0:
        sys.stderr.write(r.stderr)
        raise SystemExit("빌드를 멈춥니다 — 위 전리품 분포 문제를 먼저 해결하세요.")
else:
    print("  ⚠ node 가 없어 문법 검사 · 전리품 번호 · 분포 검사를 건너뜁니다 (괄호 짝만 셉니다). 설치하면 빌드할 때마다 자동으로 돕니다.")
    # node 가 없으면 최소한 괄호 짝이라도 셉니다
    for f in ("js/backdrop.js", "js/sound.js", "js/fx.js", "js/data.js", "js/game.js", "js/ui.js"):
        src = read(f)
        for open_c, close_c in (("{", "}"), ("(", ")"), ("[", "]")):
            if src.count(open_c) != src.count(close_c):
                raise SystemExit(f"괄호가 안 맞습니다 — {f} 의 {open_c}{close_c}")

# 그림 목록이 옛것이면 알려 줍니다 — design/images/image-manifest.json 에 적힌 data.js 표시와 지금 data.js 를 견줍니다.
# (표시는 tools/image-manifest.js 의 dataHash 와 같은 32비트 FNV-1a — 줄바꿈 · BOM 차이는 무시)
def _data_hash(path):
    b = path.read_bytes()
    if b.startswith(b"\xef\xbb\xbf"):
        b = b[3:]
    b = b.replace(b"\r\n", b"\n")
    h = 0x811c9dc5
    for x in b:
        h = ((h ^ x) * 0x01000193) & 0xffffffff
    return f"{h:08x}"
_man = ROOT / "design" / "images" / "image-manifest.json"
if _man.exists():
    import json
    _saved = json.loads(_man.read_text(encoding="utf-8")).get("data_hash", "")
    if _saved != _data_hash(ROOT / "js" / "data.js"):
        print("  ⚠ 그림 목록(design/images)이 옛것입니다 — 적이나 전리품이 바뀌었습니다. 다시 뽑으세요: node tools/cli.js images (또는 tools/export-images.html)")

size = OUT.stat().st_size
warn = f"  (BOM {stray}개 제거)" if stray else ""
kept = f" · 바깥 링크 {n_kept}개 유지" if n_kept else ""
print(f"jjunsgame.html  —  CSS {n_css}개 · JS {n_js}개 · 그림 {n_assets}개 합침{kept}, {size/1024:.0f}KB{warn}")
