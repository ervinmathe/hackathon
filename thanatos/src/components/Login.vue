<script setup>
import router , { allow } from '../router'

function login() {
  allow.value = true
  router.replace('/home')
}
</script>

<template>
  <section class="loginmainsection">
    <h1>Log In</h1>

    <button href="#" @click="login">Log In</button>
  </section>
</template>

<style scoped>

.loginmainsection{
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
</style>