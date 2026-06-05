import { Game } from './game.js';
import { Leaderboard } from './leaderboard.js';

const screens = document.querySelectorAll('.screen');
const navButtons = document.querySelectorAll('[data-screen]');
const leaderboard = new Leaderboard();
const game = new Game(document.getElementById('gameCanvas'), leaderboard);

function showScreen(id) {
  screens.forEach(s => s.classList.toggle('active', s.id === id));
  if (id === 'leaderboard') renderLeaderboard();
}

navButtons.forEach(btn => btn.addEventListener('click', () => showScreen(btn.dataset.screen)));
document.getElementById('startFromLanding').addEventListener('click', () => { showScreen('game'); game.start(); });
document.getElementById('startBtn').addEventListener('click', () => game.start());
document.getElementById('pauseBtn').addEventListener('click', () => game.togglePause());
document.getElementById('restartBtn').addEventListener('click', () => game.restart());
document.getElementById('overlayRestart').addEventListener('click', () => game.restart());

document.querySelectorAll('.mobile-controls button').forEach(btn => {
  btn.addEventListener('click', () => game.setDirection(btn.dataset.dir));
});

document.getElementById('clearLeaderboard').addEventListener('click', () => {
  leaderboard.clear();
  renderLeaderboard();
});

function renderLeaderboard() {
  const tbody = document.getElementById('leaderboardTable');
  const rows = leaderboard.getTop();
  tbody.innerHTML = rows.length ? rows.map((r, i) => `
    <tr><td>${i + 1}</td><td>${r.player}</td><td>${r.score}</td><td>${r.mode}</td><td>${r.map}</td><td>${r.date}</td></tr>
  `).join('') : '<tr><td colspan="6">No scores yet.</td></tr>';
}

window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('loadingScreen').classList.add('hide'), 700);
  renderLeaderboard();
});

let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.getElementById('installBtn');
  installBtn.classList.remove('hidden');
  installBtn.onclick = () => deferredPrompt.prompt();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js');
}
