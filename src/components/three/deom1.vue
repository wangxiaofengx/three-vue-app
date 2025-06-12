<template>
    <div>
        <div class="buttons">
            <button @click="loadModel">加载模型</button>
            <button @click="loadModel2">加载单体带贴图</button>
            <button @click="loadModel21">加载单体带多面贴图</button>
            <button @click="loadModel3">加载空洞单体</button>
            <button @click="loadModel4">加载鼠标移动渲染颜色</button>
            <button @click="loadModel5">加载鼠标点击渲染边线</button>
            <button @click="loadModel6">加载鼠标点击渲染贴图</button>
            <button @click="loadModel7">加载导出模型渲染贴图</button>
            <button @click="exportGlb">导出当前模型</button>
            <button @click="exportScene">导出当前场景</button>
            <!--            <button @click="exportJson">导出Json</button>-->
            <button @click="save">保存</button>
            <input type="file" @change="handleFile" accept=".glb"/>
            <!--            <button @click="importJson">导入Json</button>-->
        </div>
        <canvas ref="canvas" class="webgl"></canvas>
    </div>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import Map from '../../three/scene';
import {onUnmounted} from "@vue/runtime-core";

const canvas = ref(null);
let map;
let currModel;

const loadModel = async () => {
    currModel && map.remove(currModel)
    let model = currModel = await map.loadModel();
    map.flyTo(model);
}

const loadModel2 = async () => {
    currModel && map.remove(currModel)
    let model = currModel = await map.loadModel2();
    map.flyTo(model);
}
const loadModel21 = async () => {
    currModel && map.remove(currModel)
    let model = currModel = await map.loadModel21();
    await map.flyTo(model);
}
const loadModel3 = async () => {
    currModel && map.remove(currModel)
    let model = currModel = await map.loadModel3();
    await map.flyTo(model);
}
const loadModel4 = async () => {
    currModel && map.remove(currModel)
    let model = currModel = await map.loadModel4();
    await map.flyTo(model);
}
const loadModel5 = async () => {
    currModel && map.remove(currModel)
    let model = currModel = await map.loadModel5();
    await map.flyTo(model);
}
const loadModel6 = async () => {
    currModel && map.remove(currModel)
    let model = currModel = await map.loadModel6();
    await map.flyTo(model);
}
const loadModel7 = async () => {
    currModel && map.remove(currModel)
    let model = currModel = await map.loadModel7();
    await map.flyTo(model);
}
const exportGlb = async () => {
    map.exportGlb(currModel);
}
const exportScene = async () => {
    map.exportScene();
}
const exportJson = async () => {
    map.exportJson();
}
const save = async () => {
    map.save();
}
const handleFile = (event) => {
    currModel && map.remove(currModel)
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = async function (e) {
        let model = currModel = await map.importGlb(e.target.result);
        map.flyTo(model);
    };

    reader.readAsArrayBuffer(file);
}
onMounted(async () => {
    map = new Map({canvas: canvas.value});
    await map.init();
});

onUnmounted(async () => {
    currModel && map.remove(currModel)
    currModel = null
});
</script>

<style scoped>
.webgl {
    display: block;
    width: 100vw;
    height: 100vh;
}

.buttons {
    position: fixed;
    left: 100px;
}
</style>
