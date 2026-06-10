const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const state = {
  show: { year: true, month: true, day: true, hours: true, minutes: true, seconds: true },
  theme: 'dark',
};

// Load saved prefs
try {
  const saved = JSON.parse(localStorage.getItem('clockPrefs') || '{}');
  if (saved.show) Object.assign(state.show, saved.show);
  if (saved.theme) state.theme = saved.theme;
} catch {}

function savePrefs() {
  localStorage.setItem('clockPrefs', JSON.stringify({ show: state.show, theme: state.theme }));
}

function pad(n) { return String(n).padStart(2, '0'); }

function getValues() {
  const now = new Date();
  return {
    year:    String(now.getFullYear()),
    month:   MONTHS[now.getMonth()],
    day:     pad(now.getDate()),
    hours:   pad(now.getHours()),
    minutes: pad(now.getMinutes()),
    seconds: pad(now.getSeconds()),
  };
}

function tick() {
  const vals = getValues();
  for (const [unit, val] of Object.entries(vals)) {
    const el = document.getElementById(`val-${unit}`);
    if (!el) continue;
    if (el.textContent !== val) {
      el.textContent = val;
      el.classList.remove('changed');
      void el.offsetWidth;
      el.classList.add('changed');
    }
  }
}

function buildDisplay() {
  const display = document.getElementById('clockDisplay');
  const dateUnits = ['year', 'month', 'day'];
  const timeUnits = ['hours', 'minutes', 'seconds'];
  const labels = { year: 'year', month: 'month', day: 'day', hours: 'hours', minutes: 'min', seconds: 'sec' };

  const visDate = dateUnits.filter(u => state.show[u]);
  const visTime = timeUnits.filter(u => state.show[u]);

  if (visDate.length === 0 && visTime.length === 0) {
    display.innerHTML = '<span class="empty-msg">Nothing to show — enable a unit below</span>';
    return;
  }

  let html = '';

  if (visDate.length > 0) {
    html += '<div class="unit-group">';
    visDate.forEach((unit, i) => {
      if (i > 0) html += '<span class="sep">·</span>';
      html += `<div class="segment"><span class="seg-value" id="val-${unit}"></span><span class="seg-label">${labels[unit]}</span></div>`;
    });
    html += '</div>';
  }

  if (visDate.length > 0 && visTime.length > 0) {
    html += '<div class="group-divider"></div>';
  }

  if (visTime.length > 0) {
    html += '<div class="unit-group">';
    visTime.forEach((unit, i) => {
      if (i > 0) html += '<span class="sep">:</span>';
      html += `<div class="segment"><span class="seg-value" id="val-${unit}"></span><span class="seg-label">${labels[unit]}</span></div>`;
    });
    html += '</div>';
  }

  display.innerHTML = html;
  tick();
}

// Toggle buttons
document.querySelectorAll('.tog').forEach(btn => {
  const unit = btn.dataset.unit;
  btn.classList.toggle('active', state.show[unit]);

  btn.addEventListener('click', () => {
    state.show[unit] = !state.show[unit];
    btn.classList.toggle('active', state.show[unit]);
    buildDisplay();
    savePrefs();
  });
});

// Theme swatches
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  state.theme = theme;
  document.querySelectorAll('.theme-swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.theme === theme);
  });
  savePrefs();
}

document.querySelectorAll('.theme-swatch').forEach(btn => {
  btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
});

// Init
applyTheme(state.theme);
buildDisplay();
setInterval(tick, 1000);
