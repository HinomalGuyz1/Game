/**
 * 敵スポナー
 * 時間経過で難易度が上昇する敵出現管理
 */

import { Enemy } from './entities.js';

export class Spawner {
    constructor(canvasW, canvasH) {
        this.canvasW = canvasW;
        this.canvasH = canvasH;
        this.timer = 0;
        this.baseInterval = 60; // フレーム
        this.elapsed = 0; // 経過フレーム（難易度スケーリング用）
    }

    reset() {
        this.timer = 0;
        this.elapsed = 0;
    }

    /**
     * 現在の難易度レベル（0から始まり時間で増加）
     */
    get difficulty() {
        return Math.floor(this.elapsed / 600); // 10秒ごとにレベルアップ
    }

    /**
     * 現在の出現間隔
     */
    get interval() {
        return Math.max(15, this.baseInterval - this.difficulty * 4);
    }

    /**
     * 毎フレーム呼ばれ、必要に応じて敵を生成
     * @returns {Enemy[]}
     */
    update() {
        this.elapsed++;
        this.timer++;

        const spawned = [];

        if (this.timer >= this.interval) {
            this.timer = 0;

            // 敵タイプを決定
            const roll = Math.random();
            let type = 'normal';

            if (this.difficulty >= 2 && roll < 0.1) {
                type = 'big';
            } else if (this.difficulty >= 1 && roll < 0.3) {
                type = 'fast';
            }

            const margin = 40;
            const x = Math.random() * (this.canvasW - margin * 2) + margin;
            spawned.push(new Enemy(x, type, this.canvasH));

            // 高難易度で複数同時出現
            if (this.difficulty >= 3 && Math.random() < 0.3) {
                const x2 = Math.random() * (this.canvasW - margin * 2) + margin;
                spawned.push(new Enemy(x2, 'normal', this.canvasH));
            }
            if (this.difficulty >= 5 && Math.random() < 0.2) {
                const x3 = Math.random() * (this.canvasW - margin * 2) + margin;
                spawned.push(new Enemy(x3, 'fast', this.canvasH));
            }
        }

        return spawned;
    }
}
