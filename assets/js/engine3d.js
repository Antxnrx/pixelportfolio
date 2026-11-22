// UNDER THE HOOD: fixed-view 3D cutaway of an inline-4.
// Real slider-crank kinematics; crank angle, firing order and selection come from main.js (window.ARS).
(() => {
const K = window.ARS3D;
const engine = document.querySelector('.engine'), blockEl = document.getElementById('block');
if (!K || !K.webglOK() || !engine || !blockEl) return;
const wrap = document.createElement('div'); wrap.className = 'eng3d';
const cv = document.createElement('canvas'); wrap.appendChild(cv);
let px;
try { px = K.pixelRenderer(cv); } catch (e) { return; }
blockEl.before(wrap); engine.classList.add('is3d');

const { std, basic } = K;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#1a1230');
const camera = new THREE.PerspectiveCamera(30, 2, .1, 200);
scene.add(new THREE.HemisphereLight(0xffe0d0, 0x2b1f4e, .8));
const key = new THREE.DirectionalLight(0xffd0a8, 1.1); key.position.set(6, 9, 10); scene.add(key);
const rim = new THREE.DirectionalLight(0x9ed2ee, .5); rim.position.set(-8, 4, -6); scene.add(rim);
const boom = new THREE.PointLight(0xffb060, 0, 7); scene.add(boom);

const SP = 2.1, R = .55, L = 2.0, N = 4, XS = [0, 1, 2, 3].map(i => (i - 1.5)*SP), WIDE = SP*4 + .4;
const OFFS = [0, 540, 180, 360], NAMES = ['AI', 'STACK', 'DESIGN', 'INFRA'];
const ORANGE = std('#f26b3a'), BRICK = std('#c94530'), STEEL = std('#c8cde4', { metalness: .25, roughness: .4 });
const DARK = std('#3a3050', { metalness: .5 }), GOLD = std('#ffd84a', { metalness: .6, roughness: .35 });
const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); scene.add(o); return o; };
const xCyl = (r, len, segs = 14) => new THREE.CylinderGeometry(r, r, len, segs).rotateZ(Math.PI/2); // cylinder along x

// ----- block (cutaway: back wall, ends, oil pan, back half of the head) -----
add(new THREE.BoxGeometry(WIDE, 4.6, .3), ORANGE, 0, 1.3, -1.05);
for (const s of [-1, 1]) add(new THREE.BoxGeometry(.3, 4.6, 2.1), ORANGE, s*(WIDE/2 + .15), 1.3, 0);
add(new THREE.BoxGeometry(WIDE + .6, .55, 2.2), BRICK, 0, -1.6, 0);                  // oil pan
add(new THREE.BoxGeometry(WIDE + .6, .9, 1.0), ORANGE, 0, 3.7, -.6);                 // head (back half)
add(new THREE.BoxGeometry(WIDE + .2, .55, .8), BRICK, 0, 4.4, -.75);                 // cam cover (rear half, cam exposed)
for (let k = 0; k < 9; k++) add(new THREE.BoxGeometry(.12, .1, .7), ORANGE, -WIDE/2 + .5 + k*(WIDE - 1)/8, 4.72, -.75);

// ----- dyno bay: blueprint wall, chequer floor, engine stand -----
const bp = K.label(256, 128, (g, w, h) => {
  g.fillStyle = '#16204a'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1f2c5e'; for (let x = 0; x < w; x += 8) g.fillRect(x, 0, 1, h); for (let y = 0; y < h; y += 8) g.fillRect(0, y, w, 1);
  g.fillStyle = '#2e4fb8'; for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 1, h); for (let y = 0; y < h; y += 32) g.fillRect(0, y, w, 1);
  g.fillStyle = '#9ed2ee'; g.font = '400 8px Silkscreen, monospace'; g.textBaseline = 'top';
  g.fillText('A.R.S  I4  ·  FIRING 1-3-4-2', 6, 6); g.fillText('BORE 82  STROKE 90  CR 11:1', 6, 116);
  g.fillRect(150, 10, 90, 1); g.fillRect(150, 8, 1, 5); g.fillRect(239, 8, 1, 5); g.fillText('2.1 L', 182, 14);
});
const wall = add(new THREE.PlaneGeometry(34, 17), new THREE.MeshBasicMaterial({ map: bp }), 0, 3.5, -4); wall.renderOrder = -1;
const chk = K.label(32, 32, (g) => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? '#2b1f4e' : '#3a2a60'; g.fillRect(x*8, y*8, 8, 8); } });
chk.wrapS = chk.wrapT = THREE.RepeatWrapping; chk.repeat.set(10, 5);
const floor = add(new THREE.PlaneGeometry(40, 20), std(0xffffff, { map: chk, roughness: .4, metalness: .2 }), 0, -2.6, 4); floor.rotation.x = -Math.PI/2;
for (const s of [-1, 1]) for (const z of [-.7, .7]) { const leg = add(new THREE.BoxGeometry(.18, 1.1, .18), DARK, s*3.2, -2.3, z); leg.rotation.z = s*.25; }
add(new THREE.BoxGeometry(7.2, .18, .3), DARK, 0, -1.9, 0);

// ----- valvetrain: camshaft with one lobe per valve, cam + crank pulleys, timing belt -----
const cam = add(xCyl(.13, WIDE - .2, 10), STEEL, 0, 4.42, .1);
const camLobes = [];
const VALVE_PEAK = [450, 270]; // cycle-degree of max lift: intake, exhaust
XS.forEach((x, i) => [-.32, .32].forEach((dx, v) => {
  const lobe = new THREE.Mesh(new THREE.BoxGeometry(.16, .24, .2), GOLD); lobe.position.set(x + dx, .1, 0);
  const holder = new THREE.Group(); holder.position.x = 0; holder.add(lobe);
  // cam turns at half crank speed; lobe points down (-y) exactly at its valve's peak lift
  holder.rotation.x = Math.PI - ((OFFS[i] + VALVE_PEAK[v])/2)/180*Math.PI;
  cam.add(holder); camLobes.push(holder);
}));
const FRONT = -WIDE/2 - .55;
const camPulley = add(xCyl(.55, .16, 16), GOLD, FRONT, 4.42, .1);
const camMark = new THREE.Mesh(new THREE.BoxGeometry(.18, .3, .1), basic('#16121f')); camMark.position.y = .38; camPulley.add(camMark);
for (const z of [-.42, .62]) add(new THREE.BoxGeometry(.12, 4.42, .08), std('#16121f', { roughness: .9 }), FRONT, 0, z); // belt runs
const beltTeeth = [];
for (let k = 0; k < 10; k++) beltTeeth.push(add(new THREE.BoxGeometry(.14, .08, .1), basic('#ffd84a'), FRONT, 0, .62));

// ----- intake: air filter on top -----
add(new THREE.CylinderGeometry(1.0, 1.0, .5, 16), std('#e8384e'), 0, 4.95, -.75);
add(new THREE.CylinderGeometry(1.03, 1.03, .1, 16), STEEL, 0, 5.2, -.75);
add(new THREE.CylinderGeometry(.2, .2, .12, 8), GOLD, 0, 5.3, -.75);

// ----- exhaust out of the right end, flames on rev -----
add(xCyl(.2, 2.2, 10), std('#6a6f95', { metalness: .6 }), WIDE/2 + 1.3, 3.7, -.3);
const tip = add(xCyl(.27, .25, 10), STEEL, WIDE/2 + 2.4, 3.7, -.3);
const flameMat = new THREE.MeshBasicMaterial({ color: 0xff8a5a, transparent: true, opacity: 0 });
const flameCore = new THREE.MeshBasicMaterial({ color: 0xfff0a8, transparent: true, opacity: 0 });
const flame = add(new THREE.ConeGeometry(.32, 1.4, 8).rotateZ(-Math.PI/2), flameMat, WIDE/2 + 3.2, 3.7, -.3);
const flame2 = add(new THREE.ConeGeometry(.16, .8, 8).rotateZ(-Math.PI/2), flameCore, WIDE/2 + 2.9, 3.7, -.3);

// ----- per-cylinder parts -----
const cyl = XS.map((x, i) => {
  const boreMat = std('#4a4268', { metalness: .6, roughness: .35, side: THREE.DoubleSide, emissive: 0x000000 });
  add(new THREE.CylinderGeometry(.82, .82, 2.5, 20, 1, true, Math.PI/2, Math.PI), boreMat, x, 2.05, 0); // back half of the bore
  const piston = new THREE.Group(); scene.add(piston);
  const crownMat = std('#e6e9f6', { metalness: .2, roughness: .45, emissive: 0x000000 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.76, .76, .7, 18), crownMat); body.position.y = .2; piston.add(body);
  for (const y of [.42, .32]) { const ring = new THREE.Mesh(new THREE.CylinderGeometry(.775, .775, .04, 18), DARK); ring.position.y = y; piston.add(ring); }
  const wrist = new THREE.Mesh(xCyl(.13, .9), DARK); piston.add(wrist);
  const rod = add(new THREE.BoxGeometry(.22, L, .16), GOLD, x, 0, 0);
  const bigEnd = add(xCyl(.26, .3), GOLD, x, 0, 0);
  // crank throw: webs + counterweights + pin, rotating about the x axis
  const throwG = new THREE.Group(); throwG.position.x = x; scene.add(throwG);
  for (const s of [-1, 1]) {
    const web = new THREE.Mesh(new THREE.BoxGeometry(.16, 1.05, .6), DARK); web.position.set(s*.32, R/2, 0); throwG.add(web);
    const cw = new THREE.Mesh(new THREE.BoxGeometry(.16, .55, 1.15), STEEL); cw.position.set(s*.32, -.42, 0); throwG.add(cw); // counterweight, opposite the pin
  }
  const pin = new THREE.Mesh(xCyl(.2, .5), STEEL); pin.position.y = R; throwG.add(pin);
  // valves (intake left, exhaust right) + spark plug
  const valves = [-.32, .32].map(dx => {
    const v = new THREE.Group(); v.position.set(x + dx, 0, .1); scene.add(v);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .8, 6), STEEL); stem.position.y = 3.75; v.add(stem);
    const headV = new THREE.Mesh(new THREE.CylinderGeometry(.24, .2, .06, 12), STEEL); headV.position.y = 3.33; v.add(headV);
    const spring = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .3, 8), GOLD); spring.position.y = 3.95; v.add(spring);
    return v;
  });
  add(new THREE.CylinderGeometry(.07, .07, .55, 6), basic('#fff0d0'), x, 3.6, -.25);
  const flash = add(new THREE.SphereGeometry(.55, 10, 6), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0 }), x, 3.0, 0);
  return { x, piston, rod, bigEnd, throwG, valves, flash, boreMat, crownMat };
});
// main journals, flywheel, front pulley
for (let k = 0; k <= N; k++) add(xCyl(.24, SP - .8), STEEL, XS[0] - SP/2 + k*SP, 0, 0); // main journals between throws
const fly = add(xCyl(1.35, .22, 24), DARK, WIDE/2 + .55, 0, 0);
const flyMark = new THREE.Mesh(new THREE.BoxGeometry(.24, .5, .12), basic('#ffd84a')); flyMark.position.y = 1.0; fly.add(flyMark);
const pulley = add(xCyl(.5, .2, 16), GOLD, -WIDE/2 - .55, 0, 0);

// ----- labels (DOM, positioned from 3D each frame) -----
const labels = cyl.map((c, i) => {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'eng-lab';
  b.innerHTML = `<b>${i + 1}</b><span>${NAMES[i]}</span><i>INTAKE</i>`;
  b.addEventListener('click', () => window.ARS.selectCyl && window.ARS.selectCyl(i));
  wrap.appendChild(b); return b;
});
const strokeEls = labels.map(l => l.querySelector('i'));
// tach / readout HUD in the corner
const hud = document.createElement('div'); hud.className = 'eng-hud';
hud.innerHTML = `<div class="r"><small>RPM</small><b id="eRpm">0</b></div><div class="tbar"><i></i></div><div class="r"><small>FIRING</small><b id="eFire">1</b></div>`;
wrap.appendChild(hud);
const eRpm = hud.querySelector('#eRpm'), eFire = hud.querySelector('#eFire'), tbar = hud.querySelector('.tbar i');
const STROKES = [['POWER', 'p'], ['EXHAUST', 'e'], ['INTAKE', 'i'], ['COMP', 'c']];
// clicking a cylinder in the picture selects it too
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
cv.addEventListener('click', e => {
  const r = cv.getBoundingClientRect();
  mouse.set((e.clientX - r.left)/r.width*2 - 1, -(e.clientY - r.top)/r.height*2 + 1);
  ray.setFromCamera(mouse, camera);
  const hit = ray.intersectObjects(cyl.flatMap(c => [c.piston.children[0], c.rod]), false)[0];
  if (hit) { const i = cyl.findIndex(c => c.piston.children[0] === hit.object || c.rod === hit.object); if (i >= 0) window.ARS.selectCyl(i); }
});

function resize() {
  const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
  px.setSize(w, h, Math.min(720, w*.75));
  camera.aspect = w/h;
  // fit the whole block: pull back further on narrow screens
  const narrow = w/h < 1.5;
  camera.fov = narrow ? 40 : 30; camera.updateProjectionMatrix();
  camera.position.set(narrow ? 3.5 : 4.5, narrow ? 5.5 : 4.6, narrow ? 20 : 19.5);
  camera.lookAt(.8, 1.6, 0);
}
addEventListener('resize', resize); resize();
new ResizeObserver(resize).observe(wrap);

const tmp = new THREE.Vector3(), GOLDC = new THREE.Color('#ffd84a'), BLACK = new THREE.Color(0);
K.loop(wrap, () => {
  const A = window.ARS || {}, ang = A.engAng || 0, sel = A.sel || 0;
  let fire = -1, fireAmt = 0;
  cyl.forEach((c, i) => {
    const a = ((ang - OFFS[i]) % 720 + 720) % 720, th = a/180*Math.PI;   // 0 = TDC, power stroke
    const pinY = R*Math.cos(th), pinZ = R*Math.sin(th);
    const pY = pinY + Math.sqrt(L*L - pinZ*pinZ);                         // slider-crank
    c.throwG.rotation.x = th;
    c.piston.position.set(c.x, pY, 0);
    c.bigEnd.position.set(c.x, pinY, pinZ);
    c.rod.position.set(c.x, (pinY + pY)/2, pinZ/2);
    c.rod.rotation.x = Math.atan2(-pinZ, pY - pinY);
    const intake = a >= 360 && a < 540, exhaust = a >= 180 && a < 360;
    const lift = s => s ? Math.sin(((a % 180)/180)*Math.PI)*.2 : 0;
    c.valves[0].position.y = -lift(intake); c.valves[1].position.y = -lift(exhaust);
    const f = a < 70 ? 1 - a/70 : 0;
    c.flash.material.opacity = f*.85; c.flash.scale.setScalar(.5 + f*.7); c.flash.position.y = pY + .9;
    if (f > fireAmt) { fireAmt = f; fire = i; }
    const on = i === sel;
    c.boreMat.emissive.copy(on ? GOLDC : BLACK); c.boreMat.emissiveIntensity = on ? .35 : 0;
    c.crownMat.emissive.copy(on ? GOLDC : BLACK); c.crownMat.emissiveIntensity = on ? .25 : 0;
    labels[i].classList.toggle('on', on);
    const [sName, sCls] = STROKES[Math.floor(a/180)];
    if (strokeEls[i].textContent !== sName) { strokeEls[i].textContent = sName; strokeEls[i].className = sCls; }
  });
  if (fire >= 0) { boom.position.set(cyl[fire].x, 3.2, .8); boom.intensity = fireAmt*2.2; eFire.textContent = fire + 1; } else boom.intensity = 0;
  const crankRad = ang/180*Math.PI;
  fly.rotation.x = crankRad; pulley.rotation.x = crankRad;
  cam.rotation.x = crankRad/2; camPulley.rotation.x = crankRad/2;
  // belt teeth crawl up the front run and down the back
  beltTeeth.forEach((b, k) => { const s = ((k/beltTeeth.length) + ang/720) % 1; b.position.y = s*4.42; });
  // exhaust: a pop on every exhaust stroke, big flames while revving
  const rev = A.revBoost || 0, rpmN = Math.min(1, (A.rpm || 2000)/7000);
  const pop = cyl.reduce((m, c, i) => { const a = ((ang - OFFS[i]) % 720 + 720) % 720; return Math.max(m, a >= 180 && a < 240 ? 1 - (a - 180)/60 : 0); }, 0);
  const fl = Math.min(1, pop*(.25 + rpmN*.5) + rev*.6);
  flameMat.opacity = fl*.85; flameCore.opacity = fl; flame.scale.set(.4 + fl*1.4 + Math.random()*.2*fl, .6 + fl*.6, .6 + fl*.6); flame.position.x = WIDE/2 + 2.7 + fl*.6;
  flame2.scale.setScalar(.4 + fl);
  const rpm = A.rpm || 0; eRpm.textContent = rpm.toLocaleString('en-US');
  tbar.style.width = Math.round(Math.min(1, rpm/7000)*100) + '%'; tbar.classList.toggle('red', rpm > 6000);
  px.render(scene, camera);
  // labels sit just above the head of each cylinder
  const w = cv.clientWidth, h = cv.clientHeight;
  cyl.forEach((c, i) => {
    tmp.set(c.x, 5.7, .2).project(camera);
    const ly = Math.max(34, Math.round((1 - tmp.y)/2*h)); // keep inside the frame
    labels[i].style.transform = `translate(${Math.round((tmp.x + 1)/2*w)}px, ${ly}px) translate(-50%, -100%)`;
  });
});
})();
