class Event {

    constructor(scene) {
        this._events = {
            animate: [],
            renderBefore: [],
            renderAfter: [],
            click: [],
            dbClick: [],
            mousemove: [],
            mousedown: [],
            mouseup: []
        }
    }

    on(key, listener, scope) {
        this._events[key].push({event: listener, scope: scope});
    }

    un(key, listener, scope) {
        const index = this._events[key].findIndex(
            item => item.event === listener && item.scope === scope
        );
        if (index !== -1) {
            this._events[key].splice(index, 1);
        }
    }

    onAnimate(listener, scope) {
        this.on('animate', listener, scope)
    }

    unAnimate(listener, scope) {
        this.un('animate', listener, scope)
    }

    onRenderBefore(listener, scope) {
        this.on('renderBefore', listener, scope)
    }

    unRenderBefore(listener, scope) {
        this.un('renderBefore', listener, scope)
    }

    onRenderAfter(listener, scope) {
        this.on('renderAfter', listener, scope)
    }

    unRenderAfter(listener, scope) {
        this.un('renderAfter', listener, scope)
    }

    onClick(listener, scope) {
        this.on('click', listener, scope)
    }

    unClick(listener, scope) {
        this.un('click', listener, scope)
    }

    onDbClick(listener, scope) {
        this.on('dbClick', listener, scope)
    }

    unDbClick(listener, scope) {
        this.un('dbClick', listener, scope)
    }

    onMousemove(listener, scope) {
        this.on('mousemove', listener, scope)
    }

    unMousemove(listener, scope) {
        this.un('mousemove', listener, scope)
    }

    onMousedown(listener, scope) {
        this.on('mousedown', listener, scope)
    }

    unMousedown(listener, scope) {
        this.un('mousedown', listener, scope)
    }

    onMouseup(listener, scope) {
        this.on('mouseup', listener, scope)
    }

    unMouseup(listener, scope) {
        this.un('mouseup', listener, scope)
    }
}