const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const coinsLabel = document.querySelector('#coins');
const livesLabel = document.querySelector('#lives');
const intro = document.querySelector('#intro');
const result = document.querySelector('#result');

const W = canvas.width;
const H = canvas.height;
const WORLD = 2700;
const platforms = [
  { x: 0, y: 465, w: 530, h: 100 }, { x: 610, y: 420, w: 265, h: 145 },
  { x: 970, y: 365, w: 250, h: 200 }, { x: 1320, y: 425, w: 285, h: 140 },
  { x: 1710, y: 375, w: 300, h: 190 }, { x: 2100, y: 430, w: 600, h: 135 },
  { x: 290, y: 350, w: 145, h: 20 }, { x: 735, y: 305, w: 135, h: 20 },
  { x: 1080, y: 245, w: 145, h: 20 }, { x: 1460, y: 310, w: 145, h: 20 },
  { x: 1835, y: 255, w: 145, h: 20 }, { x: 2250, y: 305, w: 145, h: 20 }
];
const coinPositions = [[350, 310], [790, 263], [1145, 202], [1525, 268], [1900, 213]];
const keys = new Set();
const player = { x: 70, y: 400, w: 30, h: 42, vx: 0, vy: 0, grounded: false, facing: 1 };
let coins = [];
let camera = 0;
let lives = 3;
let state = 'intro';
let lastTime = 0;

function reset() {
  Object.assign(player, { x: 70, y: 400, vx: 0, vy: 0, grounded: false, facing: 1 });
  coins = coinPositions.map(([x, y]) => ({ x, y, collected: false }));
  camera = 0;
  lives = 3;
  coinsLabel.textContent = '0';
  livesLabel.textContent = '3';
  state = 'playing';
  intro.hidden = true;
  result.hidden = true;
}

function jump() {
  if (state === 'playing' && player.grounded) {
    player.vy = -12.5;
    player.grounded = false;
  }
}

function finish(won) {
  state = won ? 'won' : 'lost';
  document.querySelector('#result-eyebrow').textContent = won ? 'ADVENTURE COMPLETE' : 'TRY AGAIN';
  document.querySelector('#result-title').textContent = won ? 'やったね！' : 'もう少し！';
  document.querySelector('#result-text').textContent = won
    ? 'コインを集めてゴールに到着！'
    : '雲から落ちてしまった。もう一度挑戦しよう。';
  result.hidden = false;
}

function update(dt) {
  if (state !== 'playing') return;
  const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A') || keys.has('left');
  const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D') || keys.has('right');
  player.vx = (right ? 4.2 : 0) - (left ? 4.2 : 0);
  if (player.vx) player.facing = Math.sign(player.vx);

  const oldBottom = player.y + player.h;
  player.x = Math.max(0, Math.min(WORLD - player.w, player.x + player.vx * dt));
  player.vy = Math.min(13, player.vy + 0.55 * dt);
  player.y += player.vy * dt;
  player.grounded = false;
  for (const p of platforms) {
    const overlaps = player.x + player.w > p.x && player.x < p.x + p.w;
    if (player.vy >= 0 && overlaps && oldBottom <= p.y && player.y + player.h >= p.y) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.grounded = true;
    }
  }

  for (const coin of coins) {
    if (!coin.collected && Math.hypot(player.x + player.w / 2 - coin.x, player.y + player.h / 2 - coin.y) < 31) {
      coin.collected = true;
      coinsLabel.textContent = String(Number(coinsLabel.textContent) + 1);
    }
  }
  if (player.y > H + 100) {
    lives -= 1;
    livesLabel.textContent = String(lives);
    if (lives === 0) finish(false);
    else Object.assign(player, { x: Math.max(70, Math.min(player.x - 100, WORLD - 100)), y: 300, vx: 0, vy: 0 });
  }
  if (player.x > WORLD - 100) finish(true);
  camera = Math.max(0, Math.min(WORLD - W, player.x - W * 0.36));
}

function cloud(x, y, s) {
  ctx.beginPath();
  ctx.ellipse(x, y + 9 * s, 31 * s, 12 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(x - 15 * s, y + 4 * s, 15 * s, 13 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(x + s, y - 2 * s, 19 * s, 19 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 20 * s, y + 6 * s, 16 * s, 12 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#101a3c');
  sky.addColorStop(0.52, '#315a83');
  sky.addColorStop(1, '#a7c7bd');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 0.72, 210, 8, W * 0.72, 210, 250);
  glow.addColorStop(0, 'rgba(255,205,143,.62)');
  glow.addColorStop(0.28, 'rgba(255,174,139,.18)');
  glow.addColorStop(1, 'rgba(255,174,139,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 38; i++) {
    const x = ((i * 137 - camera * 0.08) % W + W) % W;
    const y = 24 + (i * 67) % 205;
    ctx.fillStyle = `rgba(230,244,255,${i % 3 === 0 ? 0.82 : 0.48})`;
    ctx.beginPath();
    ctx.arc(x, y, i % 7 === 0 ? 1.8 : 1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#29476c';
  for (let i = 0; i < 7; i++) {
    const x = i * 190 - (camera * 0.16 % 190);
    ctx.beginPath();
    ctx.moveTo(x - 100, 430);
    ctx.lineTo(x + 20, 250 + (i % 3) * 34);
    ctx.lineTo(x + 155, 430);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(20,46,76,.58)';
  for (let i = 0; i < 5; i++) {
    const x = i * 270 - (camera * 0.28 % 270) + 35;
    ctx.beginPath();
    ctx.ellipse(x, 465, 190, 54, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(221,238,255,.18)';
  for (let i = 0; i < 13; i++) {
    const x = ((i * 197 - camera * .18) % (W + 180) + W + 180) % (W + 180) - 70;
    cloud(x, 55 + (i * 83) % 210, .55 + (i % 3) * .16);
  }
}

function drawPlatform(p) {
  const x = p.x - camera;
  if (x + p.w < -10 || x > W + 10) return;
  const h = Math.min(p.h, H - p.y + 60);
  const stone = ctx.createLinearGradient(0, p.y, 0, p.y + h);
  stone.addColorStop(0, '#526b80');
  stone.addColorStop(1, '#263a55');
  ctx.fillStyle = stone;
  ctx.fillRect(x, p.y + 9, p.w, h - 9);
  ctx.fillStyle = '#77d7d0';
  ctx.fillRect(x, p.y + 4, p.w, 7);
  ctx.fillStyle = '#c1fff0';
  ctx.fillRect(x, p.y + 4, p.w, 2);
  ctx.fillStyle = 'rgba(13,30,54,.36)';
  for (let tile = x + 15; tile < x + p.w; tile += 42) {
    ctx.fillRect(tile, p.y + 20, 2, Math.max(0, h - 22));
    ctx.fillRect(tile - 8, p.y + 43, 10, 2);
  }
  ctx.fillStyle = 'rgba(169,236,227,.24)';
  for (let crystal = x + 18; crystal < x + p.w - 8; crystal += 55) {
    ctx.beginPath();
    ctx.moveTo(crystal, p.y + 4);
    ctx.lineTo(crystal + 4, p.y - 2);
    ctx.lineTo(crystal + 8, p.y + 4);
    ctx.fill();
  }
}

function drawCoin(coin, time) {
  if (coin.collected) return;
  const x = coin.x - camera;
  const y = coin.y + Math.sin(time / 180 + coin.x) * 4;
  ctx.fillStyle = 'rgba(76,80,68,.18)';
  ctx.beginPath();
  ctx.ellipse(x + 2, y + 15, 11, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.shadowColor = '#ffd36c';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#f6c64e';
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#ffe798';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff1bd';
  ctx.beginPath();
  ctx.moveTo(x, y - 6);
  ctx.lineTo(x + 4, y);
  ctx.lineTo(x, y + 6);
  ctx.lineTo(x - 4, y);
  ctx.closePath();
  ctx.fill();
}

function drawPlayer() {
  const x = player.x - camera;
  const y = player.y;
  ctx.fillStyle = 'rgba(8,20,38,.36)';
  ctx.beginPath();
  ctx.ellipse(x + 15, y + 44, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#182a49';
  ctx.beginPath();
  ctx.moveTo(x + 5, y + 17);
  ctx.lineTo(x + 15, y + 12);
  ctx.lineTo(x + 26, y + 18);
  ctx.lineTo(x + 29, y + 39);
  ctx.lineTo(x + 23, y + 42);
  ctx.lineTo(x + 7, y + 42);
  ctx.lineTo(x + 1, y + 38);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#56c9d0';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#f2bb59';
  ctx.beginPath();
  ctx.moveTo(x + 5, y + 29);
  ctx.lineTo(x + 25, y + 29);
  ctx.lineTo(x + 28, y + 34);
  ctx.lineTo(x + 3, y + 34);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#e9b995';
  ctx.beginPath();
  ctx.arc(x + 15, y + 12, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#101b35';
  ctx.beginPath();
  ctx.arc(x + 15, y + 11, 10, Math.PI, Math.PI * 2);
  ctx.lineTo(x + 26, y + 14);
  ctx.lineTo(x + 20, y + 12);
  ctx.lineTo(x + 16, y + 18);
  ctx.lineTo(x + 5, y + 15);
  ctx.fill();

  ctx.fillStyle = '#fff1d2';
  ctx.beginPath();
  ctx.arc(x + 18 + player.facing, y + 13, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#18344f';
  ctx.beginPath();
  ctx.arc(x + 18 + player.facing, y + 13, 0.8, 0, Math.PI * 2);
  ctx.fill();
}

function render(time) {
  drawBackground();
  for (const p of platforms) drawPlatform(p);
  for (const coin of coins) drawCoin(coin, time);
  const goalX = WORLD - 90 - camera;
  ctx.fillStyle = '#d8e6e9';
  ctx.fillRect(goalX, 320, 4, 110);
  ctx.fillStyle = '#ffbd62';
  ctx.beginPath();
  ctx.moveTo(goalX + 4, 321);
  ctx.lineTo(goalX + 39, 334);
  ctx.lineTo(goalX + 4, 347);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff0bd';
  ctx.fillRect(goalX + 4, 321, 2, 25);
  drawPlayer();
}

function loop(time = 0) {
  const dt = Math.min((time - lastTime) / 16.67 || 1, 2);
  lastTime = time;
  update(dt);
  render(time);
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '].includes(event.key)) event.preventDefault();
  keys.add(event.key);
  if ([' ', 'ArrowUp', 'w', 'W'].includes(event.key)) jump();
});
window.addEventListener('keyup', (event) => keys.delete(event.key));
window.addEventListener('blur', () => keys.clear());
document.querySelector('#play').addEventListener('click', reset);
document.querySelector('#again').addEventListener('click', reset);
document.querySelector('#restart').addEventListener('click', reset);
document.querySelectorAll('[data-key]').forEach((button) => {
  const key = button.dataset.key;
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    keys.add(key);
    if (key === 'jump') jump();
  });
  for (const type of ['pointerup', 'pointercancel', 'pointerleave']) {
    button.addEventListener(type, () => keys.delete(key));
  }
});

coins = coinPositions.map(([x, y]) => ({ x, y, collected: false }));
loop();
