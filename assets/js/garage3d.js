// THE GARAGE: each bay shows a different car parked on a slow turntable inside a little workshop.
// One shared WebGL renderer draws all four bays, then each frame is copied into the bay's own 2D canvas,
// so the page doesn't pay for four extra WebGL contexts.
(() => {
const K = window.ARS3D;
const bays = [...document.querySelectorAll('.garage .bay')];
const shots = bays.map(b => b.querySelector('.shot canvas')).filter(Boolean);
if (!K || !K.webglOK() || !shots.length) return;
const off = document.createElement('canvas');
let px;
try { px = K.pixelRenderer(off); } catch (e) { return; }

const { std, basic } = K;
const SPECS = [
  { car: { p: 'hyper',    c: ['#bfe6ff', '#5aa8ff', '#2e4fb8'] }, neon: '#5aa8ff', wall: '#24325e' }, // AI SYSTEMS
  { car: { p: 'gt',       c: ['#ffd27a', '#ff7a3c', '#e8384e'] }, neon: '#ffd84a', wall: '#3a2a60' }, // SOFTWARE
  { car: { p: 'muscle',   c: ['#9ff07a', '#2f9e5a', '#1d5a3a'] }, neon: '#57e36f', wall: '#1d1631' }, // AUTOMATION
  { car: { p: 'roadster', c: ['#ffe4ee', '#ff8ab0', '#e0608a'] }, neon: '#ff8ab0', wall: '#4a2b62' }, // DESIGN
];

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 4/3, .1, 100);
camera.position.set(5.6, 3.1, 7.8); camera.lookAt(0, .8, 0);
scene.add(new THREE.HemisphereLight(0xe0d0ff, 0x1d1631, .7));
const lamp = new THREE.PointLight(0xfff0d0, 1.6, 14); lamp.position.set(0, 4, 1.5); scene.add(lamp);
const key = new THREE.DirectionalLight(0xffd0b0, .6); key.position.set(5, 6, 6); scene.add(key);

// workshop shell
const wallMat = std('#3a2a60', { roughness: .9 });
const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 7), wallMat); back.position.set(0, 3, -3); scene.add(back);
const side = new THREE.Mesh(new THREE.PlaneGeometry(10, 7), wallMat); side.position.set(-5, 3, 1); side.rotation.y = Math.PI/2; scene.add(side);
const floorTex = K.speckTexture('#2b2245', ['#352c52','#211a37','#3d3360'], .1); floorTex.repeat.set(4, 4);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), std(0xffffff, { map: floorTex, roughness: .5, metalness: .2 })); floor.rotation.x = -Math.PI/2; scene.add(floor);
// pegboard with tool silhouettes
const peg = K.label(96, 40, (g, w, h) => {
  g.fillStyle = '#c8a070'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#8a5a4a'; for (let y = 3; y < h; y += 5) for (let x = 3; x < w; x += 5) g.fillRect(x, y, 1, 1);
  g.fillStyle = '#16121f';
  g.fillRect(8, 8, 3, 22); g.fillRect(6, 6, 7, 4);                     // wrench
  g.fillRect(20, 10, 12, 3); g.fillRect(30, 8, 4, 7);                    // hammer
  g.fillRect(42, 6, 2, 24); g.fillRect(40, 26, 6, 6);                   // screwdriver
  g.fillRect(54, 10, 10, 10); g.fillStyle = '#c8a070'; g.fillRect(57, 13, 4, 4); g.fillStyle = '#16121f'; // gear
  g.fillRect(70, 8, 2, 20); g.fillRect(76, 8, 2, 20); g.fillRect(70, 8, 8, 2); // spanner
  g.fillRect(84, 14, 8, 14);                                            // oil can
});
const board = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 2.25), new THREE.MeshBasicMaterial({ map: peg })); board.position.set(-.6, 2.9, -2.98); scene.add(board);
// neon strip (colour per bay) + shelf with tyres
const neonMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const neon = new THREE.Mesh(new THREE.BoxGeometry(6, .12, .06), neonMat); neon.position.set(0, 4.6, -2.95); scene.add(neon);
const shelf = new THREE.Mesh(new THREE.BoxGeometry(.6, .1, 3), std('#6a6f95')); shelf.position.set(-4.65, 1.5, -.5); scene.add(shelf);
for (let k = 0; k < 3; k++) { const t = new THREE.Mesh(new THREE.TorusGeometry(.32, .14, 6, 10), std('#16121f')); t.position.set(-4.6, 1.95, -1.5 + k*.9); t.rotation.y = Math.PI/2; scene.add(t); }
// toolbox + jack
const tb = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, .7), std('#e8384e')); tb.position.set(3.6, .55, -2.4); scene.add(tb);
for (let k = 0; k < 3; k++) { const d = new THREE.Mesh(new THREE.BoxGeometry(1.1, .04, .02), basic('#16121f')); d.position.set(3.6, .3 + k*.3, -2.04); scene.add(d); }
// turntable
const table = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 2.9, .1, 24), std('#6a6f95', { metalness: .6, roughness: .3 })); table.position.y = .05; scene.add(table);
const ring = new THREE.Mesh(new THREE.TorusGeometry(2.9, .05, 4, 32), basic('#ffd84a')); ring.rotation.x = Math.PI/2; ring.position.y = .11; scene.add(ring);
const spin = new THREE.Group(); spin.position.y = .1; scene.add(spin);
const cars = SPECS.map(s => { const c = K.buildCar(s.car); c.car.scale.setScalar(.9); c.car.visible = false; spin.add(c.car); return c; });

// 2D targets
const ctxs = shots.map(c => c.getContext('2d'));
function size() {
  const w = shots[0].clientWidth || 240, h = shots[0].clientHeight || 190;
  px.setSize(w, h, 200);
  shots.forEach((c, i) => { c.width = off.width; c.height = off.height; ctxs[i].imageSmoothingEnabled = false; });
  camera.aspect = w/h; camera.updateProjectionMatrix();
}
addEventListener('resize', size); size();

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const tmp = new THREE.Color();
K.loop(document.querySelector('.garage'), (dt, t) => {
  spin.rotation.y = reduced ? .6 : t*.35;
  SPECS.forEach((s, i) => {
    if (!ctxs[i]) return;
    cars.forEach((c, k) => c.car.visible = k === i);
    wallMat.color.set(s.wall);
    neonMat.color.copy(tmp.set(s.neon)).multiplyScalar(.85 + .15*Math.sin(t*6 + i));
    lamp.color.set(s.neon).lerp(new THREE.Color(0xfff0d0), .6);
    px.render(scene, camera);
    if (shots[i].width !== off.width) size();
    ctxs[i].drawImage(off, 0, 0);
  });
});
})();
