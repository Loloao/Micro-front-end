import { createRouter, createWebHashHistory } from 'vue-router'
import Select from '../pages/select'
import Index from '../pages/index'

const routes = [
    // 首页
    {
        path: '/index',
        name: 'Index',
        component: Index
    },
    {
        path: '/select',
        name: 'Select',
        component: Select
    },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router