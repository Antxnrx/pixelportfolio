(() => {
// ================= shared pixel helpers (same method as the sun) =================
const hex = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
const B4 = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
const bay = (x,y) => (B4[y&3][x&3] + .5) / 16;
const lerp = (a,b,t) => [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// dithered vertical gradient; stops are [fraction, '#hex']
function ditherFill(img, w, y0, y1, stops, steps, totalH, x0 = 0, x1 = w) {
  const s = stops.map(([f,c]) => [f*totalH, hex(c)]);
  for (let y = y0; y < y1; y++) {
    let i = 0; while (i < s.length - 2 && y >= s[i+1][0]) i++;
    const t = Math.min(1, Math.max(0, (y - s[i][0]) / Math.max(1e-6, s[i+1][0] - s[i][0])));
    for (let x = x0; x < x1; x++) {
      const q = Math.min(1, Math.floor(t*steps + bay(x,y)) / steps);
      const c = lerp(s[i][1], s[i+1][1], q), k = (y*w + x)*4;
      img.data[k]=c[0]; img.data[k+1]=c[1]; img.data[k+2]=c[2]; img.data[k+3]=255;
    }
  }
}
// striped retro sun drawn into an ImageData
function drawSun(img, w, h, cx, cy, r, clipY, cols = ['#fff3b0','#ffdf7a','#ffc062','#ff9a58','#ff5c6a']) {
  const C = cols.map(hex), halo = hex('#ffe3a6');
  for (let y = Math.max(0, cy - r - 16); y < Math.min(clipY, cy + r + 16); y++)
    for (let x = Math.max(0, cx - r - 16); x < Math.min(w, cx + r + 16); x++) {
      const d = Math.hypot(x - cx, y - cy), k = (y*w + x)*4;
      if (d <= r) {
        const st = y - (cy - r*.15);
        if (st > 0) { const gap = 1 + Math.floor(st / (r/4)); if (st % Math.max(6, Math.round(r/4.2)) < gap) continue; }
        const t = (y - (cy - r)) / (2*r);
        const c = C[Math.min(C.length-1, Math.max(0, Math.floor(t*C.length + bay(x,y) - .5)))];
        img.data[k]=c[0]; img.data[k+1]=c[1]; img.data[k+2]=c[2]; img.data[k+3]=255;
      } else if (d < r + 16) {
        const f = Math.floor((1 - (d - r)/16)*3 + bay(x,y)) / 3 * .3;
        const c = lerp([img.data[k],img.data[k+1],img.data[k+2]], halo, f);
        img.data[k]=c[0]; img.data[k+1]=c[1]; img.data[k+2]=c[2];
      }
    }
}
function speckTile(h, base, specks, density) {
  const t = document.createElement('canvas'); t.width = 64; t.height = Math.max(1,h);
  const g = t.getContext('2d'); g.fillStyle = base; g.fillRect(0,0,64,h);
  for (let y = 0; y < h; y++) for (let x = 0; x < 64; x++) if (Math.random() < density) { g.fillStyle = specks[(Math.random()*specks.length)|0]; g.fillRect(x,y,1,1); }
  return t;
}

// ================= the car sprite (shared everywhere) =================
const PAL = ['#ffd27a','#ff9a4a','#f26b3a','#e8384e','#c94530','#9ed2ee','#e8f7ff','#24325e','#fff0d0','#3a1f3a','#fff6c8','#ff3b5c','#1a1426','#7a2a2a'].map(hex);
function makeCar() {
  const W = 104, H = 37, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const poly = (pts, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(...pts[0]); pts.slice(1).forEach(p => g.lineTo(...p)); g.closePath(); g.fill(); };
  const line = (x1,y1,x2,y2,col,w=1) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke(); };
  const body = [[2,27],[2,18],[9,15],[30,13],[37,5],[63,4],[79,12],[99,16],[102,19],[102,25],[99,29],[2,29]];
  poly(body, '#f26b3a');
  // paint uses the sun's ramp: gold up top, hot pink-red at the sills (dithered after)
  const id0 = g.getImageData(0,0,W,H), d0 = id0.data;
  const ramp = [[4,'#ffd27a'],[13,'#ff9a4a'],[21,'#f26b3a'],[29,'#e8384e']].map(([y,c]) => [y, hex(c)]);
  for (let y = 0; y < H; y++) {
    let i = 0; while (i < ramp.length - 2 && y >= ramp[i+1][0]) i++;
    const t = Math.min(1, Math.max(0, (y - ramp[i][0]) / (ramp[i+1][0] - ramp[i][0])));
    for (let x = 0; x < W; x++) {
      const k = (y*W + x)*4; if (d0[k+3] < 110) continue;
      const q = Math.floor(t*2 + bay(x,y)) / 2;
      const col = q >= 1 ? ramp[i+1][1] : q <= 0 ? ramp[i][1] : (bay(x+1,y) < .5 ? ramp[i][1] : ramp[i+1][1]);
      d0[k]=col[0]; d0[k+1]=col[1]; d0[k+2]=col[2]; d0[k+3]=255;
    }
  }
  g.putImageData(id0, 0, 0);
  poly([[38,7],[61,6],[75,12],[33,13]], '#24325e');
  line(46,7,42,12.5,'#9ed2ee',2); line(59,7,56,12.5,'#9ed2ee',1);
  g.fillStyle = '#ff9a4a'; g.fillRect(52,6,2,7);
  g.fillStyle = '#c94530'; g.fillRect(55,13,1,10);
  g.fillStyle = '#fff0d0'; g.fillRect(6,19,92,1); g.fillRect(6,21,92,1);
  for (let i = 0; i < 3; i++) line(71+i*5,25,74+i*5,19.5,'#3a1f3a',1.6);
  g.fillStyle = '#fff6c8'; g.fillRect(99,18,3,2);
  g.fillStyle = '#ff3b5c'; g.fillRect(2,18,3,3);
  g.fillStyle = '#1a1426';
  for (const wx of [24, 82]) { g.beginPath(); g.arc(wx, 29, 10.5, Math.PI, 0); g.fill(); }
  g.fillStyle = '#7a2a2a'; g.fillRect(2,29,100,1);
  const id = g.getImageData(0,0,W,H), d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i+3] < 110) { d[i+3] = 0; continue; }
    let best = 0, bd = 1e9;
    for (let p = 0; p < PAL.length; p++) { const a = d[i]-PAL[p][0], b = d[i+1]-PAL[p][1], e = d[i+2]-PAL[p][2], dd = a*a+b*b+e*e; if (dd < bd) { bd = dd; best = p; } }
    d[i]=PAL[best][0]; d[i+1]=PAL[best][1]; d[i+2]=PAL[best][2]; d[i+3]=255;
  }
  g.putImageData(id, 0, 0);
  return c;
}
const CAR = makeCar();
function pixelCircle(ctx, cx, cy, r, col) { ctx.fillStyle = col; for (let dy = -r; dy <= r; dy++) { const w = Math.floor(Math.sqrt(r*r + r*.8 - dy*dy)); ctx.fillRect(cx - w, cy + dy, w*2 + 1, 1); } }
function drawWheel(ctx, cx, cy, ang, fast) {
  pixelCircle(ctx, cx, cy, 8, '#18121f');
  if (fast) { pixelCircle(ctx, cx, cy, 5, '#a9aecb'); pixelCircle(ctx, cx, cy, 3, '#c8cde4'); }
  else {
    pixelCircle(ctx, cx, cy, 5, '#c8cde4'); ctx.fillStyle = '#5a5d7a';
    for (let k = 0; k < 5; k++) { const a = ang + k*Math.PI*2/5; for (let rr = 1; rr <= 4; rr++) ctx.fillRect(Math.round(cx + Math.cos(a)*rr), Math.round(cy + Math.sin(a)*rr), 1, 1); }
  }
  ctx.fillStyle = '#e04848'; ctx.fillRect(cx, cy, 1, 1);
}

// ================= scroll "throttle" =================
let lastY = scrollY, vel = 0, throttle = 0;
window.ARS = { throttle: 0, heroSpd: .5 }; // read by the 3D scenes
addEventListener('scroll', () => { const dy = Math.abs(scrollY - lastY); lastY = scrollY; vel = Math.min(80, vel + dy); }, { passive: true });

// ================= HERO SCENE =================
// hero3d.js runs first; if it got WebGL, this 2D scene stays off (a canvas can't hold both contexts)
const HERO3D = !!window.ARS_HERO3D;
const hero = document.getElementById('hero'), hctx = HERO3D ? null : hero.getContext('2d');
let W, H, HZ, SEA, RT, RE, sky, sea, roadTile, shTile, farH = [], nearH = [];
let sparkles = [], streaks = [], puffs = [];
const clouds = [
  { x: .05, y: .1, s: [[0,6,40,4],[6,3,14,3],[10,0,8,3],[22,2,10,4],[30,5,9,2]] },
  { x: .55, y: .2, s: [[0,4,26,3],[5,1,10,3],[16,2,6,2]] },
  { x: .8,  y: .06, s: [[0,3,30,3],[8,0,12,3],[22,1,6,2]] },
  { x: .32, y: .3, s: [[0,3,22,3],[6,0,10,3]] },
];
function heroLayout() {
  if (HERO3D) return;
  const cw = hero.clientWidth || innerWidth, ch = hero.clientHeight || innerHeight;
  W = cw < 700 ? 280 : 480;
  H = Math.max(120, Math.round(W * ch / cw));
  hero.width = W; hero.height = H; hctx.imageSmoothingEnabled = false;
  HZ = Math.round(H * (cw < 700 ? .6 : .58)); SEA = HZ + Math.round(H*.11); RT = SEA + 8; RE = Math.round(H*.95);
  sky = document.createElement('canvas'); sky.width = W; sky.height = HZ;
  const sctx = sky.getContext('2d'), img = sctx.createImageData(W, HZ);
  ditherFill(img, W, 0, HZ, [[0,'#2b1f4e'],[.32,'#56356f'],[.56,'#a2527f'],[.76,'#df7679'],[.9,'#f7a46e'],[1,'#ffd890']], 3, HZ);
  const r = Math.round(Math.min(W*.2, HZ*.42));
  drawSun(img, W, HZ, Math.round(W*(cw < 700 ? .62 : .7)), HZ - Math.round(r*.55), r, HZ);
  sctx.putImageData(img, 0, 0);
  sea = document.createElement('canvas'); sea.width = W; sea.height = SEA - HZ;
  const s2 = sea.getContext('2d'), im2 = s2.createImageData(W, SEA - HZ);
  ditherFill(im2, W, 0, SEA - HZ, [[0,'#c86f88'],[.3,'#904f86'],[.7,'#5b3a78'],[1,'#3a2a60']], 3, SEA - HZ);
  s2.putImageData(im2, 0, 0);
  roadTile = speckTile(RE - RT, '#2a2242', ['#352c52','#211a37','#3d3360'], .07);
  shTile = speckTile(H - RE, '#1d1631', ['#2b2245','#150f25','#3a2d55'], .12);
  farH = []; nearH = [];
  for (let x = 0; x < 640; x++) {
    const a = x/640*Math.PI*2;
    farH.push(Math.max(0, Math.round(2 + 2*Math.sin(a*8) + 3*Math.sin(a*3 + 1) + Math.sin(a*21))));
    const s = Math.sin(a*4 + .4); nearH.push(s > .6 ? Math.round((s - .6)*40) : 0);
  }
  sparkles = Array.from({length: Math.round(W*.3)}, () => ({ x: Math.random()*W, y: HZ + 2 + ((Math.random()*(SEA-HZ-3))|0), l: 2 + (Math.random()*5|0) }));
  streaks = Array.from({length: 16}, () => ({ x: Math.random()*W, y: RT + 3 + ((Math.random()*(RE-RT-5))|0), l: 8 + (Math.random()*20|0), v: .8 + Math.random()*.6 }));
}
heroLayout();
let heroVisible = true;
new IntersectionObserver(e => { heroVisible = e[0].isIntersecting; }).observe(hero);

let roadOff = 0, postOff = 0, farOff = 0, nearOff = 0, wheelA = 0, bobPh = 0, puffT = 0, ht = 0;
function drawHero(dt, spd) {
  ht += dt;
  const g = hctx;
  roadOff = (roadOff + spd*300*dt) % 960; postOff = (postOff + spd*220*dt) % 14;
  farOff = (farOff + spd*5*dt) % 640; nearOff = (nearOff + spd*13*dt) % 640;
  wheelA += spd*dt*40; bobPh += spd*dt*28;
  g.drawImage(sky, 0, 0);
  for (const c of clouds) {
    c.x -= spd*.012*dt; if (c.x < -.2) c.x = 1.05;
    const x0 = Math.round(c.x*W), y0 = Math.round(c.y*HZ);
    for (const [x,y,w,h] of c.s) { g.fillStyle = '#ffe8c4'; g.fillRect(x0+x, y0+y, w, h); g.fillStyle = '#eaa59e'; g.fillRect(x0+x+1, y0+y+h-1, w-1, 1); }
  }
  g.fillStyle = '#7e4a7d';
  for (let x = 0; x < W; x++) { const h = farH[(x + Math.floor(farOff)) % 640]; if (h) g.fillRect(x, HZ-h, 1, h); }
  for (let x = 0; x < W; x++) { const h = nearH[(x + Math.floor(nearOff)) % 640]; if (h > 0) { g.fillStyle = '#4c2c60'; g.fillRect(x, HZ-h, 1, h); g.fillStyle = '#9a5a86'; g.fillRect(x, HZ-h, 1, 1); } }
  g.drawImage(sea, 0, HZ);
  g.fillStyle = '#ffe2a8'; g.fillRect(0, HZ, W, 1);
  for (const s of sparkles) {
    const dp = (s.y - HZ)/(SEA - HZ);
    s.x -= spd*(8 + dp*40)*dt; if (s.x < -8) { s.x = W + Math.random()*20; }
    g.fillStyle = dp < .4 ? '#efa1b2' : dp < .7 ? '#b073aa' : '#7a5498'; g.fillRect(Math.round(s.x), s.y, s.l, 1);
  }
  const scx = Math.round(W*(W < 300 ? .62 : .7));
  for (let y = HZ + 1; y < SEA; y++) {
    const dp = y - HZ, hw = 4 + dp*.7;
    g.fillStyle = dp < 8 ? '#fff0b0' : dp < 20 ? '#ffc674' : '#f08a70';
    for (let x = Math.floor(scx - hw); x <= scx + hw; x++) {
      const n = Math.sin(x*.9 + y*1.7 + ht*3*Math.max(spd,.3)) * Math.sin(y*.55 - ht*2.2*Math.max(spd,.3) + x*.13);
      if (n > .35 && (y % 2 === 0 || n > .75)) g.fillRect(x, y, 1, 1);
    }
  }
  g.fillStyle = '#2e2248'; g.fillRect(0, SEA, W, RT - SEA);
  g.fillStyle = '#d8c6e6'; g.fillRect(0, SEA+1, W, 1); g.fillStyle = '#8f7aa8'; g.fillRect(0, SEA+2, W, 1);
  g.fillStyle = '#b7a2cc'; for (let x = -Math.round(postOff); x < W; x += 14) g.fillRect(x, SEA+1, 2, RT - SEA - 1);
  for (let x = -Math.round(roadOff % 64); x < W; x += 64) g.drawImage(roadTile, x, RT);
  g.fillStyle = '#4a3d6c'; g.fillRect(0, RT, W, 1);
  const dashY = RT + Math.round((RE - RT)*.36);
  g.fillStyle = '#f2e6c8'; for (let x = -Math.round(roadOff % 30); x < W; x += 30) g.fillRect(x, dashY, 16, 2);
  g.fillStyle = '#bfa9d6'; g.fillRect(0, RE - 3, W, 1);
  for (let x = -Math.round((roadOff*1.1) % 64); x < W; x += 64) g.drawImage(shTile, x, RE);
  const sk = Math.max(0, (spd - .5)/1.2);
  g.fillStyle = '#fff2dc';
  streaks.forEach((s, i) => { s.x -= spd*520*s.v*dt; if (s.x + s.l < 0) { s.x = W + Math.random()*80; s.y = RT + 3 + ((Math.random()*(RE-RT-5))|0); } if (i/streaks.length < sk) g.fillRect(Math.round(s.x), s.y, s.l, 1); });
  const carX = Math.round(W*(W < 300 ? .12 : .1)), ground = RT + Math.round((RE - RT)*.8), carY = ground - 35;
  puffT -= dt;
  if (puffT <= 0) { puffs.push({ x: carX + 1, y: carY + 26, life: 0, max: .4 + Math.random()*.3 }); puffT = .06/Math.max(spd, .2); }
  for (let i = puffs.length - 1; i >= 0; i--) {
    const p = puffs[i]; p.life += dt*Math.max(spd,.15)*1.4; p.x -= spd*110*dt + dt*6; p.y -= dt*6*Math.max(spd,.2);
    if (p.life > p.max) { puffs.splice(i,1); continue; }
    const f = p.life/p.max; g.fillStyle = f < .4 ? '#e7d2ea' : '#9b84b0';
    if (f < .75 || ((Math.round(p.x)+Math.round(p.y)) & 1)) g.fillRect(Math.round(p.x), Math.round(p.y), f < .5 ? 3 : 2, f < .5 ? 3 : 2);
  }
  g.fillStyle = '#160f26'; g.fillRect(carX + 4, carY + 35, 96, 2); g.fillRect(carX + 10, carY + 37, 84, 1);
  const bob = Math.sin(bobPh) > .55 ? -1 : 0;
  g.drawImage(CAR, carX, carY + bob);
  drawWheel(g, carX + 24, carY + 28, wheelA, spd > .9);
  drawWheel(g, carX + 82, carY + 28, wheelA, spd > .9);
  if (spd > .6) { g.fillStyle = '#fff6c8'; g.fillRect(carX + 103, carY + 18 + bob, 2 + (Math.random() < .5 ? 1 : 0), 1); }
}

// ================= page sky (one long dithered gradient, sunset → night → dawn) =================
const main = document.getElementById('main');
function paintMainSky() {
  const w = Math.ceil(main.clientWidth/4), h = Math.ceil(main.scrollHeight/4);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), img = g.createImageData(w, h);
  ditherFill(img, w, 0, h, [[0,'#1d1631'],[.12,'#2b1f4e'],[.35,'#1a1230'],[.62,'#120c1f'],[.76,'#241a44'],[.86,'#2b1f4e'],[.93,'#56356f'],[1,'#904f86']], 3, h);
  g.putImageData(img, 0, 0);
  main.style.backgroundImage = `url(${c.toDataURL()})`;
  main.style.imageRendering = 'pixelated';
  // stars over the night stretch
  const st = document.getElementById('stars'); st.innerHTML = '';
  const H2 = main.scrollHeight, n = Math.round(main.clientWidth * H2 * .7 / 26000);
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i');
    s.style.left = (Math.random()*100) + '%'; s.style.top = (Math.random()*H2*.78) + 'px';
    s.style.animationDelay = (-Math.random()*2.4) + 's';
    if (Math.random() < .25) { s.style.background = '#ffd890'; }
    if (Math.random() < .12) { s.style.width = s.style.height = '8px'; }
    st.appendChild(s);
  }
}

// ================= sunrise at the arrival =================
const sunrise = document.getElementById('sunrise'), srx = sunrise.getContext('2d');
let srBase = null;
function paintSunrise() {
  const w = Math.max(60, Math.ceil(sunrise.clientWidth/5)), h = Math.max(40, Math.ceil(sunrise.clientHeight/5));
  sunrise.width = w; sunrise.height = h;
  const img = srx.createImageData(w, h);
  const hz = Math.round(h*.62);
  // transparent sky; sun only, then the sea below the horizon
  const sr = Math.round(Math.min(w*.14, h*.5)); drawSun(img, w, h, Math.round(w*.72), hz - Math.round(sr*.45), sr, hz);
  ditherFill(img, w, hz, h, [[hz/h,'#c86f88'],[(hz/h + 1)/2,'#904f86'],[1,'#5b3a78']], 3, h);
  srBase = img;
  srx.putImageData(img, 0, 0);
}
let srT = 0;
function drawSunrise(dt) {
  if (!srBase) return;
  srT += dt; srx.putImageData(srBase, 0, 0);
  const w = sunrise.width, h = sunrise.height, hz = Math.round(h*.62), cx = Math.round(w*.72);
  srx.fillStyle = '#ffe2a8'; srx.fillRect(0, hz, w, 1);
  for (let y = hz + 1; y < h; y++) {
    const dp = y - hz, hw = 3 + dp*.8; srx.fillStyle = dp < 5 ? '#fff0b0' : dp < 12 ? '#ffc674' : '#f08a70';
    for (let x = Math.floor(cx - hw); x <= cx + hw; x++) { const n = Math.sin(x*.9 + y*1.7 + srT*2)*Math.sin(y*.55 - srT*1.6 + x*.13); if (n > .4 && (y % 2 === 0 || n > .8)) srx.fillRect(x, y, 1, 1); }
  }
}

// ================= avatar (pixel driver in helmet) — 2D fallback when avatar3d.js has no WebGL =================
if (!window.ARS_AVATAR3D) {
  const c = document.getElementById('avatar'), g = c.getContext('2d'), img = g.createImageData(44, 52);
  ditherFill(img, 44, 0, 52, [[0,'#56356f'],[.5,'#a2527f'],[.8,'#df7679'],[1,'#f7a46e']], 3, 52);
  drawSun(img, 44, 52, 33, 30, 9, 52);
  g.putImageData(img, 0, 0);
  const P = (x,y,w,h,col) => { g.fillStyle = col; g.fillRect(x,y,w,h); };
  // shoulders / jacket
  P(6,40,32,12,'#1d1631'); P(8,38,28,4,'#1d1631'); P(19,40,6,12,'#f26b3a'); P(20,42,4,10,'#ffd27a');
  // neck
  P(18,33,8,6,'#b06a5a');
  // helmet ramp like the sun
  const hel = ['#ffd27a','#ff9a4a','#f26b3a','#e8384e'];
  for (let y = 8; y < 32; y++) { const t = (y - 8)/24; for (let x = 10; x < 34; x++) { const dx = x - 22, dy = y - 21; if (dx*dx/150 + dy*dy/185 > 1) continue; g.fillStyle = hel[Math.min(3, Math.floor(t*4 + bay(x,y) - .5 < 0 ? 0 : t*4 + bay(x,y) - .5))]; g.fillRect(x,y,1,1); } }
  P(13,17,20,7,'#24325e'); P(15,18,6,2,'#9ed2ee'); P(23,19,4,1,'#9ed2ee');
  P(21,9,2,22,'#fff0d0');
  P(10,25,2,4,'#1a1426');
}

// ================= engine =================
const block = document.getElementById('block'), crank = document.getElementById('crank');
const specs = [...document.querySelectorAll('.spec')], foEls = [...document.querySelectorAll('.fo span[data-c]')];
const cyls = [];
const NAMES = ['AI', 'STACK', 'DESIGN', 'INFRA'];
for (let i = 0; i < 4; i++) {
  const c = document.createElement('div'); c.className = 'cyl'; c.title = NAMES[i];
  c.innerHTML = `<span class="no">${i+1}</span><canvas class="boom" width="24" height="16"></canvas><i class="valve" style="left:28%"></i><i class="valve" style="right:28%"></i><div class="rod"></div><div class="pis"></div>`;
  c.addEventListener('click', () => select(i));
  block.appendChild(c);
  cyls.push({ el: c, pis: c.querySelector('.pis'), rod: c.querySelector('.rod'), boom: c.querySelector('.boom'), v: c.querySelectorAll('.valve') });
}
for (let i = 0; i < 4; i++) { const k = document.createElement('i'); k.style.left = (12.5 + i*25) + '%'; crank.appendChild(k); }
const crankBits = [...crank.children];
// paint the combustion flash with the sun's ramp
cyls.forEach(cy => {
  const g = cy.boom.getContext('2d'), img = g.createImageData(24, 16);
  ditherFill(img, 24, 0, 16, [[0,'#fff3b0'],[.4,'#ffc062'],[.75,'#ff7a5c'],[1,'#e8384e']], 3, 16);
  g.putImageData(img, 0, 0);
});
let sel = 0;
function select(i) { sel = i; window.ARS.sel = i; cyls.forEach((c,k) => c.el.classList.toggle('sel', k === i)); specs.forEach((s,k) => s.classList.toggle('sel', k === i)); }
select(0);
window.ARS.selectCyl = select; // engine3d.js labels call this
let engAng = 0, revBoost = 0;
document.getElementById('rev').addEventListener('click', () => { revBoost = 1.6; });
const OFFS = [0, 540, 180, 360]; // firing order 1-3-4-2: cylinder i fires at crank deg OFFS[i]
function drawEngine(dt) {
  revBoost = Math.max(0, revBoost - dt*.8);
  const rpmFactor = .35 + throttle*.6 + revBoost;
  engAng = (engAng + dt*360*rpmFactor) % 720;
  cyls.forEach((c, i) => {
    const a = ((engAng - OFFS[i]) % 720 + 720) % 720;  // 0 = TDC on power stroke
    const ph = Math.cos(a/180*Math.PI);               // 1 at TDC, -1 at BDC
    const h = c.el.clientHeight, travel = h*.42, top = 26 + (1 - ph)/2*travel;
    c.pis.style.top = Math.round(top/4)*4 + 'px';
    c.rod.style.top = Math.round((top + 30)/4)*4 + 'px';
    const firing = a < 70;
    c.boom.style.opacity = firing ? (1 - a/70) > .5 ? 1 : .55 : 0;
    c.boom.style.height = Math.max(8, top) + 'px';
    const intake = a >= 360 && a < 540, exhaust = a >= 180 && a < 360;
    c.v[0].style.top = intake ? '6px' : '0px'; c.v[1].style.top = exhaust ? '6px' : '0px';
    if (firing) foEls.forEach(f => f.classList.toggle('on', +f.dataset.c === i));
  });
  crankBits.forEach((b, i) => { const a = (engAng - OFFS[i])/180*Math.PI; b.style.transform = `translateY(${Math.round(Math.cos(a)*6/2)*2}px)`; });
  window.ARS.engAng = engAng; window.ARS.revBoost = revBoost; // engine3d.js poses its crank from this
}

// ================= billboards =================
const ICONS = {
  nodes: ['##........##','##........##','..#......#..','...#....#...','....####....','....####....','...#....#...','..#......#..','##........##','##........##'],
  eye:   ['....####....','..##....##..','.#..####..#.','#..##++##..#','#..##++##..#','.#..####..#.','..##....##..','....####....'],
  shield:['.##########.','.#++++++++#.','.#+######+#.','.#+######+#.','.#+######+#.','..#+####+#..','...#+##+#...','....#++#....','.....##.....'],
  bolt:  ['.....####...','....####....','...####.....','..#######...','.......###..','......###...','.....###....','....##......','...#........'],
  lock:  ['...######...','..##....##..','..#......#..','..#......#..','.##########.','.####++####.','.####++####.','.#####+####.','.##########.'],
  twin:  ['.####..####.','#++++##++++#','#+##+##+##+#','#++++##++++#','.####..####.','..#......#..','..########..'],
  bag:   ['....####....','...#....#...','.##########.','.#++++++++#.','.#+######+#.','.#+######+#.','.#+######+#.','.##########.'],
  flag:  ['.#..........','.#######....','.#++#++#....','.#######....','.#++#++#....','.#######....','.#..........','.#..........','.#..........'],
  truck: ['............','#######.....','#+++++#.....','#+++++####..','#+++++#++##.','#+++++#++++#','############','.##.....##..','.##.....##..'],
  stack: ['....####....','..##++++##..','....####....','..##....##..','..##++++##..','....####....','..##....##..','..##++++##..','....####....'],
};
const PROJECTS = window.ARS_DATA.projects;
const boards = document.getElementById('boards');
const posters = [];
PROJECTS.forEach((p, idx) => {
  const el = document.createElement('article'); el.className = 'bb reveal';
  const link = p.link ? `<a class="bb-link" href="${p.link.href}" target="_blank" rel="noopener">${p.link.label} ▶</a>` : '';
  el.innerHTML = `<span class="km">${p.km}</span><div class="face"><div class="lights"><i></i><i></i><i></i></div><canvas width="96" height="54"></canvas><div class="txt"><button type="button" class="where" title="Fly to this lot in the 3D tour">📍 ${p.city}, ${p.cc}</button><span class="tagline">${p.t}</span><h3>${p.n}</h3><p>${p.d}</p><div class="chips">${p.s.map(s => `<span class="chip">${s}</span>`).join('')}</div>${link}</div></div><div class="posts"><i></i><i></i></div>`;
  el.querySelector('.where').addEventListener('click', () => window.ARS_TOUR && window.ARS_TOUR.select(idx));
  boards.appendChild(el);
  const cv = el.querySelector('canvas'), g = cv.getContext('2d'), img = g.createImageData(96, 54);
  ditherFill(img, 96, 0, 54, p.bb, 3, 54);
  drawSun(img, 96, 54, 70, 40, 15, 44);
  ditherFill(img, 96, 44, 54, [[44/54,'#3a2a60'],[1,'#1d1631']], 2, 54);
  g.putImageData(img, 0, 0);
  posters.push({ g, base: img, icon: ICONS[p.i], ph: idx*.7, el, lm: p.lm });
});
function drawPosters(t) {
  for (const p of posters) {
    if (!p.vis) continue;
    p.g.putImageData(p.base, 0, 0);
    const sc = 3, ic = p.icon, w = ic[0].length*sc, x0 = 14, y0 = Math.round(8 + Math.sin(t*2 + p.ph)*2);
    for (let y = 0; y < ic.length; y++) for (let x = 0; x < ic[y].length; x++) {
      const ch = ic[y][x]; if (ch === '.') continue;
      p.g.fillStyle = '#0d0918'; p.g.fillRect(x0 + x*sc + 1, y0 + y*sc + 1, sc, sc);
    }
    for (let y = 0; y < ic.length; y++) for (let x = 0; x < ic[y].length; x++) {
      const ch = ic[y][x]; if (ch === '.') continue;
      p.g.fillStyle = ch === '+' ? '#ffd84a' : '#fff0d0'; p.g.fillRect(x0 + x*sc, y0 + y*sc, sc, sc);
    }
    // each city gets its own little scene along the bottom of its billboard
    (SCENES[p.lm] || SCENES.nyc)(p.g, t + p.ph, (x, y, w, h, c) => { p.g.fillStyle = c; p.g.fillRect(Math.round(x), Math.round(y), w, h); });
  }
}
// tiny pixel vignettes, drawn into the 96x54 billboard canvas; ground line is y≈44-54
const lap = (t, speed, span = 140, off = 30) => ((t*speed) % span + span) % span - off; // x that loops across
const SCENES = {
  tokyo(g, t, R) { // sakura petals drifting + a bullet train streaking past
    for (let i = 0; i < 9; i++) { const x = (i*13 + t*9) % 96, y = (i*7 + t*12) % 44; R(x, y, 2, 1, i % 2 ? '#ffb7d0' : '#ffe4ee'); }
    const x = lap(t, 70, 220, 90);
    R(x, 45, 34, 4, '#fff0d0'); R(x + 34, 46, 4, 3, '#fff0d0'); R(x + 36, 47, 3, 2, '#9ed2ee'); R(x, 47, 34, 1, '#5aa8ff');
    for (let k = 0; k < 6; k++) R(x + 3 + k*5, 46, 3, 1, '#24325e');
  },
  ghats(g, t, R) { // D2C delivery truck climbing a hill road
    const x = lap(t, 18);
    R(x, 43, 12, 6, '#fff0d0'); R(x + 12, 45, 5, 4, '#2f9e5a'); R(x + 13, 46, 3, 2, '#9ed2ee');
    R(x + 2, 44, 3, 2, '#f26b3a'); R(x + 6, 44, 3, 2, '#f26b3a');
    R(x + 1, 49, 3, 2, '#1a1426'); R(x + 12, 49, 3, 2, '#1a1426');
  },
  singapore(g, t, R) { // a ferry crossing the bay + a chain of blocks floating up
    R(0, 47, 96, 1, '#5aa8ff');
    const x = lap(t, 12);
    R(x, 45, 14, 3, '#fff0d0'); R(x + 3, 42, 7, 3, '#d2d6ee'); R(x + 5, 40, 2, 2, '#e8384e');
    for (let k = 0; k < 3; k++) { const y = 30 - ((t*6 + k*9) % 26); R(66 + k*8, y, 5, 5, '#57e36f'); R(71 + k*8, y + 2, 3, 1, '#d2d6ee'); }
  },
  monaco(g, t, R) { // yacht bobbing + a gull
    R(0, 47, 96, 1, '#9ed2ee');
    const x = lap(t, 8), b = Math.round(Math.sin(t*2));
    R(x, 44 + b, 16, 3, '#ffffff'); R(x + 3, 41 + b, 8, 3, '#d2d6ee'); R(x + 4, 42 + b, 6, 1, '#24325e');
    const gx = lap(t, 15, 140, 20), gy = 16 + Math.round(Math.sin(t*3)*2), f = Math.sin(t*10) > 0;
    R(gx, gy, 2, 1, '#fff0d0'); R(gx + 2, gy + (f ? -1 : 1), 2, 1, '#fff0d0'); R(gx - 2, gy + (f ? -1 : 1), 2, 1, '#fff0d0');
  },
  paris(g, t, R) { // hot-air balloon drifting up and across
    const x = 55 + Math.sin(t*.5)*14, y = 10 + Math.sin(t*.7)*4;
    R(x, y, 10, 8, '#e8384e'); R(x + 1, y - 2, 8, 2, '#e8384e'); R(x + 3, y, 2, 8, '#ffd84a'); R(x + 1, y + 8, 8, 1, '#ff8a5a'); R(x + 2, y + 9, 6, 1, '#ff8a5a');
    R(x + 3, y + 10, 1, 2, '#3a1f3a'); R(x + 6, y + 10, 1, 2, '#3a1f3a'); R(x + 3, y + 12, 4, 3, '#8a5a4a');
  },
  nyc(g, t, R) { // yellow cab + steam from a manhole
    const x = lap(t, 32);
    R(x, 46, 12, 3, '#ffd84a'); R(x + 3, 44, 6, 2, '#ffd84a'); R(x + 4, 44, 4, 1, '#24325e'); R(x + 5, 43, 2, 1, '#fff0d0');
    R(x + 1, 49, 2, 2, '#1a1426'); R(x + 9, 49, 2, 2, '#1a1426'); R(x + 12, 46, 1, 1, '#fff6c8');
    for (let k = 0; k < 3; k++) { const s = (t*8 + k*5) % 15; R(80 + Math.sin(t*2 + k)*2, 48 - s, 3, 2, s < 9 ? '#d2d6ee' : '#9a90b8'); }
  },
  dubai(g, t, R) { // a camel plodding across the dunes
    const x = lap(t, 7), step = Math.floor(t*4) % 2;
    R(x + 2, 40, 10, 4, '#c8a070'); R(x + 4, 38, 3, 2, '#c8a070'); R(x + 8, 39, 2, 1, '#c8a070');
    R(x + 11, 37, 2, 4, '#c8a070'); R(x + 12, 35, 3, 2, '#c8a070');
    R(x + 3, 44, 1, 5 - step, '#8a5a4a'); R(x + 5, 44, 1, 4 + step, '#8a5a4a'); R(x + 9, 44, 1, 5 - step, '#8a5a4a'); R(x + 11, 44, 1, 4 + step, '#8a5a4a');
  },
  london(g, t, R) { // red double-decker + drizzle
    for (let i = 0; i < 12; i++) R((i*17 + t*6) % 96, (i*11 + t*40) % 44, 1, 2, '#9ed2ee');
    const x = lap(t, 20);
    R(x, 37, 18, 11, '#e8384e'); R(x + 1, 38, 16, 2, '#fff0d0'); R(x + 1, 43, 16, 2, '#fff0d0');
    for (let k = 0; k < 4; k++) { R(x + 2 + k*4, 38, 2, 2, '#24325e'); R(x + 2 + k*4, 43, 2, 2, '#24325e'); }
    R(x + 2, 48, 3, 2, '#1a1426'); R(x + 13, 48, 3, 2, '#1a1426');
  },
  bangalore(g, t, R) { // auto-rickshaw zipping by with a beep
    const x = lap(t, 26), bob = Math.round(Math.sin(t*14)*.6);
    R(x, 42 + bob, 11, 6, '#ffd84a'); R(x + 1, 40 + bob, 9, 2, '#2f9e5a'); R(x + 7, 43 + bob, 3, 3, '#24325e');
    R(x + 1, 48, 2, 2, '#1a1426'); R(x + 8, 48, 2, 2, '#1a1426'); R(x + 11, 46 + bob, 1, 1, '#fff6c8');
    if (Math.sin(t*1.3) > .85) { R(x + 14, 37, 2, 1, '#fff0d0'); R(x + 17, 36, 2, 1, '#fff0d0'); }
  },
  mumbai(g, t, R) { // a Mumbai local rattling across
    const x = lap(t, 40, 240, 120);
    for (let c = 0; c < 4; c++) {
      const cx = x + c*24; R(cx, 41, 22, 7, '#e8384e'); R(cx, 44, 22, 1, '#ffd84a');
      for (let k = 0; k < 4; k++) R(cx + 2 + k*5, 42, 3, 2, '#24325e');
      R(cx + 3, 48, 2, 2, '#1a1426'); R(cx + 17, 48, 2, 2, '#1a1426');
    }
    R(0, 50, 96, 1, '#6a6f95');
  },
};
const pio = new IntersectionObserver(es => es.forEach(e => { const p = posters.find(q => q.el === e.target); if (p) p.vis = e.isIntersecting; }));
posters.forEach(p => pio.observe(p.el));

// ================= small sprites: header mini car, route car =================
{
  const m = document.getElementById('mini').getContext('2d');
  m.drawImage(CAR, 0, 0, 104, 37, 0, 0, 22, 8);
  const r = document.getElementById('routeCar'), g = r.getContext('2d');
  // top-down car
  const P = (x,y,w,h,c) => { g.fillStyle = c; g.fillRect(x,y,w,h); };
  P(0,4,2,4,'#1a1426'); P(9,4,2,4,'#1a1426'); P(0,15,2,4,'#1a1426'); P(9,15,2,4,'#1a1426');
  P(1,1,9,21,'#e8384e'); P(1,1,9,14,'#f26b3a'); P(2,1,7,6,'#ffd27a');
  P(2,7,7,4,'#24325e'); P(2,16,7,3,'#24325e'); P(5,1,1,21,'#fff0d0');
  P(1,0,2,1,'#fff6c8'); P(8,0,2,1,'#fff6c8'); P(1,21,2,1,'#ff3b5c'); P(8,21,2,1,'#ff3b5c');
}

// ================= speedometer (fixed) =================
const sctx = document.getElementById('speedo').getContext('2d');
function speedo(frac) {
  const g = sctx; g.clearRect(0,0,48,48);
  const cx = 24, cy = 24, r = 22;
  pixelCircle(g, cx, cy, r, '#8fd3ff'); pixelCircle(g, cx, cy, r-1, '#0f0a1e');
  g.fillStyle = '#0f0a1e'; for (let a = 0; a < Math.PI*2; a += .36) g.fillRect(Math.round(cx + Math.cos(a)*r), Math.round(cy + Math.sin(a)*r), 1, 1);
  const a0 = Math.PI*.75, sw = Math.PI*1.5;
  for (let i = 0; i <= 12; i++) { const a = a0 + sw*i/12; g.fillStyle = i >= 10 ? '#ff4d4d' : '#57e36f'; g.fillRect(Math.round(cx + Math.cos(a)*18), Math.round(cy + Math.sin(a)*18), 1, 1); }
  const na = a0 + sw*frac; g.fillStyle = '#fff';
  for (let k = 0; k <= 14; k++) g.fillRect(Math.round(cx + Math.cos(na)*k), Math.round(cy + Math.sin(na)*k), 1, 1);
  pixelCircle(g, cx, cy, 1, '#fff');
}

// ================= HUD bits =================
const barsEl = document.getElementById('bars');
for (let i = 0; i < 15; i++) { const b = document.createElement('i'); if (i >= 13) b.className = 'r'; barsEl.appendChild(b); }
const barEls = [...barsEl.children];
const rpmEl = document.getElementById('rpm'), kmhEl = document.getElementById('kmh');
const odoEls = [0,1,2,3].map(i => document.getElementById('o'+i));
const odom = [...document.querySelectorAll('#odom span')];
const mini = document.getElementById('mini'), strip = mini.parentElement;
const gearLinks = [...document.querySelectorAll('#gears a')];
const stops = [...document.querySelectorAll('[data-gear]')];
const routeWrap = document.getElementById('routeWrap'), routeCar = document.getElementById('routeCar');
const litEl = document.getElementById('lit'), ideEl = document.getElementById('ide');
let fuel = 0, ideas = 0, pumpOn = false;
new IntersectionObserver(e => { pumpOn = e[0].isIntersecting; }, { threshold: .3 }).observe(document.querySelector('.pump'));

// reveal on scroll
const rio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { threshold: .15 });
document.querySelectorAll('.reveal').forEach(el => rio.observe(el));
// garage doors roll up as you pass on touch screens
if (matchMedia('(hover: none)').matches) {
  const gio = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('open', e.isIntersecting)), { threshold: .7 });
  document.querySelectorAll('.bay').forEach(b => gio.observe(b));
}

function updateHud() {
  const max = document.documentElement.scrollHeight - innerHeight, prog = max > 0 ? scrollY/max : 0;
  mini.style.left = Math.round(prog*(strip.clientWidth - 44)) + 'px';
  const km = String(Math.round(prog*720)).padStart(4, '0');
  odoEls.forEach((e,i) => e.textContent = km[i]);
  let g = 0; stops.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight*.45) g = i; });
  gearLinks.forEach((a, i) => a.classList.toggle('on', i === g));
  // route odometer + car driving the winding road
  const r = routeWrap.getBoundingClientRect();
  const rp = Math.min(1, Math.max(0, (innerHeight*.55 - r.top) / r.height));
  const rk = String(Math.round(rp*600)).padStart(4,'0'); odom.forEach((e,i) => e.textContent = rk[i]);
  if (road.len) {
    const L = rp*road.len, a = road.path.getPointAtLength(L), b = road.path.getPointAtLength(Math.min(road.len, L + 3));
    const ang = Math.atan2(b.y - a.y, b.x - a.x) + Math.PI/2;
    routeCar.style.transform = `translate(${Math.round(a.x - 15)}px, ${Math.round(a.y - 30)}px) rotate(${ang.toFixed(3)}rad)`;
    road.cps.forEach(cp => { const hit = L >= cp.at; if (hit !== cp.hit) { cp.hit = hit; cp.leg.classList.toggle('hit', hit); cp.flag.classList.toggle('hit', hit); } });
  }
}

// ================= route log: a winding road through every milestone =================
const SVGNS = 'http://www.w3.org/2000/svg';
const road = { len: 0, cps: [] };
const roadSvg = document.createElementNS(SVGNS, 'svg'); roadSvg.classList.add('road-svg'); roadSvg.setAttribute('aria-hidden', 'true');
routeWrap.prepend(roadSvg);
function el(tag, attrs, parent) { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent && parent.appendChild(e); return e; }
function buildRoad() {
  const W = routeWrap.clientWidth, H = routeWrap.clientHeight; if (!W || !H) return;
  const narrow = innerWidth <= 720, cx = narrow ? 42 : W/2, sw = narrow ? 10 : 30;
  roadSvg.setAttribute('viewBox', `0 0 ${W} ${H}`); roadSvg.setAttribute('width', W); roadSvg.setAttribute('height', H);
  roadSvg.innerHTML = '';
  const legs = [...routeWrap.querySelectorAll('.leg')];
  const pts = [[cx, 0]];
  const marks = legs.map(l => { const side = (l.offsetLeft + l.offsetWidth/2) > W/2 ? 1 : -1; const y = l.offsetTop + 26; pts.push([cx + (narrow ? 1 : side)*sw, y]); return { l, side, y }; });
  pts.push([cx, H]);
  // Catmull-Rom → cubic Bézier for a smooth S-curve through every checkpoint
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${p1[0] + (p2[0] - p0[0])/6},${p1[1] + (p2[1] - p0[1])/6} ${p2[0] - (p3[0] - p1[0])/6},${p2[1] - (p3[1] - p1[1])/6} ${p2[0]},${p2[1]}`;
  }
  // scenery first so the road draws over it
  if (!narrow) marks.forEach((m, i) => {
    const next = marks[i + 1]; if (!next) return;
    const y = (m.y + next.y)/2, x = cx - m.side*92 + (i % 2 ? 14 : -10);
    const t = el('g', { class: 'rd-tree', transform: `translate(${x},${y})` }, roadSvg);
    el('rect', { x: -3, y: 6, width: 6, height: 14, fill: '#4a2e2a' }, t);
    el('rect', { x: -14, y: -14, width: 28, height: 22, fill: i % 3 ? '#2f9e5a' : '#ff8ab0' }, t);
    el('rect', { x: -8, y: -22, width: 16, height: 10, fill: i % 3 ? '#57e36f' : '#ffb7d0' }, t);
  });
  el('path', { d, class: 'rd-edge' }, roadSvg);
  el('path', { d, class: 'rd-asphalt' }, roadSvg);
  road.path = el('path', { d, class: 'rd-dash' }, roadSvg);
  road.len = road.path.getTotalLength();
  // checkpoints: a chequered flag where the road meets each card
  road.cps = marks.map(m => {
    // find path length nearest this checkpoint's y (path is monotonic in y)
    let lo = 0, hi = road.len;
    for (let k = 0; k < 24; k++) { const mid = (lo + hi)/2; if (road.path.getPointAtLength(mid).y < m.y) lo = mid; else hi = mid; }
    const p = road.path.getPointAtLength(lo), fx = p.x + (narrow ? 22 : m.side*24);
    const f = el('g', { class: 'rd-flag', transform: `translate(${fx},${m.y - 18})` }, roadSvg);
    el('rect', { x: 0, y: 0, width: 3, height: 26, fill: '#fff0d0' }, f);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) el('rect', { x: 3 + c*4, y: r*4, width: 4, height: 4, class: (r + c) % 2 ? 'ck-a' : 'ck-b' }, f);
    return { at: lo, leg: m.l, flag: f, hit: false };
  });
  updateHud();
}
addEventListener('resize', () => setTimeout(buildRoad, 200));
addEventListener('load', buildRoad);
document.fonts && document.fonts.ready.then(buildRoad);
buildRoad();

// ================= main loop =================
let last = performance.now(), heroSpd = .5, needle = 0;
function loop(now) {
  const dt = Math.min(.05, (now - last)/1000); last = now;
  vel *= Math.pow(.02, dt);                      // decay scroll impulse
  throttle += (Math.min(1, vel/40) - throttle) * Math.min(1, dt*4);
  const target = reduced ? .3 : .45 + throttle*1.4;
  heroSpd += (target - heroSpd) * Math.min(1, dt*2.5);
  window.ARS.throttle = throttle; window.ARS.heroSpd = heroSpd;
  if (heroVisible && !HERO3D) drawHero(dt, heroSpd);
  drawEngine(dt);
  drawPosters(now/1000);
  if (!window.ARS_BUNK3D) drawSunrise(dt);
  const kmh = Math.round(40 + throttle*200 + revBoost*40);
  needle += (Math.min(1, kmh/260) - needle)*Math.min(1, dt*6);
  speedo(needle); kmhEl.textContent = kmh;
  const rpm = Math.round((1800 + throttle*4600 + revBoost*1500 + (Math.random()-.5)*60)/10)*10;
  rpmEl.textContent = rpm.toLocaleString('en-US'); window.ARS.rpm = rpm;
  const lit = Math.round(rpm/7000*15); barEls.forEach((b,i) => b.classList.toggle('on', i < lit));
  if (pumpOn) { fuel = Math.min(99.99, fuel + dt*7.3); ideas = Math.min(999, ideas + dt*31); litEl.textContent = fuel.toFixed(2).padStart(5,'0'); ideEl.textContent = String(Math.floor(ideas)).padStart(3,'0'); }
  updateHud();
  requestAnimationFrame(loop);
}

function layoutAll() { heroLayout(); paintMainSky(); paintSunrise(); }
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layoutAll, 150); });
paintMainSky(); paintSunrise();
document.fonts && document.fonts.ready.then(() => { paintMainSky(); });
requestAnimationFrame(loop);
})();

// ================= pixel social icons (12x12, drawn as crisp SVG rects) =================
(() => {
  const ICON = {
    gh: ['.#........#.','.##......##.','.##########.','############','###..##..###','###..##..###','############','.##########.','..########..','...######...','...##..##...','...##..##...'],
    li: ['############','#..#########','#..#########','############','#..#..#...##','#..#.......#','#..#...##..#','#..#..###..#','#..#..###..#','#..#..###..#','#..#..###..#','############'],
    x: Array.from({ length: 12 }, (_, y) => Array.from({ length: 12 }, (_, x) => (Math.abs(x - y) <= 1 || x + y === 11) ? '#' : '.').join('')),
  };
  document.querySelectorAll('.soc i[data-ic]').forEach(i => {
    const rows = ICON[i.dataset.ic]; if (!rows) return;
    let r = '';
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') r += `<rect x="${x}" y="${y}" width="1" height="1"/>`; }));
    i.innerHTML = `<svg viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
  });
})();
