// 3D hero: the Pixel Cruiser coast road, landscape, speed driven by the page's scroll throttle.
// Sets window.ARS_HERO3D = true on success so main.js skips the 2D hero.
(() => {
const K = window.ARS3D;
if (!K || !K.webglOK()) return;
const cv = document.getElementById('hero');
let px;
try { px = K.pixelRenderer(cv); } catch (e) { return; }
window.ARS_HERO3D = true;
cv.classList.add('is3d');

const { std, basic } = K;
const scene = new THREE.Scene();
const FOG = 0xee9a80;
scene.fog = new THREE.Fog(FOG, 60, 430);
const camera = new THREE.PerspectiveCamera(42, 16/9, .1, 2000);
const sky = K.sky({ top: '#2b1f4e', mid: '#c86f88', bot: '#ffd890', fog: '#ee9a80', sunDir: new THREE.Vector3(-.37, .075, -1) });
scene.add(sky);

scene.add(new THREE.HemisphereLight(0xe08aa8, 0x2c2050, .85));
const sun = new THREE.DirectionalLight(0xffb070, 1.35); sun.position.set(-37, 7.5, -100); scene.add(sun);
const fill = new THREE.DirectionalLight(0xffc0b0, .9); fill.position.set(4, 6, 10); scene.add(fill);

// ground
const roadTex = K.speckTexture('#2c2345', ['#3a3058','#211a37','#433868'], .09); roadTex.repeat.set(50, 1);
const road = new THREE.Mesh(new THREE.PlaneGeometry(400, 7.2), std(0xffffff, { map: roadTex, roughness: .9 }));
road.rotation.x = -Math.PI/2; road.position.set(0, 0, -.6); scene.add(road);
const shTex = K.speckTexture('#221a38', ['#2f2548','#17112a','#3d2f5c'], .14); shTex.repeat.set(50, 10);
const shoulder = new THREE.Mesh(new THREE.PlaneGeometry(400, 80), std(0xffffff, { map: shTex, roughness: 1 }));
shoulder.rotation.x = -Math.PI/2; shoulder.position.set(0, -.01, 43); scene.add(shoulder);
for (const [z, w] of [[2.75, .14], [-3.95, .14]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(400, .02, w), basic(0xcdb8e6)); m.position.set(0, .01, z); scene.add(m); }
const wall = new THREE.Mesh(new THREE.BoxGeometry(400, 1.3, 1.8), std(0x3a2b5c)); wall.position.set(0, -.6, -5.1); scene.add(wall);
const wallTop = new THREE.Mesh(new THREE.BoxGeometry(400, .1, 1.9), std(0x7d6aa0)); wallTop.position.set(0, .05, -5.1); scene.add(wallTop);
for (const y of [.78, .5]) { const r = new THREE.Mesh(new THREE.BoxGeometry(400, .08, .08), std(0xe0d0f0, { metalness: .5, roughness: .3 })); r.position.set(0, y, -4.4); scene.add(r); }

// sea
const seaGeo = new THREE.PlaneGeometry(340, 170, 68, 34);
const sea = new THREE.Mesh(seaGeo, std(0x6c3f88, { roughness: .22, metalness: .25 }));
sea.rotation.x = -Math.PI/2; sea.position.set(0, -1, -91); scene.add(sea);
const seaFar = new THREE.Mesh(new THREE.PlaneGeometry(4000, 2000), std(0x6c3f88, { roughness: .25, metalness: .25 }));
seaFar.rotation.x = -Math.PI/2; seaFar.position.set(0, -1.15, -1000); scene.add(seaFar);
const seaPos = seaGeo.attributes.position, seaBase = Float32Array.from(seaPos.array);

// scrolling props
const LOOP = 144, scrollers = [];
const addScroller = (obj, base, loop = LOOP) => { scrollers.push({ obj, base, loop }); scene.add(obj); };
const dashGeo = new THREE.BoxGeometry(3.4, .025, .16), dashMat = basic(0xf4e8c8);
for (let i = 0; i < LOOP/8; i++) { const d = new THREE.Mesh(dashGeo, dashMat); d.position.set(0, .012, -.6); addScroller(d, i*8); }
const postGeo = new THREE.BoxGeometry(.1, .85, .1), postMat = std(0xc0aedb, { metalness: .4, roughness: .4 });
for (let i = 0; i < LOOP/3; i++) { const p = new THREE.Mesh(postGeo, postMat); p.position.set(0, .42, -4.4); addScroller(p, i*3); }
const lampMat = std(0x3b2f5a, { metalness: .4 }), bulbMat = basic(0xffe6a8);
for (let i = 0; i < LOOP/24; i++) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.BoxGeometry(.16, 5.2, .16), lampMat); pole.position.set(0, 2.6, -5.4); g.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(.12, .12, 1.5), lampMat); arm.position.set(0, 5.15, -4.75); g.add(arm);
  const head = new THREE.Mesh(new THREE.BoxGeometry(.5, .16, .36), bulbMat); head.position.set(0, 5.05, -4.1); g.add(head);
  addScroller(g, i*24 + 6);
}
const shrubMat = [std(0x3d2a5a), std(0x55356e), std(0x2c2046)];
for (let i = 0; i < 26; i++) {
  const s = new THREE.Mesh(new THREE.IcosahedronGeometry(.35 + Math.random()*.5, 0), shrubMat[i % 3]);
  s.scale.y = .55; s.rotation.y = Math.random()*3; s.position.set(0, .1, 4.2 + Math.random()*9);
  addScroller(s, Math.random()*LOOP);
}
const islandMat = std(0x4a2b62, { roughness: 1 });
for (let i = 0; i < 9; i++) {
  const r = 14 + Math.random()*30;
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, 5 + Math.random()*16, 7, 1), islandMat);
  m.position.set(0, -1, -170 - Math.random()*120); m.rotation.y = Math.random()*3;
  addScroller(m, i*100 + Math.random()*40, 900);
}
const cloudA = basic(0xffe8c4, { fog: false }), cloudB = basic(0xeaa59e, { fog: false });
for (let i = 0; i < 7; i++) {
  const g = new THREE.Group(), n = 3 + (Math.random()*4|0);
  for (let k = 0; k < n; k++) {
    const w = 18 + Math.random()*30, h = 4 + Math.random()*6;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 6), cloudA); b.position.set(k*12 - n*6 + Math.random()*6, Math.random()*6, 0); g.add(b);
    const s = new THREE.Mesh(new THREE.BoxGeometry(w*.9, 1.6, 6.2), cloudB); s.position.set(b.position.x + 1, b.position.y - h/2 + .5, .2); g.add(s);
  }
  g.position.set(0, 55 + Math.random()*70, -520 - Math.random()*120);
  addScroller(g, i*240 + Math.random()*80, 1700);
}

// car: the original cruiser silhouette + its extras
const C = K.buildCar({ p: 'gt', c: ['#ffd27a', '#ff7a3c', '#e8384e'] });
const car = C.car; car.position.z = 1.1; scene.add(car);
{
  const cream = std(0xfff0d0, { roughness: .4 }), P = C.P, W = C.W;
  const slab = (a, b, width, z) => {
    const [x1, y1] = P(...a), [x2, y2] = P(...b), len = Math.hypot(x2-x1, y2-y1), ang = Math.atan2(y2-y1, x2-x1);
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, .02, width), cream);
    m.position.set((x1+x2)/2 - Math.sin(ang)*.045, (y1+y2)/2 + Math.cos(ang)*.045, z); m.rotation.z = ang; C.body.add(m);
  };
  for (const z of [-.2, .2]) { slab([79,12],[99,16],.2,z); slab([37,5],[63,4],.2,z); slab([9,15],[30,13],.2,z); }
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: .07, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  for (const side of [-1, 1]) {
    const b = new THREE.Mesh(new THREE.ConeGeometry(.9, 7, 10, 1, true), beamMat);
    b.rotation.z = Math.PI/2; b.position.set(P(102, 18.6)[0] + 3.5, P(102, 18.6)[1], side*.58); C.body.add(b);
  }
}
const blurMat = new THREE.MeshBasicMaterial({ color: 0x9aa0c4, transparent: true, opacity: .6 });
C.wheels.forEach(w => {
  const side = Math.sign(w.spin.position.z);
  const b = new THREE.Mesh(new THREE.CircleGeometry(.22, 12), blurMat); b.position.z = side*.176; if (side < 0) b.rotation.y = Math.PI;
  w.spin.add(b); w.blur = b;
});

// particles
const streakMat = new THREE.MeshBasicMaterial({ color: 0xfff2dc, transparent: true, opacity: .7, fog: false });
const streaks = [];
for (let i = 0; i < 16; i++) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(2 + Math.random()*3, .03, .03), streakMat);
  m.position.set(Math.random()*60 - 30, .2 + Math.random()*1.8, Math.random() < .5 ? -3.2 + Math.random()*2.2 : 2.4 + Math.random()*1.5);
  m.userData.v = .9 + Math.random()*.6; scene.add(m); streaks.push(m);
}
const puffGeo = new THREE.BoxGeometry(.18, .18, .18), puffs = [];
for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(puffGeo, new THREE.MeshBasicMaterial({ color: 0xe2cfe8, transparent: true, opacity: 0 })); m.userData.life = 1; scene.add(m); puffs.push(m); }
let puffIdx = 0, puffT = 0;

// camera: mouse drag orbits; touch keeps native scrolling
let userAz = .42, userEl = .06, lastInteract = -99, clock = 0, down = null;
cv.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); cv.classList.add('drag'); });
cv.addEventListener('pointermove', e => {
  if (!down) return;
  userAz -= (e.clientX - down.x)*.006; userEl = Math.min(.6, Math.max(.02, userEl + (e.clientY - down.y)*.004));
  down = { x: e.clientX, y: e.clientY }; lastInteract = clock;
});
const up = () => { down = null; cv.classList.remove('drag'); };
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

let narrow = false;
function resize() {
  const w = cv.clientWidth || innerWidth, h = cv.clientHeight || innerHeight;
  narrow = w < 700;
  px.setSize(w, h, narrow ? 480 : 960); // internal render width; higher = finer pixels
  camera.aspect = w/h; camera.fov = narrow ? 58 : 42; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

let visible = true;
new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(cv);

const MPS = 55.5, look = new THREE.Vector3();
let dist = 0, bob = 0, last = performance.now();
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last)/1000); last = now;
  if (!visible) return;
  clock += dt;
  const A = window.ARS || {};
  const v = reduced ? .25 : Math.min(1.25, (A.heroSpd ?? .5) * .75);
  const step = v*MPS*dt; dist += step;
  for (const s of scrollers) s.obj.position.x = ((s.base - dist) % s.loop + s.loop) % s.loop - s.loop/2;
  roadTex.offset.x = (dist/8) % 1; shTex.offset.x = (dist/8) % 1;
  const tw = clock*Math.max(v, .3), arr = seaPos.array;
  for (let i = 0; i < arr.length; i += 3) {
    const X = seaBase[i] + dist, Y = seaBase[i+1];
    arr[i+2] = .32*Math.sin(X*.19 + Y*.07 + tw*1.3) + .2*Math.sin(X*.07 - Y*.23 + tw*.9) + .12*Math.sin((X+Y)*.41 + tw*2.1);
  }
  seaPos.needsUpdate = true;
  bob += dt*v*30;
  C.body.position.y = .11 + Math.sin(bob)*.012*v + Math.sin(bob*.37)*.008*v;
  C.body.rotation.z = Math.sin(bob*.5)*.004*v;
  for (const w of C.wheels) { w.spin.rotation.z -= step/.36; const fast = v > .55; w.spokes.visible = !fast; w.blur.visible = fast; }
  const sk = Math.max(0, (v - .35)/.65);
  streaks.forEach((m, i) => { m.position.x -= v*MPS*1.25*m.userData.v*dt; if (m.position.x < -40) m.position.x = 40 + Math.random()*30; m.visible = i/streaks.length < sk; });
  puffT -= dt;
  if (puffT <= 0) {
    const m = puffs[puffIdx++ % puffs.length];
    m.position.set(C.P(1, 0)[0], .3, 1.1 + (Math.random() < .5 ? -.45 : .45)); m.userData.life = 0; m.userData.max = .5 + Math.random()*.4; m.scale.setScalar(1);
    puffT = .05/Math.max(v, .15);
  }
  for (const m of puffs) {
    if (m.userData.life >= 1) { m.material.opacity = 0; continue; }
    m.userData.life += dt*Math.max(v, .12)*1.6/m.userData.max;
    const f = Math.min(1, m.userData.life);
    m.position.x -= (v*14 + .5)*dt; m.position.y += dt*.6*Math.max(v, .2);
    m.scale.setScalar(1 + f*2.2); m.material.opacity = (1 - f)*.75;
  }
  // frame the car on the right on wide screens (name card sits left), low-centre on phones
  const idle = clock - lastInteract > 3;
  const az = userAz + (idle ? .2*Math.sin(clock*.16) : 0), el = userEl + (idle ? .025*Math.sin(clock*.11) : 0);
  const R = narrow ? 17 : 13.5;
  if (narrow) look.set(.4, 3.6, 1.1); else look.set(-4.2, 2.1, 1.1);
  const shake = v > .9 ? .015 : 0;
  camera.position.set(look.x + 4.2*!narrow + Math.sin(az)*Math.cos(el)*R + (Math.random()-.5)*shake,
                      look.y + Math.sin(el)*R + (Math.random()-.5)*shake,
                      look.z + Math.cos(az)*Math.cos(el)*R);
  camera.lookAt(look);
  sky.position.copy(camera.position);
  px.render(scene, camera);
}
requestAnimationFrame(frame);
})();
