import { maps } from './maps.js';

const GRID = 24;
const CELL = 640 / GRID;

const difficultySpeed = { easy: 145, medium: 110, hard: 82, expert: 58 };
const powerTypes = ['speed','slow','double','shield','magnet'];

export class Game {
  constructor(canvas, leaderboard) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.leaderboard = leaderboard;
    this.stats = JSON.parse(localStorage.getItem('snakeStats') || '{"games":0,"totalScore":0}');
    this.keys();
    this.reset();
    this.updateStatsUI();
  }

  reset() {
    this.snake = [{x:10,y:12},{x:9,y:12},{x:8,y:12}];
    this.dir = {x:1,y:0};
    this.nextDir = {x:1,y:0};
    this.food = this.randomCell();
    this.power = null;
    this.activePower = null;
    this.powerUntil = 0;
    this.score = 0;
    this.time = 0;
    this.running = false;
    this.paused = false;
    this.gameOver = false;
    this.lastStep = 0;
    this.startedAt = 0;
    this.particles = [];
    this.boss = {x:18,y:6,hp:8,alive:false};
    this.highScore = Number(localStorage.getItem('snakeHighScore') || 0);
    this.draw();
    this.ui();
  }

  start() {
    this.reset();
    this.running = true;
    this.startedAt = performance.now();
    this.mode = document.getElementById('modeSelect').value;
    this.mapType = document.getElementById('mapSelect').value;
    this.difficulty = document.getElementById('difficultySelect').value;
    if (this.mode === 'boss') this.boss.alive = true;
    document.getElementById('gameOverlay').classList.add('hidden');
    requestAnimationFrame(t => this.loop(t));
  }

  restart() { this.start(); }
  togglePause() { if (this.running) this.paused = !this.paused; }

  keys() {
    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') this.setDirection('up');
      if (k === 'arrowdown' || k === 's') this.setDirection('down');
      if (k === 'arrowleft' || k === 'a') this.setDirection('left');
      if (k === 'arrowright' || k === 'd') this.setDirection('right');
      if (k === ' ') this.togglePause();
    });
  }

  setDirection(d) {
    const map = {up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
    const nd = map[d];
    if (!nd) return;
    if (nd.x + this.dir.x !== 0 || nd.y + this.dir.y !== 0) this.nextDir = nd;
  }

  loop(t) {
    if (!this.running) return;
    if (!this.paused) {
      const speed = this.currentSpeed();
      if (t - this.lastStep > speed) {
        this.step(t);
        this.lastStep = t;
      }
      this.time = Math.floor((t - this.startedAt) / 1000);
      if (this.mode === 'time' && this.time >= 120) this.end('Time Attack Complete');
    }
    this.draw();
    requestAnimationFrame(x => this.loop(x));
  }

  currentSpeed() {
    let speed = difficultySpeed[this.difficulty] || 100;
    speed -= Math.min(34, Math.floor(this.score / 80) * 5);
    if (this.activePower === 'speed') speed *= .55;
    if (this.activePower === 'slow') speed *= 1.6;
    if (this.mode === 'survival') speed *= Math.max(.45, 1 - this.time / 350);
    return speed;
  }

  step(t) {
    this.dir = this.nextDir;
    const head = {...this.snake[0]};
    head.x += this.dir.x; head.y += this.dir.y;

    if (this.mapType === 'infinite') {
      head.x = (head.x + GRID) % GRID;
      head.y = (head.y + GRID) % GRID;
    }

    const walls = maps[this.mapType] || [];
    const hitWall = head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID || walls.some(w => w.x === head.x && w.y === head.y);
    const hitSelf = this.snake.some(s => s.x === head.x && s.y === head.y);

    if ((hitWall || hitSelf) && this.activePower !== 'shield') return this.end();
    if (hitWall || hitSelf) return;

    this.snake.unshift(head);

    const ateFood = head.x === this.food.x && head.y === this.food.y;
    if (ateFood || (this.activePower === 'magnet' && this.distance(head, this.food) < 3)) {
      const mult = this.activePower === 'double' ? 2 : 1;
      this.score += 10 * mult;
      this.food = this.randomCell();
      this.spawnParticles(head.x, head.y);
      if (Math.random() < .45) this.power = {...this.randomCell(), type: powerTypes[Math.floor(Math.random()*powerTypes.length)]};
    } else {
      this.snake.pop();
    }

    if (this.power && head.x === this.power.x && head.y === this.power.y) {
      this.activePower = this.power.type;
      this.powerUntil = t + 8000;
      this.power = null;
    }
    if (this.activePower && t > this.powerUntil) this.activePower = null;

    if (this.boss.alive && head.x === this.boss.x && head.y === this.boss.y) {
      this.boss.hp--;
      this.score += 25;
      if (this.boss.hp <= 0) { this.boss.alive = false; this.score += 150; }
    }
    this.ui();
  }

  end(title='Game Over') {
    this.running = false;
    this.gameOver = true;
    this.highScore = Math.max(this.highScore, this.score);
    localStorage.setItem('snakeHighScore', this.highScore);
    this.stats.games++;
    this.stats.totalScore += this.score;
    localStorage.setItem('snakeStats', JSON.stringify(this.stats));
    const player = document.getElementById('nickname').value || 'Player';
    this.leaderboard.add({ player, score:this.score, mode:this.mode, map:this.mapType });
    document.getElementById('overlayTitle').textContent = title;
    document.getElementById('overlayText').textContent = `Your score: ${this.score}`;
    document.getElementById('gameOverlay').classList.remove('hidden');
    this.updateStatsUI();
  }

  randomCell() {
    let cell;
    do {
      cell = {x:Math.floor(Math.random()*GRID), y:Math.floor(Math.random()*GRID)};
    } while (this.snake?.some(s=>s.x===cell.x&&s.y===cell.y));
    return cell;
  }

  distance(a,b){ return Math.abs(a.x-b.x)+Math.abs(a.y-b.y); }

  spawnParticles(x,y) {
    for(let i=0;i<16;i++) this.particles.push({x:x*CELL+CELL/2,y:y*CELL+CELL/2,vx:(Math.random()-.5)*6,vy:(Math.random()-.5)*6,life:25});
  }

  draw() {
    const c = this.ctx;
    c.clearRect(0,0,640,640);
    c.fillStyle = '#020617';
    c.fillRect(0,0,640,640);

    c.strokeStyle = 'rgba(0,245,255,.08)';
    for(let i=0;i<=GRID;i++){ c.beginPath(); c.moveTo(i*CELL,0); c.lineTo(i*CELL,640); c.stroke(); c.beginPath(); c.moveTo(0,i*CELL); c.lineTo(640,i*CELL); c.stroke(); }

    const walls = maps[this.mapType] || [];
    c.fillStyle = 'rgba(168,85,247,.75)';
    walls.forEach(w => this.roundRect(w.x*CELL+2,w.y*CELL+2,CELL-4,CELL-4,7));

    c.shadowColor = '#00f5ff'; c.shadowBlur = 18;
    this.snake.forEach((s,i)=>{ c.fillStyle = i===0?'#00f5ff':'#14b8a6'; this.roundRect(s.x*CELL+3,s.y*CELL+3,CELL-6,CELL-6,8); });
    c.shadowColor = '#facc15'; c.shadowBlur = 22; c.fillStyle = '#facc15';
    this.roundRect(this.food.x*CELL+5,this.food.y*CELL+5,CELL-10,CELL-10,9);

    if (this.power) {
      c.shadowColor = '#fb7185'; c.shadowBlur = 20; c.fillStyle = '#fb7185';
      this.roundRect(this.power.x*CELL+4,this.power.y*CELL+4,CELL-8,CELL-8,10);
    }

    if (this.boss.alive) {
      c.shadowColor = '#ef4444'; c.shadowBlur = 28; c.fillStyle = '#ef4444';
      this.roundRect(this.boss.x*CELL-4,this.boss.y*CELL-4,CELL+8,CELL+8,11);
    }

    c.shadowBlur = 0;
    this.particles = this.particles.filter(p => p.life-- > 0);
    this.particles.forEach(p => { p.x+=p.vx; p.y+=p.vy; c.fillStyle='rgba(0,245,255,.7)'; c.fillRect(p.x,p.y,3,3); });
  }

  roundRect(x,y,w,h,r) {
    const c = this.ctx;
    c.beginPath(); c.roundRect(x,y,w,h,r); c.fill();
  }

  ui() {
    document.getElementById('score').textContent = this.score;
    document.getElementById('highScore').textContent = this.highScore;
    document.getElementById('timer').textContent = this.time || 0;
    document.getElementById('activePower').textContent = this.activePower || 'None';
    const achievements = [
      ['Rookie', this.score >= 50],
      ['Hunter', this.score >= 150],
      ['Neon Master', this.score >= 300],
      ['Legend', this.score >= 600]
    ];
    document.getElementById('achievements').innerHTML = achievements.map(a => `<p>${a[1]?'✅':'⬜'} ${a[0]}</p>`).join('');
  }

  updateStatsUI() {
    document.getElementById('gamesPlayed').textContent = this.stats.games;
    document.getElementById('avgScore').textContent = this.stats.games ? Math.round(this.stats.totalScore / this.stats.games) : 0;
  }
}
