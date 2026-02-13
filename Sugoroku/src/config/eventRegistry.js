/**
 * イベントレジストリ
 * マスのイベントを一元管理し、追加・変更・削除を容易にする
 */

const EventRegistry = (() => {
  // イベントタイプ定義
  const EVENT_TYPES = {
    ADVANCE: 'advance',     // 進む
    RETREAT: 'retreat',     // 戻る
    SKIP_TURN: 'skip_turn', // 1回休み
    BONUS: 'bonus',         // ボーナス（もう1回振れる）
    SWAP: 'swap',           // プレイヤー入れ替え
    NEUTRAL: 'neutral',     // 影響なし（メッセージのみ）
  };

  // デフォルトイベント一覧
  const events = new Map();

  // デフォルトイベントを登録
  const defaultEvents = [
    { id: 'advance_1', name: '追い風！', description: '追い風が吹いた！1マス進む', type: EVENT_TYPES.ADVANCE, icon: '💨', effect: { value: 1 } },
    { id: 'advance_2', name: 'ダッシュ！', description: '走り出した！2マス進む', type: EVENT_TYPES.ADVANCE, icon: '🏃', effect: { value: 2 } },
    { id: 'advance_3', name: 'ワープ！', description: 'ワープゾーン発見！3マス進む', type: EVENT_TYPES.ADVANCE, icon: '🌀', effect: { value: 3 } },
    { id: 'retreat_1', name: '落とし穴！', description: '落とし穴に落ちた！1マス戻る', type: EVENT_TYPES.RETREAT, icon: '🕳️', effect: { value: 1 } },
    { id: 'retreat_2', name: '逆風！', description: '強い逆風！2マス戻る', type: EVENT_TYPES.RETREAT, icon: '🌪️', effect: { value: 2 } },
    { id: 'retreat_3', name: '迷子！', description: '道に迷った！3マス戻る', type: EVENT_TYPES.RETREAT, icon: '😵', effect: { value: 3 } },
    { id: 'skip_turn', name: '1回休み', description: '疲れた…1回休み', type: EVENT_TYPES.SKIP_TURN, icon: '😴', effect: {} },
    { id: 'bonus', name: 'もう1回！', description: 'ラッキー！もう1回サイコロを振れる', type: EVENT_TYPES.BONUS, icon: '🎲', effect: {} },
    { id: 'swap', name: '入れ替え！', description: '相手と位置を入れ替える！', type: EVENT_TYPES.SWAP, icon: '🔄', effect: {} },
    { id: 'neutral_1', name: '休憩所', description: 'きれいな景色！一息つこう', type: EVENT_TYPES.NEUTRAL, icon: '🏞️', effect: {} },
    { id: 'neutral_2', name: 'お花畑', description: 'お花畑を通過中…', type: EVENT_TYPES.NEUTRAL, icon: '🌸', effect: {} },
    { id: 'neutral_3', name: '星空', description: '美しい星空が見える', type: EVENT_TYPES.NEUTRAL, icon: '⭐', effect: {} },
  ];

  // 初期登録
  defaultEvents.forEach(event => {
    events.set(event.id, { ...event });
  });

  return {
    EVENT_TYPES,

    /**
     * イベントを取得
     * @param {string} eventId
     * @returns {object|null}
     */
    getEvent(eventId) {
      const event = events.get(eventId);
      return event ? { ...event } : null;
    },

    /**
     * 全イベントを取得
     * @returns {object[]}
     */
    getAllEvents() {
      return Array.from(events.values()).map(e => ({ ...e }));
    },

    /**
     * イベントを登録（追加 or 上書き）
     * @param {object} event
     */
    registerEvent(event) {
      if (!event.id || !event.name || !event.type) {
        throw new Error('Event must have id, name, and type');
      }
      events.set(event.id, { ...event });
    },

    /**
     * イベントを更新（部分更新）
     * @param {string} eventId
     * @param {object} updates
     */
    updateEvent(eventId, updates) {
      const existing = events.get(eventId);
      if (!existing) {
        throw new Error(`Event not found: ${eventId}`);
      }
      events.set(eventId, { ...existing, ...updates });
    },

    /**
     * イベントを削除
     * @param {string} eventId
     */
    removeEvent(eventId) {
      events.delete(eventId);
    },

    /**
     * 全イベントをリセット（デフォルトに戻す）
     */
    reset() {
      events.clear();
      defaultEvents.forEach(event => {
        events.set(event.id, { ...event });
      });
    },
  };
})();

export default EventRegistry;
