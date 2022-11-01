<template>
    <ul>
        <li v-for="item in carList" :key="item.id">
            {{item.name}}
        </li>
    </ul>
</template>
<script>
import axios from 'axios'

export default {
    name: 'index-vue',
    data() {
        return {
            carList: []
        }
    },
    methods: {
        async getCarList() {
            const res = await axios.get('http://localhost:3000/vue2/car/list')
            this.carList = res.data
        }
    },
    mounted() {
        this.getCarList()
    }
}
</script>
