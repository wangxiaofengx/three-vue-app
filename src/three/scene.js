import * as THREE from 'three';
import gsap from 'gsap';
import Stats from 'stats.js';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
import {MTLLoader} from 'three/examples/jsm/loaders/MTLLoader.js';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';


class Map {

    constructor(options) {
        this.canvas = null;
        this._events = {
            animate: [],
            renderBefore: [],
            renderAfter: [],
            click: [],
            mousemove: [],
            mousedown: [],
            mouseup: []
        }
        Object.assign(this, options);
    }

    async init() {
        const that = this;
        const scene = this._scene = new THREE.Scene();
        const canvas = this.canvas;

        const axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);

        const camera = this._camera = new THREE.PerspectiveCamera(
            75,
            canvas.clientWidth / canvas.clientHeight,
            0.1,
            2000
        );

        const renderer = this._renderer = new THREE.WebGLRenderer({canvas, antialias: true});
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        // 添加控制器
        const controls = this._controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; // 惯性（更顺滑）
        controls.dampingFactor = 0.05;

        controls.enableZoom = true;          // 启用缩放（滚轮）
        controls.enablePan = true;           // 启用右键平移
        controls.minDistance = 1;            // 最小缩放距离
        // controls.maxDistance = 10;           // 最大缩放距离
        // controls.maxPolarAngle = Math.PI / 2; // 最大垂直角度（防止上下翻转）

        // 允许垂直方向自由旋转
        controls.minPolarAngle = 0;             // 最低可以仰望天顶
        controls.maxPolarAngle = Math.PI;       // 最高可以俯视地面

        // 可选：放宽水平旋转范围
        controls.minAzimuthAngle = -Infinity;
        controls.maxAzimuthAngle = Infinity;

        controls.update();

        const light = new THREE.HemisphereLight(0xffffff, 0x444444);
        scene.add(light);

        this.loadGrid(scene);
        this.loadFps();
        this.loadEvent()

        const loader = new RGBELoader();
        loader.load('/resource/hdr/kloofendal_48d_partly_cloudy_puresky_1k.hdr', texture => {
            texture.mapping = THREE.EquirectangularReflectionMapping;

            // 设置为场景背景
            scene.background = texture;

            // 设置为物体反射的环境贴图
            scene.environment = texture;
        });

        function animate() {
            that._events.animate.forEach(e => e.event && e.event.call(e.scope));
            that._events.renderBefore.forEach(e => e.event && e.event.call(e.scope));
            renderer.render(scene, camera);
            that._events.renderAfter.forEach(e => e.event && e.event.call(e.scope));
            requestAnimationFrame(animate);
        }

        animate();

        // 响应窗口变化
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
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

    loadMouseEvent() {
        const that = this;
        let isClick = false;
        let clickStart = new THREE.Vector2();

        window.addEventListener('mousedown', (event) => {
            that._events.mousedown.forEach(e => e.event && e.event.call(e.scope, event));
            if (event.button === 0) { // 左键
                isClick = true;
                clickStart.set(event.clientX, event.clientY);
            }
        });

        window.addEventListener('mousemove', (event) => {
            that._events.mousemove.forEach(e => e.event && e.event.call(e.scope, event));

            const move = new THREE.Vector2(event.clientX, event.clientY);
            if (move.distanceTo(clickStart) > 5) {
                isClick = false;
            }
        });

        window.addEventListener('mouseup', (event) => {
            that._events.mouseup.forEach(e => e.event && e.event.call(e.scope, event));

            if (event.button === 0 && isClick) {
                that._events.click.forEach(e => e.event && e.event.call(e.scope, event));
            }
        });
    }

    loadEvent() {
        this.loadMouseEvent();
    }

    loadFps() {
        // 创建 stats 面板
        const stats = new Stats();
        stats.showPanel(0); // 0: FPS, 1: MS, 2: MB
        document.body.appendChild(stats.dom);
        this.onRenderBefore(item => stats.begin())
        this.onRenderAfter(item => stats.end())
    }

    loadGrid(scene) {

        const gridHelper = new THREE.GridHelper(1000, 1000, 0xff0000, 0x999999);
        scene.add(gridHelper);

        // const grid1 = new THREE.GridHelper(1000, 1000);
        // grid1.material.color.setHex(0x999999);
        // grid1.material.vertexColors = false;
        // scene.add(grid1);
        //
        // const grid2 = new THREE.GridHelper(1000, 2);
        // grid2.material.color.setHex(0x777777);
        // grid2.material.vertexColors = false;
        // scene.add(grid2);

        // const base64Grid = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2Ij4KICA8cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iYmxhY2siLz4KICA8ZyBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIG9wYWNpdHk9IjAuOCI+CiAgICA8cGF0aCBkPSJNMCAwIEwyNTYgMCBMMjU2IDI1NiBMMCAtIiBmaWxsPSJub25lIi8+CiAgICA8bGluZSB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMjU2Ii8+CiAgICA8bGluZSB5MT0iMCIgeDE9IjAiIHkyPSIwIiB4Mj0iMjU2Ii8+CiAgPC9nPgo8L3N2Zz4=';
        //
        // // 加载贴图
        // const texture = new THREE.TextureLoader().load(base64Grid);
        // texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        // texture.repeat.set(50, 50);
        //
        // // 材质和网格面
        // const material = new THREE.MeshBasicMaterial({
        //     map: texture,
        //     side: THREE.DoubleSide,
        //     transparent: true,
        //     opacity: 0.8,
        //     depthWrite: false,
        // });
        // const plane = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), material);
        // plane.rotation.x = -Math.PI / 2;
        // scene.add(plane);
    }

    loadModel() {
        const scene = this._scene;
        return new Promise(resolve => {
            // 加载 OBJ 模型
            const mtlLoader = new MTLLoader();
            // mtlLoader.setPath('/model/buildings/');
            mtlLoader.load('/model/grass/building_04.mtl', (materials) => {
                materials.preload();

                const objLoader = new OBJLoader();
                objLoader.setMaterials(materials);
                // mtlLoader.setPath('/model/buildings/');
                objLoader.load('/model/grass/building_04.obj', (object) => {
                    scene.add(object);
                    // 计算模型的包围盒
                    const box = new THREE.Box3().setFromObject(object);
                    console.log(box)
                    const minY = box.min.y;
                    object.position.y -= minY;
                    resolve(object);
                });
            });
        })
    }

    async loadModel2() {
        const that = this;
        const scene = this._scene;
        // 1. 你的 EPSG:4526 坐标点
        const points = [
            [38466388.2988292, 3846057.4789985027],
            [38466363.106568456, 3845818.992263477],
            [38465901.24845485, 3845798.838454883],
            [38466353.02966416, 3845693.030959766],
            [38466146.45312607, 3845330.2624050784],
            [38466472.27303167, 3845647.68489043],
            [38466630.14453232, 3845652.7233425784],
            [38466824.96468206, 3845338.659825326],
            [38466720.836670995, 3845666.1592149744],
            [38466720.836670995, 3845795.479486784],
            [38467118.87439072, 3845798.838454883],
            [38466725.87512314, 3845884.4921414065],
            [38466880.38765569, 3846185.1197862634],
            [38466650.29834092, 3845906.3254340496],
            [38466472.27303167, 3845887.8511095056],
            // [38466388.2988292, 3846057.4789985027], // 闭合
        ];

        // 2. 平移原点，使模型在中心附近（避免数值太大）
        const center = this.getCenterFromPoints(points);

        // 缩小坐标点（米 → 单位坐标），再设置合适的建筑高度
        const scale = 0.01;
        const height = 5; // 30 米变为 0.03 单位（配合缩放）

        const outerPoints = points.map(([x, y], i) => {
            const px = (x - center.x) * scale;
            const py = (y - center.y) * scale;
            return new THREE.Vector2(px, py)
        })
        const shape = new THREE.Shape(outerPoints);

        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: height,
            bevelEnabled: false
        });

        let material = new THREE.MeshStandardMaterial({
            color: 0x8888ff,
            vertexColors: true,
            side: THREE.DoubleSide
        });

        let textureLoader = new THREE.TextureLoader();
        let texture = textureLoader.load('/resource/20051814lid32ehd.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        let material2 = new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.DoubleSide
        });

        let texture3 = textureLoader.load('/resource/20051814itj9ddm3.jpg');
        texture3.wrapS = THREE.RepeatWrapping;
        texture3.wrapT = THREE.RepeatWrapping;
        let material3 = new THREE.MeshStandardMaterial({
            map: texture3,
            side: THREE.DoubleSide
        });

        let texture4 = textureLoader.load('/resource/25F9651F418944C0B6DEE32CB30BD7E4.jpg');
        texture4.wrapS = THREE.RepeatWrapping;
        texture4.wrapT = THREE.RepeatWrapping;
        let material4 = new THREE.MeshStandardMaterial({
            map: texture4,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, [material2, material3, material4]);

        // ✅ 把建筑从 XY 平面竖起来（Z轴为高度方向）
        mesh.rotation.x = -Math.PI / 2;

        scene.add(mesh);

        // const wireframe = new THREE.WireframeGeometry(geometry);
        // const line = new THREE.LineSegments(wireframe, new THREE.LineBasicMaterial({color: 0xff0000}));
        // line.rotation.x = -Math.PI / 2;
        // scene.add(line);

        // 轮廓线
        // const edges = new THREE.EdgesGeometry(geometry);
        // const line2 = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: 0x00ffff}));
        // line2.rotation.x = -Math.PI / 2;
        // scene.add(line2);

        return mesh;
    }

    async loadModel21() {
        const that = this;
        const scene = this._scene;
        // 1. 你的 EPSG:4526 坐标点
        const points = [
            [38466388.2988292, 3846057.4789985027],
            [38466363.106568456, 3845818.992263477],
            [38465901.24845485, 3845798.838454883],
            [38466353.02966416, 3845693.030959766],
            [38466146.45312607, 3845330.2624050784],
            [38466472.27303167, 3845647.68489043],
            [38466630.14453232, 3845652.7233425784],
            [38466824.96468206, 3845338.659825326],
            [38466720.836670995, 3845666.1592149744],
            [38466720.836670995, 3845795.479486784],
            [38467118.87439072, 3845798.838454883],
            [38466725.87512314, 3845884.4921414065],
            [38466880.38765569, 3846185.1197862634],
            [38466650.29834092, 3845906.3254340496],
            [38466472.27303167, 3845887.8511095056],
            [38466388.2988292, 3846057.4789985027], // 闭合
        ];

        // 2. 平移原点，使模型在中心附近（避免数值太大）
        const center = this.getCenterFromPoints(points);

        // 缩小坐标点（米 → 单位坐标），再设置合适的建筑高度
        const scale = 0.01;
        const height = 5; // 30 米变为 0.03 单位（配合缩放）

        const outerPoints = points.map(([x, y], i) => {
            const px = (x - center.x) * scale;
            const py = (y - center.y) * scale;
            return new THREE.Vector2(px, py)
        })
        const shape = new THREE.Shape(outerPoints);

        let geometry = new THREE.ExtrudeGeometry(shape, {
            depth: height,
            bevelEnabled: false
        });

        if (!geometry.index) {
            geometry = BufferGeometryUtils.mergeVertices(geometry);
        }

        geometry.clearGroups(); // 清除默认 group

        // 标记每个三角形属于哪个“逻辑面”
        const index = geometry.index.array;
        const normal = geometry.attributes.normal;
        const faceMap = new Array(index.length / 3).fill(null);

        let edgeId = 0;
        for (let i = 0; i < index.length; i += 3) {
            // 判断当前面是否为侧面（x/y法线分量接近 1，z 接近 0）
            const a = index[i];
            const nz = normal.getZ(a);
            if (Math.abs(nz) < 0.01) {
                // 假设 ExtrudeGeometry 生成的顺序稳定，每两个三角面是一组，属于一条边
                faceMap[i / 3] = `${edgeId}`;
                faceMap[i / 3 + 1] = `${edgeId}`;
                // geometry.addGroup(i, i * 3, edgeId);
                i += 3; // 多走一个三角面
                edgeId++;
            } else {
                // top 或 bottom 面
                faceMap[i / 3] = nz > 0 ? 'top' : 'bottom';
            }
        }

        // 默认材质，标准材质，支持光照、纹理、贴图
        const textureLoader = new THREE.TextureLoader();
        const defaultMaterial = new THREE.MeshStandardMaterial({});
        const sideMaterials = [];
        const mapMaterials = {};
        let indexFace = 0;
        let currFace = faceMap[0];
        let count = 0;
        let start = 0;
        for (let i = 0; i < faceMap.length; i++) {
            let isEnd = i === faceMap.length - 1;
            if (currFace !== faceMap[i] || isEnd) {
                if (isEnd) {
                    count += 3;
                }

                geometry.addGroup(start, count, indexFace);

                // 添加材质
                mapMaterials[currFace] = indexFace;
                let texture = textureLoader.load(indexFace % 2 === 0 ? '/resource/25F9651F418944C0B6DEE32CB30BD7E4.jpg' : '/resource/20051814itj9ddm3.jpg');
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                sideMaterials.push(new THREE.MeshStandardMaterial({
                    map: texture,
                    side: THREE.DoubleSide
                }));

                currFace = faceMap[i];
                indexFace++;
                start += count
                count = 0;
            }
            count += 3;
        }
        console.log(geometry.groups,sideMaterials)
        // 创建 Mesh
        const mesh = new THREE.Mesh(geometry, sideMaterials);
        mesh.rotateX(-Math.PI / 2); // 放到地面
        scene.add(mesh);
        return mesh;
    }

    async loadModel3() {
        const scene = this._scene;
        // 外轮廓（顺时针）
        const outerPoints = [
            new THREE.Vector2(0, 0),
            new THREE.Vector2(10, 0),
            new THREE.Vector2(10, 10),
            new THREE.Vector2(0, 10)
        ];

        // 内轮廓（逆时针）
        const innerPoints = [
            new THREE.Vector2(3, 3),
            new THREE.Vector2(7, 3),
            new THREE.Vector2(7, 7),
            new THREE.Vector2(3, 7)
        ];

        // 创建 Shape 对象
        const shape = new THREE.Shape(outerPoints);

        // 添加孔洞
        const hole = new THREE.Path(innerPoints);
        shape.holes.push(hole);

        // 创建几何体（可用于拉伸）
        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: 5,
            bevelEnabled: false
        });

        const material = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        scene.add(mesh);
        return mesh;
    }

    async loadModel4() {

        const that = this;
        const scene = this._scene;
        const renderer = this._renderer;
        const camera = this._camera;

        const points = [
            [38466388.2988292, 3846057.4789985027],
            [38466363.106568456, 3845818.992263477],
            [38465901.24845485, 3845798.838454883],
            [38466353.02966416, 3845693.030959766],
            [38466146.45312607, 3845330.2624050784],
            [38466472.27303167, 3845647.68489043],
            [38466630.14453232, 3845652.7233425784],
            [38466824.96468206, 3845338.659825326],
            [38466720.836670995, 3845666.1592149744],
            [38466720.836670995, 3845795.479486784],
            [38467118.87439072, 3845798.838454883],
            [38466725.87512314, 3845884.4921414065],
            [38466880.38765569, 3846185.1197862634],
            [38466650.29834092, 3845906.3254340496],
            [38466472.27303167, 3845887.8511095056],
            // [38466388.2988292, 3846057.4789985027], // 闭合
        ];

        // 2. 平移原点，使模型在中心附近（避免数值太大）
        const center = this.getCenterFromPoints(points);

        // 缩小坐标点（米 → 单位坐标），再设置合适的建筑高度
        const scale = 0.01;
        const height = 5; // 30 米变为 0.03 单位（配合缩放）

        const outerPoints = points.map(([x, y], i) => {
            const px = (x - center.x) * scale;
            const py = (y - center.y) * scale;
            return new THREE.Vector2(px, py)
        })


// 创建二维轮廓
        const shape = new THREE.Shape(outerPoints);
        // shape.moveTo(0, 0);
        // shape.lineTo(50, 0);
        // shape.lineTo(50, 50);
        // shape.lineTo(0, 50);
        // shape.lineTo(0, 0);

// 拉伸生成建筑
        const extrudeSettings = {depth: height, bevelEnabled: false};
        let geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        if (!geometry.index) {
            geometry = BufferGeometryUtils.mergeVertices(geometry);
        }
// 为颜色准备 Buffer 属性
        geometry.computeVertexNormals();
        const colorAttr = new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 3), 3);
        geometry.setAttribute('color', colorAttr);

// 标记每个三角形属于哪个“逻辑面”
        const index = geometry.index.array;
        const normal = geometry.attributes.normal;
        const color = geometry.attributes.color;

        const faceMap = new Array(index.length / 3).fill(null);

        let edgeId = 0;
        for (let i = 0; i < index.length; i += 3) {
            // 判断当前面是否为侧面（x/y法线分量接近 1，z 接近 0）
            const a = index[i];
            const nz = normal.getZ(a);
            if (Math.abs(nz) < 0.01) {
                // 假设 ExtrudeGeometry 生成的顺序稳定，每两个三角面是一组，属于一条边
                faceMap[i / 3] = `edge_${edgeId}`;
                faceMap[i / 3 + 1] = `edge_${edgeId}`;
                i += 3; // 多走一个三角面
                edgeId++;
            } else {
                // top 或 bottom 面
                faceMap[i / 3] = nz > 0 ? 'top' : 'bottom';
            }
        }

// 创建 mesh
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            flatShading: true
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        scene.add(mesh);

// 鼠标拾取
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let hoveredFace = null;

// 恢复默认颜色
        function resetColor() {
            const color = geometry.attributes.color;
            for (let i = 0; i < color.count; i++) {
                color.setXYZ(i, 0.8, 0.8, 0.8);
            }
            color.needsUpdate = true;
        }

// 设置某一类面颜色
        function highlightFaceGroup(type) {
            resetColor();
            for (let i = 0; i < faceMap.length; i++) {
                if (faceMap[i] === type) {
                    const ia = index[i * 3];
                    const ib = index[i * 3 + 1];
                    const ic = index[i * 3 + 2];
                    color.setXYZ(ia, 1, 0, 0);
                    color.setXYZ(ib, 1, 0, 0);
                    color.setXYZ(ic, 1, 0, 0);
                }
            }
            color.needsUpdate = true;
        }

// 监听鼠标移动
        window.addEventListener('mousemove', (event) => {
            const {clientX, clientY} = event;
            mouse.x = (clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(mesh);
            if (intersects.length > 0) {
                const faceIndex = Math.floor(intersects[0].faceIndex / 1); // 每个面是三角形
                const type = faceMap[faceIndex];
                if (type !== hoveredFace) {
                    hoveredFace = type;
                    highlightFaceGroup(type);
                }
            } else {
                hoveredFace = null;
                resetColor();
            }
        });
        return mesh;
    }

    async loadModel5() {
        const that = this;
        const scene = this._scene;
        const renderer = this._renderer;
        const camera = this._camera;

        const points = [
            [38466388.2988292, 3846057.4789985027],
            [38466363.106568456, 3845818.992263477],
            [38465901.24845485, 3845798.838454883],
            [38466353.02966416, 3845693.030959766],
            [38466146.45312607, 3845330.2624050784],
            [38466472.27303167, 3845647.68489043],
            [38466630.14453232, 3845652.7233425784],
            [38466824.96468206, 3845338.659825326],
            [38466720.836670995, 3845666.1592149744],
            [38466720.836670995, 3845795.479486784],
            [38467118.87439072, 3845798.838454883],
            [38466725.87512314, 3845884.4921414065],
            [38466880.38765569, 3846185.1197862634],
            [38466650.29834092, 3845906.3254340496],
            [38466472.27303167, 3845887.8511095056],
            // [38466388.2988292, 3846057.4789985027], // 闭合
        ];

        // 2. 平移原点，使模型在中心附近（避免数值太大）
        const center = this.getCenterFromPoints(points);

        // 缩小坐标点（米 → 单位坐标），再设置合适的建筑高度
        const scale = 0.01;
        const height = 5; // 30 米变为 0.03 单位（配合缩放）

        const outerPoints = points.map(([x, y], i) => {
            const px = (x - center.x) * scale;
            const py = (y - center.y) * scale;
            return new THREE.Vector2(px, py)
        })


        // 创建二维轮廓
        const shape = new THREE.Shape(outerPoints);

        // 拉伸生成建筑
        const extrudeSettings = {depth: height, bevelEnabled: false};
        let geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        if (!geometry.index) {
            geometry = BufferGeometryUtils.mergeVertices(geometry);
        }
        // 为颜色准备 Buffer 属性
        geometry.computeVertexNormals();
        const colorAttr = new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 3), 3);
        geometry.setAttribute('color', colorAttr);

        // 创建 mesh
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            flatShading: true
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        scene.add(mesh);

        // 标记每个三角形属于哪个“逻辑面”
        const index = geometry.index.array;
        const normal = geometry.attributes.normal;
        const color = geometry.attributes.color;

        const faceMap = new Array(index.length / 3).fill(null);

        let edgeId = 0;
        for (let i = 0; i < index.length; i += 3) {
            // 判断当前面是否为侧面（x/y法线分量接近 1，z 接近 0）
            const a = index[i];
            const nz = normal.getZ(a);
            if (Math.abs(nz) < 0.01) {
                // 假设 ExtrudeGeometry 生成的顺序稳定，每两个三角面是一组，属于一条边
                faceMap[i / 3] = `edge_${edgeId}`;
                faceMap[i / 3 + 1] = `edge_${edgeId}`;
                i += 3; // 多走一个三角面
                edgeId++;
            } else {
                // top 或 bottom 面
                faceMap[i / 3] = nz > 0 ? 'top' : 'bottom';
            }
        }

        // 恢复默认颜色
        function resetColor() {
            const color = geometry.attributes.color;
            for (let i = 0; i < color.count; i++) {
                color.setXYZ(i, 0.8, 0.8, 0.8);
            }
            color.needsUpdate = true;
        }

// 设置某一类面颜色
        function highlightFaceGroup(type) {
            resetColor();
            for (let i = 0; i < faceMap.length; i++) {
                if (faceMap[i] === type) {
                    const ia = index[i * 3];
                    const ib = index[i * 3 + 1];
                    const ic = index[i * 3 + 2];
                    color.setXYZ(ia, 1, 0, 0);
                    color.setXYZ(ib, 1, 0, 0);
                    color.setXYZ(ic, 1, 0, 0);
                }
            }
            color.needsUpdate = true;
        }

        // 鼠标拾取
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let hoveredFace = null;

        // 监听鼠标移动
        let onMousemove = (event) => {
            const {clientX, clientY} = event;
            mouse.x = (clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(mesh);
            if (intersects.length > 0) {
                const faceIndex = Math.floor(intersects[0].faceIndex / 1); // 每个面是三角形
                const type = faceMap[faceIndex];
                if (type !== hoveredFace) {
                    hoveredFace = type;
                    highlightFaceGroup(type);
                }
            } else {
                hoveredFace = null;
                resetColor();
            }
        };
        window.addEventListener('mousemove', onMousemove);

        let clickFace = null;

        let onClick = (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(mesh);
            if (intersects.length > 0) {
                const faceIndex = Math.floor(intersects[0].faceIndex / 1); // 每个面是三角形
                const type = faceMap[faceIndex];
                if (type !== clickFace) {
                    clickFace = type;
                    showOutline(type);
                }
            } else {
                clickFace = null;
                clearOutline();
            }
        };
        this.onClick(onClick)
        // window.addEventListener('click', onClick);
        let outlineGroup = new THREE.Group(); // 保存当前轮廓
        scene.add(outlineGroup);

        function showOutline(type) {
            outlineGroup.clear();
            if (type === 'bottom') {
                return
            }
            const indices = [];
            for (let i = 0; i < faceMap.length; i++) {
                if (faceMap[i] === type) {
                    const ia = geometry.index.getX(i * 3);
                    const ib = geometry.index.getX(i * 3 + 1);
                    const ic = geometry.index.getX(i * 3 + 2);
                    if (!indices.includes(ia)) {
                        indices.push(ia);
                    }
                    if (!indices.includes(ib)) {
                        indices.push(ib);
                    }
                    if (!indices.includes(ic)) {
                        indices.push(ic);
                    }
                }
            }
            const pos = geometry.attributes.position;
            const vertices = indices.map(i => new THREE.Vector3(
                pos.getX(i), pos.getY(i), pos.getZ(i)
            ));
            const edges = [];
            if (type === 'top') {
                for (let i = 1; i < vertices.length; i++) {
                    edges.push([vertices[i - 1], vertices[i]])
                    if (i === vertices.length - 1) {
                        edges.push([vertices[i], vertices[0]]);
                    }
                }
            } else {
                edges.push(
                    [vertices[0], vertices[1]],
                    [vertices[1], vertices[3]],
                    [vertices[3], vertices[2]],
                    [vertices[2], vertices[0]]
                )
            }

            for (const [start, end] of edges) {
                const path = new THREE.LineCurve3(start, end);
                const tube = new THREE.TubeGeometry(path, 1, 0.04, 4, false);
                const tubeMaterial = new THREE.MeshBasicMaterial({color: 0x00ffff});
                const mesh = new THREE.Mesh(tube, tubeMaterial);
                mesh.rotation.x = -Math.PI / 2;
                outlineGroup.add(mesh);
            }
        }

        function clearOutline() {
            if (outlineGroup) {
                outlineGroup.clear();
            }
        }

        return mesh;
    }

    async loadModel6() {
        const that = this;
        const scene = this._scene;
        const renderer = this._renderer;
        const camera = this._camera;

        // 1. 你的 EPSG:4526 坐标点
        // const points = [
        //     [38466388.2988292, 3846057.4789985027],
        //     [38466363.106568456, 3845818.992263477],
        //     [38465901.24845485, 3845798.838454883],
        //     [38466353.02966416, 3845693.030959766],
        //     [38466146.45312607, 3845330.2624050784],
        //     [38466472.27303167, 3845647.68489043],
        //     [38466630.14453232, 3845652.7233425784],
        //     [38466824.96468206, 3845338.659825326],
        //     [38466720.836670995, 3845666.1592149744],
        //     [38466720.836670995, 3845795.479486784],
        //     [38467118.87439072, 3845798.838454883],
        //     [38466725.87512314, 3845884.4921414065],
        //     [38466880.38765569, 3846185.1197862634],
        //     [38466650.29834092, 3845906.3254340496],
        //     [38466472.27303167, 3845887.8511095056],
        //     [38466388.2988292, 3846057.4789985027], // 闭合
        // ];


        // 38475934.749355,3847665.029031
        // 38475943.144576,3847665.020336
        // 38475943.157475,3847667.650043
        // 38475948.069688,3847667.625946
        // 38475948.056889,3847665.015239
        // 38475965.075333,3847664.997649
        // 38475965.078432,3847667.637057
        // 38475969.957144,3847667.63136
        // 38475969.954046,3847664.992652
        // 38475986.610989,3847664.975363
        // 38475986.618087,3847667.64997
        // 38475991.4743,3847667.637073
        // 38475991.467201,3847664.970366
        // 38476000.037023,3847664.961571
        // 38476000.028428,3847654.810443
        // 38475934.73066,3847654.818002
        // 38475934.749355,3847665.029031;
        const points = [
            [38475934.749355, 3847665.029031],
            [38475943.144576, 3847665.020336],
            [38475943.157475, 3847667.650043],
            [38475948.069688, 3847667.625946],
            [38475948.056889, 3847665.015239],
            [38475965.075333, 3847664.997649],
            [38475965.078432, 3847667.637057],
            [38475969.957144, 3847667.63136],
            [38475969.954046, 3847664.992652],
            [38475986.610989, 3847664.975363],
            [38475986.618087, 3847667.64997],
            [38475991.4743, 3847667.637073],
            [38475991.467201, 3847664.970366],
            [38476000.037023, 3847664.961571],
            [38476000.028428, 3847654.810443],
            [38475934.73066, 3847654.818002],
            [38475934.749355, 3847665.029031],
        ]

        // 2. 平移原点，使模型在中心附近（避免数值太大）
        const center = this.getCenterFromPoints(points);

        // 缩小坐标点（米 → 单位坐标），再设置合适的建筑高度
        const scale = 1;
        const height = 30; // 30 米变为 0.03 单位（配合缩放）

        const outerPoints = points.map(([x, y], i) => {
            const px = (x - center.x) * scale;
            const py = (y - center.y) * scale;
            return new THREE.Vector2(px, py)
        })
        const shape = new THREE.Shape(outerPoints);

        let geometry = new THREE.ExtrudeGeometry(shape, {
            depth: height,
            bevelEnabled: false
        });

        if (!geometry.index) {
            geometry = BufferGeometryUtils.mergeVertices(geometry);
        }

        geometry.clearGroups(); // 清除默认 group

        // 标记每个三角形属于哪个“逻辑面”
        const index = geometry.index.array;
        const normal = geometry.attributes.normal;
        const faceMap = new Array(index.length / 3).fill(null);

        let edgeId = 0;
        for (let i = 0; i < index.length; i += 3) {
            // 判断当前面是否为侧面（x/y法线分量接近 1，z 接近 0）
            const a = index[i];
            const nz = normal.getZ(a);
            if (Math.abs(nz) < 0.01) {
                // 假设 ExtrudeGeometry 生成的顺序稳定，每两个三角面是一组，属于一条边
                faceMap[i / 3] = `${edgeId}`;
                faceMap[i / 3 + 1] = `${edgeId}`;
                // geometry.addGroup(i, i * 3, edgeId);
                i += 3; // 多走一个三角面
                edgeId++;
            } else {
                // top 或 bottom 面
                faceMap[i / 3] = nz > 0 ? 'top' : 'bottom';
            }
        }

        // 默认材质，标准材质，支持光照、纹理、贴图
        const textureLoader = new THREE.TextureLoader();
        const defaultMaterial = new THREE.MeshStandardMaterial({});
        const sideMaterials = [];
        const mapMaterials = {};
        let indexFace = 0;
        let currFace = faceMap[0];
        let count = 0;
        let start = 0;
        for (let i = 0; i < faceMap.length; i++) {
            let isEnd = i === faceMap.length - 1;
            if (currFace !== faceMap[i] || isEnd) {
                if (isEnd) {
                    count += 3;
                }

                geometry.addGroup(start, count, indexFace);

                // 添加材质
                mapMaterials[currFace] = indexFace;
                sideMaterials.push(new THREE.MeshStandardMaterial({side: THREE.DoubleSide}));

                currFace = faceMap[i];
                indexFace++;
                start += count
                count = 0;
            }
            count += 3;
        }
        // 创建 Mesh
        const mesh = new THREE.Mesh(geometry, sideMaterials);
        mesh.rotateX(-Math.PI / 2); // 放到地面
        scene.add(mesh);

        const outlineClickGroup = new THREE.Group(); // 保存当前轮廓
        scene.add(outlineClickGroup);

        const outlineMousemoveGroup = new THREE.Group(); // 保存当前轮廓
        scene.add(outlineMousemoveGroup);

        const mouseFace = {
            click: null,
            move: null
        }
        // 鼠标拾取
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let mouseEvent = (event, group, key, callback) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(mesh);
            if (intersects.length > 0) {
                const faceIndex = Math.floor(intersects[0].faceIndex / 1); // 每个面是三角形
                const type = faceMap[faceIndex];
                if (type !== mouseFace[key]) {
                    mouseFace[key] = type;
                    group.clear();
                    let outlines = getOutlines(type);
                    for (let i = 0; i < outlines.length; i++) {
                        group.add(outlines[i]);
                    }
                    callback && callback(type);
                }
            } else {
                mouseFace[key] = null;
                group.clear();
                callback && callback(null);
            }
        };

        this.onClick((event) => {
            mouseEvent(event, outlineClickGroup, 'click', (type) => {
                if (type === null) {
                    return;
                }
                let map = textureLoader.load('/resource/20051814lid32ehd.jpg');
                map.wrapS = THREE.RepeatWrapping;
                map.wrapT = THREE.RepeatWrapping;
                mesh.material[mapMaterials[type]].map = map;
                mesh.material[mapMaterials[type]].needsUpdate = true;
            })
        })

        this.onMousemove((event) => {
            mouseEvent(event, outlineMousemoveGroup, 'move')
        })

        function getOutlines(type) {
            if (type === 'bottom') {
                return [];
            }
            const indices = [];
            for (let i = 0; i < faceMap.length; i++) {
                if (faceMap[i] === type) {
                    const ia = geometry.index.getX(i * 3);
                    const ib = geometry.index.getX(i * 3 + 1);
                    const ic = geometry.index.getX(i * 3 + 2);
                    if (!indices.includes(ia)) {
                        indices.push(ia);
                    }
                    if (!indices.includes(ib)) {
                        indices.push(ib);
                    }
                    if (!indices.includes(ic)) {
                        indices.push(ic);
                    }
                }
            }
            const pos = geometry.attributes.position;
            const vertices = indices.map(i => new THREE.Vector3(
                pos.getX(i), pos.getY(i), pos.getZ(i)
            ));
            const edges = [];
            if (type === 'top') {
                for (let i = 1; i < vertices.length; i++) {
                    edges.push([vertices[i - 1], vertices[i]])
                    if (i === vertices.length - 1) {
                        edges.push([vertices[i], vertices[0]]);
                    }
                }
            } else {
                edges.push(
                    [vertices[0], vertices[1]],
                    [vertices[1], vertices[3]],
                    [vertices[3], vertices[2]],
                    [vertices[2], vertices[0]]
                )
            }
            const meshes = [];
            for (const [start, end] of edges) {
                const path = new THREE.LineCurve3(start, end);
                const tube = new THREE.TubeGeometry(path, 1, 0.04, 4, false);
                const tubeMaterial = new THREE.MeshBasicMaterial({color: 0x00ffff});
                const mesh = new THREE.Mesh(tube, tubeMaterial);
                mesh.rotation.x = -Math.PI / 2;
                meshes.push(mesh)
            }
            return meshes;
        }

        // const edges = new THREE.EdgesGeometry(geometry);
        // const line2 = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: 0x00ffff}));
        // line2.rotation.x = -Math.PI / 2;
        // scene.add(line2);

        // const wireframe = new THREE.WireframeGeometry(geometry);
        // const line = new THREE.LineSegments(wireframe, new THREE.LineBasicMaterial({color: 0xff0000}));
        // line.rotation.x = -Math.PI / 2;
        // scene.add(line);

        return mesh;
    }

    exportGlb(meshOrGroup) {
        const that = this;
        const exporter = new GLTFExporter();

// 例如：导出一个 mesh 或 group
        exporter.parse(
            meshOrGroup,
            (result) => {
                // result 是 ArrayBuffer（如果是 binary: true）或 JSON
                const blob = new Blob([result], {type: 'application/octet-stream'});
                that.saveBlob(blob, 'model.glb'); // 下载
            }, null,
            {
                binary: true,             // 是否导出为 .glb（二进制），否则是 .gltf（JSON）
                embedImages: true,        // 是否内嵌贴图
                onlyVisible: false,       // 是否只导出 visible=true 的对象
                truncateDrawRange: true,  // 移除未使用顶点
            }
        );
    }

    exportScene() {

    }

    flyTo(object) {
        const camera = this._camera;
        const controls = this._controls;
        const box = new THREE.Box3().setFromObject(object);

        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(size);

        // 计算合理的相机距离
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const distance = maxDim / (2 * Math.tan(fov / 2));
        const offset = distance * 1.5;

        // 目标相机位置（正对模型中心，沿Z轴拉远）
        const newCamPos = center.clone().add(new THREE.Vector3(0, 0, offset));

        // 🚀 动画过渡：相机位置 & OrbitControls 目标
        gsap.to(camera.position, {
            x: newCamPos.x,
            y: newCamPos.y,
            z: newCamPos.z,
            duration: 1.5,
            ease: 'power2.inOut',
            onUpdate: () => {
                camera.lookAt(center); // 实时更新视角
            }
        });

        gsap.to(controls.target, {
            x: center.x,
            y: center.y,
            z: center.z,
            duration: 1.5,
            ease: 'power2.inOut',
            onUpdate: () => {
                controls.update();
            }
        });
    }

    clear() {
        this._scene.clear();
    }

    remove(obj) {
        this._scene.remove(obj)
    }

    /**
     * 计算二维坐标点的中心点
     * @param {Array<[number, number]>} points - 点数组，每个元素为 [x, y]
     * @param {'bbox' | 'avg'} method - 计算方式：'bbox' 为包围盒中心，'avg' 为平均点（默认）
     * @returns {{x: number, y: number}} 中心点坐标
     */
    getCenterFromPoints(points, method = 'avg') {
        if (!points || points.length === 0) {
            return {x: 0, y: 0};
        }

        if (method === 'bbox') {
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;

            for (const [x, y] of points) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }

            return {
                x: (minX + maxX) / 2,
                y: (minY + maxY) / 2
            };
        } else {
            // method === 'avg'
            let sumX = 0, sumY = 0;

            for (const [x, y] of points) {
                sumX += x;
                sumY += y;
            }

            return {
                x: sumX / points.length,
                y: sumY / points.length
            };
        }
    }

    saveBlob(blob, filename) {
        const link = document.createElement('a');
        link.style.display = 'none';
        document.body.appendChild(link);
        let url = URL.createObjectURL(blob);
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }
}

export default Map