/**
 * メインアプリケーション
 * UIの描画とイベントハンドリング
 */

import GameState from './gameState.js';
import BoardConfig from './config/boardConfig.js';

// ============== DOM 生成 ==============

function createApp() {
    const app = document.getElementById('app');
    app.innerHTML = `
    <header class="header">
      <h1 class="header__title">🎲 すごろく</h1>
    </header>

    <section class="player-bar" id="player-bar"></section>

    <section class="dice-section" id="dice-section">
      <div class="dice" id="dice">
        <div class="dice__face" id="dice-face"></div>
      </div>
      <button class="dice-btn" id="roll-btn">サイコロを振る</button>
    </section>

    <section class="board-container">
      <div class="board" id="board"></div>
    </section>

    <!-- イベントモーダル -->
    <div class="modal-overlay" id="event-modal" style="display:none;">
      <div class="modal">
        <div class="modal__icon" id="modal-icon"></div>
        <h2 class="modal__title" id="modal-title"></h2>
        <p class="modal__desc" id="modal-desc"></p>
        <button class="modal__btn" id="modal-close-btn">OK</button>
      </div>
    </div>

    <!-- ゲームオーバーモーダル -->
    <div class="modal-overlay" id="gameover-modal" style="display:none;">
      <div class="modal modal--winner">
        <div class="modal__icon">🎉</div>
        <h2 class="modal__title" id="winner-title"></h2>
        <p class="modal__desc">ゴールに到達！</p>
        <button class="modal__btn" id="replay-btn">もう一度遊ぶ</button>
      </div>
    </div>
  `;

    renderBoard();
    bindEvents();
}

// ============== ボード描画 ==============

function renderBoard() {
    const boardEl = document.getElementById('board');
    const squares = BoardConfig.getAllSquares();
    const cols = BoardConfig.COLUMNS;
    boardEl.innerHTML = '';

    // スネーク状レイアウト: 下から上、行ごとに方向反転
    const rows = Math.ceil(squares.length / cols);
    const orderedSquares = [];

    for (let row = rows - 1; row >= 0; row--) {
        const start = row * cols;
        const end = Math.min(start + cols, squares.length);
        const rowSquares = squares.slice(start, end);

        // 偶数行（下から数えて）は左→右、奇数行は右→左
        const rowFromBottom = rows - 1 - row;
        if (rowFromBottom % 2 === 1) {
            rowSquares.reverse();
        }
        orderedSquares.push(...rowSquares);
    }

    orderedSquares.forEach(sq => {
        const div = document.createElement('div');
        div.className = 'square';
        div.dataset.index = sq.index;

        if (sq.isStart) div.classList.add('square--start');
        if (sq.isGoal) div.classList.add('square--goal');

        // イベントアイコン
        const icon = sq.event ? sq.event.icon : (sq.isStart ? '🚩' : sq.isGoal ? '🏁' : '');

        div.innerHTML = `
      <span class="square__number">${sq.label}</span>
      <span class="square__icon">${icon}</span>
      <div class="square__players" id="sq-players-${sq.index}"></div>
    `;

        boardEl.appendChild(div);
    });
}

// ============== プレイヤーバー更新 ==============

function renderPlayerBar(gameState) {
    const bar = document.getElementById('player-bar');
    bar.innerHTML = gameState.players.map((p, i) => `
    <div class="player-card ${i === gameState.currentPlayerIndex ? 'player-card--active' : ''}"
         style="--player-color: ${p.color}">
      <div class="player-card__marker" style="background: ${p.color}"></div>
      <div class="player-card__info">
        <span class="player-card__name">${p.name}</span>
        <span class="player-card__pos">マス ${p.position}/${BoardConfig.GOAL_POSITION}</span>
      </div>
      ${i === gameState.currentPlayerIndex ? '<span class="player-card__turn">◀ ターン</span>' : ''}
    </div>
  `).join('');
}

// ============== サイコロ描画 ==============

const DICE_DOTS = {
    1: [[1, 1]],
    2: [[0, 2], [2, 0]],
    3: [[0, 2], [1, 1], [2, 0]],
    4: [[0, 0], [0, 2], [2, 0], [2, 2]],
    5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
    6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
};

function renderDice(value, isRolling) {
    const face = document.getElementById('dice-face');
    const dice = document.getElementById('dice');

    if (isRolling) {
        dice.classList.add('dice--rolling');
    } else {
        dice.classList.remove('dice--rolling');
    }

    if (!value) {
        face.innerHTML = '<span class="dice__placeholder">?</span>';
        return;
    }

    const dots = DICE_DOTS[value] || [];
    face.innerHTML = `
    <div class="dice__grid">
      ${[0, 1, 2].map(row =>
        [0, 1, 2].map(col => {
            const hasDot = dots.some(([r, c]) => r === row && c === col);
            return `<div class="dice__cell">${hasDot ? '<span class="dice__dot"></span>' : ''}</div>`;
        }).join('')
    ).join('')}
    </div>
  `;
}

// ============== プレイヤーコマ表示 ==============

function renderPlayerPositions(gameState) {
    // 全マスのプレイヤー表示をクリア
    document.querySelectorAll('.square__players').forEach(el => {
        el.innerHTML = '';
    });

    // 全マスのアクティブ状態をクリア
    document.querySelectorAll('.square').forEach(el => {
        el.classList.remove('square--active-p0', 'square--active-p1');
    });

    gameState.players.forEach(player => {
        const container = document.getElementById(`sq-players-${player.position}`);
        if (container) {
            const piece = document.createElement('span');
            piece.className = `player-piece player-piece--${player.id}`;
            piece.style.background = player.color;
            piece.textContent = player.id === 0 ? '▲' : '●';
            container.appendChild(piece);
        }

        // マスの境界線をプレイヤー色に
        const squareEl = document.querySelector(`.square[data-index="${player.position}"]`);
        if (squareEl) {
            squareEl.classList.add(`square--active-p${player.id}`);
        }
    });
}

// ============== モーダル ==============

function showEventModal(event) {
    const modal = document.getElementById('event-modal');
    document.getElementById('modal-icon').textContent = event.icon || '❓';
    document.getElementById('modal-title').textContent = event.name;
    document.getElementById('modal-desc').textContent = event.description;
    modal.style.display = 'flex';
    modal.classList.add('modal-overlay--visible');
}

function hideEventModal() {
    const modal = document.getElementById('event-modal');
    modal.classList.remove('modal-overlay--visible');
    setTimeout(() => { modal.style.display = 'none'; }, 300);
}

function showGameOverModal(winner) {
    const modal = document.getElementById('gameover-modal');
    document.getElementById('winner-title').textContent = `${winner.name} の勝ち！`;
    modal.style.display = 'flex';
    modal.classList.add('modal-overlay--visible');
}

function hideGameOverModal() {
    const modal = document.getElementById('gameover-modal');
    modal.classList.remove('modal-overlay--visible');
    setTimeout(() => { modal.style.display = 'none'; }, 300);
}

// ============== イベントバインド ==============

function bindEvents() {
    // サイコロボタン
    document.getElementById('roll-btn').addEventListener('click', () => {
        GameState.rollDice();
    });

    // イベントモーダル閉じる
    document.getElementById('modal-close-btn').addEventListener('click', () => {
        hideEventModal();
        GameState.dismissEvent();
    });

    // リプレイ
    document.getElementById('replay-btn').addEventListener('click', () => {
        hideGameOverModal();
        GameState.resetGame();
    });

    // 状態変更を監視
    GameState.subscribe((gameState) => {
        renderPlayerBar(gameState);
        renderDice(gameState.diceValue, gameState.isRolling);
        renderPlayerPositions(gameState);

        // ボタンの有効/無効
        const rollBtn = document.getElementById('roll-btn');
        rollBtn.disabled = gameState.phase !== 'waiting';

        // イベントモーダル
        if (gameState.phase === 'event' && gameState.currentEvent) {
            showEventModal(gameState.currentEvent);
        }

        // ゲームオーバー
        if (gameState.phase === 'gameover' && gameState.winner) {
            showGameOverModal(gameState.winner);
        }
    });

    // 初期描画
    const initialState = GameState.getState();
    renderPlayerBar(initialState);
    renderDice(null, false);
    renderPlayerPositions(initialState);
}

// ============== 起動 ==============

document.addEventListener('DOMContentLoaded', createApp);
