import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

class ThreeModelViewer {
  constructor(options = {}) {
    // 可动态修改的配置项
    this.modelPath = options.modelPath;
    this.cameraFov = options.cameraFov || 75;
    this.cameraNear = options.cameraNear || 0.1;
    this.cameraFar = options.cameraFar || 1000;
    this.ambientLightIntensity = options.ambientLightIntensity || 0.5;
    this.directionalLightIntensity = options.directionalLightIntensity || 1;
    this.cameraPosition = options.cameraPosition || { x: 0, y: 20, z: 30 };
    this.gridSize = options.gridSize || 5000;
    this.gridDivisions = options.gridDivisions || 5000;
    this.scaleFactor = options.scaleFactor || 0.003;
    this.rotationXSensitivity = options.rotationXSensitivity || 0.01;
    this.rotationSensitivity = options.rotationSensitivity || 0.01;
    this.moveSpeed = options.moveSpeed || 0.05;
    this.baseOffset = options.baseOffset || 0.02;
    this.distanceFactor = options.distanceFactor || 0.05;
    this.canvas = options.canvas || null;
    this.boxHelperColor = options.boxHelperColor || 0x00ff00;

    this.controls;
    this.scene;
    this.camera;
    this.renderer;
    this.modelGroup;
    this.isDragging = false;
    this.currentMarkerIndex;
    this.startX;
    this.startY;
    this.startScale;
    this.startPosition;
    this.startRotation;
    this.startMouseY;
    this.startYPosition;
    this.startMouseX;
    this.startRotationX;
    this.startRotationY;
    this.startRotationZ;
    this.originalHalfWidth;
    this.originalHalfDepth;
    this.originalHalfHeight;
    this.fixedRightEdge;
    this.fixedLeftEdge;
    this.fixedFrontEdge;
    this.fixedBackEdge;
    this.fixedTopEdge;
    this.fixedBottomEdge;
    this.localBox;
    this.updateMarkers = null;
  }

  /**
   * 初始化场景、相机和渲染器
   * 实现思路：创建场景、相机和渲染器对象，设置渲染器大小并添加到页面，添加网格辅助线和光照，设置相机位置
   */
  initScene() {
    const canvas = this.canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      this.cameraFov,
      window.innerWidth / window.innerHeight,
      this.cameraNear,
      this.cameraFar
    );

    // 创建一个WebGL渲染器实例，传入canvas元素并开启抗锯齿功能
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    // 设置渲染器的尺寸为canvas元素的实际宽度和高度
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    // 根据设备的像素比率设置渲染器的像素比率，以适配不同设备的屏幕
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // 添加网格辅助线
    const gridHelper = new THREE.GridHelper(this.gridSize, this.gridDivisions);
    this.scene.add(gridHelper);

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(
      0xffffff,
      this.ambientLightIntensity
    );
    this.scene.add(ambientLight);

    // 创建一个平行光对象，颜色为白色，强度由类的配置项决定
    const directionalLight = new THREE.DirectionalLight(
      0xffffff,
      this.directionalLightIntensity
    );
    // 设置平行光的位置，使其从坐标 (5, 5, 5) 照射场景
    directionalLight.position.set(5, 5, 5);
    // 将平行光添加到场景中，使其能够对场景中的物体产生光照效果
    this.scene.add(directionalLight);

    // 设置相机位置
    this.camera.position.set(
      this.cameraPosition.x,
      this.cameraPosition.y,
      this.cameraPosition.z
    );
  }

  /**
   * 加载GLB模型
   * 实现思路：使用GLTFLoader加载模型，创建模型组，计算包围盒，调整模型位置，添加到场景并执行回调
   */
  loadGLBModel() {
    const loader = new GLTFLoader();
    loader.load(
      this.modelPath,
      (gltf) => {
        const model = gltf.scene;
        this.modelGroup = new THREE.Group();
        this.modelGroup.add(model);

        // 创建包围盒
        const boxHelper = new THREE.BoxHelper(
          this.modelGroup,
          this.boxHelperColor
        );
        boxHelper.geometry.computeBoundingBox();
        const minY = boxHelper.geometry.boundingBox.min.y;
        this.modelGroup.position.y -= minY; // 将模型的Y轴坐标设置为包围盒的最小Y坐标
        this.modelGroup.add(boxHelper);
        this.scene.add(this.modelGroup);

        this.createMarkers();
      },
      undefined,
      (error) => {
        console.error("Error loading GLB model:", error);
      }
    );
  }

  /**
   * 创建标记点
   * 实现思路：计算模型包围盒和中心点坐标，创建各种标记点元素并添加到页面，定义坐标更新函数
   */
  createMarkers() {
    // 计算模型局部空间包围盒（不包含模型组变换）
    const box = new THREE.Box3();
    this.modelGroup.traverse((child) => {
      if (child.isMesh) {
        if (!child.geometry.boundingBox) {
          child.geometry.computeBoundingBox();
        }
        box.union(child.geometry.boundingBox);
      }
    });

    // 计算模型中心点局部坐标（XYZ轴中点）
    const centerLocal = new THREE.Vector3(
      (box.min.x + box.max.x) / 2,
      (box.min.y + box.max.y) / 2,
      (box.min.z + box.max.z) / 2
    );
    this.modelGroup.userData.centerLocal = centerLocal;

    // 定义底面四条边的局部中心坐标（相对于模型组）
    const edgeCentersLocal = [
      new THREE.Vector3(box.min.x, box.min.y, (box.min.z + box.max.z) / 2), // 左边中点
      new THREE.Vector3(box.max.x, box.min.y, (box.min.z + box.max.z) / 2), // 右边中点
      new THREE.Vector3((box.min.x + box.max.x) / 2, box.min.y, box.min.z), // 前边中点
      new THREE.Vector3((box.min.x + box.max.x) / 2, box.min.y, box.max.z), // 后边中点
    ];

    // 创建底面边中点DOM标记点
    const markers = edgeCentersLocal.map((center, index) => {
      const marker = document.createElement("div");
      marker.className = "model-marker";
      marker.addEventListener("mousedown", (event) =>
        this.startDrag(index, event)
      );
      document.body.appendChild(marker);
      return marker;
    });

    // 计算顶面中心局部坐标（顶面y取max.y，x和z取中间值）
    const topCenterLocal = new THREE.Vector3(
      (box.min.x + box.max.x) / 2,
      box.max.y,
      (box.min.z + box.max.z) / 2
    );
    this.modelGroup.userData.topCenterLocal = topCenterLocal;

    // 创建顶面中心DOM标记点
    const topMarker = document.createElement("div");
    topMarker.className = "model-top-marker";
    topMarker.addEventListener("mousedown", (event) =>
      this.startDrag(4, event)
    );
    document.body.appendChild(topMarker);

    // 创建中心标记点
    const centerMarker = document.createElement("div");
    centerMarker.className = "model-center-marker";
    centerMarker.addEventListener("mousedown", (event) =>
      this.startDrag(5, event)
    );
    document.body.appendChild(centerMarker);

    // 创建左侧标记点
    const leftMarker = document.createElement("div");
    leftMarker.className = "model-side-marker-left";
    leftMarker.addEventListener("mousedown", (event) =>
      this.startDrag(6, event)
    );
    document.body.appendChild(leftMarker);

    const leftMarker2 = document.createElement("div");
    leftMarker2.className = "model-side-marker-left-2";
    leftMarker2.addEventListener("mousedown", (event) =>
      this.startDrag(9, event)
    );
    document.body.appendChild(leftMarker2);

    // 创建右侧标记点
    const rightMarker = document.createElement("div");
    rightMarker.className = "model-side-marker-right";
    rightMarker.addEventListener("mousedown", (event) =>
      this.startDrag(7, event)
    );
    document.body.appendChild(rightMarker);

    // 创建右侧第二个标记点
    const rightMarker2 = document.createElement("div");
    rightMarker2.className = "model-side-marker-right-2";
    rightMarker2.addEventListener("mousedown", (event) =>
      this.startDrag(8, event)
    );
    document.body.appendChild(rightMarker2);

    // 定义坐标更新函数
    this.updateMarkers = () => {
      // 更新底面边中点标记
      edgeCentersLocal.forEach((localPos, index) => {
        const worldPos = localPos
          .clone()
          .applyMatrix4(this.modelGroup.matrixWorld);
        const projected = worldPos.clone().project(this.camera);
        const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;
        markers[index].style.left = `${x - 5}px`;
        markers[index].style.top = `${y - 5}px`;
      });

      // 更新顶面中心标记
      const topWorldPos = topCenterLocal
        .clone()
        .applyMatrix4(this.modelGroup.matrixWorld);
      const topProjected = topWorldPos.clone().project(this.camera);
      const topX = (topProjected.x * 0.5 + 0.5) * window.innerWidth;
      const topY = (-topProjected.y * 0.5 + 0.5) * window.innerHeight;
      topMarker.style.left = `${topX - 5}px`;
      topMarker.style.top = `${topY - 5}px`;

      // 更新中心和两侧标记点（与相机保持垂直）
      const centerWorld = this.modelGroup.userData.centerLocal
        .clone()
        .applyMatrix4(this.modelGroup.matrixWorld);
      const cameraDir = new THREE.Vector3()
        .setFromMatrixColumn(this.camera.matrixWorld, 2)
        .negate(); // 相机视线方向
      const rightDir = new THREE.Vector3()
        .crossVectors(this.camera.up, cameraDir)
        .normalize(); // 计算右方向向量
      // 动态计算偏移量：基于相机到模型中心的距离
      const distance = this.camera.position.distanceTo(centerWorld);
      const offset = this.baseOffset + distance * this.distanceFactor; // 动态偏移量

      // 计算左右标记点世界坐标
      const leftWorld = centerWorld
        .clone()
        .sub(rightDir.clone().multiplyScalar(offset));
      const leftWorld2 = centerWorld
        .clone()
        .sub(rightDir.clone().multiplyScalar(offset * 2));
      const rightWorld = centerWorld
        .clone()
        .add(rightDir.clone().multiplyScalar(offset));
      // 计算右侧额外标记点世界坐标（偏移量加倍和三倍）
      const rightWorld2 = centerWorld
        .clone()
        .add(rightDir.clone().multiplyScalar(offset * 2));

      // 将世界坐标投影到屏幕坐标
      const centerProjected = centerWorld.clone().project(this.camera);
      const leftProjected = leftWorld.clone().project(this.camera);
      const leftProjected2 = leftWorld2.clone().project(this.camera);
      const rightProjected = rightWorld.clone().project(this.camera);
      const rightProjected2 = rightWorld2.clone().project(this.camera);

      // 计算屏幕位置
      const centerX = (centerProjected.x * 0.5 + 0.5) * window.innerWidth;
      const centerY = (-centerProjected.y * 0.5 + 0.5) * window.innerHeight;
      const leftX = (leftProjected.x * 0.5 + 0.5) * window.innerWidth;
      const leftY = (-leftProjected.y * 0.5 + 0.5) * window.innerHeight;
      const leftX2 = (leftProjected2.x * 0.5 + 0.5) * window.innerWidth;
      const leftY2 = (-leftProjected2.y * 0.5 + 0.5) * window.innerHeight;
      const rightX = (rightProjected.x * 0.5 + 0.5) * window.innerWidth;
      const rightY = (-rightProjected.y * 0.5 + 0.5) * window.innerHeight;
      const rightX2 = (rightProjected2.x * 0.5 + 0.5) * window.innerWidth;
      const rightY2 = (-rightProjected2.y * 0.5 + 0.5) * window.innerHeight;

      // 更新DOM元素位置
      centerMarker.style.left = `${centerX - 5}px`;
      centerMarker.style.top = `${centerY - 5}px`;
      leftMarker.style.left = `${leftX - 5}px`;
      leftMarker.style.top = `${leftY - 5}px`;
      leftMarker2.style.left = `${leftX2 - 5}px`;
      leftMarker2.style.top = `${leftY2 - 5}px`;
      rightMarker.style.left = `${rightX - 5}px`;
      rightMarker.style.top = `${rightY - 5}px`;
      rightMarker2.style.left = `${rightX2 - 5}px`;
      rightMarker2.style.top = `${rightY2 - 5}px`;
    };
  }

  /**
   * 开始拖拽标记点
   * 实现思路：设置拖拽状态，记录当前标记点索引和起始位置，记录模型的初始缩放、位置和旋转，计算初始固定点
   */
  startDrag(index, event) {
    this.isDragging = true;
    this.currentMarkerIndex = index;
    this.startX = event.clientX;
    this.startY = event.clientY;

    if (this.modelGroup) {
      this.startScale = this.modelGroup.scale.clone();
      this.startPosition = this.modelGroup.position.clone();
      this.startRotation = this.modelGroup.rotation.clone(); // 记录初始旋转

      if (index === 5) {
        this.startMouseY = event.clientY;
        this.startRotationX = this.modelGroup.rotation.x;
      }

      if (index === 6) {
        this.startMouseX = event.clientX;
        this.startRotationY = this.modelGroup.rotation.y;
      }

      if (index === 7) {
        // 创建一个二维向量对象，用于存储鼠标在标准化设备坐标（NDC）中的位置
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        // 创建一个射线投射器对象，用于在三维空间中进行射线检测，通过鼠标位置发射射线，判断与场景中物体的相交情况
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        // 创建一个平面对象，该平面的法向量为 (0, 1, 0)，即平面平行于 XZ 平面且经过原点，用于射线与平面的相交计算
        const gridPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        // 初始化一个三维向量，用于存储鼠标在世界坐标系中的起始位置
        this.startMouseWorldPos = new THREE.Vector3();
        // 使用射线投射器的射线与网格平面相交，将相交点的坐标存储到 startMouseWorldPos 中
        raycaster.ray.intersectPlane(gridPlane, this.startMouseWorldPos);
      }

      if (index === 8) {
        this.startMouseY = event.clientY;
        this.startYPosition = this.modelGroup.position.y;
      }

      if (index === 9) {
        this.startMouseX = event.clientX;
        this.startRotationZ = this.modelGroup.rotation.z;
      }

      // 计算原始包围盒（未应用变换）
      const originalModel = this.modelGroup.children[0];
      this.localBox = new THREE.Box3();
      originalModel.traverse((child) => {
        if (child.isMesh) {
          if (!child.geometry.boundingBox) {
            child.geometry.computeBoundingBox();
          }
          this.localBox.union(child.geometry.boundingBox);
        }
      });
      this.originalHalfWidth = (this.localBox.max.x - this.localBox.min.x) / 2; // 记录X轴半尺寸
      this.originalHalfDepth = (this.localBox.max.z - this.localBox.min.z) / 2; // 记录Z轴半尺寸

      const localCenter = new THREE.Vector3(
        (this.localBox.min.x + this.localBox.max.x) / 2,
        (this.localBox.min.y + this.localBox.max.y) / 2,
        (this.localBox.min.z + this.localBox.max.z) / 2
      );

      // 计算初始右边缘的世界坐标（固定点）
      const localRightEdge = new THREE.Vector3(this.originalHalfWidth, 0, 0); // 局部右边缘点（X轴正方向）
      const localLeftEdge = new THREE.Vector3(-this.originalHalfWidth, 0, 0); // 左边缘（X轴负方向）
      const localFrontEdge = new THREE.Vector3(0, 0, this.localBox.min.z); // 前边缘（Z轴负方向）
      const localBackEdge = new THREE.Vector3(0, 0, this.localBox.max.z); // 后边缘（Z轴正方向）

      this.fixedRightEdge = localRightEdge
        .clone()
        .multiply(this.startScale) // 应用初始缩放
        .applyEuler(this.startRotation) // 应用初始旋转
        .add(this.startPosition); // 应用初始位置
      this.fixedLeftEdge = localLeftEdge
        .clone()
        .multiply(this.startScale)
        .applyEuler(this.startRotation)
        .add(this.startPosition); // 左固定点
      this.fixedFrontEdge = localFrontEdge
        .clone()
        .multiply(this.startScale)
        .applyEuler(this.startRotation)
        .add(this.startPosition); // 前固定点
      this.fixedBackEdge = localBackEdge
        .clone()
        .multiply(this.startScale)
        .applyEuler(this.startRotation)
        .add(this.startPosition); // 后固定点

      // 计算顶面中心固定世界坐标
      const localTopEdge = this.modelGroup.userData.topCenterLocal;
      this.fixedTopEdge = localTopEdge
        .clone()
        .multiply(this.startScale)
        .applyEuler(this.startRotation)
        .add(this.startPosition);

      // 计算底面中心固定世界坐标（底面Y取min.y）
      const localBottomEdge = new THREE.Vector3(
        (this.localBox.min.x + this.localBox.max.x) / 2,
        this.localBox.min.y, // 底面Y坐标
        (this.localBox.min.z + this.localBox.max.z) / 2
      );
      this.fixedBottomEdge = localBottomEdge
        .clone()
        .multiply(this.startScale)
        .applyEuler(this.startRotation)
        .add(this.startPosition);
    }

    window.addEventListener("mousemove", (event) => this.onDrag(event));
    window.addEventListener("mouseup", () => this.endDrag());
  }

  /**
   * 拖拽过程中的处理
   * 实现思路：根据当前标记点索引，处理不同的拖拽操作，如缩放、旋转、平移等
   */
  onDrag(event) {
    if (!this.isDragging || !this.modelGroup) return;

    // 将屏幕坐标转换为世界坐标
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1; // 转换为NDC X
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1; // 转换为NDC Y

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    const gridPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const mouseWorldPos = new THREE.Vector3();
    raycaster.ray.intersectPlane(gridPlane, mouseWorldPos);

    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;

    switch (this.currentMarkerIndex) {
      case 0: // 左边中点（右固定，X轴左缩放）
        this.modelGroup.scale.x -= deltaX * this.scaleFactor;
        const currentLocalRightEdge = new THREE.Vector3(
          this.originalHalfWidth,
          0,
          0
        );
        const currentWorldRightEdge = currentLocalRightEdge
          .clone()
          .multiply(this.modelGroup.scale) // 应用当前缩放
          .applyEuler(this.modelGroup.rotation) // 应用当前旋转
          .add(this.modelGroup.position); // 应用当前位置

        // 调整模型位置，使右边缘世界坐标等于固定点
        const deltaPosition = this.fixedRightEdge
          .clone()
          .sub(currentWorldRightEdge);
        this.modelGroup.position.add(deltaPosition);
        this.startX = event.clientX;
        this.startY = event.clientY;
        // 计算模型在X轴方向上的长度，考虑缩放
        const length =
          (this.localBox.max.x - this.localBox.min.x) * this.modelGroup.scale.x;
        console.log("模型的长度为:", length);
        break;
      case 1: // 右边中点（左边缘固定，X轴右缩放）
        this.modelGroup.scale.x += deltaX * this.scaleFactor;

        // 计算当前左边缘的世界坐标
        const currentLocalLeftEdge = new THREE.Vector3(
          -this.originalHalfWidth,
          0,
          0
        );
        const currentWorldLeftEdge = currentLocalLeftEdge
          .clone()
          .multiply(this.modelGroup.scale)
          .applyEuler(this.modelGroup.rotation)
          .add(this.modelGroup.position);

        // 调整模型位置，使左边缘世界坐标等于固定点
        const deltaLeftPosition = this.fixedLeftEdge
          .clone()
          .sub(currentWorldLeftEdge);
        this.modelGroup.position.add(deltaLeftPosition);

        this.startX = event.clientX;
        this.startY = event.clientY;
        // 计算模型在X轴方向上的长度，考虑缩放
        const length2 =
          (this.localBox.max.x - this.localBox.min.x) * this.modelGroup.scale.x;
        console.log("模型的长度为:", length2);
        break;
      case 2: // 前边中点（后边缘固定，Z轴前缩放）
        this.modelGroup.scale.z -= deltaY * this.scaleFactor; // 调整Z轴缩放（前缩放）
        // 计算当前后边缘的局部坐标（基于原始模型包围盒）
        const localBackEdge = new THREE.Vector3(0, 0, this.localBox.max.z);
        // 应用当前变换（缩放+旋转+位置）得到当前世界坐标
        const currentBackWorld = localBackEdge
          .clone()
          .multiply(this.modelGroup.scale)
          .applyEuler(this.modelGroup.rotation)
          .add(this.modelGroup.position);

        // 调整模型位置使后边缘世界坐标等于初始固定点（保持后边缘不动）
        this.modelGroup.position.add(
          this.fixedBackEdge.clone().sub(currentBackWorld)
        );
        this.startY = event.clientY;
        break;
      case 3: // 后边中点（前边缘固定，Z轴后缩放）
        this.modelGroup.scale.z += deltaY * this.scaleFactor; // 调整Z轴缩放（与case 2方向一致）
        // 计算当前前边缘的世界坐标
        const currentLocalFrontEdge = new THREE.Vector3(
          0,
          0,
          this.localBox.min.z
        );
        const currentWorldFrontEdge = currentLocalFrontEdge
          .clone()
          .multiply(this.modelGroup.scale)
          .applyEuler(this.modelGroup.rotation)
          .add(this.modelGroup.position);
        // 调整模型位置，使前边缘世界坐标等于固定点
        const deltaFrontPosition = this.fixedFrontEdge
          .clone()
          .sub(currentWorldFrontEdge);
        this.modelGroup.position.add(deltaFrontPosition);
        this.startY = event.clientY;
        break;
      case 4: // 顶面中点（底面固定，Y轴上缩放）
        this.modelGroup.scale.y -= deltaY * this.scaleFactor; // 调整Y轴缩放（deltaY为垂直移动量）
        this.modelGroup.scale.y = Math.max(0.1, this.modelGroup.scale.y); // 限制最小缩放值

        // 计算当前底面的局部坐标（基于原始模型包围盒）
        const localBottomEdge = new THREE.Vector3(
          (this.localBox.min.x + this.localBox.max.x) / 2,
          this.localBox.min.y, // 底面Y坐标
          (this.localBox.min.z + this.localBox.max.z) / 2
        );
        // 应用当前变换（缩放+旋转+位置）得到当前世界坐标
        const currentBottomWorld = localBottomEdge
          .clone()
          .multiply(this.modelGroup.scale)
          .applyEuler(this.modelGroup.rotation)
          .add(this.modelGroup.position);

        // 调整模型位置使底面世界坐标等于初始固定点（保持底面不动）
        const deltaBottomPosition = this.fixedBottomEdge
          .clone()
          .sub(currentBottomWorld);
        this.modelGroup.position.add(deltaBottomPosition);

        this.startY = event.clientY;
        break;
      case 5:
        // 绕X轴旋转
        const deltaRotationX =
          (event.clientY - this.startMouseY) * this.rotationXSensitivity;
        this.modelGroup.rotation.x = this.startRotationX - deltaRotationX; // 负号使旋转方向符合直觉
        // 限制X轴旋转角度在合理范围内（可选）
        this.modelGroup.rotation.x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, this.modelGroup.rotation.x)
        );
        break;
      case 6:
        // 绕Y轴旋转
        const deltaRotation =
          (event.clientX - this.startMouseX) * this.rotationSensitivity;
        this.modelGroup.rotation.y = this.startRotationY + deltaRotation;
        break;
      case 7:
        // 拖拽模型在XZ坐标上移动
        // 计算鼠标在世界坐标系中的移动增量
        const deltaWorld = mouseWorldPos.clone().sub(this.startMouseWorldPos);
        // 应用增量到模型位置
        this.modelGroup.position.copy(
          this.startPosition.clone().add(deltaWorld)
        );
        break;
      case 8:
        // 调整模型的离地高度
        // 计算鼠标Y轴移动增量
        const deltaY1 = event.clientY - this.startMouseY;
        // 仅修改Y轴位置，保持X和Z轴不变
        this.modelGroup.position.y =
          this.startYPosition - deltaY1 * this.moveSpeed;
        break;
      case 9:
        // 绕Z轴旋转
        const rotationZDelta = (event.clientX - this.startMouseX) * 0.01;
        this.modelGroup.rotation.z = this.startRotationZ - rotationZDelta;
        break;
    }
  }

  /**
   * 结束拖拽
   * 实现思路：设置拖拽状态为false，移除鼠标移动和鼠标抬起事件监听器
   */
  endDrag() {
    this.isDragging = false;
    window.removeEventListener("mousemove", (event) => this.onDrag(event));
    window.removeEventListener("mouseup", () => this.endDrag());
  }

  /**
   * 动画循环
   * 实现思路：使用requestAnimationFrame递归调用自身，更新控制器和标记点位置，渲染场景
   */
  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    if (this.updateMarkers) this.updateMarkers(); // 模型加载完成后更新标记
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * 窗口大小改变事件处理
   * 实现思路：监听窗口大小改变事件，更新相机和渲染器的相关属性，更新控制器和标记点位置
   */
  handleWindowResize() {
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.controls.handleResize();
      if (this.updateMarkers) this.updateMarkers(); // 窗口调整时更新标记
    });
  }

  setPosition(_coordinate, _value) {
    console.log("设置坐标：", _coordinate, _value);
    this.modelGroup.position[_coordinate] = _value;
    this.updateMarkers(); // 模型加载完成后更新标记
  }

  setRotation(_coordinate, _value) {
    console.log("设置坐标：", _coordinate, _value);
    this.modelGroup.rotation[_coordinate] = this.radiansToDegrees(_value);
    this.updateMarkers(); // 模型加载完成后更新标记
  }

  // 将弧度转换为角度的函数
  radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
  }

  setScale(_coordinate, _value) {
    console.log("设置坐标：", _coordinate, _value);
    this.modelGroup.scale[_coordinate] = _value;
    this.updateMarkers(); // 模型加载完成后更新标记
  }

  /**
   * 主函数，初始化场景、加载模型等
   * 实现思路：调用初始化场景、加载模型、创建控制器等方法，启动动画循环和窗口大小改变事件处理
   */
  main() {
    this.initScene();
    this.loadGLBModel();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // 启用阻尼惯性
    this.controls.dampingFactor = 0.05;

    this.animate();
    this.handleWindowResize();
  }
}
export default ThreeModelViewer;
