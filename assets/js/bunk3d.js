// Footer: a big seaside petrol bunk at evening, city skyline + swaying trees behind,
// a Supra parked at the pump and its driver leaning on it. Fixed view.
// Sets window.ARS_BUNK3D so main.js stops drawing the 2D sunrise.
(() => {
const K = window.ARS3D, cv = document.getElementById('bunk');
if (!K || !cv || !K.webglOK()) return;
let px;
try { px = K.pixelRenderer(cv); } catch (e) { return; }
window.ARS_BUNK3D = true;
document.getElementById('main').classList.add('has-bunk');

const { std, basic } = K;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x904f86, 45, 190);
const camera = new THREE.PerspectiveCamera(34, 2.4, .1, 2000);
// evening: sun almost set, sky going violet
const sky = K.sky({ top: '#2b1f4e', mid: '#904f86', bot: '#ff8a5a', fog: '#904f86', sunA: '#ff5c6a', sunB: '#ffa064', sunDir: new THREE.Vector3(-.22, .025, -1), sunR: .13 });
scene.add(sky);
scene.add(new THREE.HemisphereLight(0xc8a0d0, 0x2b1f4e, .6));
const sun = new THREE.DirectionalLight(0xff8a5a, .7); sun.position.set(-20, 6, -40); scene.add(sun);
const front = new THREE.DirectionalLight(0xd0b8f0, .45); front.position.set(10, 14, 20); scene.add(front);
for (const x of [-7, 7]) { const l = new THREE.PointLight(0xfff0c8, 1.4, 16); l.position.set(x, 5.6, 0); scene.add(l); }

const M = {}, mat = c => M[c] || (M[c] = std(c));
const box = (w, h, d, c, x, y, z, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m || mat(c)); o.position.set(x, y + h/2, z); scene.add(o); return o; };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- ground, road, sea, hills ----------
const gTex = K.speckTexture('#3d3360', ['#4a3d6c','#2f2848','#56487a'], .1); gTex.repeat.set(24, 16);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 80), std(0xffffff, { map: gTex, roughness: 1 }));
ground.rotation.x = -Math.PI/2; ground.position.set(0, 0, -14); scene.add(ground);
const rTex = K.speckTexture('#2c2345', ['#3a3058','#211a37','#433868'], .09); rTex.repeat.set(30, 1);
const road = new THREE.Mesh(new THREE.PlaneGeometry(200, 7), std(0xffffff, { map: rTex, roughness: .9 }));
road.rotation.x = -Math.PI/2; road.position.set(0, .01, 11); scene.add(road);
for (let x = -80; x < 80; x += 6) box(2.6, .02, .14, 0, x, .02, 11, basic('#f4e8c8'));
const sea = new THREE.Mesh(new THREE.PlaneGeometry(1400, 600), std('#56356f', { roughness: .25, metalness: .3 }));
sea.rotation.x = -Math.PI/2; sea.position.set(0, -.05, -360); scene.add(sea);
for (const [x, z, r, h] of [[-90, -150, 34, 16], [80, -170, 44, 22], [-20, -200, 30, 12]]) { const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), mat('#4a2b62')); c.position.set(x, h/2 - .1, z); scene.add(c); }

// ---------- city skyline behind ----------
const winA = K.windowTexture('#1d1631', ['#ffd890','#fff0a8','#f7a46e'], .45), winB = K.windowTexture('#24325e', ['#9ed2ee','#fff0d0','#ffd890'], .4);
[winA, winB].forEach(t => t.repeat.set(2, 6));
const towerMats = [winA, winB].map(t => std(0xffffff, { map: t, emissive: 0x332244, emissiveMap: t, emissiveIntensity: 1.2, roughness: .8 }));
const beacons = [];
for (let i = 0; i < 26; i++) {
  const x = -70 + i*5.6 + Math.random()*3, z = -34 - Math.random()*26;
  const w = 3 + Math.random()*4, h = 12 + Math.random()*34 * (Math.abs(x) < 30 ? 1 : .6);
  box(w, h, w*.9, 0, x, 0, z, towerMats[i % 2]);
  if (h > 32) { box(w*.6, 2, w*.6, '#3a2a60', x, h, z); beacons.push(box(.5, .5, .5, 0, x, h + 2.4, z, basic('#ff3b5c'))); box(.12, 2.4, .12, '#d2d6ee', x, h + 2, z); }
}

// ---------- trees (canopy groups sway; each leaf cluster wobbles on its own) ----------
const trees = [];
const LEAF = ['#2f9e5a', '#1d5a3a', '#57e36f'];
function tree(x, z, s = 1) {
  const t = new THREE.Group(); t.position.set(x, 0, z); scene.add(t);
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(.4*s, 3*s, .4*s), mat('#4a2e2a')); trunk.position.y = 1.5*s; t.add(trunk);
  const crown = new THREE.Group(); crown.position.y = 3*s; t.add(crown);
  const leaves = [];
  for (let k = 0; k < 6; k++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry((.9 + Math.random()*.6)*s, 0), mat(LEAF[k % 3]));
    m.position.set((Math.random() - .5)*2.2*s, (.3 + Math.random()*1.6)*s, (Math.random() - .5)*2*s);
    m.userData.ph = Math.random()*6; m.userData.base = m.position.clone();
    crown.add(m); leaves.push(m);
  }
  trees.push({ crown, leaves, ph: Math.random()*6 });
}
for (let i = 0; i < 9; i++) tree(-26 + i*6.5 + Math.random()*2, -20 - Math.random()*4, 1 + Math.random()*.4);
for (const [x, z] of [[-29, -4], [-31, 4], [29, -6], [31, 3], [17, -16], [-17, -16]]) tree(x, z, 1.1);

// ---------- the big bunk ----------
const CREAM = mat('#fff0d0');
for (const x of [-11, 0, 11]) for (const z of [-5, 5]) box(.6, 6.4, .6, 0, x, 0, z, CREAM);
box(26, .7, 13, '#d8c6e6', 0, 6.4, 0);
box(26.4, .9, 13.4, '#ff5c6a', 0, 6.9, 0);
box(26.45, .18, 13.45, 0, 0, 7.8, 0, basic('#fff0d0'));
const panels = [];
for (let x = -10.5; x <= 10.5; x += 3.5) for (const z of [-4, -1.3, 1.3, 4]) panels.push(box(1.6, .05, .8, 0, x, 6.35, z, basic('#fff6c8')));
const fascia = new THREE.Mesh(new THREE.PlaneGeometry(9, .8), new THREE.MeshBasicMaterial({ map: K.label(180, 16, (g, w, h) => {
  g.fillStyle = '#ff5c6a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff0d0'; g.font = '700 12px Silkscreen, monospace'; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText('A.R.S FUEL · OPEN 24/7', w/2, h/2 + 1);
}) }));
fascia.position.set(0, 7.35, 6.71); scene.add(fascia);

// three pump islands, three pumps each
const screens = [];
for (const z of [-3.6, 0, 3.0]) {
  box(16, .3, 1.3, '#d2d6ee', 0, 0, z);
  for (const x of [-5.5, 0, 5.5]) {
    box(1.1, 2.3, .85, '#ff5c6a', x, .3, z); box(1.15, .4, .9, 0, x, 2.6, z, basic('#fff0d0'));
    const sc = K.label(48, 24, () => {});
    const s = new THREE.Mesh(new THREE.PlaneGeometry(.75, .38), new THREE.MeshBasicMaterial({ map: sc })); s.position.set(x, 1.9, z + .44); scene.add(s);
    screens.push(sc);
    box(.12, 1, .12, '#16121f', x + .42, .8, z + .48);
  }
}
const FILL = screens.length - 2; // the pump the Supra is at
let litres = 0;
function paintScreens() {
  screens.forEach((t, i) => {
    const g = t.image.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, 48, 24);
    g.fillStyle = '#57e36f'; g.font = '700 9px Silkscreen, monospace'; g.textBaseline = 'top';
    g.fillText(i === FILL ? litres.toFixed(2).padStart(6, '0') : '000.00', 3, 3);
    g.fillStyle = '#ffd84a'; g.fillText(i === FILL ? 'FILLING' : 'READY', 3, 13);
    t.needsUpdate = true;
  });
}

// shop
const shopTex = K.windowTexture('#fff0d0', ['#ffd890', '#fff0a8'], .9); shopTex.repeat.set(6, 1);
box(20, 4.2, 5, 0, 0, 0, -12.5, std(0xffffff, { map: shopTex, emissive: 0x554433, emissiveMap: shopTex }));
box(20.6, .8, 5.6, '#56356f', 0, 4.2, -12.5);
const openMat = basic('#57e36f');
box(2.6, .7, .1, 0, 6, 2.8, -9.95, openMat);
const shopSign = new THREE.Mesh(new THREE.PlaneGeometry(6, .7), new THREE.MeshBasicMaterial({ map: K.label(140, 18, (g, w, h) => {
  g.fillStyle = '#56356f'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd84a'; g.font = '700 12px Silkscreen, monospace'; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText('PIT MART · 24/7', w/2, h/2 + 1);
}) }));
shopSign.position.set(-3, 4.6, -9.68); scene.add(shopSign);

// price totem
box(.5, 5, .5, '#3a3050', -27, 0, 5);
const totem = new THREE.Mesh(new THREE.PlaneGeometry(3, 3.9), new THREE.MeshBasicMaterial({ map: K.label(64, 84, (g, w, h) => {
  g.fillStyle = '#0d0918'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ff5c6a'; g.fillRect(0, 0, w, 18); g.fillStyle = '#fff0d0'; g.font = '700 10px Silkscreen, monospace'; g.textBaseline = 'top'; g.fillText('A.R.S', 15, 4);
  [['IDEAS', '∞'], ['CODE', '24/7'], ['DESIGN', 'ON'], ['AI', 'FULL']].forEach(([a, b], i) => { g.fillStyle = '#9ed2ee'; g.font = '400 8px Silkscreen, monospace'; g.fillText(a, 4, 24 + i*15); g.fillStyle = '#ffd84a'; g.fillText(b, 40, 24 + i*15); });
}) }));
totem.position.set(-27, 6.95, 5.28); scene.add(totem);
box(3.2, 4.1, .2, '#16121f', -27, 4.9, 5.08);

// street lamps (glowing heads at evening)
for (const x of [-30, 24, 40]) { box(.2, 7, .2, '#3b2f5a', x, 0, 8); box(1.4, .22, .45, 0, x - .6, 7, 8, basic('#ffe6a8')); }

// ---------- left side: car wash, air pump, vending, tyres, bench ----------
const signBoard = (txt, w, x, y, z, bg = '#5aa8ff', fg = '#0d0918', ry = 0) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w*.16), new THREE.MeshBasicMaterial({ map: K.label(Math.round(w*22), Math.round(w*3.5), (g, cw, ch) => {
    g.fillStyle = bg; g.fillRect(0, 0, cw, ch); g.fillStyle = fg; g.font = `700 ${Math.round(ch*.62)}px Silkscreen, monospace`; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText(txt, cw/2, ch/2 + 1);
  }) }));
  m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); return m;
};
// car wash: back wall + roof, open towards the forecourt, two spinning brushes
box(8, 4.6, .4, '#d2d6ee', -22, 0, -6);
for (const z of [-6, 2]) box(8, .5, .4, '#5aa8ff', -22, 4.6, z);
box(8.4, .4, 8.6, '#e6e9f6', -22, 5.1, -2);
for (const x of [-25.8, -18.2]) box(.4, 4.6, .4, '#d2d6ee', x, 0, 2);
box(8.6, .25, 8.8, 0, -22, 5.5, -2, basic('#5aa8ff'));
const brushes = [];
for (const x of [-24, -20]) {
  const b = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, 3.6, 10), basic('#2e4fb8')); b.position.set(x, 2.1, -1.5); scene.add(b);
  for (let k = 0; k < 6; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(.12, 3.4, .3), basic(k % 2 ? '#5aa8ff' : '#9ed2ee')); s.position.set(Math.cos(k)*.72, 0, Math.sin(k)*.72); s.rotation.y = -k; b.add(s); }
  brushes.push(b);
}
box(8, .06, 7.6, 0, -22, .02, -2, std('#24325e', { roughness: .15, metalness: .5 })); // wet floor
signBoard('CAR WASH', 6, -22, 4.85, 2.22);
// air & water post
box(.5, 1.6, .5, '#57e36f', -14.5, 0, 3); box(.6, .5, .6, 0, -14.5, 1.6, 3, basic('#fff0d0'));
signBoard('AIR', 1.2, -14.5, 2.5, 3.32, '#57e36f');
// vending machines + bench + bin by the shop
for (const [x, c] of [[-12.4, '#ff5c6a'], [-13.6, '#5aa8ff']]) { box(1, 2.2, .9, c, x, 0, -9.2); box(.7, 1.2, .02, 0, x, .7, -8.74, basic('#fff0a8')); }
box(2.6, .15, .7, '#8a5a4a', -14, .5, 6.5); for (const x of [-15.1, -12.9]) box(.12, .5, .6, '#3a3050', x, 0, 6.5);
const bin = new THREE.Mesh(new THREE.CylinderGeometry(.3, .26, .8, 8), mat('#2f9e5a')); bin.position.set(-11.8, .4, 6.6); scene.add(bin);
// stacked tyres
for (let k = 0; k < 4; k++) { const t = new THREE.Mesh(new THREE.TorusGeometry(.42, .2, 6, 10), mat('#16121f')); t.rotation.x = Math.PI/2; t.position.set(-16 + (k > 2 ? .9 : 0), .2 + (k > 2 ? 0 : k*.4), -4.5); scene.add(t); }

// ---------- right side: tyre garage, second car, EV chargers, cones, drums ----------
box(9, 5.2, 7, '#3a2a60', 18, 0, -4);
box(9.4, .6, 7.4, '#ff8a5a', 18, 5.2, -4);
box(6.4, 3.4, .1, 0, 18, 0, -.45, basic('#fff0c8'));                 // lit open bay
box(6.6, 1.4, .3, '#d2d6ee', 18, 3.4, -.4);                          // half-raised roller door
for (let k = 0; k < 4; k++) box(6.6, .06, .32, '#6a6f95', 18, 3.5 + k*.32, -.38);
signBoard('PIT GARAGE', 7.5, 18, 5.5, -.25, '#ff8a5a');
const lift = box(2.6, .2, 1.4, '#ffd84a', 18, 1.2, -2.2);            // car lift inside
const C2 = K.buildCar({ p: 'wedge', c: ['#bfe6ff', '#5aa8ff', '#2e4fb8'] });
C2.car.position.set(15.5, 0, 4.6); C2.car.rotation.y = -.9; C2.car.scale.setScalar(1.15); scene.add(C2.car);
for (const x of [13.6, 15.4]) { box(.5, 1.8, .4, '#d2d6ee', x, 0, 8); box(.36, .4, .02, 0, x, 1.2, 8.21, basic('#57e36f')); }
signBoard('EV', .9, 14.5, 2.3, 8.25, '#57e36f');
for (const [x, z] of [[14, 1], [14.8, 2.2], [21.5, 2.5]]) { const c = new THREE.Mesh(new THREE.ConeGeometry(.22, .6, 6), basic('#ff8a5a')); c.position.set(x, .3, z); scene.add(c); }
for (const [x, z, c] of [[22.5, -.6, '#e8384e'], [23.3, -.2, '#5aa8ff']]) { const d = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, 1, 10), mat(c)); d.position.set(x, .5, z); scene.add(d); }

// ---------- the Supra ----------
const CAR_Z = 5.4, CAR_S = 1.25;
const S = K.buildCar({ p: 'supra', c: ['#ffa064', '#f26b3a', '#c94530'] });
S.car.position.set(1.5, 0, CAR_Z); S.car.scale.setScalar(CAR_S); scene.add(S.car);
for (const s of [-1, 1]) for (const dz of [-.18, .18]) {
  const tl = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .04, 10).rotateZ(Math.PI/2), basic('#ff3b5c'));
  tl.position.set(...S.P(1.4, 18), s*.62 + dz*.6); S.body.add(tl);
}

// ---------- the driver, leaning on the passenger door, arms crossed, ankles crossed ----------
const SKIN = std('#ffe8d6', { roughness: .85 }), HAIR = std('#2a1a1e'), JACKET = std('#1d1631'), JEANS = std('#24325e'), SHOE = std('#fff0d0');
const driver = new THREE.Group();   // yaw (faces camera-ish)
const lean = new THREE.Group();     // leans back onto the car
driver.add(lean); scene.add(driver);
const part = (w, h, d, m, x, y, z, parent = lean) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); parent.add(o); return o; };
// legs: planted left, right crossed over at the ankle
part(.2, .95, .22, JEANS, -.12, .5, 0);
const rLeg = part(.2, .95, .22, JEANS, .06, .5, .05); rLeg.rotation.z = .2;
part(.24, .12, .34, SHOE, -.12, .06, .06); part(.24, .12, .34, SHOE, -.04, .06, .14);
part(.46, .24, .28, JEANS, -.04, 1.05, 0);                       // hips
const torso = part(.52, .68, .3, JACKET, -.04, 1.5, 0);
part(.08, .6, .02, std('#f26b3a'), -.04, 1.5, .16);              // racing stripe
part(.06, .56, .02, basic('#ffd27a'), -.04, 1.5, .17);
for (const s of [-1, 1]) {                                        // upper arms down the sides
  const ua = part(.15, .44, .16, JACKET, -.04 + s*.33, 1.55, .04); ua.rotation.z = s*.12;
}
part(.62, .14, .16, JACKET, -.04, 1.38, .2);                      // crossed forearms
for (const s of [-1, 1]) part(.1, .1, .1, SKIN, -.04 + s*.27, 1.4, .29);
part(.13, .12, .13, SKIN, -.04, 1.9, 0);                          // neck
const head = new THREE.Group(); head.position.set(-.04, 2.08, 0); lean.add(head);
const skull = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8), SKIN); skull.scale.set(.9, 1.08, .95); head.add(skull);
const cap = new THREE.Mesh(new THREE.SphereGeometry(.17, 10, 6, 0, Math.PI*2, 0, Math.PI*.45), HAIR); cap.position.set(0, .03, -.01); head.add(cap);
part(.2, .07, .1, HAIR, .01, .16, .07, head).rotation.x = -.3;     // quiff
part(.24, .055, .03, std('#16121f', { metalness: .6 }), 0, .02, .15, head); // aviators
const DRIVER_LEAN = -.24;
lean.rotation.x = DRIVER_LEAN;
// feet out from the car's side, back resting on the door
driver.position.set(2.4, 0, CAR_Z + .95*CAR_S + .62); // at the passenger door
driver.rotation.y = .45;

// ---------- particles ----------
const puffs = [];
for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.16, .16, .16), new THREE.MeshBasicMaterial({ color: 0xc8a0d0, transparent: true, opacity: 0 })); m.userData.life = Math.random(); scene.add(m); puffs.push(m); }
const fallLeaves = [];
for (let i = 0; i < 18; i++) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(.22, .14), basic(LEAF[i % 3], { side: THREE.DoubleSide }));
  m.position.set(-28 + Math.random()*56, Math.random()*5, -22 + Math.random()*26); m.userData.ph = Math.random()*6; scene.add(m); fallLeaves.push(m);
}

let narrow = false;
function resize() {
  const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
  narrow = w < 700;
  px.setSize(w, h, narrow ? 420 : 900);
  camera.aspect = w/h; camera.fov = narrow ? 55 : 43; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

let tick = 0;
K.loop(cv, (dt, t) => {
  const A = reduced ? 0 : 1;
  const sway = Math.sin(t*.15)*.6*A;
  // framed to take in the car wash (left) through the tyre garage (right)
  if (narrow) camera.position.set(8 + sway, 5, 26); else camera.position.set(6 + sway, 4.4, 25);
  camera.lookAt(narrow ? 2 : 1.5, 2.8, 0);
  sky.position.copy(camera.position);
  // wind: canopies sway, each leaf cluster wobbles, a few leaves drift down
  const gust = .6 + .4*Math.sin(t*.35);
  trees.forEach(tr => {
    tr.crown.rotation.z = Math.sin(t*1.3 + tr.ph)*.06*gust*A;
    tr.crown.rotation.x = Math.sin(t*.9 + tr.ph)*.035*gust*A;
    tr.leaves.forEach(l => { const b = l.userData.base, p = l.userData.ph; l.position.set(b.x + Math.sin(t*2.6 + p)*.08*A, b.y + Math.sin(t*3.1 + p)*.05*A, b.z); l.rotation.y = Math.sin(t*1.7 + p)*.25*A; });
  });
  fallLeaves.forEach(m => {
    const p = m.userData.ph;
    m.position.y -= dt*.7*A; m.position.x += (Math.sin(t*1.4 + p)*.8 + .9*gust)*dt*A;
    m.rotation.x += dt*2*A; m.rotation.z += dt*1.3*A;
    if (m.position.y < .05) { m.position.y = 5 + Math.random()*2; m.position.x = -28 + Math.random()*40; }
  });
  // the driver breathes and glances around
  head.rotation.y = (Math.sin(t*.4)*.5 - .2)*A;
  head.rotation.x = Math.sin(t*.3)*.06*A;
  lean.rotation.x = DRIVER_LEAN + Math.sin(t*1.5)*.008*A;
  torso.scale.z = 1 + Math.sin(t*1.5)*.03*A;
  rLeg.rotation.x = Math.max(0, Math.sin(t*2.2))*.06*A * (Math.sin(t*.25) > .6 ? 1 : 0); // occasional foot tap
  brushes.forEach((b, i) => b.rotation.y += dt*(i ? -3 : 3)*A);
  lift.position.y = 1.2 + (Math.sin(t*.4) + 1)*.4*A;
  // car idles; signs and beacons blink
  S.body.position.y = .11 + Math.sin(t*38)*.006*A;
  openMat.color.set(Math.floor(t*1.5) % 4 === 0 ? '#1d5a3a' : '#57e36f');
  beacons.forEach((b, i) => b.visible = Math.floor(t + i*.37) % 2 === 0);
  if (Math.random() < .004*A) panels[(Math.random()*panels.length)|0].visible = false; else if (Math.random() < .08) panels.forEach(p => p.visible = true);
  const tail = S.P(1, 0)[0]*CAR_S + 1.5;
  puffs.forEach(m => {
    m.userData.life += dt*.7;
    if (m.userData.life > 1) { m.userData.life = 0; m.position.set(tail, .4, CAR_Z + (Math.random() < .5 ? -.5 : .5)); }
    const f = m.userData.life; m.position.x -= dt*.8; m.position.y += dt*.5;
    m.scale.setScalar(1 + f*2); m.material.opacity = (1 - f)*.55*A;
  });
  tick += dt;
  if (tick > .15) { tick = 0; litres = (litres + .37) % 999; paintScreens(); }
  px.render(scene, camera);
});
})();
