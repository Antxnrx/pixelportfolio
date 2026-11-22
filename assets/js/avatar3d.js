// Driver's licence photo: low-poly 3D bust (fair skin, dark hair, aviators, racing jacket) against the sunset.
// Sets window.ARS_AVATAR3D so main.js skips the 2D helmet portrait.
(() => {
const K = window.ARS3D;
if (!K || !K.webglOK()) return;
const cv = document.getElementById('avatar');
let px;
try { px = K.pixelRenderer(cv); } catch (e) { return; }
window.ARS_AVATAR3D = true;

const { std, basic } = K;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(28, 176/208, .1, 2000);
camera.position.set(0, 1.55, 5); camera.lookAt(0, 1.3, 0);
const sky = K.sky({ top: '#56356f', mid: '#df7679', bot: '#f7a46e', fog: '#a2527f', sunDir: new THREE.Vector3(.32, .12, -1), sunR: .2 });
scene.add(sky);
// neutral-white key so the fair skin isn't tinted by the sunset; the pink stays on the rim
scene.add(new THREE.HemisphereLight(0xffffff, 0x56356f, .9));
const key = new THREE.DirectionalLight(0xfff6ee, 1.0); key.position.set(2.5, 3, 5); scene.add(key);
const rim = new THREE.DirectionalLight(0xff8ab0, .55); rim.position.set(-4, 2, -3); scene.add(rim);

const SKIN = std('#ffe8d6', { roughness: .85 }), SKIN_D = std('#f8d4bc', { roughness: .85 });
const HAIR = std('#2a1a1e', { roughness: .9 }), JACKET = std('#1d1631'), LENS = std('#16121f', { metalness: .6, roughness: .2 });
const mesh = (geo, m, x, y, z, parent) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); parent.add(o); return o; };

// torso + jacket
const bust = new THREE.Group(); scene.add(bust);
mesh(new THREE.CylinderGeometry(.8, 1.15, 1.2, 8), JACKET, 0, .3, 0, bust);
mesh(new THREE.BoxGeometry(.14, 1.05, .05), std('#f26b3a'), 0, .3, .98, bust).rotation.x = -.22;
mesh(new THREE.BoxGeometry(.06, 1.0, .06), basic('#ffd27a'), 0, .3, 1.0, bust).rotation.x = -.22;
for (const s of [-1, 1]) { const c = mesh(new THREE.BoxGeometry(.42, .2, .1), std('#f26b3a'), s*.3, .86, .55, bust); c.rotation.set(-.6, 0, s*.5); }
mesh(new THREE.CylinderGeometry(.19, .22, .4, 8), SKIN_D, 0, 1.0, .02, bust);

// head
const head = new THREE.Group(); head.position.set(0, 1.5, 0); bust.add(head);
const skull = mesh(new THREE.SphereGeometry(.42, 12, 10), SKIN, 0, 0, 0, head); skull.scale.set(.88, 1.08, .95);
mesh(new THREE.BoxGeometry(.5, .22, .5), SKIN, 0, -.27, .03, head).scale.set(.8, 1, .82); // jaw
for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(.06, .14, .1), SKIN_D, s*.38, -.02, 0, head);
mesh(new THREE.BoxGeometry(.08, .14, .1), SKIN_D, 0, -.06, .41, head); // nose
mesh(new THREE.BoxGeometry(.16, .025, .03), std('#c27a6a'), 0, -.22, .37, head); // mouth
// brows + a fringe of hair peeking out under the helmet
for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(.13, .03, .04), HAIR, s*.15, .16, .4, head);
mesh(new THREE.BoxGeometry(.42, .06, .06), HAIR, 0, .26, .37, head).rotation.x = -.3;

// full-face racing helmet. Built from spheres, then sculpted so it reads as a helmet, not a ball:
// longer front-to-back, slightly narrow, chin bar jutting forward, flat neck opening.
let visorGlint;
{
  const C0 = -.02; // helmet centre (head space)
  function sculpt(geo) {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      x *= .92; y *= 1.06;
      if (z < 0) z *= 1.16;                                   // longer at the back
      if (y < -.04 && z > 0) z += (-.04 - y)*.62*(z/.55);     // chin bar pushes forward
      if (y < -.44) y = -.44 + (y + .44)*.2;                  // flat neck opening
      if (y > .3) y = .3 + (y - .3)*.9;                       // slightly flatter crown
      p.setXYZ(i, x, y + C0, z);
    }
    p.needsUpdate = true; geo.computeVertexNormals(); return geo;
  }
  const g = sculpt(new THREE.SphereGeometry(.55, 24, 18, 0, Math.PI*2, 0, Math.PI*.84));
  const pos = g.attributes.position, cols = new Float32Array(pos.count*3), c = new THREE.Color();
  const ramp = ['#ffd27a', '#ff9a4a', '#f26b3a', '#e8384e'].map(h => new THREE.Color(h));
  for (let i = 0; i < pos.count; i++) {
    const t = Math.min(.999, Math.max(0, (.55 - pos.getY(i))/.98)), k = t*3, j = Math.floor(k);
    c.copy(ramp[j]).lerp(ramp[j + 1], k - j); cols.set([c.r, c.g, c.b], i*3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  mesh(g, std(0xffffff, { vertexColors: true, roughness: .28, metalness: .2 }), 0, 0, 0, head);
  // centre stripe, brow to nape (baked into helmet space, then sculpted)
  const sg = new THREE.TorusGeometry(.56, .045, 4, 28, Math.PI*.92).rotateZ(Math.PI*.04).rotateY(Math.PI/2);
  mesh(sculpt(sg), std('#fff0d0'), 0, 0, 0, head);
  // visor (down): wide tinted window across the eyes, gold trim along its top edge
  const vg = sculpt(new THREE.SphereGeometry(.57, 20, 6, Math.PI*.2, Math.PI*.6, Math.PI*.35, Math.PI*.2));
  mesh(vg, std('#24325e', { metalness: .85, roughness: .08, side: THREE.DoubleSide, emissive: 0x1a2450 }), 0, 0, 0, head);
  const eg = sculpt(new THREE.SphereGeometry(.578, 20, 1, Math.PI*.19, Math.PI*.62, Math.PI*.34, Math.PI*.025));
  mesh(eg, std('#ffd27a', { metalness: .8, side: THREE.DoubleSide }), 0, 0, 0, head);
  for (const s of [-1, 1]) { // visor pivot pods
    const pod = mesh(new THREE.CylinderGeometry(.07, .07, .05, 10), std('#16121f'), s*.5, .05, .08, head); pod.rotation.z = Math.PI/2;
  }
  visorGlint = mesh(new THREE.BoxGeometry(.05, .14, .02), basic('#ffffff'), 0, .06, .58, head); visorGlint.rotation.z = .5;
  // chin vents, breath guard, rear spoiler
  for (const dx of [-.08, 0, .08]) mesh(new THREE.BoxGeometry(.035, .09, .03), std('#16121f'), dx, -.3, .62, head);
  mesh(new THREE.BoxGeometry(.3, .05, .12), std('#16121f'), 0, -.44, .5, head).rotation.x = .3;
  const spoiler = mesh(new THREE.BoxGeometry(.36, .05, .16), std('#16121f'), 0, .2, -.6, head); spoiler.rotation.x = -.45;
  mesh(new THREE.CylinderGeometry(.34, .36, .1, 16), std('#16121f'), 0, -.5, -.02, head).scale.z = 1.1; // neck roll
}
// aviators
for (const s of [-1, 1]) {
  mesh(new THREE.BoxGeometry(.25, .15, .04), LENS, s*.15, .05, .41, head);
  mesh(new THREE.BoxGeometry(.03, .025, .38), std('#ffd27a', { metalness: .8 }), s*.36, .09, .22, head);
}
mesh(new THREE.BoxGeometry(.08, .025, .03), std('#ffd27a', { metalness: .8 }), 0, .1, .42, head);
const glint = mesh(new THREE.BoxGeometry(.05, .03, .01), basic('#ffffff'), -.2, .09, .435, head);

const W = () => cv.clientWidth || 176, H = () => cv.clientHeight || 208;
function resize() { px.setSize(W(), H(), 140); camera.aspect = W()/H(); camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
K.loop(cv, (dt, t) => {
  if (!reduced) {
    head.rotation.y = Math.sin(t*.5)*.32;
    head.rotation.x = Math.sin(t*.37)*.04;
    head.rotation.z = Math.sin(t*.29)*.03;
    bust.position.y = Math.sin(t*1.6)*.01;
    const g = (t % 4) / 4; // glint sweeps across the visor every 4s
    visorGlint.visible = g < .3; visorGlint.position.x = -.3 + g/.3*.6;
    visorGlint.position.z = Math.sqrt(Math.max(0, .57*.57 - visorGlint.position.x**2)) + .01;
  }
  sky.position.copy(camera.position);
  px.render(scene, camera);
});
})();
