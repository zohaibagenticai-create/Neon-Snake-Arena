export class Leaderboard {
  constructor() {
    this.key = 'snakeLeaderboard';
  }

  getTop() {
    return JSON.parse(localStorage.getItem(this.key) || '[]')
      .sort((a,b) => b.score - a.score)
      .slice(0, 10);
  }

  add(entry) {
    const rows = this.getTop();
    rows.push({
      ...entry,
      date: new Date().toLocaleDateString(),
      // Online-ready shape:
      syncStatus: 'local-only',
      userId: null,
      serverId: null
    });
    localStorage.setItem(this.key, JSON.stringify(rows.sort((a,b)=>b.score-a.score).slice(0,10)));
  }

  clear() {
    localStorage.removeItem(this.key);
  }
}
