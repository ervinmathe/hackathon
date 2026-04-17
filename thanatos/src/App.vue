<script setup>
import { createRouter, createWebHistory } from 'vue-router'
import router from './router';



</script>

<template>
  <router-view></router-view>
</template>

<style scoped>

</style>

<style>
:root {
  --universalbackgrounbcolor: #090c11;
  --universalsecondarybackgroundcolor: #0d1117;
  --universalprimarytextcolor: #E6EAF0;
  --universalsecondarytextcolor: #9AA4B2;
  --universalaccentcolor: #6DA8FF;
  --universalfontstyle: 'Inter', system-ui, -apple-system, sans-serif;
  --universallogouttextcolor: #DA2C38;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--universalbackgrounbcolor);
  color: var(--universaltextcolor);
  font-family: var(--universalfontstyle);
}

h1 {
  color: var(--universalprimarytextcolor);
}

p {
  color: var(--universalsecondarytextcolor);
}

a {
  color: var(--universalaccentcolor);
}
</style>
