/**
 * ゲーム状態管理
 * プレイヤー位置、ターン、サイコロの値などを一元管理
 */

import BoardConfig from './config/boardConfig.js';
import EventRegistry from './config/eventRegistry.js';

const GameState = (() => {
    const state = {
        players: [
            { id: 0, name: 'プレイヤー1', position: 0, color: '#6C63FF', skipNext: false },
            { id: 1, name: 'プレイヤー2', position: 0, color: '#FF6584', skipNext: false },
        ],
        currentPlayerIndex: 0,
        diceValue: null,
        isRolling: false,
        isGameOver: false,
        winner: null,
        currentEvent: null,
        phase: 'waiting', // 'waiting' | 'rolling' | 'moving' | 'event' | 'gameover'
    };

    // コールバックリスト
    const listeners = new Set();

    function notify() {
        listeners.forEach(fn => fn(getSnapshot()));
    }

    function getSnapshot() {
        return {
            players: state.players.map(p => ({ ...p })),
            currentPlayerIndex: state.currentPlayerIndex,
            currentPlayer: { ...state.players[state.currentPlayerIndex] },
            diceValue: state.diceValue,
            isRolling: state.isRolling,
            isGameOver: state.isGameOver,
            winner: state.winner ? { ...state.winner } : null,
            currentEvent: state.currentEvent ? { ...state.currentEvent } : null,
            phase: state.phase,
        };
    }

    return {
        /**
         * 状態変更リスナーを登録
         * @param {function} fn
         * @returns {function} unsubscribe
         */
        subscribe(fn) {
            listeners.add(fn);
            return () => listeners.delete(fn);
        },

        /**
         * 現在のスナップショットを取得
         */
        getState() {
            return getSnapshot();
        },

        /**
         * サイコロを振る
         * @returns {Promise<number>}
         */
        async rollDice() {
            if (state.phase !== 'waiting' || state.isGameOver) return;

            // スキップ判定
            const currentPlayer = state.players[state.currentPlayerIndex];
            if (currentPlayer.skipNext) {
                currentPlayer.skipNext = false;
                state.currentEvent = {
                    name: '1回休み',
                    description: `${currentPlayer.name}は1回休み…`,
                    icon: '😴',
                    type: 'skip_turn',
                };
                state.phase = 'event';
                notify();

                await new Promise(resolve => setTimeout(resolve, 1500));
                state.currentEvent = null;
                state.phase = 'waiting';
                state.currentPlayerIndex = (state.currentPlayerIndex + 1) % 2;
                notify();
                return;
            }

            // サイコロ演出
            state.phase = 'rolling';
            state.isRolling = true;
            notify();

            // ランダム表示演出
            for (let i = 0; i < 10; i++) {
                state.diceValue = Math.floor(Math.random() * 6) + 1;
                notify();
                await new Promise(resolve => setTimeout(resolve, 80));
            }

            // 最終値
            const finalValue = Math.floor(Math.random() * 6) + 1;
            state.diceValue = finalValue;
            state.isRolling = false;
            notify();

            await new Promise(resolve => setTimeout(resolve, 400));

            // プレイヤー移動
            state.phase = 'moving';
            const player = state.players[state.currentPlayerIndex];
            let newPosition = player.position + finalValue;

            // ゴールを超えた場合はゴールで止まる
            if (newPosition >= BoardConfig.GOAL_POSITION) {
                newPosition = BoardConfig.GOAL_POSITION;
            }

            // 1マスずつ移動アニメーション
            const startPos = player.position;
            for (let pos = startPos + 1; pos <= newPosition; pos++) {
                player.position = pos;
                notify();
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // ゴール判定
            if (player.position === BoardConfig.GOAL_POSITION) {
                state.isGameOver = true;
                state.winner = { ...player };
                state.phase = 'gameover';
                notify();
                return;
            }

            // イベント発火
            const event = BoardConfig.getSquareEvent(player.position);
            if (event) {
                state.currentEvent = event;
                state.phase = 'event';
                notify();

                // イベント効果を適用（少し待ってから）
                await new Promise(resolve => setTimeout(resolve, 1500));
                this.applyEvent(event, player);
            } else {
                state.phase = 'waiting';
                state.currentPlayerIndex = (state.currentPlayerIndex + 1) % 2;
                notify();
            }
        },

        /**
         * イベント効果を適用
         */
        applyEvent(event, player) {
            const otherPlayer = state.players[(state.currentPlayerIndex + 1) % 2];
            let grantBonusTurn = false;

            switch (event.type) {
                case EventRegistry.EVENT_TYPES.ADVANCE: {
                    let newPos = player.position + (event.effect?.value || 0);
                    if (newPos >= BoardConfig.GOAL_POSITION) {
                        newPos = BoardConfig.GOAL_POSITION;
                    }
                    player.position = newPos;

                    if (player.position === BoardConfig.GOAL_POSITION) {
                        state.isGameOver = true;
                        state.winner = { ...player };
                        state.phase = 'gameover';
                        notify();
                        return;
                    }
                    break;
                }
                case EventRegistry.EVENT_TYPES.RETREAT: {
                    let newPos = player.position - (event.effect?.value || 0);
                    if (newPos < 0) newPos = 0;
                    player.position = newPos;
                    break;
                }
                case EventRegistry.EVENT_TYPES.SKIP_TURN:
                    player.skipNext = true;
                    break;
                case EventRegistry.EVENT_TYPES.BONUS:
                    grantBonusTurn = true;
                    break;
                case EventRegistry.EVENT_TYPES.SWAP: {
                    const tempPos = player.position;
                    player.position = otherPlayer.position;
                    otherPlayer.position = tempPos;
                    break;
                }
                case EventRegistry.EVENT_TYPES.NEUTRAL:
                default:
                    break;
            }

            state.currentEvent = null;
            state.phase = 'waiting';
            if (!grantBonusTurn) {
                state.currentPlayerIndex = (state.currentPlayerIndex + 1) % 2;
            }
            notify();
        },

        /**
         * イベントモーダルを閉じる
         */
        dismissEvent() {
            if (state.phase === 'event' && state.currentEvent) {
                const player = state.players[state.currentPlayerIndex];
                const event = state.currentEvent;
                this.applyEvent(event, player);
            }
        },

        /**
         * ゲームをリセット
         */
        resetGame() {
            state.players[0].position = 0;
            state.players[0].skipNext = false;
            state.players[1].position = 0;
            state.players[1].skipNext = false;
            state.currentPlayerIndex = 0;
            state.diceValue = null;
            state.isRolling = false;
            state.isGameOver = false;
            state.winner = null;
            state.currentEvent = null;
            state.phase = 'waiting';
            notify();
        },
    };
})();

export default GameState;
