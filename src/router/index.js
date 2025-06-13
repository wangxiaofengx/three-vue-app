import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "demo1",
    component: import("../components/three/demo1.vue"),
  },
  {
    path: "/demo2",
    name: "demo2",
    component: import("../components/three/demo2.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
