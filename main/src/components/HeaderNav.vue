<template>
<ul>
  <li 
    v-for='item in list' 
    :key="item.id"
  >
    <router-link :to='item.url'>{{item.name}}</router-link>
  </li>
</ul>
</template>
<script>
import { reactive } from 'vue'
import {navList} from '../constant/nav'
export default {
  setup() {
    let list = reactive([])
    list = navList
    return {
      list
    }
  },
}
</script>