<script setup>
import { onMounted, ref } from 'vue';
import ThreeModelViewer from '../../three/ThreeModelViewer';

let loader;
const canvas = ref(null);
const positionX = ref('0')
const positionY = ref('0')
const positionZ = ref('0')
const rotationX = ref('0')
const rotationY = ref('0')
const rotationZ = ref('0')
const scaleX = ref('0')
const scaleY = ref('0')
const scaleZ = ref('0')

onMounted(() => {
    loader = new ThreeModelViewer({
        modelPath: '/public/model/glb/Cesium_Air.glb',
        canvas: canvas.value
    });
    loader.main();
})
// 位置
const positionBlur = (_coordinate, _value) => {
    console.log(_coordinate, _value)
    if (_value) {
        loader.setPosition(_coordinate, _value)
    }
}
// 旋转
const rotationBlur = (_coordinate, _value) => {
    console.log(_coordinate, _value)
    if (_value) {
        loader.setRotation(_coordinate, _value)
    }
}
// 缩放
const scaleBlur = (_coordinate, _value) => {
    console.log(_coordinate, _value)
    if (_value) {
        loader.setScale(_coordinate, _value)
    }
}
</script>

<template>
    <div class="model">
        <canvas ref="canvas" class="webgl"></canvas>
        <div class="right-panel">
            <div class="flex color-333 mb-10">
                <label class="label">位置(m)</label>
                <div class="flex flex-column justify-center align-center mr-10">
                    <el-input size="small" type="text" v-model="positionX"
                        @blur="positionBlur('x', positionX)"></el-input>
                    <span>X</span>
                </div>
                <div class="flex flex-column justify-center align-center mr-10 pl-5">
                    <el-input size="small" type="text" v-model="positionY" @blur="positionBlur('y', positionY)" />
                    <span>Y</span>
                </div>
                <div class="flex flex-column justify-center align-center mr-10 pl-5">
                    <el-input size="small" type="text" v-model="positionZ" @blur="positionBlur('z', positionZ)" />
                    <span>Z</span>
                </div>
            </div>

            <div class="flex color-333 mb-10">
                <label class="label">旋转(°)</label>
                <div class="flex flex-column justify-center align-center mr-10">
                    <el-input size="small" type="text" v-model="rotationX" @blur="rotationBlur('x', rotationX)" />
                    <span>X</span>
                </div>
                <div class="flex flex-column justify-center align-center mr-10 pl-5">
                    <el-input size="small" type="text" v-model="rotationY" @blur="rotationBlur('y', rotationY)" />
                    <span>Y</span>
                </div>
                <div class="flex flex-column justify-center align-center mr-10 pl-5">
                    <el-input size="small" type="text" v-model="rotationZ" @blur="rotationBlur('z', rotationZ)" />
                    <span>Z</span>
                </div>
            </div>

            <div class="flex color-333 mb-10">
                <label class="label">缩放(m)</label>
                <div class="flex flex-column justify-center align-center mr-10">
                    <el-input size="small" type="text" v-model="scaleX" @blur="scaleBlur('x', scaleX)" />
                    <span>X</span>
                </div>
                <div class="flex flex-column justify-center align-center mr-10 pl-5">
                    <el-input size="small" type="text" v-model="scaleY" @blur="scaleBlur('y', scaleY)" />
                    <span>Y</span>
                </div>
                <div class="flex flex-column justify-center align-center mr-10 pl-5">
                    <el-input size="small" type="text" v-model="scaleZ" @blur="scaleBlur('z', scaleZ)" />
                    <span>Z</span>
                </div>
            </div>

            <!-- <div class="flex color-333 mb-10">
                <div class="label">可见性</div>
                <input type="checkbox" id="visibilityToggle" checked>
                <label for="visibilityToggle" class="color-333">可见</label>
            </div> -->
        </div>
    </div>
</template>

<style>
.model {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
}

.right-panel {
    position: absolute;
    right: 0;
    top: 0;
    width: 260px;
    height: calc(100vh - 260px);
    background: #fff;
    padding: 10px;
}

.flex {
    display: flex;
}

.flex-column {
    flex-direction: column;
}

.justify-center {
    justify-content: center;
}

.align-center {
    align-items: center;
}

.label {
    white-space: nowrap;
    width: 60px;
    min-width: 60px;
    padding-top: 3px;
}

#positionX,
#positionY,
#positionZ,
#rotationX,
#rotationY,
#rotationZ,
#scaleX,
#scaleY,
#scaleZ {
    width: 50px;
}

.color-333 {
    color: #333;
    font-size: 13px;
}

.mr-10 {
    margin-right: 10px;
}

.pl-5 {
    padding-left: 5px;
}

.pr-10 {
    padding-right: 10px;
}

.mb-10 {
    margin-bottom: 10px;
}

.webgl {
    display: block;
    width: 100vw;
    height: 100vh;
}

/* 新增标记点样式 */
.model-marker {
    position: absolute;
    width: 12px;
    height: 12px;
    /* background: #ff0000; */
    border-radius: 50%;
    cursor: pointer;
    user-select: none;
    background-image: url("../../../public/model/images/double_scale.png");
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
}

/* 新增顶面中心标记样式（绿色区分） */
.model-top-marker {
    /* background: #00ff00; */
    position: absolute;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    cursor: pointer;
    user-select: none;
    background-image: url("../../../public/model/images/double_scale.png");
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
}

/* 中心标记点样式（黄色） */
.model-center-marker {
    position: absolute;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    user-select: none;
    background-image: url("../../../public/model/images/angle_y.png");
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
}

/* 两侧标记点样式（青色） */
.model-side-marker-left {
    position: absolute;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    user-select: none;
    background-image: url("../../../public/model/images/angle_y.png");
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
}

.model-side-marker-left-2 {
    position: absolute;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    user-select: none;
    background-image: url("../../../public/model/images/angle_y.png");
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
}

.model-side-marker-right {
    position: absolute;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    user-select: none;
    background-image: url("../../../public/model/images/translate_xz.png");
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
}

.model-side-marker-right-2 {
    position: absolute;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    user-select: none;
    background-image: url("../../../public/model/images/translate_y.png");
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
}
</style>