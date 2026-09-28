/* Flüssigkeits-Simulation (WebGL) für den Hero.
   Reagiert auf Maus und Finger. Läuft nur, wenn WebGL verfügbar ist
   und keine reduzierte Bewegung gewünscht ist. */
(function () {
  var canvas = document.querySelector('.fluid');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var small = window.innerWidth < 700;
  var SIM_RES = small ? 96 : 128;
  var DYE_RES = small ? 384 : 768;
  var PRESSURE_ITER = small ? 14 : 20;
  var CURL = 22;
  var SPLAT_RADIUS = 0.22;
  var SPLAT_FORCE = 5000;
  var VEL_DISSIPATION = 0.25;
  var DYE_DISSIPATION = 0.9;

  var opts = { alpha: false, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
  var gl = canvas.getContext('webgl2', opts);
  var isGL2 = !!gl;
  if (!gl) gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
  if (!gl) return;

  var halfFloatType, linear;
  if (isGL2) {
    gl.getExtension('EXT_color_buffer_float');
    linear = gl.getExtension('OES_texture_float_linear');
    halfFloatType = gl.HALF_FLOAT;
  } else {
    var hf = gl.getExtension('OES_texture_half_float');
    linear = gl.getExtension('OES_texture_half_float_linear');
    halfFloatType = hf && hf.HALF_FLOAT_OES;
  }
  if (!halfFloatType) return;
  var internalFormat = isGL2 ? gl.RGBA16F : gl.RGBA;
  var filtering = linear ? gl.LINEAR : gl.NEAREST;

  /* ---------- Shader ---------- */

  var HEAD = 'precision highp float;\nprecision mediump sampler2D;\n';

  var baseVS = HEAD +
    'attribute vec2 aPosition;\n' +
    'varying vec2 vUv, vL, vR, vT, vB;\n' +
    'uniform vec2 texelSize;\n' +
    'void main () {\n' +
    '  vUv = aPosition * 0.5 + 0.5;\n' +
    '  vL = vUv - vec2(texelSize.x, 0.0);\n' +
    '  vR = vUv + vec2(texelSize.x, 0.0);\n' +
    '  vT = vUv + vec2(0.0, texelSize.y);\n' +
    '  vB = vUv - vec2(0.0, texelSize.y);\n' +
    '  gl_Position = vec4(aPosition, 0.0, 1.0);\n' +
    '}';

  var FS = {
    clear:
      'varying vec2 vUv; uniform sampler2D uTexture; uniform float value;\n' +
      'void main () { gl_FragColor = value * texture2D(uTexture, vUv); }',
    splat:
      'varying vec2 vUv; uniform sampler2D uTarget; uniform float aspectRatio; uniform vec3 color; uniform vec2 point; uniform float radius;\n' +
      'void main () {\n' +
      '  vec2 p = vUv - point; p.x *= aspectRatio;\n' +
      '  vec3 s = exp(-dot(p, p) / radius) * color;\n' +
      '  gl_FragColor = vec4(texture2D(uTarget, vUv).xyz + s, 1.0);\n' +
      '}',
    advection:
      'varying vec2 vUv; uniform sampler2D uVelocity; uniform sampler2D uSource;\n' +
      'uniform vec2 texelSize; uniform vec2 dyeTexelSize; uniform float dt; uniform float dissipation;\n' +
      'vec4 bilerp (sampler2D sam, vec2 uv, vec2 ts) {\n' +
      '  vec2 st = uv / ts - 0.5; vec2 iuv = floor(st); vec2 f = fract(st);\n' +
      '  vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * ts);\n' +
      '  vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * ts);\n' +
      '  vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * ts);\n' +
      '  vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * ts);\n' +
      '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);\n' +
      '}\n' +
      'void main () {\n' +
      '#ifdef MANUAL_FILTERING\n' +
      '  vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;\n' +
      '  vec4 result = bilerp(uSource, coord, dyeTexelSize);\n' +
      '#else\n' +
      '  vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;\n' +
      '  vec4 result = texture2D(uSource, coord);\n' +
      '#endif\n' +
      '  gl_FragColor = result / (1.0 + dissipation * dt);\n' +
      '}',
    divergence:
      'varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uVelocity;\n' +
      'void main () {\n' +
      '  float L = texture2D(uVelocity, vL).x; float R = texture2D(uVelocity, vR).x;\n' +
      '  float T = texture2D(uVelocity, vT).y; float B = texture2D(uVelocity, vB).y;\n' +
      '  vec2 C = texture2D(uVelocity, vUv).xy;\n' +
      '  if (vL.x < 0.0) L = -C.x; if (vR.x > 1.0) R = -C.x;\n' +
      '  if (vT.y > 1.0) T = -C.y; if (vB.y < 0.0) B = -C.y;\n' +
      '  gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);\n' +
      '}',
    curl:
      'varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uVelocity;\n' +
      'void main () {\n' +
      '  float L = texture2D(uVelocity, vL).y; float R = texture2D(uVelocity, vR).y;\n' +
      '  float T = texture2D(uVelocity, vT).x; float B = texture2D(uVelocity, vB).x;\n' +
      '  gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);\n' +
      '}',
    vorticity:
      'varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float curl; uniform float dt;\n' +
      'void main () {\n' +
      '  float L = texture2D(uCurl, vL).x; float R = texture2D(uCurl, vR).x;\n' +
      '  float T = texture2D(uCurl, vT).x; float B = texture2D(uCurl, vB).x;\n' +
      '  float C = texture2D(uCurl, vUv).x;\n' +
      '  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));\n' +
      '  force /= length(force) + 0.0001; force *= curl * C; force.y *= -1.0;\n' +
      '  vec2 vel = texture2D(uVelocity, vUv).xy + force * dt;\n' +
      '  gl_FragColor = vec4(clamp(vel, -1000.0, 1000.0), 0.0, 1.0);\n' +
      '}',
    pressure:
      'varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uPressure; uniform sampler2D uDivergence;\n' +
      'void main () {\n' +
      '  float L = texture2D(uPressure, vL).x; float R = texture2D(uPressure, vR).x;\n' +
      '  float T = texture2D(uPressure, vT).x; float B = texture2D(uPressure, vB).x;\n' +
      '  float div = texture2D(uDivergence, vUv).x;\n' +
      '  gl_FragColor = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);\n' +
      '}',
    gradient:
      'varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uPressure; uniform sampler2D uVelocity;\n' +
      'void main () {\n' +
      '  float L = texture2D(uPressure, vL).x; float R = texture2D(uPressure, vR).x;\n' +
      '  float T = texture2D(uPressure, vT).x; float B = texture2D(uPressure, vB).x;\n' +
      '  vec2 vel = texture2D(uVelocity, vUv).xy - vec2(R - L, T - B);\n' +
      '  gl_FragColor = vec4(vel, 0.0, 1.0);\n' +
      '}',
    display:
      'varying vec2 vUv; uniform sampler2D uTexture;\n' +
      'void main () {\n' +
      '  vec3 c = texture2D(uTexture, vUv).rgb;\n' +
      '  c = c / (1.0 + c);\n' + /* weiches Tonemapping, nichts brennt aus */
      '  gl_FragColor = vec4(c, 1.0);\n' +
      '}'
  };

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, baseVS);

  function Program(fsSrc) {
    var p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, HEAD + fsSrc));
    gl.bindAttribLocation(p, 0, 'aPosition');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    this.p = p;
    this.u = {};
    var n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) {
      var name = gl.getActiveUniform(p, i).name;
      this.u[name] = gl.getUniformLocation(p, name);
    }
  }
  Program.prototype.bind = function () { gl.useProgram(this.p); };

  var P;
  try {
    P = {
      clear: new Program(FS.clear),
      splat: new Program(FS.splat),
      advection: new Program((linear ? '' : '#define MANUAL_FILTERING\n') + FS.advection),
      divergence: new Program(FS.divergence),
      curl: new Program(FS.curl),
      vorticity: new Program(FS.vorticity),
      pressure: new Program(FS.pressure),
      gradient: new Program(FS.gradient),
      display: new Program(FS.display)
    };
  } catch (e) {
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  function blit(target) {
    if (target) {
      gl.viewport(0, 0, target.w, target.h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    } else {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }

  /* ---------- Framebuffer ---------- */

  function FBO(w, h, filter) {
    gl.activeTexture(gl.TEXTURE0);
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, gl.RGBA, halfFloatType, null);
    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    this.tex = tex;
    this.fbo = fbo;
    this.w = w;
    this.h = h;
    this.tx = 1 / w;
    this.ty = 1 / h;
  }
  FBO.prototype.attach = function (id) {
    gl.activeTexture(gl.TEXTURE0 + id);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    return id;
  };

  function Double(w, h, filter) {
    this.read = new FBO(w, h, filter);
    this.write = new FBO(w, h, filter);
    this.ok = this.read.ok && this.write.ok;
    this.w = w;
    this.h = h;
    this.tx = 1 / w;
    this.ty = 1 / h;
  }
  Double.prototype.swap = function () {
    var t = this.read;
    this.read = this.write;
    this.write = t;
  };

  function res(r) {
    var ar = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (ar < 1) ar = 1 / ar;
    var a = Math.round(r), b = Math.round(r * ar);
    return gl.drawingBufferWidth > gl.drawingBufferHeight ? { w: b, h: a } : { w: a, h: b };
  }

  var dye, vel, pressure, divergence, curl;

  function initFBOs() {
    var s = res(SIM_RES), d = res(DYE_RES);
    dye = new Double(d.w, d.h, filtering);
    vel = new Double(s.w, s.h, filtering);
    pressure = new Double(s.w, s.h, gl.NEAREST);
    divergence = new FBO(s.w, s.h, gl.NEAREST);
    curl = new FBO(s.w, s.h, gl.NEAREST);
    return dye.ok && vel.ok && pressure.ok && divergence.ok && curl.ok;
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    var h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width === w && canvas.height === h) return false;
    canvas.width = w;
    canvas.height = h;
    return true;
  }

  resize();
  if (!initFBOs()) return;
  canvas.classList.add('is-on');

  /* ---------- Simulation ---------- */

  function step(dt) {
    gl.disable(gl.BLEND);

    P.curl.bind();
    gl.uniform2f(P.curl.u.texelSize, vel.tx, vel.ty);
    gl.uniform1i(P.curl.u.uVelocity, vel.read.attach(0));
    blit(curl);

    P.vorticity.bind();
    gl.uniform2f(P.vorticity.u.texelSize, vel.tx, vel.ty);
    gl.uniform1i(P.vorticity.u.uVelocity, vel.read.attach(0));
    gl.uniform1i(P.vorticity.u.uCurl, curl.attach(1));
    gl.uniform1f(P.vorticity.u.curl, CURL);
    gl.uniform1f(P.vorticity.u.dt, dt);
    blit(vel.write);
    vel.swap();

    P.divergence.bind();
    gl.uniform2f(P.divergence.u.texelSize, vel.tx, vel.ty);
    gl.uniform1i(P.divergence.u.uVelocity, vel.read.attach(0));
    blit(divergence);

    P.clear.bind();
    gl.uniform1i(P.clear.u.uTexture, pressure.read.attach(0));
    gl.uniform1f(P.clear.u.value, 0.8);
    blit(pressure.write);
    pressure.swap();

    P.pressure.bind();
    gl.uniform2f(P.pressure.u.texelSize, vel.tx, vel.ty);
    gl.uniform1i(P.pressure.u.uDivergence, divergence.attach(0));
    for (var i = 0; i < PRESSURE_ITER; i++) {
      gl.uniform1i(P.pressure.u.uPressure, pressure.read.attach(1));
      blit(pressure.write);
      pressure.swap();
    }

    P.gradient.bind();
    gl.uniform2f(P.gradient.u.texelSize, vel.tx, vel.ty);
    gl.uniform1i(P.gradient.u.uPressure, pressure.read.attach(0));
    gl.uniform1i(P.gradient.u.uVelocity, vel.read.attach(1));
    blit(vel.write);
    vel.swap();

    P.advection.bind();
    gl.uniform2f(P.advection.u.texelSize, vel.tx, vel.ty);
    if (P.advection.u.dyeTexelSize) gl.uniform2f(P.advection.u.dyeTexelSize, vel.tx, vel.ty);
    var vId = vel.read.attach(0);
    gl.uniform1i(P.advection.u.uVelocity, vId);
    gl.uniform1i(P.advection.u.uSource, vId);
    gl.uniform1f(P.advection.u.dt, dt);
    gl.uniform1f(P.advection.u.dissipation, VEL_DISSIPATION);
    blit(vel.write);
    vel.swap();

    if (P.advection.u.dyeTexelSize) gl.uniform2f(P.advection.u.dyeTexelSize, dye.tx, dye.ty);
    gl.uniform1i(P.advection.u.uVelocity, vel.read.attach(0));
    gl.uniform1i(P.advection.u.uSource, dye.read.attach(1));
    gl.uniform1f(P.advection.u.dissipation, DYE_DISSIPATION);
    blit(dye.write);
    dye.swap();
  }

  function render() {
    P.display.bind();
    gl.uniform1i(P.display.u.uTexture, dye.read.attach(0));
    blit(null);
  }

  function splat(x, y, dx, dy, color) {
    var ar = canvas.width / canvas.height;
    var r = SPLAT_RADIUS / 100;
    if (ar > 1) r *= ar;
    P.splat.bind();
    gl.uniform1i(P.splat.u.uTarget, vel.read.attach(0));
    gl.uniform1f(P.splat.u.aspectRatio, ar);
    gl.uniform2f(P.splat.u.point, x, y);
    gl.uniform3f(P.splat.u.color, dx, dy, 0);
    gl.uniform1f(P.splat.u.radius, r);
    blit(vel.write);
    vel.swap();
    gl.uniform1i(P.splat.u.uTarget, dye.read.attach(0));
    gl.uniform3f(P.splat.u.color, color[0], color[1], color[2]);
    blit(dye.write);
    dye.swap();
  }

  /* Kühles Weiß mit leichtem Blaustich */
  function tint(k) {
    var v = 0.12 + Math.random() * 0.1;
    return [v * 0.78 * k, v * 0.88 * k, v * k];
  }

  function randomSplats(n) {
    for (var i = 0; i < n; i++) {
      splat(Math.random(), Math.random() * 0.8 + 0.1, (Math.random() - 0.5) * 1200, (Math.random() - 0.5) * 1200, tint(3));
    }
  }

  /* ---------- Eingabe ---------- */

  var host = canvas.parentElement;
  var last = null;

  function move(clientX, clientY) {
    var r = canvas.getBoundingClientRect();
    var x = (clientX - r.left) / r.width;
    var y = 1 - (clientY - r.top) / r.height;
    if (last) {
      var ar = r.width / r.height;
      var dx = (x - last.x) * (ar < 1 ? ar : 1);
      var dy = (y - last.y) / (ar > 1 ? ar : 1);
      if (dx !== 0 || dy !== 0) splat(x, y, dx * SPLAT_FORCE, dy * SPLAT_FORCE, tint(1));
    }
    last = { x: x, y: y };
  }

  host.addEventListener('pointermove', function (e) { move(e.clientX, e.clientY); });
  host.addEventListener('pointerleave', function () { last = null; });
  host.addEventListener('touchmove', function (e) {
    var t = e.touches[0];
    if (t) move(t.clientX, t.clientY);
  }, { passive: true });
  host.addEventListener('touchend', function () { last = null; });

  /* Scrollen wirbelt die Flüssigkeit auf (vor allem fürs Handy) */
  var lastScroll = window.scrollY;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    var d = y - lastScroll;
    lastScroll = y;
    if (!visible || Math.abs(d) < 2) return;
    var x = 0.15 + Math.random() * 0.7;
    splat(x, 0.2 + Math.random() * 0.6, (Math.random() - 0.5) * 300, d * 25, tint(1.4));
  }, { passive: true });

  /* ---------- Schleife (pausiert, wenn Hero nicht sichtbar) ---------- */

  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(canvas);
  }

  var prev = performance.now();
  var idle = 0;
  randomSplats(5);

  function loop(now) {
    var dt = Math.min((now - prev) / 1000, 0.016666);
    prev = now;
    if (visible && !document.hidden) {
      if (resize()) initFBOs();
      idle += dt;
      if (idle > 3.5) {
        randomSplats(1 + Math.floor(Math.random() * 2));
        idle = 0;
      }
      step(dt);
      render();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
