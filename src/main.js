
import './style.css'
import './assets/base.css'
import './assets/main.css'
import 'element-plus/dist/index.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia';
import App from './App.vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

const pinia = createPinia();
createApp(App).use(ElementPlus, {
    locale: zhCn,
}).use(pinia).mount('#app')
