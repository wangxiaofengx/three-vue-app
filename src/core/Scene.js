class Scene {

    constructor(options) {
        this.id = null;
        this.name = null;
        this._canvas = null;
        this._group = null;
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
        Object.assign(this, options);
    }

    init() {

    }


}

export default Scene;