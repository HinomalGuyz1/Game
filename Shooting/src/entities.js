/**
 * エンティティ定義
 * Player, Enemy, Bullet, Particle, Star
 */

// ============== Star (背景) ==============
export class Star {
    constructor(canvas) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speed = Math.random() * 1.5 + 0.5;
        this.opacity = Math.random() * 0.7 + 0.3;
        this.canvasH = canvas.height;
        this.canvasW = canvas.width;
    }

    update() {
        this.y += this.speed;
        if (this.y > this.canvasH) {
            this.y = 0;
            this.x = Math.random() * this.canvasW;
        }
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ============== Player ==============
export class Player {
    constructor(canvas) {
        this.width = 40;
        this.height = 44;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 20;
        this.speed = 6;
        this.lives = 3;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.shootCooldown = 0;
        this.shootInterval = 12; // フレーム
        this.canvasW = canvas.width;
        this.thrusterPhase = 0;
    }

    update(inputState) {
        // 移動
        if (inputState.left) this.x -= this.speed;
        if (inputState.right) this.x += this.speed;

        // タッチ移動
        if (inputState.touchX !== null) {
            const targetX = inputState.touchX - this.width / 2;
            const diff = targetX - this.x;
            this.x += diff * 0.15;
        }

        // 画面内制限
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.canvasW) this.x = this.canvasW - this.width;

        // 無敵時間
        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) this.invincible = false;
        }

        // 射撃クールダウン
        if (this.shootCooldown > 0) this.shootCooldown--;

        this.thrusterPhase += 0.2;
    }

    canShoot() {
        return this.shootCooldown <= 0;
    }

    shoot() {
        this.shootCooldown = this.shootInterval;
        return new Bullet(this.x + this.width / 2, this.y);
    }

    hit() {
        if (this.invincible) return false;
        this.lives--;
        this.invincible = true;
        this.invincibleTimer = 90; // 1.5秒
        return true;
    }

    draw(ctx) {
        if (this.invincible && Math.floor(this.invincibleTimer / 4) % 2 === 0) return;

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // スラスター炎
        const flameH = 8 + Math.sin(this.thrusterPhase) * 4;
        const grad = ctx.createLinearGradient(0, this.height / 2, 0, this.height / 2 + flameH);
        grad.addColorStop(0, '#6C63FF');
        grad.addColorStop(0.5, '#FF6584');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-8, this.height / 2 - 4);
        ctx.lineTo(0, this.height / 2 + flameH);
        ctx.lineTo(8, this.height / 2 - 4);
        ctx.fill();

        // 機体
        ctx.fillStyle = '#6C63FF';
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 2 - 4);
        ctx.lineTo(-this.width / 4, this.height / 2 - 8);
        ctx.lineTo(0, this.height / 2 - 2);
        ctx.lineTo(this.width / 4, this.height / 2 - 8);
        ctx.lineTo(this.width / 2, this.height / 2 - 4);
        ctx.closePath();
        ctx.fill();

        // コクピット
        ctx.fillStyle = '#a0a0ff';
        ctx.beginPath();
        ctx.ellipse(0, -4, 5, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ============== Bullet ==============
export class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 14;
        this.speed = 10;
        this.alive = true;
    }

    update() {
        this.y -= this.speed;
        if (this.y + this.height < 0) this.alive = false;
    }

    draw(ctx) {
        const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, '#6C63FF');
        ctx.fillStyle = grad;
        ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);

        // グロー
        ctx.shadowColor = '#6C63FF';
        ctx.shadowBlur = 8;
        ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

// ============== Enemy ==============
const ENEMY_TYPES = {
    normal: { width: 30, height: 30, speed: 2, hp: 1, score: 100, color: '#FF6584' },
    fast: { width: 24, height: 24, speed: 4, hp: 1, score: 200, color: '#FFD700' },
    big: { width: 48, height: 48, speed: 1.2, hp: 3, score: 500, color: '#ff4444' },
};

export class Enemy {
    constructor(x, type = 'normal', canvasH) {
        const t = ENEMY_TYPES[type] || ENEMY_TYPES.normal;
        this.type = type;
        this.x = x;
        this.y = -t.height;
        this.width = t.width;
        this.height = t.height;
        this.speed = t.speed;
        this.hp = t.hp;
        this.maxHp = t.hp;
        this.score = t.score;
        this.color = t.color;
        this.alive = true;
        this.canvasH = canvasH;
        this.wobblePhase = Math.random() * Math.PI * 2;
        this.wobbleSpeed = type === 'fast' ? 0.08 : 0.03;
        this.wobbleAmp = type === 'fast' ? 2 : 1;
    }

    update() {
        this.y += this.speed;
        this.wobblePhase += this.wobbleSpeed;
        this.x += Math.sin(this.wobblePhase) * this.wobbleAmp;
        if (this.y > this.canvasH + this.height) this.alive = false;
    }

    hit() {
        this.hp--;
        if (this.hp <= 0) {
            this.alive = false;
            return true; // 撃破
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y + this.height / 2);

        if (this.type === 'big') {
            // 大型: 六角形
            ctx.fillStyle = this.color;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 2;
                const r = this.width / 2;
                ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
            }
            ctx.closePath();
            ctx.fill();
            // HPバー
            if (this.hp < this.maxHp) {
                const barW = this.width;
                const barH = 4;
                ctx.fillStyle = '#333';
                ctx.fillRect(-barW / 2, -this.height / 2 - 8, barW, barH);
                ctx.fillStyle = '#4ade80';
                ctx.fillRect(-barW / 2, -this.height / 2 - 8, barW * (this.hp / this.maxHp), barH);
            }
        } else if (this.type === 'fast') {
            // 高速: 菱形
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(0, -this.height / 2);
            ctx.lineTo(this.width / 2, 0);
            ctx.lineTo(0, this.height / 2);
            ctx.lineTo(-this.width / 2, 0);
            ctx.closePath();
            ctx.fill();
        } else {
            // 通常: 逆三角形
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(-this.width / 2, -this.height / 2);
            ctx.lineTo(this.width / 2, -this.height / 2);
            ctx.lineTo(0, this.height / 2);
            ctx.closePath();
            ctx.fill();
        }

        // コア（光る点）
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.restore();
    }
}

// ============== Particle ==============
export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.02;
        this.size = Math.random() * 3 + 1;
        this.color = color;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.05; // gravity
        this.life -= this.decay;
    }

    get alive() {
        return this.life > 0;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}
