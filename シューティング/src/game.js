/**
 * ゲームメインループ
 * 状態管理、更新、描画、当たり判定
 */

import { Player, Star, Particle } from './entities.js';
import { InputManager } from './input.js';
import { Spawner } from './spawner.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();

        this.input = new InputManager(canvas);
        this.state = 'start'; // 'start' | 'playing' | 'gameover'
        this.score = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.hiScore = parseInt(localStorage.getItem('shooting_hiscore') || '0');

        // エンティティ
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.stars = [];
        this.spawner = null;

        // 背景の星を初期化
        for (let i = 0; i < 80; i++) {
            this.stars.push(new Star(this.canvas));
        }

        // UI要素
        this.scoreEl = document.getElementById('score-value');
        this.comboEl = document.getElementById('combo');
        this.livesEl = document.getElementById('lives');
        this.startScreen = document.getElementById('start-screen');
        this.gameoverScreen = document.getElementById('gameover-screen');
        this.finalScoreEl = document.getElementById('final-score');
        this.hiScoreEl = document.getElementById('hi-score');
        this.hiScoreStartEl = document.getElementById('hi-score-start');

        // スタート / リスタート
        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('restart-btn').addEventListener('click', () => this.start());
        // キーボードでもスタート
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                if (this.state === 'start' || this.state === 'gameover') this.start();
            }
        });

        this.hiScoreStartEl.textContent = this.hiScore;
        this.startScreen.classList.add('visible');

        // リサイズ対応
        window.addEventListener('resize', () => this.resize());

        // ゲームループ開始
        this.loop();
    }

    resize() {
        const ratio = window.devicePixelRatio || 1;
        const maxW = 480;
        const w = Math.min(window.innerWidth, maxW);
        const h = window.innerHeight;
        this.canvas.width = w * ratio;
        this.canvas.height = h * ratio;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.scale(ratio, ratio);
        this.W = w;
        this.H = h;
    }

    start() {
        this.state = 'playing';
        this.score = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.bullets = [];
        this.enemies = [];
        this.particles = [];

        // resize canvas for game coords
        this.canvas.width = this.W;
        this.canvas.height = this.H;

        this.player = new Player(this.canvas);
        this.spawner = new Spawner(this.canvas.width, this.canvas.height);

        this.startScreen.classList.remove('visible');
        this.gameoverScreen.classList.remove('visible');
        this.updateUI();
    }

    gameOver() {
        this.state = 'gameover';
        if (this.score > this.hiScore) {
            this.hiScore = this.score;
            localStorage.setItem('shooting_hiscore', String(this.hiScore));
        }
        this.finalScoreEl.textContent = this.score.toLocaleString();
        this.hiScoreEl.textContent = this.hiScore.toLocaleString();
        this.gameoverScreen.classList.add('visible');
    }

    // ============== ゲームループ ==============

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    update() {
        // 背景の星は常に更新
        this.stars.forEach(s => s.update());

        if (this.state !== 'playing') return;

        // プレイヤー更新
        this.player.update(this.input.state);

        // 自動射撃
        if (this.player.canShoot()) {
            this.bullets.push(this.player.shoot());
        }

        // 弾更新
        this.bullets.forEach(b => b.update());
        this.bullets = this.bullets.filter(b => b.alive);

        // 敵出現
        const newEnemies = this.spawner.update();
        this.enemies.push(...newEnemies);

        // 敵更新
        this.enemies.forEach(e => e.update());

        // コンボタイマー
        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) this.combo = 0;
        }

        // 当たり判定: 弾 vs 敵
        for (const bullet of this.bullets) {
            if (!bullet.alive) continue;
            for (const enemy of this.enemies) {
                if (!enemy.alive) continue;
                if (this.checkCollision(
                    bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height,
                    enemy.x - enemy.width / 2, enemy.y, enemy.width, enemy.height
                )) {
                    bullet.alive = false;
                    const destroyed = enemy.hit();
                    if (destroyed) {
                        // コンボ
                        this.combo++;
                        this.comboTimer = 90;
                        const comboMultiplier = Math.min(this.combo, 10);
                        this.score += enemy.score * comboMultiplier;

                        // 爆発パーティクル
                        for (let i = 0; i < 12; i++) {
                            this.particles.push(new Particle(enemy.x, enemy.y + enemy.height / 2, enemy.color));
                        }
                        for (let i = 0; i < 6; i++) {
                            this.particles.push(new Particle(enemy.x, enemy.y + enemy.height / 2, '#ffffff'));
                        }
                    }
                    break;
                }
            }
        }

        // 当たり判定: 敵 vs プレイヤー
        for (const enemy of this.enemies) {
            if (!enemy.alive) continue;
            if (this.checkCollision(
                this.player.x, this.player.y, this.player.width, this.player.height,
                enemy.x - enemy.width / 2, enemy.y, enemy.width, enemy.height
            )) {
                enemy.alive = false;
                const wasHit = this.player.hit();
                if (wasHit) {
                    // ヒットエフェクト
                    for (let i = 0; i < 20; i++) {
                        this.particles.push(new Particle(
                            this.player.x + this.player.width / 2,
                            this.player.y + this.player.height / 2,
                            '#6C63FF'
                        ));
                    }
                    this.combo = 0;
                    if (this.player.lives <= 0) {
                        this.gameOver();
                    }
                }
            }
        }

        // 画面外の敵を削除
        this.enemies = this.enemies.filter(e => e.alive);

        // パーティクル更新
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.alive);

        this.updateUI();
    }

    checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }

    // ============== 描画 ==============

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.W, this.H);

        // 背景
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, this.W, this.H);

        // 星
        this.stars.forEach(s => s.draw(ctx));

        if (this.state !== 'playing' && this.state !== 'gameover') return;

        // 弾
        this.bullets.forEach(b => b.draw(ctx));

        // 敵
        this.enemies.forEach(e => e.draw(ctx));

        // パーティクル
        this.particles.forEach(p => p.draw(ctx));

        // プレイヤー
        if (this.player) this.player.draw(ctx);
    }

    // ============== UI更新 ==============

    updateUI() {
        this.scoreEl.textContent = this.score.toLocaleString();

        // コンボ表示
        if (this.combo >= 2) {
            this.comboEl.textContent = `${this.combo} COMBO!`;
            this.comboEl.classList.add('visible');
        } else {
            this.comboEl.classList.remove('visible');
        }

        // ライフ表示
        if (this.player) {
            this.livesEl.textContent = '♥'.repeat(this.player.lives);
        }
    }
}
