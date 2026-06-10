const canvas = document.getElementById('bg');
const ctx    = canvas.getContext('2d');
let W, H;

// ── State ──
const state = {
  show:  { year: true, month: true, day: true, hours: true, minutes: true, seconds: true },
  scene: 'beach',
};
try {
  const s = JSON.parse(localStorage.getItem('wpPrefs') || '{}');
  if (s.show)  Object.assign(state.show, s.show);
  if (s.scene) state.scene = s.scene;
} catch {}

function save() { localStorage.setItem('wpPrefs', JSON.stringify(state)); }

// ── Clock ──
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function pad(n) { return String(n).padStart(2,'0'); }

function tick() {
  const now = new Date();
  const vals = {
    year:    String(now.getFullYear()),
    month:   MONTHS[now.getMonth()],
    day:     pad(now.getDate()),
    hours:   pad(now.getHours()),
    minutes: pad(now.getMinutes()),
    seconds: pad(now.getSeconds()),
  };
  for (const [u, v] of Object.entries(vals)) {
    const el = document.getElementById('val-' + u);
    if (!el) continue;
    if (el.textContent !== v) {
      el.textContent = v;
      el.classList.remove('changed');
      void el.offsetWidth;
      el.classList.add('changed');
    }
  }
}

function buildDisplay() {
  const disp = document.getElementById('clockDisplay');
  const dateU = ['year','month','day'];
  const timeU = ['hours','minutes','seconds'];
  const lbls  = { year:'year', month:'month', day:'day', hours:'hours', minutes:'min', seconds:'sec' };
  const vDate = dateU.filter(u => state.show[u]);
  const vTime = timeU.filter(u => state.show[u]);
  if (!vDate.length && !vTime.length) {
    disp.innerHTML = '<span class="empty-msg">Enable a unit below</span>';
    return;
  }
  let html = '';
  if (vDate.length) {
    html += '<div class="unit-group">';
    vDate.forEach((u,i) => {
      if (i) html += '<span class="sep">·</span>';
      html += `<div class="segment"><span class="seg-value" id="val-${u}"></span><span class="seg-label">${lbls[u]}</span></div>`;
    });
    html += '</div>';
  }
  if (vDate.length && vTime.length) html += '<div class="group-divider"></div>';
  if (vTime.length) {
    html += '<div class="unit-group">';
    vTime.forEach((u,i) => {
      if (i) html += '<span class="sep">:</span>';
      html += `<div class="segment"><span class="seg-value" id="val-${u}"></span><span class="seg-label">${lbls[u]}</span></div>`;
    });
    html += '</div>';
  }
  disp.innerHTML = html;
  tick();
}

// ── Scenes ──
const SCENES = {};

/* BEACH */
SCENES.beach = {
  init() {},
  draw(t) {
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.58);
    sky.addColorStop(0,   '#fbbf24');
    sky.addColorStop(0.45,'#f97316');
    sky.addColorStop(1,   '#ef4444');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * 0.58);

    // Sun glow
    const sx = W * 0.72, sy = H * 0.18;
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, H * 0.22);
    sg.addColorStop(0,   'rgba(255,255,180,0.9)');
    sg.addColorStop(0.25,'rgba(255,210,60,0.5)');
    sg.addColorStop(1,   'rgba(255,140,0,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, H*0.22, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,220,0.95)';
    ctx.beginPath(); ctx.arc(sx, sy, H*0.045, 0, Math.PI*2); ctx.fill();

    // Ocean
    const oc = ctx.createLinearGradient(0, H*0.58, 0, H*0.76);
    oc.addColorStop(0, '#0e7490');
    oc.addColorStop(1, '#155e75');
    ctx.fillStyle = oc; ctx.fillRect(0, H*0.58, W, H*0.18);

    // Waves
    for (let i = 0; i < 5; i++) {
      const wy = H * (0.595 + i * 0.03);
      const ph = t * (0.6 + i * 0.1) + i * 1.3;
      ctx.beginPath(); ctx.moveTo(0, wy);
      for (let x = 0; x <= W; x += 4)
        ctx.lineTo(x, wy + Math.sin(x * 0.012 + ph) * 7);
      ctx.strokeStyle = `rgba(255,255,255,${0.08 + i * 0.04})`;
      ctx.lineWidth = 1.5; ctx.stroke();
    }

    // Shore foam
    ctx.beginPath(); ctx.moveTo(0, H*0.76);
    for (let x = 0; x <= W; x += 3)
      ctx.lineTo(x, H*0.76 + Math.sin(x*0.018 + t*0.9)*4);
    ctx.lineTo(W, H*0.785); ctx.lineTo(0, H*0.785);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();

    // Sand
    const sand = ctx.createLinearGradient(0, H*0.76, 0, H);
    sand.addColorStop(0, '#d4a26a'); sand.addColorStop(1, '#a87c4a');
    ctx.fillStyle = sand; ctx.fillRect(0, H*0.76, W, H*0.24);

    // Shimmer on sand near water
    const shim = ctx.createLinearGradient(0, H*0.76, 0, H*0.82);
    shim.addColorStop(0, 'rgba(14,116,144,0.35)'); shim.addColorStop(1,'rgba(14,116,144,0)');
    ctx.fillStyle = shim; ctx.fillRect(0, H*0.76, W, H*0.06);
  }
};

/* FOREST */
SCENES.forest = {
  leaves: [],
  init() {
    this.leaves = Array.from({ length: 55 }, () => this.newLeaf(true));
  },
  newLeaf(random = false) {
    return {
      x:    Math.random() * W,
      y:    random ? Math.random() * H : -20,
      size: Math.random() * 9 + 4,
      vy:   Math.random() * 0.9 + 0.3,
      phase: Math.random() * Math.PI * 2,
      rot:  Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.03,
      col:  ['#4ade80','#22c55e','#a3e635','#86efac','#d4a76a','#fbbf24','#34d399'][Math.floor(Math.random()*7)],
    };
  },
  draw(t) {
    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#052e16'); bg.addColorStop(0.6,'#064e3b'); bg.addColorStop(1,'#022c22');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Light shafts
    for (let i = 0; i < 6; i++) {
      const lx = W * (0.08 + i * 0.17);
      const lg = ctx.createLinearGradient(lx, 0, lx + W*0.06, H*0.9);
      lg.addColorStop(0, 'rgba(255,255,200,0.06)');
      lg.addColorStop(1, 'rgba(255,255,200,0)');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.moveTo(lx - W*0.02, 0); ctx.lineTo(lx + W*0.06, H*0.9);
      ctx.lineTo(lx + W*0.1,  H*0.9); ctx.lineTo(lx + W*0.02, 0);
      ctx.fill();
    }

    // Tree silhouettes — back row (taller, lighter)
    for (let i = 0; i < 14; i++) {
      const tx = (W / 13) * i;
      const th = H * (0.55 + (i % 4) * 0.07);
      drawPine(ctx, tx, H, th, 'rgba(2,20,8,0.7)');
    }
    // Front row (shorter, darker)
    for (let i = 0; i < 9; i++) {
      const tx = (W / 8) * i + (i%2===0?40:-30);
      const th = H * (0.38 + (i%3)*0.06);
      drawPine(ctx, tx, H, th, 'rgba(1,10,4,0.95)');
    }

    // Ground mist
    const mist = ctx.createLinearGradient(0, H*0.72, 0, H);
    mist.addColorStop(0, 'rgba(134,239,172,0)');
    mist.addColorStop(1, 'rgba(134,239,172,0.14)');
    ctx.fillStyle = mist; ctx.fillRect(0, H*0.72, W, H*0.28);

    // Leaves
    this.leaves.forEach(l => {
      l.y  += l.vy;
      l.x  += Math.sin(t * 0.4 + l.phase) * 0.6;
      l.rot += l.rotV;
      if (l.y > H + 20) Object.assign(l, this.newLeaf());
      ctx.save();
      ctx.translate(l.x, l.y); ctx.rotate(l.rot);
      ctx.fillStyle = l.col + 'bb';
      ctx.beginPath(); ctx.ellipse(0, 0, l.size, l.size*0.45, 0, 0, Math.PI*2);
      ctx.fill(); ctx.restore();
    });
  }
};

function drawPine(ctx, x, y, h, color) {
  const w = h * 0.38;
  ctx.fillStyle = color;
  // 3 stacked triangles
  for (let tier = 0; tier < 3; tier++) {
    const ty  = y - h * (0.3 + tier * 0.28);
    const tw  = w * (1 - tier * 0.22);
    const th  = h * 0.42;
    ctx.beginPath();
    ctx.moveTo(x, ty - th);
    ctx.lineTo(x - tw/2, ty);
    ctx.lineTo(x + tw/2, ty);
    ctx.fill();
  }
  // Trunk
  ctx.fillRect(x - w*0.06, y - h*0.18, w*0.12, h*0.18);
}

/* NIGHT SKY */
SCENES.night = {
  stars: [],
  shootX: -999, shootY: 0, shootDX: 0, shootDY: 0, shootAlpha: 0, nextShoot: 5,
  init() {
    this.stars = Array.from({ length: 280 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H * 0.85,
      r: Math.random() * 1.5 + 0.3,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 2 + 0.5,
    }));
  },
  draw(t) {
    // Sky
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#04051a'); bg.addColorStop(0.7,'#080d28'); bg.addColorStop(1,'#0a0f1e');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Moon glow
    const mx = W*0.75, my = H*0.14;
    const mg = ctx.createRadialGradient(mx, my, 0, mx, my, H*0.28);
    mg.addColorStop(0,   'rgba(220,230,255,0.18)');
    mg.addColorStop(0.4, 'rgba(180,200,255,0.06)');
    mg.addColorStop(1,   'rgba(100,120,200,0)');
    ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, H*0.28, 0, Math.PI*2); ctx.fill();
    // Moon
    ctx.fillStyle = '#e2e8ff';
    ctx.beginPath(); ctx.arc(mx, my, H*0.048, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#c8d0f0';
    ctx.beginPath(); ctx.arc(mx - H*0.012, my - H*0.006, H*0.016, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + H*0.02, my + H*0.015, H*0.01, 0, Math.PI*2); ctx.fill();

    // Stars
    this.stars.forEach(s => {
      const a = 0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.twinklePhase);
      ctx.fillStyle = `rgba(255,255,255,${a * 0.8 + 0.1})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
    });

    // Shooting star
    if (t > this.nextShoot) {
      this.shootX  = Math.random() * W * 0.6;
      this.shootY  = Math.random() * H * 0.3;
      this.shootDX = (Math.random() * 4 + 3) * W * 0.001;
      this.shootDY = (Math.random() * 2 + 1) * H * 0.001;
      this.shootAlpha = 1;
      this.nextShoot = t + Math.random() * 8 + 5;
    }
    if (this.shootAlpha > 0) {
      this.shootX += this.shootDX * 16;
      this.shootY += this.shootDY * 16;
      this.shootAlpha -= 0.02;
      const trail = ctx.createLinearGradient(
        this.shootX - this.shootDX * 200, this.shootY - this.shootDY * 200,
        this.shootX, this.shootY
      );
      trail.addColorStop(0, `rgba(255,255,255,0)`);
      trail.addColorStop(1, `rgba(255,255,255,${this.shootAlpha})`);
      ctx.strokeStyle = trail; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(this.shootX - this.shootDX*200, this.shootY - this.shootDY*200);
      ctx.lineTo(this.shootX, this.shootY); ctx.stroke();
    }

    // Horizon hills
    ctx.fillStyle = '#06091a';
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 6)
      ctx.lineTo(x, H*0.72 + Math.sin(x*0.004)*H*0.06 + Math.sin(x*0.009+1)*H*0.04);
    ctx.lineTo(W,H); ctx.fill();
    ctx.fillStyle = '#030612';
    ctx.beginPath(); ctx.moveTo(0,H);
    for (let x = 0; x <= W; x += 4)
      ctx.lineTo(x, H*0.82 + Math.sin(x*0.005+2)*H*0.04);
    ctx.lineTo(W,H); ctx.fill();
  }
};

/* AURORA */
SCENES.aurora = {
  stars: [],
  init() {
    this.stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * W, y: Math.random() * H * 0.7,
      r: Math.random() * 1.2 + 0.2,
      twinkle: Math.random() * Math.PI * 2,
      ts: Math.random() * 1.5 + 0.5,
    }));
  },
  draw(t) {
    // Sky
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#010a08'); bg.addColorStop(0.6,'#020f1a'); bg.addColorStop(1,'#010d12');
    ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

    // Stars
    this.stars.forEach(s => {
      const a = 0.4 + 0.35 * Math.sin(t * s.ts + s.twinkle);
      ctx.fillStyle = `rgba(200,230,255,${a})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
    });

    // Aurora bands
    const bands = [
      { baseY: 0.22, amp: 0.07, speed: 0.25, colors: ['rgba(0,255,120,0)', 'rgba(0,255,120,0.18)', 'rgba(0,255,120,0)'] },
      { baseY: 0.30, amp: 0.06, speed: 0.18, colors: ['rgba(0,200,255,0)', 'rgba(0,200,255,0.14)', 'rgba(0,200,255,0)'] },
      { baseY: 0.18, amp: 0.05, speed: 0.32, colors: ['rgba(160,80,255,0)', 'rgba(160,80,255,0.1)', 'rgba(160,80,255,0)'] },
      { baseY: 0.35, amp: 0.04, speed: 0.22, colors: ['rgba(0,255,180,0)', 'rgba(0,255,180,0.12)', 'rgba(0,255,180,0)'] },
    ];

    bands.forEach(b => {
      const bandH = H * 0.12;
      ctx.save();
      for (let x = 0; x <= W; x += 3) {
        const cy = H * b.baseY + Math.sin(x * 0.006 + t * b.speed) * H * b.amp
                                + Math.sin(x * 0.003 + t * b.speed * 0.6 + 1.5) * H * b.amp * 0.5;
        const colGrad = ctx.createLinearGradient(x, cy - bandH, x, cy + bandH);
        colGrad.addColorStop(0, b.colors[0]);
        colGrad.addColorStop(0.5, b.colors[1]);
        colGrad.addColorStop(1, b.colors[2]);
        ctx.fillStyle = colGrad;
        ctx.fillRect(x, cy - bandH, 4, bandH * 2);
      }
      ctx.restore();
    });

    // Ground silhouette
    ctx.fillStyle = '#000d0a';
    ctx.beginPath(); ctx.moveTo(0,H);
    for (let x=0; x<=W; x+=5)
      ctx.lineTo(x, H*0.78 + Math.sin(x*0.005)*H*0.04 + Math.sin(x*0.012+2)*H*0.025);
    ctx.lineTo(W,H); ctx.fill();
    ctx.fillStyle = '#00070a';
    ctx.beginPath(); ctx.moveTo(0,H);
    for (let x=0;x<=W;x+=4)
      ctx.lineTo(x, H*0.88 + Math.sin(x*0.007+1)*H*0.025);
    ctx.lineTo(W,H); ctx.fill();
  }
};

/* SNOW */
SCENES.snow = {
  flakes: [],
  init() {
    this.flakes = Array.from({ length: 140 }, () => this.newFlake(true));
  },
  newFlake(random = false) {
    return {
      x: Math.random() * W,
      y: random ? Math.random() * H : -10,
      r: Math.random() * 3.5 + 1,
      vy: Math.random() * 0.8 + 0.25,
      phase: Math.random() * Math.PI * 2,
      alpha: Math.random() * 0.5 + 0.4,
    };
  },
  draw(t) {
    // Sky
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0d1b2a'); bg.addColorStop(0.6,'#1b2838'); bg.addColorStop(1,'#243447');
    ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

    // Subtle moonlight glow
    const mg = ctx.createRadialGradient(W*0.2, H*0.08, 0, W*0.2, H*0.08, H*0.35);
    mg.addColorStop(0, 'rgba(200,215,240,0.1)'); mg.addColorStop(1,'rgba(200,215,240,0)');
    ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(W*0.2, H*0.08, H*0.35, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(230,238,255,0.9)';
    ctx.beginPath(); ctx.arc(W*0.2, H*0.08, H*0.03, 0, Math.PI*2); ctx.fill();

    // Pine trees (snow-capped)
    for (let i = 0; i < 10; i++) {
      const tx = (W/9)*i + (i%2===0?20:-15);
      const th = H*(0.3 + (i%3)*0.07);
      drawPine(ctx, tx, H, th, `rgba(15,25,40,${0.7+i%3*0.1})`);
      // Snow on tips
      ctx.fillStyle = 'rgba(220,230,245,0.4)';
      const tw = th * 0.38;
      ctx.beginPath();
      ctx.moveTo(tx, H - th);
      ctx.lineTo(tx - tw*0.18, H - th*0.92);
      ctx.lineTo(tx + tw*0.18, H - th*0.92);
      ctx.fill();
    }

    // Ground snow
    const gsnow = ctx.createLinearGradient(0, H*0.8, 0, H);
    gsnow.addColorStop(0, 'rgba(200,215,240,0)');
    gsnow.addColorStop(1, 'rgba(200,215,240,0.25)');
    ctx.fillStyle = gsnow; ctx.fillRect(0, H*0.8, W, H*0.2);

    // Flakes
    this.flakes.forEach(f => {
      f.y += f.vy;
      f.x += Math.sin(t * 0.35 + f.phase) * 0.5;
      if (f.y > H + 15) Object.assign(f, this.newFlake());
      ctx.fillStyle = `rgba(220,235,255,${f.alpha})`;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI*2); ctx.fill();
    });
  }
};

// ── Scene management ──
let activeScene = null;

function setScene(name) {
  activeScene = SCENES[name];
  state.scene = name;
  activeScene.init?.();
  document.querySelectorAll('.scene-btn').forEach(b => b.classList.toggle('active', b.dataset.scene === name));
  save();
}

// ── Render loop ──
function loop(ts) {
  const t = ts / 1000;
  activeScene?.draw(t);
  requestAnimationFrame(loop);
}

// ── Resize ──
function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  activeScene?.init?.();
}
window.addEventListener('resize', resize);

// ── UI idle hide ──
const overlay = document.getElementById('uiOverlay');
let idleTimer;
function resetIdle() {
  overlay.classList.remove('hidden');
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => overlay.classList.add('hidden'), 3500);
}
window.addEventListener('mousemove', resetIdle);
window.addEventListener('touchstart', resetIdle);

// ── Toggle buttons ──
document.querySelectorAll('.tog').forEach(btn => {
  const u = btn.dataset.unit;
  btn.classList.toggle('active', state.show[u]);
  btn.addEventListener('click', () => {
    state.show[u] = !state.show[u];
    btn.classList.toggle('active', state.show[u]);
    buildDisplay(); save();
  });
});

// ── Scene buttons ──
document.querySelectorAll('.scene-btn').forEach(btn => {
  btn.addEventListener('click', () => setScene(btn.dataset.scene));
});

// ── Init ──
resize();
setScene(state.scene);
buildDisplay();
setInterval(tick, 1000);
requestAnimationFrame(loop);
resetIdle();
