<template>
<div>
<header-nav />
<!-- <router-view /> -->
<div id='micro-container'>子应用内容</div>
</div>
</template>

<script>
import HeaderNav from './components/HeaderNav.vue'
import { registerApp } from './utils';
import {subNavList} from './store/sub'

registerApp(subNavList)

export default {
  name: 'App',
  components: {
    HeaderNav
  }
}
</script>

<style></style>
