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
  --universalbackgrounbcolor: rgb(18, 18, 18);
  --universalprimarytextcolor: #E6EAF0;
  --universalsecondarytextcolor: #9AA4B2;
  --universalaccentcolor: #6DA8FF;
  --universalfontstyle: 'Inter', system-ui, -apple-system, sans-serif;
  --universallogouttextcolor: #DA2C38;
}


body {
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
