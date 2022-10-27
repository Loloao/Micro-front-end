import Vue from 'vue'
import VueRouter from 'vue-router'
import Energy from '../pages/energy'

Vue.use(VueRouter)

const routes = [
    {
        path: '/energy',
        name: 'Energy',
        component: Energy
    }
]

const router = new VueRouter({
    mode: 'hash',
    routes
})

export default router