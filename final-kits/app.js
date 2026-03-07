/* ==========================================================================
  MyCelium App — Logic
  ========================================================================== */

// ---------- Screen Routing ----------
function switchScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
  });
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const screen = document.getElementById(id);
  if (screen) {
    screen.classList.add('active');
    // reset animation
    screen.style.animation = 'none';
    screen.offsetHeight; // force reflow
    screen.style.animation = '';
  }

  const navBtn = document.querySelector(`.nav-item[data-screen="${id}"]`);
  if (navBtn) navBtn.classList.add('active');

  // Scroll screen area to top
  const area = document.querySelector('.screen-area');
  if (area) area.scrollTop = 0;

  // Draw network viz if switching to network screen
  if (id === 'network') {
    setTimeout(drawNetwork, 100);
  }
}


// ---------- Task Toggle ----------
function toggleTask(el) {
  el.closest('.task-item').classList.toggle('done');
  updateTaskProgress();
}

function updateTaskProgress() {
  const total = document.querySelectorAll('#instructions .task-item').length;
  const done = document.querySelectorAll('#instructions .task-item.done').length;
  const pct = Math.round((done / total) * 100);
  const counter = document.getElementById('taskCounter');
  if (counter) counter.textContent = `${done}/${total} done`;
}


// ---------- Toggle Switches ----------
function toggleSwitch(el) {
  el.classList.toggle('toggle--active');
}


// ---------- Network Visualization ----------
function drawNetwork() {
  const canvas = document.getElementById('networkCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = canvas.offsetHeight * dpr;
  ctx.scale(dpr, dpr);

  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight;
  ctx.clearRect(0, 0, W, H);

  // Generate 18 nodes
  const nodes = [];
  const centerX = W / 2;
  const centerY = H / 2;

  // Hub node at center
  nodes.push({ x: centerX, y: centerY, r: 10, type: 'hub', label: 'Hub' });

  // Farm nodes in orbits
  for (let i = 0; i < 17; i++) {
    const orbit = 40 + Math.random() * 70;
    const angle = (i / 17) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    nodes.push({
      x: centerX + Math.cos(angle) * orbit,
      y: centerY + Math.sin(angle) * orbit,
      r: 4 + Math.random() * 3,
      type: Math.random() > 0.2 ? 'active' : 'pending',
      label: `N${i + 1}`
    });
  }

  // Draw edges
  ctx.strokeStyle = 'rgba(26,26,26,0.06)';
  ctx.lineWidth = 1;
  for (let i = 1; i < nodes.length; i++) {
    ctx.beginPath();
    ctx.moveTo(nodes[0].x, nodes[0].y);
    ctx.lineTo(nodes[i].x, nodes[i].y);
    ctx.stroke();

    // Occasional peer edges
    if (i > 1 && Math.random() > 0.6) {
      const peer = 1 + Math.floor(Math.random() * (nodes.length - 1));
      if (peer !== i) {
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[peer].x, nodes[peer].y);
        ctx.stroke();
      }
    }
  }

  // Draw nodes
  nodes.forEach(n => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);

    if (n.type === 'hub') {
      ctx.fillStyle = '#E8913A';
      ctx.fill();
      // glow
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r + 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(232,145,58,0.15)';
      ctx.fill();
    } else if (n.type === 'active') {
      ctx.fillStyle = '#1A1A1A';
      ctx.fill();
    } else {
      ctx.fillStyle = '#D1CDC7';
      ctx.fill();
    }
  });

  // Hub label
  ctx.fillStyle = '#1A1A1A';
  ctx.font = '600 9px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HUB', centerX, centerY + 20);
}


// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  // Bind nav items
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      switchScreen(btn.dataset.screen);
    });
  });

  // Bind task checks
  document.querySelectorAll('.task-check').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTask(btn);
    });
  });

  // Bind action cards that navigate
  document.querySelectorAll('[data-goto]').forEach(el => {
    el.addEventListener('click', () => {
      switchScreen(el.dataset.goto);
    });
  });

  // Set initial screen
  switchScreen('home');
  updateTaskProgress();
});
