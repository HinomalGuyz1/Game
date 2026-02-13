/**
 * 入力管理
 * キーボード、タッチ、マウスを統一的に処理
 */

export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.state = {
            left: false,
            right: false,
            touchX: null,
        };

        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseLeave = this._onMouseLeave.bind(this);

        this.bind();
    }

    bind() {
        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup', this._onKeyUp);
        this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', this._onTouchEnd);
        this.canvas.addEventListener('mousemove', this._onMouseMove);
        this.canvas.addEventListener('mouseleave', this._onMouseLeave);
    }

    unbind() {
        document.removeEventListener('keydown', this._onKeyDown);
        document.removeEventListener('keyup', this._onKeyUp);
        this.canvas.removeEventListener('touchstart', this._onTouchStart);
        this.canvas.removeEventListener('touchmove', this._onTouchMove);
        this.canvas.removeEventListener('touchend', this._onTouchEnd);
        this.canvas.removeEventListener('mousemove', this._onMouseMove);
        this.canvas.removeEventListener('mouseleave', this._onMouseLeave);
    }

    _onKeyDown(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a') this.state.left = true;
        if (e.key === 'ArrowRight' || e.key === 'd') this.state.right = true;
    }

    _onKeyUp(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a') this.state.left = false;
        if (e.key === 'ArrowRight' || e.key === 'd') this.state.right = false;
    }

    _getTouchX(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        return (e.touches[0].clientX - rect.left) * scaleX;
    }

    _onTouchStart(e) {
        e.preventDefault();
        this.state.touchX = this._getTouchX(e);
    }

    _onTouchMove(e) {
        e.preventDefault();
        this.state.touchX = this._getTouchX(e);
    }

    _onTouchEnd() {
        this.state.touchX = null;
    }

    _onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        this.state.touchX = (e.clientX - rect.left) * scaleX;
    }

    _onMouseLeave() {
        this.state.touchX = null;
    }
}
