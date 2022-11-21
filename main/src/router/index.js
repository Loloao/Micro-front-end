import { createRouter, createWebHashHistory } from 'vue-router'
// import Select from '../pages/select'
// import Index from '../pages/index'

const routes = [
    {
        path: '/',
        component: () => import('../App.vue')
    },
    {
        path: '/vue2',
        component: () => import('../App.vue')
    },
    {
        path: '/vue3',
        component: () => import('../App.vue')
    },
    {
        path: '/react16',
        component: () => import('../App.vue')
    },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router