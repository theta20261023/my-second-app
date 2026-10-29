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
  sky.addColorStop(0, '#9ed9ef');
  sky.addColorStop(1, '#e2f2e7');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.34)';
  for (let i = 0; i < 13; i++) {
    const x = ((i * 197 - camera * .18) % (W + 180) + W + 180) % (W + 180) - 70;
    cloud(x, 55 + (i * 83) % 210, .55 + (i % 3) * .16);
  }
  ctx.fillStyle = '#a6d9ce';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(i * 320 - (camera * .35 % 320) + 20, 470, 190, 58, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlatform(p) {
  const x = p.x - camera;
  if (x + p.w < -10 || x > W + 10) return;
  const h = Math.min(p.h, H - p.y + 60);
  ctx.fillStyle = '#6e9a72';
  ctx.fillRect(x, p.y, p.w, 12);
  ctx.fillStyle = '#87b77c';
  ctx.fillRect(x, p.y, p.w, 7);
  ctx.fillStyle = '#b98c65';
  ctx.fillRect(x, p.y + 12, p.w, h - 12);
  ctx.fillStyle = 'rgba(121,82,60,.12)';
  for (let tile = x + 12; tile < x + p.w; tile += 36) ctx.fillRect(tile, p.y + 23, 2, Math.max(0, h - 25));
  ctx.fillStyle = '#a3cf83';
  for (let grass = x + 14; grass < x + p.w - 8; grass += 27) {
    ctx.beginPath();
    ctx.arc(grass, p.y + 1, 2.5, Math.PI, 0);
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
  ctx.fillStyle = '#f6c64e';
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffe798';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff1bd';
  ctx.fillRect(x - 2, y - 5, 3, 10);
}

function drawPlayer() {
  const x = player.x - camera;
  const y = player.y;
  ctx.fillStyle = 'rgba(43,58,72,.18)';
  ctx.beginPath();
  ctx.ellipse(x + 15, y + 45, 15, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f5c955';
  ctx.beginPath();
  ctx.roundRect(x + 3, y + 13, 24, 27, 8);
  ctx.fill();
  ctx.fillStyle = '#455f91';
  ctx.beginPath();
  ctx.roundRect(x + 2, y + 27, 26, 15, 5);
  ctx.fill();
  ctx.fillStyle = '#ffd8ad';
  ctx.beginPath();
  ctx.arc(x + 15, y + 11, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#62463f';
  ctx.beginPath();
  ctx.arc(x + 15, y + 7, 11, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + 5, y + 7, 20, 5);
  ctx.fillStyle = '#27334b';
  ctx.beginPath();
  ctx.arc(x + 18 + player.facing * 2, y + 12, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function render(time) {
  drawBackground();
  for (const p of platforms) drawPlatform(p);
  for (const coin of coins) drawCoin(coin, time);
  const goalX = WORLD - 90 - camera;
  ctx.fillStyle = '#f6d46b';
  ctx.fillRect(goalX, 320, 4, 110);
  ctx.fillStyle = '#f17872';
  ctx.beginPath();
  ctx.moveTo(goalX + 4, 321);
  ctx.lineTo(goalX + 42, 334);
  ctx.lineTo(goalX + 4, 347);
  ctx.closePath();
  ctx.fill();
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
