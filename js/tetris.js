/* Neumorphic Tetris — embedded on about.html.
   Self-contained IIFE: no globals, scoped to #tetris-embed.
   Keyboard input only fires while the embed has focus. */
(function () {
  'use strict';

  const root = document.getElementById('tetris-embed');
  if (!root) return;

  const SHAPES = {
    I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    O: [[2,2],[2,2]],
    T: [[0,3,0],[3,3,3],[0,0,0]],
    S: [[0,4,4],[4,4,0],[0,0,0]],
    Z: [[5,5,0],[0,5,5],[0,0,0]],
    J: [[6,0,0],[6,6,6],[0,0,0]],
    L: [[0,0,7],[7,7,7],[0,0,0]]
  };

  const COLORS = {
    1: '#55a2f7', 2: '#bb6620', 3: '#792d82',
    4: '#55a2f7', 5: '#ea3b99', 6: '#792d82', 7: '#bb6620'
  };

  const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

  const WALL_KICKS = {
    I: {
      '0->1': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
      '1->0': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
      '1->2': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
      '2->1': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
      '2->3': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
      '3->2': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
      '3->0': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
      '0->3': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]]
    },
    default: {
      '0->1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
      '1->0': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
      '1->2': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
      '2->1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
      '2->3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
      '3->2': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
      '3->0': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
      '0->3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]]
    }
  };

  class Tetromino {
    constructor(type) {
      this.type = type;
      this.shape = JSON.parse(JSON.stringify(SHAPES[type]));
      this.x = 3;
      this.y = 0;
      this.rotation = 0;
    }
    rotated(direction) {
      const n = this.shape.length;
      const out = Array(n).fill(0).map(() => Array(n).fill(0));
      if (direction === 1) {
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) out[x][n - 1 - y] = this.shape[y][x];
      } else {
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) out[n - 1 - x][y] = this.shape[y][x];
      }
      return out;
    }
    blocks() {
      const out = [];
      for (let y = 0; y < this.shape.length; y++) {
        for (let x = 0; x < this.shape[y].length; x++) {
          if (this.shape[y][x] !== 0) out.push({ x: this.x + x, y: this.y + y, color: this.shape[y][x] });
        }
      }
      return out;
    }
  }

  class PieceBag {
    constructor() { this.bag = []; this.refill(); }
    refill() {
      this.bag = PIECE_TYPES.slice();
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    next() {
      if (this.bag.length === 0) this.refill();
      return new Tetromino(this.bag.pop());
    }
  }

  const BOARD_W = 10;
  const BOARD_H = 20;

  function collides(piece, board) {
    for (const b of piece.blocks()) {
      if (b.x < 0 || b.x >= BOARD_W || b.y >= BOARD_H) return true;
      if (b.y >= 0 && board[b.y][b.x] !== 0) return true;
    }
    return false;
  }

  class Renderer {
    constructor(gameCanvas, nextCanvas, holdCanvas) {
      this.gc = gameCanvas; this.gx = gameCanvas.getContext('2d');
      this.nc = nextCanvas; this.nx = nextCanvas.getContext('2d');
      this.hc = holdCanvas; this.hx = holdCanvas.getContext('2d');
      this.block = gameCanvas.width / BOARD_W;
    }
    clear(ctx, canvas) { ctx.clearRect(0, 0, canvas.width, canvas.height); }
    block_(ctx, x, y, color, size) {
      const px = x * size, py = y * size;
      ctx.fillStyle = color;
      ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(px + 2, py + 2, size - 4, 3);
      ctx.fillRect(px + 2, py + 2, 3, size - 4);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(px + 2, py + size - 5, size - 4, 3);
      ctx.fillRect(px + size - 5, py + 2, 3, size - 4);
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);
    }
    ghost_(ctx, x, y, color, size) {
      const px = x * size, py = y * size;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);
      ctx.fillStyle = color + '20';
      ctx.fillRect(px + 3, py + 3, size - 6, size - 6);
    }
    drawBoard(board) {
      this.clear(this.gx, this.gc);
      for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
          if (board[y][x] !== 0) this.block_(this.gx, x, y, COLORS[board[y][x]], this.block);
        }
      }
    }
    drawPiece(piece) {
      for (const b of piece.blocks()) {
        if (b.y >= 0) this.block_(this.gx, b.x, b.y, COLORS[b.color], this.block);
      }
    }
    drawGhost(piece, board) {
      const ghost = new Tetromino(piece.type);
      ghost.shape = JSON.parse(JSON.stringify(piece.shape));
      ghost.x = piece.x; ghost.y = piece.y;
      while (true) {
        ghost.y++;
        if (collides(ghost, board)) { ghost.y--; break; }
      }
      for (const b of ghost.blocks()) {
        if (b.y >= 0) this.ghost_(this.gx, b.x, b.y, COLORS[b.color], this.block);
      }
    }
    drawMini(ctx, canvas, piece) {
      this.clear(ctx, canvas);
      if (!piece) return;
      const blocks = piece.blocks();
      const xs = blocks.map(b => b.x), ys = blocks.map(b => b.y);
      const w = Math.max(...xs) - Math.min(...xs) + 1;
      const h = Math.max(...ys) - Math.min(...ys) + 1;
      const cellsAcross = canvas.width / this.block;
      const cellsDown = canvas.height / this.block;
      const ox = (cellsAcross - w) / 2 - Math.min(...xs);
      const oy = (cellsDown - h) / 2 - Math.min(...ys);
      for (const b of blocks) this.block_(ctx, b.x + ox, b.y + oy, COLORS[b.color], this.block);
    }
    render(game) {
      this.drawBoard(game.board);
      if (game.currentPiece && !game.gameOver && !game.paused) this.drawGhost(game.currentPiece, game.board);
      if (game.currentPiece && !game.gameOver) this.drawPiece(game.currentPiece);
      this.drawMini(this.nx, this.nc, game.nextPiece);
      this.drawMini(this.hx, this.hc, game.holdPiece);
    }
  }

  class Game {
    constructor() {
      this.q = (sel) => root.querySelector(sel);
      this.board = this.fresh();
      this.currentPiece = null;
      this.nextPiece = null;
      this.holdPiece = null;
      this.canHold = true;
      this.score = 0;
      this.level = 1;
      this.lines = 0;
      this.gameOver = false;
      this.paused = false;
      this.started = false;
      this.dropInterval = 1000;
      this.lastDropTime = 0;
      this.rafId = null;
      this.bag = new PieceBag();
      this.renderer = new Renderer(
        this.q('[data-tetris="game"]'),
        this.q('[data-tetris="next"]'),
        this.q('[data-tetris="hold"]')
      );
      this.bindUI();
      this.showOverlay('start');
    }
    fresh() { return Array(BOARD_H).fill(null).map(() => Array(BOARD_W).fill(0)); }
    showOverlay(which) {
      root.querySelectorAll('.tetris-overlay').forEach(o => o.classList.add('tetris-hidden'));
      const el = root.querySelector('[data-tetris="' + which + '"]');
      if (el) el.classList.remove('tetris-hidden');
    }
    hideOverlays() {
      root.querySelectorAll('.tetris-overlay').forEach(o => o.classList.add('tetris-hidden'));
    }
    start() {
      if (this.started && !this.gameOver) return;
      if (this.gameOver) { this.reset(); }
      this.hideOverlays();
      this.started = true;
      this.gameOver = false;
      this.paused = false;
      this.nextPiece = this.bag.next();
      this.spawn();
      this.lastDropTime = performance.now();
      this.loop();
      root.focus();
      this.updatePlayLabel();
    }
    reset() {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.board = this.fresh();
      this.currentPiece = null;
      this.nextPiece = null;
      this.holdPiece = null;
      this.canHold = true;
      this.score = 0;
      this.level = 1;
      this.lines = 0;
      this.gameOver = false;
      this.paused = false;
      this.started = false;
      this.dropInterval = 1000;
      this.bag = new PieceBag();
      this.updateUI();
      this.renderer.render(this);
    }
    restart() { this.reset(); this.start(); }
    spawn() {
      this.currentPiece = this.nextPiece;
      this.nextPiece = this.bag.next();
      this.canHold = true;
      if (collides(this.currentPiece, this.board)) this.end();
    }
    move(dx, dy) {
      if (!this.currentPiece || this.gameOver || this.paused) return false;
      this.currentPiece.x += dx;
      this.currentPiece.y += dy;
      if (collides(this.currentPiece, this.board)) {
        this.currentPiece.x -= dx;
        this.currentPiece.y -= dy;
        return false;
      }
      this.renderer.render(this);
      return true;
    }
    rotate(direction) {
      if (!this.currentPiece || this.gameOver || this.paused) return;
      const oldShape = this.currentPiece.shape;
      const oldRot = this.currentPiece.rotation;
      this.currentPiece.shape = this.currentPiece.rotated(direction);
      this.currentPiece.rotation = (oldRot + direction + 4) % 4;
      if (!collides(this.currentPiece, this.board)) { this.renderer.render(this); return; }
      const key = oldRot + '->' + this.currentPiece.rotation;
      const kicks = this.currentPiece.type === 'I' ? WALL_KICKS.I[key] : WALL_KICKS.default[key];
      if (kicks) {
        for (const [kx, ky] of kicks) {
          this.currentPiece.x += kx;
          this.currentPiece.y += ky;
          if (!collides(this.currentPiece, this.board)) { this.renderer.render(this); return; }
          this.currentPiece.x -= kx;
          this.currentPiece.y -= ky;
        }
      }
      this.currentPiece.shape = oldShape;
      this.currentPiece.rotation = oldRot;
    }
    softDrop() {
      if (this.move(0, 1)) { this.score += 1; this.updateUI(); }
    }
    hardDrop() {
      if (!this.currentPiece || this.gameOver || this.paused) return;
      let drop = 0;
      while (this.move(0, 1)) drop++;
      this.score += drop * 2;
      this.lock();
      this.updateUI();
    }
    lock() {
      if (!this.currentPiece) return;
      for (const b of this.currentPiece.blocks()) {
        if (b.y >= 0 && b.y < BOARD_H) this.board[b.y][b.x] = b.color;
      }
      this.clearLines();
      this.spawn();
      this.renderer.render(this);
    }
    clearLines() {
      let cleared = 0;
      for (let y = this.board.length - 1; y >= 0; y--) {
        if (this.board[y].every(c => c !== 0)) {
          this.board.splice(y, 1);
          this.board.unshift(Array(BOARD_W).fill(0));
          cleared++;
          y++;
        }
      }
      if (cleared > 0) {
        this.lines += cleared;
        const scores = [0, 100, 300, 500, 800];
        this.score += scores[cleared] * this.level;
        this.level = Math.floor(this.lines / 10) + 1;
        this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 50);
        this.updateUI();
      }
    }
    hold() {
      if (!this.currentPiece || !this.canHold || this.gameOver || this.paused) return;
      if (this.holdPiece === null) {
        this.holdPiece = new Tetromino(this.currentPiece.type);
        this.spawn();
      } else {
        const heldType = this.holdPiece.type;
        this.holdPiece = new Tetromino(this.currentPiece.type);
        this.currentPiece = new Tetromino(heldType);
      }
      this.canHold = false;
      this.renderer.render(this);
    }
    togglePause() {
      if (this.gameOver || !this.started) return;
      this.paused = !this.paused;
      this.updatePlayLabel();
      if (!this.paused) {
        this.lastDropTime = performance.now();
        this.loop();
      }
    }
    end() {
      this.gameOver = true;
      const fs = this.q('[data-tetris="final-score"]');
      if (fs) fs.textContent = this.score;
      this.showOverlay('gameover');
    }
    updateUI() {
      const s = this.q('[data-tetris="score"]');
      const l = this.q('[data-tetris="level"]');
      const ln = this.q('[data-tetris="lines"]');
      if (s) s.textContent = this.score;
      if (l) l.textContent = this.level;
      if (ln) ln.textContent = this.lines;
    }
    updatePlayLabel() {
      const el = this.q('[data-tetris="play-label"]');
      if (!el) return;
      el.textContent = this.paused ? 'Resume' : 'Pause';
    }
    loop() {
      if (this.gameOver || this.paused) return;
      const now = performance.now();
      if (now - this.lastDropTime > this.dropInterval) {
        if (!this.move(0, 1)) this.lock();
        this.lastDropTime = now;
      }
      this.renderer.render(this);
      this.rafId = requestAnimationFrame(() => this.loop());
    }
    bindUI() {
      root.querySelectorAll('[data-tetris-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.getAttribute('data-tetris-action');
          if (action === 'start') this.start();
          else if (action === 'restart' || action === 'restart-overlay') this.restart();
          else if (action === 'play-pause') {
            if (!this.started || this.gameOver) this.start();
            else this.togglePause();
          }
        });
      });

      // Focus-gated keyboard: only intercept while embed has focus.
      root.addEventListener('keydown', (e) => {
        const handled = this.handleKey(e.key);
        if (handled) e.preventDefault();
      });

      // Click anywhere on the embed grabs focus.
      root.addEventListener('mousedown', () => {
        if (root !== document.activeElement) root.focus();
      });

      // Touch swipes / taps on the game canvas.
      const canvas = this.q('[data-tetris="game"]');
      let tx = 0, ty = 0, tt = 0;
      const SWIPE = 30, TAP = 200;
      canvas.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        tx = t.clientX; ty = t.clientY; tt = Date.now();
      }, { passive: true });
      canvas.addEventListener('touchend', (e) => {
        if (this.gameOver) return;
        if (!this.started) { this.start(); return; }
        if (this.paused) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - tx;
        const dy = t.clientY - ty;
        const dt = Date.now() - tt;
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < TAP) { this.rotate(1); return; }
        if (Math.abs(dx) > Math.abs(dy)) {
          if (Math.abs(dx) > SWIPE) this.move(dx > 0 ? 1 : -1, 0);
        } else {
          if (Math.abs(dy) > SWIPE) {
            if (dy > 0) this.softDrop(); else this.hardDrop();
          }
        }
      }, { passive: true });
    }
    handleKey(key) {
      if (!this.started || this.gameOver) {
        if (key === 'Enter' || key === ' ') { this.start(); return true; }
        return false;
      }
      const GAME_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'c', 'C', 'p', 'P', 'Escape'];
      if (!GAME_KEYS.includes(key)) return false;
      if (this.paused && key !== 'p' && key !== 'P' && key !== 'Escape') return true;
      switch (key) {
        case 'ArrowLeft': this.move(-1, 0); break;
        case 'ArrowRight': this.move(1, 0); break;
        case 'ArrowDown': this.softDrop(); break;
        case 'ArrowUp': this.rotate(1); break;
        case ' ': this.hardDrop(); break;
        case 'c': case 'C': this.hold(); break;
        case 'p': case 'P': case 'Escape': this.togglePause(); break;
      }
      return true;
    }
  }

  // Lazy-init when the embed scrolls near the viewport.
  let game = null;
  const init = () => { if (!game) game = new Game(); };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { init(); io.disconnect(); }
      });
    }, { rootMargin: '200px' });
    io.observe(root);
  } else {
    init();
  }
})();
