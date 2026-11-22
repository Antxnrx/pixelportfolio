// PIT STOPS world tour: one lot per project, each in a different city with a landmark and a parked supercar.
// The camera glides between lots; sky and fog blend between city presets as it travels.
(() => {
const K = window.ARS3D, DATA = window.ARS_DATA;
const tour = document.getElementById('tour');
if (!tour || !DATA) return;
if (!K || !K.webglOK()) { tour.classList.add('no3d'); return; }
const cv = document.getElementById('tourGl'), stage = document.getElementById('tourStage');
let px;
try { px = K.pixelRenderer(cv); } catch (e) { tour.classList.add('no3d'); return; }

const { std, basic } = K;
const PROJ = DATA.projects, N = PROJ.length, SP = 46;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xee9a80, 40, 150);
const camera = new THREE.PerspectiveCamera(40, 16/9, .1, 2000);

const SKIES = {
  sakura:   { top:'#56356f', mid:'#ff8ab0', bot:'#ffe4ee', fog:'#c86f88', sunA:'#ff5c6a', sunB:'#fff0d0' },
  neon:     { top:'#120c1f', mid:'#6c3f88', bot:'#ff5c6a', fog:'#4a2b62', sunA:'#ff5c6a', sunB:'#ffd27a' },
  morning:  { top:'#24325e', mid:'#9ed2ee', bot:'#fff0a8', fog:'#9ed2ee', sunA:'#ffa064', sunB:'#fff0d0' },
  night:    { top:'#120c1f', mid:'#24325e', bot:'#5aa8ff', fog:'#24325e', sunA:'#d2d6ee', sunB:'#ffffff' },
  dusk:     { top:'#2b1f4e', mid:'#a2527f', bot:'#ff8a5a', fog:'#a2527f', sunA:'#ff5c6a', sunB:'#fff0a8' },
  rose:     { top:'#56356f', mid:'#df7679', bot:'#ffd890', fog:'#df7679', sunA:'#ff5c6a', sunB:'#fff0a8' },
  sunset:   { top:'#2b1f4e', mid:'#df7679', bot:'#ffd890', fog:'#ee9a80', sunA:'#ff5c6a', sunB:'#fff0a8' },
  golden:   { top:'#904f86', mid:'#f7a46e', bot:'#fff0a8', fog:'#f7a46e', sunA:'#ff8a5a', sunB:'#ffffff' },
  overcast: { top:'#3a2a60', mid:'#6a6f95', bot:'#c86f88', fog:'#6a6f95', sunA:'#df7679', sunB:'#ffd890' },
  dawn:     { top:'#24325e', mid:'#c86f88', bot:'#ffd890', fog:'#c86f88', sunA:'#ff8a5a', sunB:'#fff0a8' },
};
const skyCols = PROJ.map(p => { const s = SKIES[p.sky] || SKIES.sunset; const o = {}; for (const k in s) o[k] = new THREE.Color(s[k]); return o; });
const sky = K.sky({ sunDir: new THREE.Vector3(-.25, .09, -1) });
scene.add(sky);
const hemi = new THREE.HemisphereLight(0xe08aa8, 0x2c2050, .9); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffc090, 1.2); sun.position.set(-30, 40, 60); scene.add(sun);

// ---------- world: a long road with lots on its far side ----------
const roadTex = K.speckTexture('#2c2345', ['#3a3058','#211a37','#433868'], .09); roadTex.repeat.set(N*SP/8, 1);
const L = N*SP + 200, X0 = (N - 1)*SP/2;
const road = new THREE.Mesh(new THREE.PlaneGeometry(L, 6), std(0xffffff, { map: roadTex, roughness: .9 }));
road.rotation.x = -Math.PI/2; road.position.set(X0, .01, 10); scene.add(road);
const gTex = K.speckTexture('#1d1631', ['#2b2245','#150f25','#3a2d55'], .12); gTex.repeat.set(L/8, 40);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(L, 320), std(0xffffff, { map: gTex, roughness: 1 }));
ground.rotation.x = -Math.PI/2; ground.position.set(X0, 0, -40); scene.add(ground);
for (let x = -100; x < N*SP + 100; x += 8) { const d = new THREE.Mesh(new THREE.BoxGeometry(3.4, .02, .16), basic(0xf4e8c8)); d.position.set(x, .02, 10); scene.add(d); }
for (const z of [7.1, 12.9]) { const m = new THREE.Mesh(new THREE.BoxGeometry(L, .02, .14), basic(0xcdb8e6)); m.position.set(X0, .02, z); scene.add(m); }

// ---------- helpers ----------
const M = {}; const mat = c => M[c] || (M[c] = std(c));
function box(g, w, h, d, c, x, y, z, m) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m || mat(c)); o.position.set(x, y + h/2, z); g.add(o); return o; }
function cyl(g, rt, rb, h, seg, c, x, y, z, m) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m || mat(c)); o.position.set(x, y + h/2, z); g.add(o); return o; }
function cone(g, r, h, seg, c, x, y, z) { const o = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat(c)); o.position.set(x, y + h/2, z); g.add(o); return o; }
const winTex = [K.windowTexture(), K.windowTexture('#24325e', ['#9ed2ee','#fff0d0','#5aa8ff']), K.windowTexture('#2b1f4e', ['#ff5c6a','#d9a8ff','#ffd890'])];
winTex.forEach(t => t.repeat.set(2, 4));
const winMat = winTex.map(t => std(0xffffff, { map: t, roughness: .8, emissive: 0x221a33, emissiveMap: t, emissiveIntensity: .9 }));
function skyline(g, n, x0, x1, hMin, hMax, mi = 0, z0 = -16, z1 = -28) {
  for (let i = 0; i < n; i++) {
    const w = 2.5 + Math.random()*3.5, h = hMin + Math.random()*(hMax - hMin);
    box(g, w, h, 2.5 + Math.random()*3, 0, x0 + (x1 - x0)*(i + Math.random()*.6)/n, 0, z0 + (z1 - z0)*Math.random(), winMat[mi]);
  }
}
// named supertalls: [x, z, width, height, windowStyle] → stepped crown + antenna
function towers(g, list) {
  for (const [x, z, w, h, mi] of list) {
    box(g, w, h, w, 0, x, 0, z, winMat[mi]);
    box(g, w*.7, h*.08, w*.7, 0, x, h, z, winMat[mi]);
    box(g, w*.4, h*.05, w*.4, '#d2d6ee', x, h*1.08, z);
    cyl(g, .04, .12, h*.15, 4, '#d2d6ee', x, h*1.13, z);
    box(g, .3, .3, .3, 0, x, h*1.28, z, basic('#ff3b5c')); // aircraft beacon
  }
}
function water(g, c = '#6c3f88', z = -22, d = 30) {
  const w = new THREE.Mesh(new THREE.PlaneGeometry(SP, d), std(c, { roughness: .2, metalness: .3 }));
  w.rotation.x = -Math.PI/2; w.position.set(0, .03, z); g.add(w);
}
function tree(g, x, z, s = 1, c = '#2f9e5a') { box(g, .25*s, 1*s, .25*s, '#3a1f3a', x, 0, z); cone(g, .9*s, 2.4*s, 6, c, x, .8*s, z); }
// cherry tree: crooked trunk + clusters of pink blossom
const BLOSSOM = ['#ffe4ee', '#ffb7d0', '#ff8ab0'];
function sakura(g, x, z, s = 1) {
  const t = box(g, .35*s, 2.2*s, .35*s, '#3a1f3a', x, 0, z); t.rotation.z = .12;
  for (const [dx, a] of [[-.6, .7], [.6, -.7]]) { const b = box(g, .18*s, 1.4*s, .18*s, '#3a1f3a', x + dx*s*.6, 1.8*s, z); b.rotation.z = a; }
  for (let k = 0; k < 7; k++) {
    const r = (.7 + Math.random()*.6)*s;
    const o = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat(BLOSSOM[k % 3]));
    o.position.set(x + (Math.random() - .5)*2.8*s, (2.6 + Math.random()*1.4)*s, z + (Math.random() - .5)*2.2*s);
    o.rotation.set(Math.random()*3, Math.random()*3, 0); g.add(o);
  }
  // fallen petals under the canopy
  for (let k = 0; k < 10; k++) box(g, .25, .02, .25, BLOSSOM[k % 3], x + (Math.random() - .5)*4*s, .13, z + (Math.random() - .5)*3*s, basic(BLOSSOM[k % 3]));
}
// drifting petals; updated every frame while the lot exists
const updaters = [];
function petals(g, n, x0, x1, z0, z1, top) {
  const geo = new THREE.PlaneGeometry(.18, .18), ps = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(geo, basic(BLOSSOM[i % 3], { side: THREE.DoubleSide }));
    m.position.set(x0 + Math.random()*(x1 - x0), Math.random()*top, z0 + Math.random()*(z1 - z0));
    m.userData = { v: .6 + Math.random()*.6, ph: Math.random()*6 };
    g.add(m); ps.push(m);
  }
  updaters.push((dt, t) => ps.forEach(m => {
    const u = m.userData;
    m.position.y -= u.v*dt; m.position.x += Math.sin(t*1.3 + u.ph)*dt*.8 + dt*.4;
    m.rotation.x += dt*2; m.rotation.y += dt*1.5;
    if (m.position.y < .15) { m.position.y = top; m.position.x = x0 + Math.random()*(x1 - x0); }
  }));
}
function palm(g, x, z) { box(g, .2, 3.6, .2, '#8a5a4a', x, 0, z); for (let k = 0; k < 5; k++) { const f = box(g, 1.8, .08, .35, '#2f9e5a', x, 3.5, z); f.rotation.y = k*1.25; f.rotation.z = .3; } }

// ---------- landmarks (low-poly nods, built around the lot origin) ----------
const LM = {
  tokyo(g) {
    const cols = ['#ff5c6a', '#fff0d0'];
    let y = 0; [[3.6,2.6,4],[2.6,1.8,4],[1.8,1.2,4],[1.2,.8,3],[.8,.5,3]].forEach(([rb, rt, h], k) => {
      const o = cyl(g, rt, rb, h, 4, cols[k % 2], 6, y, -8); o.rotation.y = Math.PI/4; y += h;
      if (k === 1 || k === 3) box(g, rt*2.4, .7, rt*2.4, '#fff0d0', 6, y - .35, -8);
    });
    cyl(g, .05, .3, 6, 4, '#ff5c6a', 6, y, -8);
    // torii
    for (const x of [-9, -5]) cyl(g, .22, .26, 4, 8, '#e8384e', x, 0, -2);
    box(g, 6.2, .35, .6, '#16121f', -7, 4, -2); box(g, 5, .3, .4, '#e8384e', -7, 3.2, -2);
    skyline(g, 9, -20, 20, 5, 13, 2);
    for (let i = 0; i < 6; i++) box(g, .3, 2 + Math.random()*2, 1.2, 0, -16 + i*6.4, 3 + Math.random()*5, -14, basic(['#ff5c6a','#5aa8ff','#d9a8ff'][i % 3]));
    // sakura: an avenue behind the lot, a pair framing the torii, one beside the tower
    for (const [x, z, s] of [[-16, -5, 1.1], [-11.5, -4, 1], [-2.5, -4.5, 1.2], [1.5, -6, .9], [11, -5, 1.1], [15, -3.5, 1], [-17, 1, .9], [17, 1.5, .9]]) sakura(g, x, z, s);
    petals(g, 70, -18, 18, -7, 7, 7);
  },
  ghats(g) {
    [['#2f9e5a',18,10,-6,-30],['#1d5a3a',22,14,10,-36],['#2f9e5a',14,8,24,-26],['#1d5a3a',16,9,-22,-24]].forEach(([c, r, h, x, z]) => cone(g, r, h, 7, c, x, 0, z));
    for (let i = 0; i < 16; i++) tree(g, -18 + Math.random()*36, -6 - Math.random()*10, .8 + Math.random()*.6, Math.random() < .5 ? '#2f9e5a' : '#1d5a3a');
    // micro-hub
    box(g, 6, 2.6, 4, '#fff0d0', 6, 0, -5); const roof = cone(g, 4.4, 1.6, 4, '#f26b3a', 6, 2.6, -5); roof.rotation.y = Math.PI/4; roof.scale.z = .7;
    box(g, 1.4, 1.8, .1, '#24325e', 6, 0, -2.95); box(g, 2.4, .5, .1, '#57e36f', 6, 2, -2.9, basic('#57e36f'));
    box(g, 1, 1, 1, '#f7a46e', 2.4, 0, -3.6); box(g, .8, .8, .8, '#f7a46e', 2.6, 1, -3.6);
  },
  singapore(g) {
    water(g, '#24325e', -24, 26);
    for (const x of [1, 5, 9]) { const t = box(g, 1.8, 13, 2.6, 0, x, 0, -9, winMat[1]); t.rotation.z = (x - 5)*.004; }
    box(g, 12.5, .6, 3.2, '#d2d6ee', 5, 13, -9); box(g, 2, .4, 3, '#d2d6ee', 11.8, 13.1, -9);
    for (const [x, h] of [[-8, 5], [-12, 6.5], [-5, 4]]) { cyl(g, .4, .6, h, 6, '#6c3f88', x, 0, -8); cone(g, 1.8, 1.4, 8, '#d9a8ff', x, h, -8).rotation.x = Math.PI; }
    skyline(g, 7, -24, 24, 6, 14, 1, -30, -38);
  },
  monaco(g) {
    water(g, '#5aa8ff', -16, 22);
    cone(g, 22, 12, 7, '#4a2b62', -6, 0, -40); cone(g, 16, 9, 7, '#56356f', 14, 0, -36);
    for (let i = 0; i < 12; i++) box(g, 1.6, 1.2 + Math.random()*2, 1.4, Math.random() < .5 ? '#fff0d0' : '#f7a46e', -16 + i*2.8, Math.random()*3, -26 - Math.random()*4);
    // yachts
    for (const [x, z, s] of [[-4, -12, 1], [7, -16, .8]]) { box(g, 6*s, .9*s, 1.8*s, '#ffffff', x, .05, z); box(g, 3*s, .8*s, 1.4*s, '#d2d6ee', x - .4*s, .95*s, z); box(g, 1.6*s, .6*s, 1*s, '#24325e', x - .4*s, 1.75*s, z); }
    // casino
    box(g, 7, 3.4, 3, '#fff0d0', 8, 0, -4.5); cyl(g, 1.2, 1.4, .8, 8, '#2f9e5a', 8, 3.4, -4.5); cone(g, 1.2, 1, 8, '#2f9e5a', 8, 4.2, -4.5);
    for (const x of [5.5, 10.5]) cyl(g, .4, .4, 1, 6, '#2f9e5a', x, 3.4, -4.5);
    palm(g, -9, -4); palm(g, 3, -2.5);
  },
  paris(g) {
    const bronze = '#8a5a6a';
    const leg = cyl(g, 1.3, 4, 6.5, 4, bronze, 6, 0, -9); leg.rotation.y = Math.PI/4; leg.material = std(bronze, { side: THREE.DoubleSide });
    box(g, 3.6, .5, 3.6, '#56356f', 6, 6.5, -9);
    const mid = cyl(g, .55, 1.3, 7, 4, bronze, 6, 7, -9); mid.rotation.y = Math.PI/4;
    box(g, 1.7, .4, 1.7, '#56356f', 6, 14, -9);
    cyl(g, .06, .55, 8, 4, bronze, 6, 14.4, -9).rotation.y = Math.PI/4;
    // haussmann blocks
    for (let i = 0; i < 7; i++) { const x = -22 + i*6.6, h = 4 + Math.random()*1.5; if (Math.abs(x - 6) < 5) continue;
      box(g, 5.6, h, 4, 0, x, 0, -18, winMat[0]); const r = cone(g, 3.6, 1.5, 4, '#24325e', x, h, -18); r.rotation.y = Math.PI/4; r.scale.z = .75; }
    for (const x of [-9, -3]) tree(g, x, -4, .8, '#2f9e5a');
  },
  nyc(g) {
    let y = 0; [[6,12,6],[4.4,5,4.4],[3,4,3],[1.6,2.5,1.6]].forEach(([w, h, d]) => { box(g, w, h, d, 0, 6, y, -10, winMat[0]); y += h; });
    cyl(g, .05, .3, 4, 4, '#d2d6ee', 6, y, -10);
    skyline(g, 12, -24, 24, 6, 18, 0, -16, -30);
    box(g, 1.4, 1.1, 2.6, '#ffd84a', -10, 0, -3); box(g, 1.2, .8, 1.6, '#ffd84a', -10, 1.1, -3.3); // a yellow cab
  },
  dubai(g) {
    let y = 0; [[2.4,6],[2,6],[1.6,5],[1.2,5],[.85,4],[.55,4],[.35,3]].forEach(([r, h]) => { cyl(g, r*.85, r, h, 6, '#d2d6ee', 6, y, -10, std('#d2d6ee', { metalness: .6, roughness: .25 })); y += h; });
    cyl(g, .02, .2, 7, 4, '#ffffff', 6, y, -10);
    skyline(g, 8, -24, 24, 6, 14, 1, -18, -30);
    // dunes + palms
    for (const [x, r] of [[-14, 9], [18, 11]]) { const d = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 4, 0, Math.PI*2, 0, Math.PI/2), mat('#f7a46e')); d.scale.y = .25; d.position.set(x, 0, -14); g.add(d); }
    palm(g, -8, -3); palm(g, -11, -5);
  },
  london(g) {
    const sand = '#c8a070';
    box(g, 2.6, 13, 2.6, sand, 6, 0, -9); box(g, 3.2, 3, 3.2, sand, 6, 13, -9);
    for (const [dx, dz, ry] of [[0, 1.62, 0], [1.62, 0, Math.PI/2]]) { const f = new THREE.Mesh(new THREE.CircleGeometry(1.1, 12), basic(0xfff0d0)); f.position.set(6 + dx, 14.5, -9 + dz); f.rotation.y = ry; g.add(f); }
    const r = cone(g, 2.3, 4, 4, '#24325e', 6, 16, -9); r.rotation.y = Math.PI/4;
    cyl(g, .03, .15, 2, 4, '#ffd84a', 6, 20, -9);
    box(g, 16, 5, 4, 0, -6, 0, -13, winMat[0]); for (let i = 0; i < 6; i++) cone(g, .5, 1.6, 4, sand, -13 + i*2.8, 5, -11);
    box(g, .9, 2.2, .9, '#e8384e', -9, 0, -2.5); box(g, .5, .5, .05, '#ffd890', -9, 1.2, -2.03); // phone box
    box(g, 6, 1.6, 2, '#e8384e', -15, 0, 3); box(g, 6, 1.4, 2, '#e8384e', -15, 1.7, 3); // double-decker
    box(g, 6.05, .5, 2.05, 0, -15, 2.2, 3, winMat[0]);
  },
  bangalore(g) {
    const stone = '#e6d0b0';
    box(g, 18, 4.5, 5, stone, 4, 0, -11); box(g, 8, 6, 5.4, stone, 4, 0, -10.8);
    for (let i = 0; i < 6; i++) cyl(g, .25, .25, 4, 6, '#fff0d0', 1 + i*1.2, 0, -7.9);
    box(g, 8, .6, 1.4, stone, 4, 4, -7.9);
    cyl(g, 2, 2.2, 1.4, 10, stone, 4, 6, -11);
    const d = new THREE.Mesh(new THREE.SphereGeometry(2, 10, 6, 0, Math.PI*2, 0, Math.PI/2), mat('#c8a070')); d.position.set(4, 7.4, -11); g.add(d);
    cyl(g, .05, .2, 1.4, 4, '#ffd84a', 4, 9.4, -11);
    for (let i = 0; i < 10; i++) tree(g, -20 + i*4.4, -3 - Math.random()*2, .7 + Math.random()*.5, '#2f9e5a');
    // tech-park skyline: glass towers behind the dome, tallest pair flanking it
    skyline(g, 10, -28, 28, 10, 22, 1, -22, -34);
    towers(g, [[-8, -18, 2.6, 26, 1], [16, -20, 3, 30, 1], [-16, -24, 2.4, 20, 0], [22, -26, 2.2, 24, 2]]);
  },
  mumbai(g) {
    water(g, '#6c3f88', -24, 24);
    const st = '#e6c090';
    for (const x of [3, 9]) box(g, 2.2, 7, 2.6, st, x, 0, -9);
    box(g, 8.4, 2.6, 2.8, st, 6, 7, -9);
    for (const x of [2.4, 9.6]) for (const z of [-10, -8]) { cyl(g, .45, .45, 1.6, 8, st, x, 9.6, z); cone(g, .5, .7, 8, st, x, 11.2, z); }
    box(g, 3.6, 2.2, 2.7, '#2b1f4e', 6, 4.8, -9.1);
    box(g, 22, 4.5, 4, 0, -10, 0, -14, winMat[0]); const dm = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 5, 0, Math.PI*2, 0, Math.PI/2), mat('#c94530')); dm.position.set(-10, 4.5, -14); g.add(dm);
    for (const [x, z] of [[-4, -20], [12, -26]]) { box(g, 2.2, .5, .8, '#f7a46e', x, .05, z); box(g, .08, 2, .08, '#fff0d0', x, .5, z); }
    // the Mumbai skyline across the bay: dense supertalls
    skyline(g, 8, -30, 30, 12, 26, 0, -36, -44);
    towers(g, [[-14, -34, 3, 40, 1], [-9, -38, 2.6, 34, 0], [18, -34, 3.2, 44, 1], [24, -40, 2.4, 30, 2], [4, -42, 2.8, 36, 0]]);
  },
};

// ---------- signs ----------
const signs = [];
function signTex(p, i) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 56;
  const t = K.nearest(new THREE.CanvasTexture(c));
  const draw = () => {
    const g = c.getContext('2d');
    g.fillStyle = '#0d0918'; g.fillRect(0, 0, 128, 56);
    g.fillStyle = '#fff0d0'; g.fillRect(0, 0, 128, 3); g.fillRect(0, 53, 128, 3); g.fillRect(0, 0, 3, 56); g.fillRect(125, 0, 3, 56);
    g.fillStyle = '#ffd84a'; g.fillRect(3, 3, 122, 14);
    g.fillStyle = '#0d0918'; g.font = '700 10px Silkscreen, monospace'; g.textBaseline = 'top';
    g.fillText(`LOT ${String(i + 1).padStart(2, '0')} · ${p.cc}`, 7, 5);
    g.fillStyle = '#fff0d0'; g.font = '700 13px Silkscreen, monospace';
    g.fillText(p.city, 7, 21, 114);
    g.fillStyle = '#8fd3ff'; g.font = '400 10px Silkscreen, monospace';
    g.fillText(p.n, 7, 39, 114);
    t.needsUpdate = true;
  };
  draw(); signs.push(draw);
  return t;
}

// ---------- build lots ----------
const lots = [];
PROJ.forEach((p, i) => {
  const g = new THREE.Group(); g.position.x = i*SP; scene.add(g);
  const pad = new THREE.Mesh(new THREE.BoxGeometry(SP - 6, .12, 14), std('#2b2245', { roughness: 1 })); pad.position.set(0, .06, 0); g.add(pad);
  for (let k = -3; k <= 3; k++) box(g, .12, .02, 4, '#fff0d0', -8 + k*3, .12, 3.6, basic('#fff0d0')); // bay lines
  (LM[p.lm] || LM.nyc)(g);
  const C = K.buildCar(p.car);
  C.car.position.set(-3, .12, 3.4); C.car.rotation.y = -.45; C.car.scale.setScalar(1.6); g.add(C.car);
  // the sign
  // sign sits front-right so the desktop info card never covers it
  const SX = 12;
  for (const x of [SX - 1.6, SX + 1.6]) box(g, .22, 2.6, .22, '#3a3050', x, 0, 5.2);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.27), new THREE.MeshBasicMaterial({ map: signTex(p, i) }));
  s.position.set(SX, 3.6, 5.32); s.rotation.y = -.25; g.add(s);
  const sb = box(g, 5.4, 2.47, .16, '#16121f', SX, 2.47, 5.2); sb.rotation.y = -.25;
  // lamp posts
  for (const x of [-18, 16]) { box(g, .16, 5, .16, '#3b2f5a', x, 0, 6.6); box(g, .5, .16, .36, '#ffe6a8', x, 5, 6.6, basic('#ffe6a8')); }
  dress(g, p, i);
  lots.push({ g, car: C });
});

// ---------- per-lot detail: foreground street, mid-ground clutter, far mountains, life ----------
function dress(g, p, i) {
  const sky = SKIES[p.sky] || SKIES.sunset, accent = p.car.c[1];
  // far layer: a mountain range fading into the fog
  for (let k = 0; k < 4; k++) {
    const r = 18 + ((i*7 + k*11) % 14), h = 10 + ((i*5 + k*13) % 12);
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), mat(sky.top)); m.position.set(-24 + k*16, h/2 - .2, -78 - (k % 2)*10); g.add(m);
  }
  // mid layer: hedge + planters along the back of the lot, a food stall, parked scooters
  box(g, 34, .8, .9, '#1d5a3a', -2, .12, -6.6);
  for (let k = 0; k < 6; k++) {
    const x = -16 + k*6.4; box(g, 1.2, .5, 1.2, '#6a6f95', x, .12, -5.6);
    for (let f = 0; f < 3; f++) box(g, .3, .3, .3, 0, x - .3 + f*.3, .62, -5.6, basic(['#ff8ab0', '#ffd84a', '#fff0d0'][(k + f) % 3]));
  }
  // food stall in the city's accent colour, striped awning
  box(g, 3, 1.8, 1.8, '#fff0d0', -14, .12, -2.4);
  for (let s = 0; s < 5; s++) { const a = box(g, .62, .14, 2.2, s % 2 ? accent : '#fff0d0', -15.24 + s*.62, 2.2, -2.2); a.rotation.x = .25; }
  box(g, 3.2, .1, .5, '#8a5a4a', -14, 1.1, -1.4);
  for (const x of [-11.4, -10.6]) { // scooters
    box(g, .25, .5, 1.4, accent, x, .3, 1.8); box(g, .08, .7, .08, '#16121f', x, .8, 2.4);
    for (const z of [1.3, 2.3]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .12, 8).rotateZ(Math.PI/2), mat('#16121f')); w.position.set(x, .34, z); g.add(w); }
  }
  // traffic light at the lot entrance (cycles)
  box(g, .16, 4, .16, '#3b2f5a', 8.4, 0, 6.8);
  box(g, .5, 1.4, .4, '#16121f', 8.4, 3.6, 6.8);
  const tl = ['#ff3b5c', '#ffd84a', '#57e36f'].map((c, k) => box(g, .3, .3, .05, 0, 8.4, 4.6 - k*.42, 7.02, new THREE.MeshBasicMaterial({ color: c })));
  updaters.push((dt, t) => { const ph = Math.floor((t + i*1.7) % 9 / 3); tl.forEach((m, k) => m.material.color.set(k === ph ? ['#ff3b5c', '#ffd84a', '#57e36f'][k] : '#2b1f4e')); });
  // foreground: far-side sidewalk with kerb, street trees, bus stop, bench, hydrant, bollards
  box(g, SP, .25, 3, '#56487a', 0, 0, 14.6);
  box(g, SP, .3, .2, '#d2d6ee', 0, 0, 13.1);
  for (const x of [-16, 15]) {
    box(g, .3, 2.2, .3, '#4a2e2a', x, .25, 15.2);
    const crown = new THREE.Group(); crown.position.set(x, 2.6, 15.2); g.add(crown);
    for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.8 + (k % 2)*.3, 0), mat(p.lm === 'tokyo' ? BLOSSOM[k % 3] : ['#2f9e5a', '#1d5a3a', '#57e36f'][k % 3])); b.position.set((k - 1.5)*.55, (k % 2)*.5, (k % 3 - 1)*.4); crown.add(b); }
    const ph = Math.random()*6; updaters.push((dt, t) => { crown.rotation.z = Math.sin(t*1.2 + ph)*.05; crown.rotation.x = Math.sin(t*.8 + ph)*.03; });
  }
  // bus stop: roof, back glass, lit ad panel in the city's colour
  box(g, 4.4, .14, 1.6, '#d2d6ee', -5, 2.6, 15.4);
  box(g, 4.2, 2.4, .06, 0, -5, .25, 16.1, new THREE.MeshStandardMaterial({ color: 0x9ed2ee, transparent: true, opacity: .35 }));
  box(g, 1.3, 1.8, .1, 0, -6.6, .5, 16.05, basic(accent));
  for (const x of [-7.1, -2.9]) box(g, .1, 2.6, .1, '#6a6f95', x, 0, 15.4);
  box(g, 2.4, .12, .5, '#8a5a4a', -4.6, .7, 15.8);
  const hy = new THREE.Mesh(new THREE.CylinderGeometry(.16, .2, .7, 8), mat('#e8384e')); hy.position.set(4, .6, 13.8); g.add(hy);
  for (let k = 0; k < 5; k++) box(g, .16, .7, .16, '#fff0d0', 6 + k*1.4, .25, 13.5);
  // pedestrians strolling the sidewalk (legs swing, they turn at the ends)
  for (let k = 0; k < 3; k++) {
    const ped = new THREE.Group(); g.add(ped);
    const coat = mat(['#e8384e', '#5aa8ff', '#ffd84a', '#d9a8ff', '#2f9e5a'][(i + k) % 5]);
    const body = new THREE.Mesh(new THREE.BoxGeometry(.4, .7, .26), coat); body.position.y = 1.15; ped.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.15, 8, 6), mat(['#ffe8d6', '#d29a80', '#ecb89c'][k % 3])); head.position.y = 1.68; ped.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(.155, 8, 4, 0, Math.PI*2, 0, Math.PI*.45), mat('#2a1a1e')); hair.position.y = 1.7; ped.add(hair);
    const legs = [-.1, .1].map(dx => { const l = new THREE.Mesh(new THREE.BoxGeometry(.14, .62, .14), mat('#24325e')); l.geometry.translate(0, -.31, 0); l.position.set(dx, .8, 0); ped.add(l); return l; });
    const span = 10 + k*3, x0 = -12 + k*5, speed = .9 + k*.25, ph = k*2.1;
    ped.position.set(x0, .25, 14.2 + k*.6);
    updaters.push((dt, t) => {
      const u = (t*speed/span + ph) % 2, fwd = u < 1;
      ped.position.x = x0 + (fwd ? u : 2 - u)*span;
      ped.rotation.y = fwd ? Math.PI/2 : -Math.PI/2;
      const sw = Math.sin(t*speed*7)*.5; legs[0].rotation.x = sw; legs[1].rotation.x = -sw;
      body.position.y = 1.15 + Math.abs(Math.sin(t*speed*7))*.03;
    });
  }
}
document.fonts && document.fonts.load('700 13px Silkscreen').then(() => signs.forEach(d => d())).catch(() => {});

// visitor: the hero cruiser drives along the road between lots
const V = K.buildCar({ p: 'gt', c: ['#ffd27a', '#ff7a3c', '#e8384e'] });
V.car.position.set(0, 0, 9.2); scene.add(V.car);

// traffic in the far lane, looping the whole road
const ROAD_X0 = -60, ROAD_L = N*SP + 120;
const traffic = [['wedge', ['#bfe6ff','#5aa8ff','#2e4fb8']], ['muscle', ['#fff0d0','#d2d6ee','#6a6f95']], ['hyper', ['#ff8a9a','#ff3b5c','#8a2a2a']], ['gt', ['#9ff07a','#2f9e5a','#1d5a3a']], ['roadster', ['#fff6c8','#ffd84a','#f7a46e']], ['wedge', ['#d9a8ff','#904f86','#4a2b62']]]
  .map(([pr, c], k) => { const T = K.buildCar({ p: pr, c }); T.car.rotation.y = Math.PI; T.car.position.z = 11.8; T.car.userData = { s: k/6*ROAD_L, v: 9 + (k % 3)*3 }; scene.add(T.car); return T; });
updaters.push(dt => traffic.forEach(T => {
  const u = T.car.userData; u.s = (u.s + u.v*dt) % ROAD_L;
  T.car.position.x = ROAD_X0 + ROAD_L - u.s;
  T.wheels.forEach(w => w.spin.rotation.z -= u.v*dt/.36);
}));
// two warm street-lamp lights that travel with the camera (cheaper than one per lamp)
const lampL = [-18, 16].map(dx => { const l = new THREE.PointLight(0xffd8a0, 1.2, 18); l.position.set(0, 4.6, 6.6); l.userData.dx = dx; scene.add(l); return l; });

// ---------- DOM: departures board + card ----------
const citiesEl = document.getElementById('cities'), card = document.getElementById('tourCard'), idxEl = document.getElementById('tIdx');
const tabs = PROJ.map((p, i) => {
  const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab');
  b.innerHTML = `<b>${p.code}</b><span>${p.city}</span>`;
  b.addEventListener('click', () => select(i));
  citiesEl.appendChild(b); return b;
});
let cur = -1, tx = 0, camX = 0;
function select(i) {
  i = (i + N) % N; if (i === cur) return; cur = i; tx = i*SP;
  const p = PROJ[i];
  tabs.forEach((t, k) => { t.classList.toggle('on', k === i); t.setAttribute('aria-selected', k === i); });
  // centre the tab inside the strip only — scrollIntoView would also scroll the page (and did, on load via select(0))
  const tr = tabs[i].getBoundingClientRect(), cr = citiesEl.getBoundingClientRect();
  citiesEl.scrollTo({ left: citiesEl.scrollLeft + tr.left - cr.left - (cr.width - tr.width)/2, behavior: 'smooth' });
  idxEl.textContent = `${String(i + 1).padStart(2, '0')}/${String(N).padStart(2, '0')}`;
  card.innerHTML = `<span class="loc">📍 ${p.city}, ${p.cc} · LOT ${String(i + 1).padStart(2, '0')}</span>
    <span class="tagline">${p.t}</span><h3>${p.n}</h3><p>${p.d}</p>
    <div>${p.s.map(s => `<span class="chip">${s}</span>`).join('')}</div>
    ${p.link ? `<a class="cta sm" href="${p.link.href}" target="_blank" rel="noopener">${p.link.label} ▶</a>` : ''}`;
  card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
}
document.getElementById('tPrev').addEventListener('click', () => select(cur - 1));
document.getElementById('tNext').addEventListener('click', () => select(cur + 1));
stage.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') { e.preventDefault(); select(cur + 1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); select(cur - 1); }
});
select(0); camX = tx;
window.ARS_TOUR = { select: i => { select(i); tour.scrollIntoView({ behavior: 'smooth', block: 'center' }); } };

// drag: mouse orbits; a horizontal touch swipe changes city (vertical stays page scroll)
let az = .12, el = .2, down = null, lastInteract = -99, clock = 0;
cv.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: e.pointerType }; if (e.pointerType === 'mouse') { cv.setPointerCapture(e.pointerId); stage.classList.add('drag'); } });
cv.addEventListener('pointermove', e => {
  if (!down || down.t !== 'mouse') return;
  az -= (e.clientX - down.x)*.006; el = Math.min(.7, Math.max(.06, el + (e.clientY - down.y)*.004));
  down.x = e.clientX; down.y = e.clientY; lastInteract = clock;
});
const end = e => {
  if (down && down.t !== 'mouse') { const dx = e.clientX - down.sx, dy = e.clientY - down.sy; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)*1.3) select(cur + (dx < 0 ? 1 : -1)); }
  down = null; stage.classList.remove('drag');
};
cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', () => { down = null; stage.classList.remove('drag'); });

let wide = true;
function resize() {
  const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
  wide = w >= 760;
  px.setSize(w, h, wide ? 960 : 480); // internal render width; higher = finer pixels
  camera.aspect = w/h; camera.fov = wide ? 40 : 55; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();
let visible = false;
new IntersectionObserver(e => { visible = e[0].isIntersecting; if (visible) resize(); }).observe(stage);

const look = new THREE.Vector3(), cA = new THREE.Color(), tmp = new THREE.Color();
let last = performance.now(), vx = 0, wheelA = 0;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last)/1000); last = now;
  if (!visible) return;
  clock += dt;
  const prev = camX;
  camX += (tx - camX)*Math.min(1, dt*(reduced ? 10 : 1.8));
  vx = (camX - prev)/Math.max(dt, 1e-4);
  // blend sky presets by position along the road
  const f = Math.min(N - 1, Math.max(0, camX/SP)), a = Math.floor(f), b = Math.min(N - 1, a + 1), t = f - a;
  const U = sky.userData.u;
  for (const k of ['top','mid','bot','fog','sunA','sunB']) {
    cA.copy(skyCols[a][k]).lerp(skyCols[b][k], t);
    const key = { top:'cTop', mid:'cMid', bot:'cBot', fog:'fogCol', sunA:'sunA', sunB:'sunB' }[k];
    U[key].value.copy(cA);
    if (k === 'fog') { scene.fog.color.copy(cA); hemi.color.copy(tmp.copy(cA).lerp(new THREE.Color(0xffffff), .3)); }
  }
  if (!reduced) updaters.forEach(u => u(dt, clock));
  const near = Math.round(camX/SP)*SP; lampL.forEach(l => l.position.x = near + l.userData.dx);
  // visitor car leads the camera along the road
  V.car.position.x = camX + 13 + Math.max(-8, Math.min(8, vx*.08));
  V.car.rotation.y = vx < -.5 ? Math.PI : 0;
  wheelA += Math.abs(vx)*dt/.36;
  V.wheels.forEach(w => w.spin.rotation.z = -wheelA*(vx < 0 ? -1 : 1));
  V.body.position.y = .11 + (Math.abs(vx) > .5 ? Math.sin(clock*30)*.012 : 0);
  // camera
  const idle = clock - lastInteract > 3;
  const A = az + (idle && !reduced ? .18*Math.sin(clock*.2) : 0), E = el + (idle && !reduced ? .03*Math.sin(clock*.13) : 0);
  // wide: aim left of the lot so it lands in the right ~60% beside the card
  const R = wide ? 44 : 46, travel = Math.min(1, Math.abs(tx - camX)/SP);
  look.set(camX - (wide ? 9 : 0), 5 + travel*2, -3);
  camera.position.set(look.x + Math.sin(A)*Math.cos(E)*R, look.y + Math.sin(E)*R + travel*6, look.z + Math.cos(A)*Math.cos(E)*R);
  camera.lookAt(look);
  sky.position.copy(camera.position);
  px.render(scene, camera);
}
requestAnimationFrame(frame);
})();
