// Shared three.js pieces for the hero and the world tour:
// palette-locked Bayer dither post pass, gradient sky with striped sun, car builder.
(() => {
if (!window.THREE) return;

const PALETTE = ['#120c1f','#1d1631','#2b1f4e','#3a2a60','#4a2b62','#56356f','#6c3f88','#904f86','#a2527f',
  '#c86f88','#df7679','#ff5c6a','#ff8a5a','#f7a46e','#ffd890','#fff0a8','#fff0d0',
  '#f26b3a','#c94530','#8a2a2a','#ffa064','#e8384e','#ffd27a','#24325e','#6a6f95','#9ed2ee','#d2d6ee','#57e36f',
  // added for the world tour: blues, greens, white, near-black
  '#2e4fb8','#5aa8ff','#1d5a3a','#2f9e5a','#9ff07a','#ffffff','#16121f','#d9a8ff',
  // sakura pinks
  '#ffe4ee','#ffb7d0','#ff8ab0','#e0608a',
  // fair skin ramp + hair
  '#ffe8d6','#f8d4bc','#ecb89c','#d29a80','#2a1a1e','#4a2e2a'];

const BAYER = `
  float b2(vec2 a){ return a.x==0. ? (a.y==0.?0.:2.) : (a.y==0.?3.:1.); }
  float bayer(vec2 p){ vec2 q = mod(floor(p),4.); return (4.*b2(mod(q,2.)) + b2(floor(q/2.)) + .5)/16.; }`;

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); }
  catch (e) { return false; }
}

// Renderer + low-res target + dither pass. render(scene, cam) does both passes.
function pixelRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  const rt = new THREE.WebGLRenderTarget(16, 16, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const mat = new THREE.ShaderMaterial({
    uniforms: { tex: { value: rt.texture }, pal: { value: PALETTE.map(h => new THREE.Color(h)) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
    fragmentShader: `
      uniform sampler2D tex; uniform vec3 pal[${PALETTE.length}]; varying vec2 vUv; ${BAYER}
      void main(){
        vec3 c = texture2D(tex, vUv).rgb, w = vec3(.35,.5,.25);
        float d1 = 1e9, d2 = 1e9; vec3 c1 = c, c2 = c;
        for (int i = 0; i < ${PALETTE.length}; i++) {
          vec3 e = c - pal[i]; float d = dot(e*e, w);
          if (d < d1) { d2 = d1; c2 = c1; d1 = d; c1 = pal[i]; } else if (d < d2) { d2 = d; c2 = pal[i]; }
        }
        float a = sqrt(d1), b = sqrt(d2);
        gl_FragColor = vec4(bayer(gl_FragCoord.xy) < a/(a+b+1e-5) ? c2 : c1, 1.);
      }`,
    depthTest: false, depthWrite: false,
  });
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  return {
    renderer,
    setSize(cssW, cssH, targetW) {
      const div = Math.max(1.25, cssW / targetW);
      const rw = Math.max(1, Math.round(cssW / div)), rh = Math.max(1, Math.round(cssH / div));
      renderer.setSize(rw, rh, false); rt.setSize(rw, rh);
    },
    render(scene, cam) {
      renderer.setRenderTarget(rt); renderer.render(scene, cam);
      renderer.setRenderTarget(null); renderer.render(postScene, postCam);
    },
  };
}

// Sky dome: 3-stop gradient + halo + striped retro sun. Colours are uniforms so they can be lerped.
function sky(opts = {}) {
  const u = {
    sunDir: { value: (opts.sunDir || new THREE.Vector3(-.37, .075, -1)).clone().normalize() },
    cTop: { value: new THREE.Color(opts.top || '#2b1f4e') },
    cMid: { value: new THREE.Color(opts.mid || '#df7679') },
    cBot: { value: new THREE.Color(opts.bot || '#ffd890') },
    fogCol: { value: new THREE.Color(opts.fog || '#ee9a80') },
    sunA: { value: new THREE.Color(opts.sunA || '#ff5c6a') },
    sunB: { value: new THREE.Color(opts.sunB || '#fff0a8') },
    sunR: { value: opts.sunR || .125 },
  };
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: u,
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
      uniform vec3 sunDir, cTop, cMid, cBot, fogCol, sunA, sunB; uniform float sunR; varying vec3 vDir; ${BAYER}
      void main(){
        vec3 d = normalize(vDir); float dz = bayer(gl_FragCoord.xy);
        if (d.y < 0.) { gl_FragColor = vec4(fogCol,1.); return; }
        float t = floor(pow(clamp(d.y/.55,0.,1.), .6)*16. + dz)/16.;
        vec3 col = t < .5 ? mix(cBot, cMid, t*2.) : mix(cMid, cTop, (t-.5)*2.);
        float ang = acos(clamp(dot(d,sunDir),-1.,1.)), R = sunR;
        col = mix(col, mix(sunB, vec3(1.), .3), floor((1. - smoothstep(R, R*2.6, ang))*4. + dz)/4. * .38);
        if (ang < R) {
          float sy = (d.y - sunDir.y)/R; bool gap = false;
          if (sy < .2) { float k = .2 - sy; if (mod(k, .26) < .05 + k*.11) gap = true; }
          if (!gap) col = mix(sunA, sunB, floor(clamp((sy+1.)/2.,0.,1.)*5. + dz)/5.);
        }
        gl_FragColor = vec4(col,1.);
      }`,
  }));
  mesh.userData.u = u;
  return mesh;
}

const std = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, flatShading: true, roughness: .6, metalness: .1 }, o));
const basic = (color, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color }, o));

function speckTexture(base, specks, density, size = 64) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (Math.random() < density) {
    g.fillStyle = specks[(Math.random()*specks.length)|0]; g.fillRect(x, y, 1, 1);
  }
  return nearest(new THREE.CanvasTexture(c), true);
}
function nearest(t, repeat) {
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
// Lit-window facade texture for skyline boxes.
function windowTexture(wall = '#1d1631', lit = ['#ffd890', '#fff0a8', '#f7a46e'], density = .35) {
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d'); g.fillStyle = wall; g.fillRect(0, 0, 32, 32);
  for (let y = 2; y < 32; y += 4) for (let x = 2; x < 32; x += 4) {
    g.fillStyle = Math.random() < density ? lit[(Math.random()*lit.length)|0] : '#0d0918';
    g.fillRect(x, y, 2, 2);
  }
  return nearest(new THREE.CanvasTexture(c), true);
}

// ---------- Cars ----------
// Profiles are drawn in the 2D sprite's 104x37 pixel space (y down, ground line at 29),
// so every body shares the hero sprite's proportions. `up` runs front-bottom → roof → rear-bottom.
const PROFILES = {
  gt:       { up:[[99,29],[102,25],[102,19],[99,16],[79,12],[63,4],[37,5],[30,13],[9,15],[2,18],[2,29]],
              glass:[[38,7],[61,6],[75,12],[33,13]], wheels:[24,82], head:[102.3,18.6], tail:[1.6,19.5], wing:[5.5,10.2] },
  wedge:    { up:[[100,29],[103,24],[102,21],[74,15],[60,9],[42,9],[30,15],[6,16],[2,19],[2,29]],
              glass:[[44,10],[59,10],[71,15],[33,15]], wheels:[22,82], head:[102.4,21.6], tail:[1.6,20] },
  muscle:   { up:[[100,29],[102,26],[102,18],[70,16],[60,8],[40,8],[30,15],[4,15],[2,17],[2,29]],
              glass:[[41,9],[59,9],[67,15],[33,15]], wheels:[22,80], head:[102.4,19.5], tail:[1.6,18.5], scoop:[78,15.2] },
  hyper:    { up:[[101,29],[104,25],[103,22],[78,17],[64,10],[48,9],[36,13],[14,15],[2,14],[2,29]],
              glass:[[49,10],[63,11],[74,16],[38,15]], wheels:[22,84], head:[103.4,22.6], tail:[1.6,17], wing:[4,9], fin:true },
  // long-nose, cab-rearward 90s JDM coupe with a hoop wing (the footer's Supra)
  supra:    { up:[[100,29],[103,25],[103,21],[98,18],[80,16],[66,14],[56,8],[42,7],[30,11],[20,14],[6,14],[3,13],[2,17],[2,29]],
              glass:[[42.5,8],[55.5,8.5],[64.5,14],[30.5,12.5]], wheels:[22,82], head:[103.2,20.5], tail:[1.6,17.5], wing:[7,8.6] },
  roadster: { up:[[99,29],[102,25],[101,20],[80,17],[66,16],[56,16],[30,16],[8,16],[2,19],[2,29]],
              glass:[[58,11],[61,11],[67,16],[55,16]], wheels:[24,80], head:[102,21.5], tail:[1.6,20.5], open:true },
};
const P = (px, py) => [(px - 52) / 24, (35 - py) / 24];

function buildCar(spec = {}) {
  const pr = PROFILES[spec.p || 'gt'], W = spec.width || 1.9;
  const [cTop, cMid, cBot] = (spec.c || ['#ffd27a','#ff7a3c','#e8384e']).map(h => new THREE.Color(h));
  const car = new THREE.Group(), body = new THREE.Group(); body.position.y = .11; car.add(body);

  const s = new THREE.Shape(); s.moveTo(...P(2, 29));
  for (const wx of pr.wheels) { s.lineTo(...P(wx - 10, 29)); s.absarc(...P(wx, 29), 10/24, Math.PI, 0, true); }
  pr.up.forEach(p => s.lineTo(...P(...p)));
  const g = new THREE.ExtrudeGeometry(s, { depth: W - .08, bevelEnabled: true, bevelThickness: .04, bevelSize: .03, bevelSegments: 1, curveSegments: 6 });
  g.translate(0, 0, -(W - .08)/2);
  // the sun's ramp, top → bottom
  g.computeBoundingBox();
  const y0 = g.boundingBox.min.y, y1 = g.boundingBox.max.y;
  const pos = g.attributes.position, cols = new Float32Array(pos.count*3), tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getY(i) - y0) / (y1 - y0);
    if (t > .5) tmp.copy(cMid).lerp(cTop, (t - .5)/.5); else tmp.copy(cBot).lerp(cMid, t/.5);
    cols[i*3] = tmp.r; cols[i*3+1] = tmp.g; cols[i*3+2] = tmp.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  body.add(new THREE.Mesh(g, std(0xffffff, { vertexColors: true, roughness: .5, metalness: 0, emissive: 0x2a0c14 })));
  const paint = std(cMid.getHex(), { roughness: .35, metalness: .3 });

  const glass = std(0x24325e, { roughness: .08, metalness: .7, emissive: 0x141c3a });
  const gs = new THREE.Shape(pr.glass.map(p => new THREE.Vector2(...P(...p))));
  const gw = pr.open ? W - .3 : W + .02;
  const gg = new THREE.ExtrudeGeometry(gs, { depth: gw, bevelEnabled: false }); gg.translate(0, 0, -gw/2);
  body.add(new THREE.Mesh(gg, glass));
  if (pr.open) { // cockpit + two seat backs
    const pit = new THREE.Mesh(new THREE.BoxGeometry(1.0, .06, W - .5), std(0x16121f)); pit.position.set(...P(44, 15.6), 0); body.add(pit);
    for (const z of [-.38, .38]) { const st = new THREE.Mesh(new THREE.BoxGeometry(.14, .34, .5), std(0x3a1f3a)); st.position.set(...P(38, 12), z); st.rotation.z = .2; body.add(st); }
  }
  const cream = std(0xfff0d0, { roughness: .4 }), dark = std(0x1f1830, { metalness: .4 });
  for (const side of [-1, 1]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(.06, .08, .34), basic(0xfff6c8));
    hl.position.set(...P(...pr.head), side * .58); body.add(hl);
    const st = new THREE.Mesh(new THREE.BoxGeometry(3.6, .035, .02), cream);
    st.position.set(...P(52, 20), side * (W/2 + .045)); body.add(st);
  }
  const tail = new THREE.Mesh(new THREE.BoxGeometry(.05, .09, W - .3), basic(0xff3b5c));
  tail.position.set(...P(...pr.tail), 0); body.add(tail);
  if (pr.wing) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(.5, .05, W + .05), dark);
    wing.position.set(...P(...pr.wing), 0); wing.rotation.z = .08; body.add(wing);
    for (const side of [-1, 1]) { const su = new THREE.Mesh(new THREE.BoxGeometry(.05, .2, .05), dark); su.position.set(...P(pr.wing[0] + .5, pr.wing[1] + 2.4), side*.6); body.add(su); }
  }
  if (pr.fin) { const f = new THREE.Mesh(new THREE.BoxGeometry(1.1, .3, .04), paint); f.position.set(...P(22, 11.5), 0); body.add(f); }
  if (pr.scoop) { const sc = new THREE.Mesh(new THREE.BoxGeometry(.7, .12, .5), dark); sc.position.set(...P(...pr.scoop), 0); body.add(sc); }

  const tireMat = std(0x17111f, { roughness: .9 }), rimMat = std(0xd2d6ee, { metalness: .8, roughness: .25 }), spokeMat = std(0x4e5070, { metalness: .5 });
  const wheels = [];
  for (const wx of pr.wheels) for (const side of [-1, 1]) {
    const spin = new THREE.Group(); spin.position.set(P(wx, 0)[0], .36, side * (W/2 - .12)); car.add(spin);
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .32, 16), tireMat); tire.rotation.x = Math.PI/2; spin.add(tire);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .335, 10), rimMat); rim.rotation.x = Math.PI/2; spin.add(rim);
    const spokes = new THREE.Group(); spin.add(spokes);
    for (let k = 0; k < 5; k++) {
      const a = k*Math.PI*2/5, sp = new THREE.Mesh(new THREE.BoxGeometry(.06, .2, .02), spokeMat);
      sp.position.set(Math.sin(a)*.11, Math.cos(a)*.11, side*.172); sp.rotation.z = -a; spokes.add(sp);
    }
    const hub = new THREE.Mesh(new THREE.BoxGeometry(.07, .07, .02), basic(0xe04848)); hub.position.z = side*.175; spin.add(hub);
    wheels.push({ spin, spokes });
  }
  car.add(shadow(5.6, 2.8));
  return { car, body, wheels, paint, W, P };
}

let shadowTex = null;
function shadow(w, h) {
  if (!shadowTex) {
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const g = c.getContext('2d'), rg = g.createRadialGradient(16,16,2,16,16,16);
    rg.addColorStop(0, 'rgba(10,6,20,.8)'); rg.addColorStop(1, 'rgba(10,6,20,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 32, 32);
    shadowTex = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI/2; m.position.y = .02;
  return m;
}

// rAF loop that only calls frame(dt, t) while `el` is on screen
function loop(el, frame) {
  let vis = false, last = performance.now(), t = 0;
  new IntersectionObserver(e => { vis = e[0].isIntersecting; }).observe(el);
  (function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min(.05, (now - last)/1000); last = now;
    if (vis) { t += dt; frame(dt, t); }
  })(last);
}
// canvas-texture label (Silkscreen), redrawn once the font loads
function label(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const t = nearest(new THREE.CanvasTexture(c));
  const paint = () => { draw(c.getContext('2d'), w, h); t.needsUpdate = true; };
  paint(); document.fonts && document.fonts.load('700 12px Silkscreen').then(paint).catch(() => {});
  return t;
}

window.ARS3D = { loop, label, webglOK, pixelRenderer, sky, std, basic, speckTexture, windowTexture, nearest, buildCar, shadow, P, PALETTE };
})();
