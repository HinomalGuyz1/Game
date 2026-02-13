/**
 * ボード設定
 * マスの定義と各マスへのイベント割り当て
 */

import EventRegistry from './eventRegistry.js';

const TOTAL_SQUARES = 30; // ゴール含む

// 各マスのイベントID割り当て（マス0=スタート, マス29=ゴール）
// スタートとゴールにはイベントなし
const squareEventMap = [
    null,           // 0: スタート
    'advance_1',    // 1
    'neutral_1',    // 2
    'retreat_1',    // 3
    'bonus',        // 4
    'neutral_2',    // 5
    'advance_2',    // 6
    'retreat_2',    // 7
    'skip_turn',    // 8
    'neutral_3',    // 9
    'advance_3',    // 10
    'retreat_1',    // 11
    'swap',         // 12
    'advance_1',    // 13
    'neutral_1',    // 14
    'retreat_3',    // 15
    'bonus',        // 16
    'advance_2',    // 17
    'neutral_2',    // 18
    'retreat_1',    // 19
    'skip_turn',    // 20
    'advance_1',    // 21
    'neutral_3',    // 22
    'retreat_2',    // 23
    'advance_3',    // 24
    'swap',         // 25
    'neutral_1',    // 26
    'retreat_1',    // 27
    'bonus',        // 28
    null,           // 29: ゴール
];

const BoardConfig = {
    TOTAL_SQUARES,
    START_POSITION: 0,
    GOAL_POSITION: TOTAL_SQUARES - 1,
    COLUMNS: 5, // ボード表示の列数

    /**
     * マスのイベントIDを取得
     * @param {number} squareIndex
     * @returns {string|null}
     */
    getEventId(squareIndex) {
        return squareEventMap[squareIndex] || null;
    },

    /**
     * マスのイベント情報を取得
     * @param {number} squareIndex
     * @returns {object|null}
     */
    getSquareEvent(squareIndex) {
        const eventId = this.getEventId(squareIndex);
        if (!eventId) return null;
        return EventRegistry.getEvent(eventId);
    },

    /**
     * マスのイベントIDを変更
     * @param {number} squareIndex
     * @param {string|null} eventId
     */
    setSquareEvent(squareIndex, eventId) {
        if (squareIndex < 0 || squareIndex >= TOTAL_SQUARES) {
            throw new Error(`Invalid square index: ${squareIndex}`);
        }
        squareEventMap[squareIndex] = eventId;
    },

    /**
     * マス情報を一覧取得
     * @returns {object[]}
     */
    getAllSquares() {
        return squareEventMap.map((eventId, index) => {
            const event = eventId ? EventRegistry.getEvent(eventId) : null;
            let label = '';
            if (index === 0) label = 'START';
            else if (index === TOTAL_SQUARES - 1) label = 'GOAL';
            else label = `${index}`;

            return {
                index,
                label,
                eventId,
                event,
                isStart: index === 0,
                isGoal: index === TOTAL_SQUARES - 1,
            };
        });
    },
};

export default BoardConfig;
