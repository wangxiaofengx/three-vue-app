<template>
    <div>
        <div class="buttons">
            <button @click="loadModel">加载模型</button>
            <button @click="loadModel2">加载单体带贴图</button>
            <button @click="loadModel3">加载空洞单体</button>
            <button @click="loadModel4">加载鼠标移动渲染颜色</button>
            <button @click="loadModel5">加载鼠标移动渲染贴图</button>
        </div>
        <canvas ref="canvas" class="webgl"></canvas>
    </div>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import Map from '../../three/scene';

const canvas = ref(null);
let map;


const loadModel = async () => {
    let model = await map.loadModel();
    map.flyTo(model);
}

const loadModel2=  async () => {
    let model = await map.loadModel2();
    map.flyTo(model);
}
const loadModel3=  async () => {
    let model = await map.loadModel3();
    map.flyTo(model);
}
const loadModel4=  async () => {
    let model = await map.loadModel4();
    map.flyTo(model);
}
const loadModel5=  async () => {
    let model = await map.loadModel5();
    map.flyTo(model);
}
onMounted(async () => {
    map = new Map({canvas: canvas.value});
    await map.init();
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
