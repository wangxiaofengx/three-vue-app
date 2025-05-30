import * as THREE from 'three';
import gsap from 'gsap';
import Stats from 'stats.js';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
import {MTLLoader} from 'three/examples/jsm/loaders/MTLLoader.js';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {VertexNormalsHelper} from 'three/examples/jsm/helpers/VertexNormalsHelper.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';


class Map {

    constructor(options) {
        this.canvas = null;
        Object.assign(this, options);
    }

    async init() {
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

        // 创建 stats 面板
        const stats = new Stats();
        stats.showPanel(0); // 0: FPS, 1: MS, 2: MB
        document.body.appendChild(stats.dom);

        const loader = new RGBELoader();
        loader.load('/resource/hdr/kloofendal_48d_partly_cloudy_puresky_1k.hdr', texture => {
            texture.mapping = THREE.EquirectangularReflectionMapping;

            // 设置为场景背景
            scene.background = texture;

            // 设置为物体反射的环境贴图
            scene.environment = texture;
        });

        function animate() {
            stats.begin();
            renderer.render(scene, camera);
            stats.end();
            requestAnimationFrame(animate);
        }

        animate();
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
        });

        let texture3 = textureLoader.load('/resource/20051814itj9ddm3.jpg');
        texture3.wrapS = THREE.RepeatWrapping;
        texture3.wrapT = THREE.RepeatWrapping;
        let material3 = new THREE.MeshStandardMaterial({
            map: texture3,
        });

        let texture4 = textureLoader.load('/resource/25F9651F418944C0B6DEE32CB30BD7E4.jpg');
        texture4.wrapS = THREE.RepeatWrapping;
        texture4.wrapT = THREE.RepeatWrapping;
        let material4 = new THREE.MeshStandardMaterial({
            map: texture4,
        });

        const mesh = new THREE.Mesh(geometry, [material2, material3, material4]);

        // ✅ 把建筑从 XY 平面竖起来（Z轴为高度方向）
        mesh.rotation.x = -Math.PI / 2;

        scene.add(mesh);

        // const wireframe = new THREE.WireframeGeometry(geometry);
        // const line = new THREE.LineSegments(wireframe, new THREE.LineBasicMaterial({color: 0xff0000}));
        // scene.add(line);

        // 轮廓线
        const edges = new THREE.EdgesGeometry(geometry);
        const line2 = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: 0x00ffff}));
        line2.rotation.x = -Math.PI / 2;
        scene.add(line2);

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
        const scale = 1;
        const height = 100; // 30 米变为 0.03 单位（配合缩放）

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
        const extrudeSettings = {depth: height, bevelEnabled: false};
        let geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        if (!geometry.index) {
            geometry = BufferGeometryUtils.mergeVertices(geometry);
        }
        // --- 分组每个侧面 ---
        const faceMap = []; // 每个三角形属于哪个边
        const edges = shape.getPoints();

        // 标记：哪个三角形属于哪个 edge_n（粗略）
        for (let i = 0; i < geometry.index.count / 3; i++) {
            const a = geometry.index.array[i * 3];
            const nx = geometry.attributes.normal.getX(a);
            const ny = geometry.attributes.normal.getY(a);
            const nz = geometry.attributes.normal.getZ(a);
            if (Math.abs(nz) < 0.1) {
                faceMap[i] = `edge_${i % edges.length}`;
            } else {
                faceMap[i] = 'topbottom';
            }
        }

        // 贴图和材质
        const textureLoader = new THREE.TextureLoader();
        const textures = {};
        const materialsMap = {};

        for (let i = 0; i < edges.length; i++) {
            const t = textureLoader.load('/resource/20051814itj9ddm3.jpg');
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.repeat.set(1, 1);
            textures[`edge_${i}`] = t;
            materialsMap[`edge_${i}`] = new THREE.MeshStandardMaterial({map: t});
        }

        materialsMap['topbottom'] = new THREE.MeshStandardMaterial({color: 0xdddddd});

        // 分组 geometry
        geometry.clearGroups();
        const groupIndices = {};
        for (let i = 0; i < faceMap.length; i++) {
            const type = faceMap[i];
            if (!groupIndices[type]) groupIndices[type] = [];
            groupIndices[type].push(i * 3);
        }

        let materialArray = [];
        let typeToMaterialIndex = {};
        let index = 0;
        for (const [type, starts] of Object.entries(groupIndices)) {
            for (const start of starts) {
                geometry.addGroup(start, 3, index);
            }
            materialArray.push(materialsMap[type]);
            typeToMaterialIndex[type] = index++;
        }

        const mesh = new THREE.Mesh(geometry, materialArray);
        mesh.rotation.x = -Math.PI / 2;
        scene.add(mesh);

        // 灯光
        scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        const dl = new THREE.DirectionalLight(0xffffff, 0.5);
        dl.position.set(20, 50, 10);
        scene.add(dl);

        // 鼠标交互
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        window.addEventListener('mousemove', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(mesh);
            if (intersects.length > 0) {
                const i = Math.floor(intersects[0].faceIndex / 1);
                const type = Object.keys(materialsMap).find(k => faceMap[i] === k);
                if (type && type !== 'topbottom') {
                    materialsMap[type].color.set(0xff0000); // 高亮颜色
                }
            } else {
                // 恢复原色
                for (const key in materialsMap) {
                    if (key.startsWith('edge_')) {
                        materialsMap[key].color.set(0xffffff);
                    }
                }
            }
        });
        return mesh;
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
}

export default Map