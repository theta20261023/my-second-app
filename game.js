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
const enemySpawns = [
  { x: 180, minX: 90, maxX: 470, platformY: 465 },
  { x: 690, minX: 635, maxX: 815, platformY: 420 },
  { x: 1035, minX: 995, maxX: 1155, platformY: 365 },
  { x: 1790, minX: 1735, maxX: 1950, platformY: 375 },
  { x: 2310, minX: 2130, maxX: 2640, platformY: 430 }
];
const keys = new Set();
const player = { x: 70, y: 400, w: 30, h: 42, vx: 0, vy: 0, grounded: false, facing: 1 };
let coins = [];
let enemies = createEnemies();
let camera = 0;
let lives = 3;
let state = 'intro';
let lastTime = 0;

function createEnemies() {
  return enemySpawns.map((spawn) => ({
    ...spawn,
    y: spawn.platformY - 28,
    w: 32,
    h: 28,
    vx: 1.15,
    alive: true
  }));
}

function reset() {
  Object.assign(player, { x: 70, y: 400, vx: 0, vy: 0, grounded: false, facing: 1 });
  coins = coinPositions.map(([x, y]) => ({ x, y, collected: false }));
  enemies = createEnemies();
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

function loseLife() {
  lives -= 1;
  livesLabel.textContent = String(lives);
  if (lives === 0) {
    finish(false);
    return;
  }
  Object.assign(player, { x: Math.max(70, Math.min(player.x - 100, WORLD - 100)), y: 300, vx: 0, vy: 0, grounded: false });
}

function update(dt) {
  if (state !== 'playing') return;
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    enemy.x += enemy.vx * dt;
    if (enemy.x < enemy.minX || enemy.x > enemy.maxX) {
      enemy.x = Math.max(enemy.minX, Math.min(enemy.x, enemy.maxX));
      enemy.vx *= -1;
    }
  }

  const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A') || keys.has('left');
  const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D') || keys.has('right');
  player.vx = (right ? 4.2 : 0) - (left ? 4.2 : 0);
  if (player.vx) player.facing = Math.sign(player.vx);

  const oldBottom = player.y + player.h;
  player.x = Math.max(0, Math.min(WORLD - player.w, player.x + player.vx * dt));
  player.vy = Math.min(13, player.vy + 0.55 * dt);
  player.y += player.vy * dt;
  player.grounded = false;
  let lostLife = false;
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const overlaps = player.x + player.w > enemy.x && player.x < enemy.x + enemy.w;
    if (!overlaps || player.y + player.h <= enemy.y || player.y >= enemy.y + enemy.h) continue;
    if (player.vy > 0 && oldBottom <= enemy.y + enemy.h / 2) {
      enemy.alive = false;
      player.y = enemy.y - player.h;
      player.vy = -8;
      break;
    }
    loseLife();
    if (state !== 'playing') return;
    lostLife = true;
    break;
  }

  for (const p of platforms) {
    const overlaps = player.x + player.w > p.x && player.x < p.x + p.w;
    if (player.vy >= 0 && overlaps && oldBottom <= p.y && player.y + player.h >= p.y) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.grounded = true;
    }
  }

  if (!lostLife) {
    for (const coin of coins) {
      if (!coin.collected && Math.hypot(player.x + player.w / 2 - coin.x, player.y + player.h / 2 - coin.y) < 31) {
        coin.collected = true;
        coinsLabel.textContent = String(Number(coinsLabel.textContent) + 1);
      }
    }
  }
  if (player.y > H + 100) {
    loseLife();
    if (state !== 'playing') return;
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

function drawBackground(time) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#080d22');
  sky.addColorStop(0.5, '#171b46');
  sky.addColorStop(0.82, '#302d64');
  sky.addColorStop(1, '#111a39');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const nebula = ctx.createRadialGradient(W * 0.28, 155, 12, W * 0.28, 155, 310);
  nebula.addColorStop(0, 'rgba(117,81,197,.3)');
  nebula.addColorStop(0.5, 'rgba(76,80,174,.13)');
  nebula.addColorStop(1, 'rgba(76,80,174,0)');
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  const aurora = ctx.createLinearGradient(0, 85, 0, 315);
  aurora.addColorStop(0, 'rgba(74,255,225,0)');
  aurora.addColorStop(0.5, 'rgba(74,255,225,.09)');
  aurora.addColorStop(1, 'rgba(123,115,255,0)');
  ctx.fillStyle = aurora;
  ctx.beginPath();
  ctx.moveTo(-40, 260);
  ctx.bezierCurveTo(95, 92, 250, 90, 405, 205);
  ctx.bezierCurveTo(570, 326, 740, 78, 1010, 130);
  ctx.lineTo(1010, 260);
  ctx.bezierCurveTo(745, 193, 590, 393, 405, 275);
  ctx.bezierCurveTo(235, 166, 100, 177, -40, 320);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 0.6 + Math.sin(time / 1600) * 0.12;
  ctx.shadowColor = '#49e8dc';
  ctx.shadowBlur = 22;
  ctx.strokeStyle = 'rgba(91,255,222,.26)';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-20, 214);
  ctx.bezierCurveTo(150, 112, 272, 141, 425, 218);
  ctx.bezierCurveTo(610, 313, 754, 93, 990, 151);
  ctx.stroke();
  ctx.restore();

  const planetX = ((W * 0.76 - camera * 0.035) % (W + 180) + W + 180) % (W + 180) - 90;
  const planetY = 177;
  const planetGlow = ctx.createRadialGradient(planetX, planetY, 24, planetX, planetY, 145);
  planetGlow.addColorStop(0, 'rgba(81,221,219,.21)');
  planetGlow.addColorStop(1, 'rgba(81,221,219,0)');
  ctx.fillStyle = planetGlow;
  ctx.fillRect(planetX - 145, planetY - 145, 290, 290);

  ctx.save();
  ctx.translate(planetX, planetY);
  ctx.rotate(-0.2);
  ctx.strokeStyle = 'rgba(145,232,232,.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 83, 21, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(145,232,232,.2)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(0, 0, 88, 23, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const planet = ctx.createRadialGradient(planetX - 18, planetY - 24, 4, planetX, planetY, 55);
  planet.addColorStop(0, '#a7f4e9');
  planet.addColorStop(0.35, '#538dc0');
  planet.addColorStop(1, '#32386f');
  ctx.fillStyle = planet;
  ctx.beginPath();
  ctx.arc(planetX, planetY, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(194,255,245,.56)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = 'rgba(25,49,94,.28)';
  ctx.beginPath();
  ctx.ellipse(planetX - 12, planetY + 9, 13, 5, -0.5, 0, Math.PI * 2);
  ctx.ellipse(planetX + 19, planetY - 13, 8, 3, 0.4, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 38; i++) {
    const x = ((i * 137 - camera * 0.08) % W + W) % W;
    const y = 24 + (i * 67) % 205;
    const twinkle = 0.64 + Math.sin(time / 450 + i) * 0.2;
    ctx.fillStyle = `rgba(231,231,255,${(i % 3 === 0 ? 0.8 : 0.44) * twinkle})`;
    ctx.beginPath();
    ctx.arc(x, y, i % 7 === 0 ? 1.8 : 1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#23234f';
  for (let i = 0; i < 7; i++) {
    const x = i * 190 - (camera * 0.16 % 190);
    ctx.beginPath();
    ctx.moveTo(x - 100, 450);
    ctx.lineTo(x + 20, 265 + (i % 3) * 34);
    ctx.lineTo(x + 155, 450);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(13,20,48,.76)';
  for (let i = 0; i < 5; i++) {
    const x = i * 270 - (camera * 0.28 % 270) + 35;
    ctx.beginPath();
    ctx.ellipse(x, 482, 190, 63, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(119,194,255,.09)';
  for (let i = 0; i < 13; i++) {
    const x = ((i * 197 - camera * .18) % (W + 180) + W + 180) % (W + 180) - 70;
    cloud(x, 55 + (i * 83) % 210, .55 + (i % 3) * .16);
  }
}

function drawPlatform(p) {
  const x = p.x - camera;
  if (x + p.w < -10 || x > W + 10) return;
  const h = Math.min(p.h, H - p.y + 60);
  ctx.fillStyle = 'rgba(10,14,37,.28)';
  ctx.fillRect(x + 4, p.y + 13, p.w, h - 9);
  const stone = ctx.createLinearGradient(0, p.y, 0, p.y + h);
  stone.addColorStop(0, '#343b68');
  stone.addColorStop(0.42, '#252d51');
  stone.addColorStop(1, '#171d39');
  ctx.fillStyle = stone;
  ctx.fillRect(x, p.y + 8, p.w, h - 8);
  ctx.fillStyle = '#36c6bf';
  ctx.fillRect(x, p.y + 3, p.w, 8);
  ctx.fillStyle = '#b6fff0';
  ctx.fillRect(x + 2, p.y + 3, Math.max(0, p.w - 4), 2);
  ctx.fillStyle = 'rgba(15,21,48,.5)';
  for (let tile = x + 15; tile < x + p.w; tile += 42) {
    ctx.fillRect(tile, p.y + 20, 2, Math.max(0, h - 22));
    ctx.fillRect(tile - 8, p.y + 43, 10, 2);
  }
  ctx.fillStyle = 'rgba(131,255,232,.62)';
  for (let crystal = x + 18; crystal < x + p.w - 8; crystal += 55) {
    ctx.beginPath();
    ctx.moveTo(crystal, p.y + 4);
    ctx.lineTo(crystal + 4, p.y - 5);
    ctx.lineTo(crystal + 8, p.y + 4);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,190,154,.55)';
  for (let shard = x + 34; shard < x + p.w - 18; shard += 84) {
    ctx.beginPath();
    ctx.moveTo(shard, p.y + 16);
    ctx.lineTo(shard + 5, p.y + 25);
    ctx.lineTo(shard + 1, p.y + 35);
    ctx.closePath();
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

function drawEnemy(enemy, time) {
  if (!enemy.alive) return;
  const x = enemy.x - camera;
  const y = enemy.y + Math.sin(time / 160 + enemy.x) * 1.5;

  ctx.fillStyle = 'rgba(12,17,42,.35)';
  ctx.beginPath();
  ctx.ellipse(x + enemy.w / 2, enemy.y + enemy.h + 3, 15, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  const body = ctx.createLinearGradient(x, y, x + enemy.w, y + enemy.h);
  body.addColorStop(0, '#ffb34f');
  body.addColorStop(1, '#e34b83');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(x + 5, y + 10);
  ctx.lineTo(x + 3, y + 2);
  ctx.lineTo(x + 12, y + 7);
  ctx.quadraticCurveTo(x + 16, y + 4, x + 20, y + 7);
  ctx.lineTo(x + 29, y + 1);
  ctx.lineTo(x + 27, y + 13);
  ctx.quadraticCurveTo(x + 34, y + 22, x + 25, y + 27);
  ctx.quadraticCurveTo(x + 15, y + 31, x + 6, y + 26);
  ctx.quadraticCurveTo(x - 2, y + 21, x + 5, y + 10);
  ctx.fill();
  ctx.strokeStyle = '#ffdb91';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#fff4d2';
  ctx.beginPath();
  ctx.ellipse(x + 11, y + 16, 3.2, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 22, y + 16, 3.2, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#352344';
  ctx.beginPath();
  ctx.arc(x + 12, y + 17, 1.5, 0, Math.PI * 2);
  ctx.arc(x + 21, y + 17, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#6f294d';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x + 16, y + 20, 3, 0.15, Math.PI - 0.15);
  ctx.stroke();
}

function drawPlayer(time) {
  const x = player.x - camera;
  const y = player.y;
  ctx.fillStyle = 'rgba(8,20,38,.36)';
  ctx.beginPath();
  ctx.ellipse(x + 15, y + 44, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const stride = player.grounded && player.vx ? Math.sin(time / 65) * 2 : 0;
  ctx.save();
  ctx.translate(x + 15, 0);
  ctx.scale(player.facing, 1);
  ctx.translate(-(x + 15), 0);

  ctx.fillStyle = '#dc6384';
  ctx.beginPath();
  ctx.moveTo(x + 7, y + 18);
  ctx.lineTo(x + 2 - (player.vx ? 3 : 0), y + 25);
  ctx.lineTo(x + 5, y + 39);
  ctx.lineTo(x + 11, y + 35);
  ctx.lineTo(x + 12, y + 22);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff9a9f';
  ctx.beginPath();
  ctx.moveTo(x + 5, y + 25);
  ctx.lineTo(x + 1, y + 36);
  ctx.lineTo(x + 7, y + 33);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#121a38';
  ctx.beginPath();
  ctx.moveTo(x + 9, y + 34);
  ctx.lineTo(x + 22, y + 34);
  ctx.lineTo(x + 24, y + 41 + stride);
  ctx.lineTo(x + 18, y + 42 + stride);
  ctx.lineTo(x + 15, y + 38);
  ctx.lineTo(x + 12, y + 42 - stride);
  ctx.lineTo(x + 6, y + 41 - stride);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#43d9d0';
  ctx.fillRect(x + 6, y + 40 + stride, 7, 2);
  ctx.fillRect(x + 18, y + 40 - stride, 7, 2);

  const armor = ctx.createLinearGradient(x + 5, y + 15, x + 27, y + 39);
  armor.addColorStop(0, '#4778a8');
  armor.addColorStop(0.55, '#263d70');
  armor.addColorStop(1, '#18254c');
  ctx.fillStyle = armor;
  ctx.beginPath();
  ctx.moveTo(x + 9, y + 17);
  ctx.lineTo(x + 15, y + 14);
  ctx.lineTo(x + 23, y + 17);
  ctx.lineTo(x + 27, y + 34);
  ctx.lineTo(x + 22, y + 39);
  ctx.lineTo(x + 8, y + 39);
  ctx.lineTo(x + 3, y + 34);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#55e6dc';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#f0b857';
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 28);
  ctx.lineTo(x + 23, y + 28);
  ctx.lineTo(x + 25, y + 32);
  ctx.lineTo(x + 7, y + 32);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffe4a3';
  ctx.fillRect(x + 9, y + 29, 11, 1);

  ctx.fillStyle = '#e8b99a';
  ctx.beginPath();
  ctx.arc(x + 16, y + 12, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#162344';
  ctx.beginPath();
  ctx.moveTo(x + 7, y + 12);
  ctx.lineTo(x + 9, y + 5);
  ctx.lineTo(x + 16, y + 2);
  ctx.lineTo(x + 24, y + 6);
  ctx.lineTo(x + 27, y + 14);
  ctx.lineTo(x + 19, y + 12);
  ctx.lineTo(x + 15, y + 15);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#65eee0';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#ffcf70';
  ctx.beginPath();
  ctx.moveTo(x + 18, y + 11);
  ctx.lineTo(x + 25, y + 12);
  ctx.lineTo(x + 22, y + 16);
  ctx.lineTo(x + 17, y + 15);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff4cd';
  ctx.fillRect(x + 20, y + 12, 2, 1);
  ctx.fillStyle = '#42fff0';
  ctx.shadowColor = '#31eee1';
  ctx.shadowBlur = 8;
  ctx.fillRect(x + 11, y + 20, 2, 2);
  ctx.restore();

  ctx.fillStyle = 'rgba(255,187,115,.8)';
  ctx.beginPath();
  ctx.arc(x + 15, y + 28, 2.2, 0, Math.PI * 2);
  ctx.fill();
}

function render(time) {
  drawBackground(time);
  for (const p of platforms) drawPlatform(p);
  for (const enemy of enemies) drawEnemy(enemy, time);
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
  drawPlayer(time);
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
