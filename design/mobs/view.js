// node view.js <sprites.js> <out.png> [ids] — A · B 를 12배(격자) + 실제 크기 2 · 3배로 · 기준 그림 바탕색 · 같은 폴더에 <out>.html (걸어 다님)
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const S = require(path.resolve(process.argv[2])), out = process.argv[3];
const ids = process.argv[4] ? process.argv[4].split(',') : Object.keys(S);
for (const id of ids) for (const f of ['a', 'b']) {
  const g = S[id][f]; if (![16, 32, 48].includes(g.length)) throw new Error(`${id}.${f} 줄 ${g.length}`);
  g.forEach((r, y) => { if (r.length !== g.length) throw new Error(`${id}.${f} ${y}줄 길이 ${r.length} «${r}»`); for (const ch of r) if (ch !== '.' && !S[id].pal[ch]) throw new Error(`${id}.${f} ${y}줄 모르는 색 ${ch}`); });
}
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const BIG = 192, PAD = 12, SM = 2 * 96 + 24;
const W = PAD + ids.length * (2 * (BIG + PAD) + SM + PAD), H = PAD * 2 + BIG;
const px = Buffer.alloc(W * H * 4);
const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const X = x + i, Y = y + j; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const k = (Y * W + X) * 4; px[k] = c[0]; px[k + 1] = c[1]; px[k + 2] = c[2]; px[k + 3] = 255; } };
const BG = [132, 149, 162];
rect(0, 0, W, H, [70, 74, 80]);
const draw = (s, g, x0, y0, z) => g.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') rect(x0 + x * z, y0 + y * z, z, z, hex(s.pal[ch])); }));
ids.forEach((id, k) => {
  const s = S[id], x0 = PAD + k * (2 * (BIG + PAD) + SM + PAD);
  ['a', 'b'].forEach((f, j) => {
    const x = x0 + j * (BIG + PAD);
    const n = s[f].length, Z = BIG / n;
    rect(x, PAD, BIG, BIG, BG);
    for (let t = 1; t < n; t++) { const c = t % 16 ? [126, 143, 156] : [100, 112, 124]; rect(x + t * Z, PAD, 1, BIG, c); rect(x, PAD + t * Z, BIG, 1, c); }
    draw(s, s[f], x, PAD, Z);
  });
  const xs = x0 + 2 * (BIG + PAD);
  rect(xs, PAD, SM, BIG, BG);
  const n = s.a.length;
  draw(s, s.a, xs + 8, PAD + 8, 2); draw(s, s.b, xs + 16 + 2 * n, PAD + 8, 2);
  draw(s, s.a, xs + 8, PAD + 24 + 2 * n, 1); draw(s, s.b, xs + 16 + n, PAD + 24 + 2 * n, 1);
});
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc = b => { let c = -1; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const raw = Buffer.alloc(H * (W * 4 + 1));
for (let y = 0; y < H; y++) px.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 6;
fs.writeFileSync(out, Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
const sub = Object.fromEntries(ids.map(id => [id, S[id]]));
const html = `<!doctype html><meta charset="utf-8"><title>지도 몬스터 도트</title>
<style>body{margin:0;background:#2b2620;color:#eee;font:14px system-ui;padding:16px}canvas{image-rendering:pixelated;display:block;margin:8px 0;max-width:100%}</style>
<div>지도 몬스터 도트 — 한 칸 16×16 · 2프레임 (왼쪽으로 갈 땐 뒤집음) · 4배</div><canvas id="c"></canvas>
<script>
const S=${JSON.stringify(sub)};
const ids=Object.keys(S),T=16,Z=3,COLS=20,W=COLS*T;let H=0;const rowY=ids.map(id=>{const y=H;H+=S[id].a.length+8;return y});
const c=document.getElementById('c');c.width=W*Z;c.height=H*Z;
const g=c.getContext('2d');g.imageSmoothingEnabled=false;
const art={};for(const id of ids){art[id]={};for(const f of['a','b']){const s=S[id],r=s[f],cv=document.createElement('canvas');cv.width=cv.height=r.length;const x=cv.getContext('2d');r.forEach((row,y)=>[...row].forEach((ch,i)=>{if(ch!=='.'){x.fillStyle=s.pal[ch];x.fillRect(i,y,1,1)}}));art[id][f]=cv}}
const mobs=ids.map((id,k)=>({id,x:1+(k%4)*3,y:rowY[k]/T+0.25,dir:1,walked:0}));
let last=0;function frame(t){const dt=Math.min(.1,(t-(last||t))/1000);last=t;g.setTransform(Z,0,0,Z,0,0);
for(let y=0;y<Math.ceil(H/T);y++)for(let x=0;x<COLS;x++){g.fillStyle=(x+y)%2?'#5d7a3e':'#66843f';g.fillRect(x*T,y*T,T,T)}
for(const m of mobs){const sp=1.4*dt;m.x+=m.dir*sp;m.walked+=sp;const n=art[m.id].a.width;if(m.x>COLS-n/T-1||m.x<1)m.dir*=-1;
const im=art[m.id][Math.floor(m.walked*2.5)%2?'b':'a'],px=Math.round(m.x*T),py=Math.round(m.y*T);
g.fillStyle='rgba(20,14,8,.3)';g.beginPath();g.ellipse(px+n/2,py+n-1,n*.38,2+n/16,0,0,7);g.fill();
g.save();if(m.dir<0){g.translate(px+n,py);g.scale(-1,1)}else g.translate(px,py);g.drawImage(im,0,0);g.restore()}
requestAnimationFrame(frame)}requestAnimationFrame(frame);
</script>`;
fs.writeFileSync(out.replace(/\.png$/, '.html'), html);
console.log('ok');
