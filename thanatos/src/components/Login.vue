<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const activeTab = ref('login')
const sliding = ref(false)
// Error & Loading
const error = ref('')
const loading = ref(false)

// Input Refs for focus management
const loginPassRef = ref(null)
const regEmailRef = ref(null)
const regPassRef = ref(null)
const regConfirmRef = ref(null)

const focusNext = (nextRef) => {
  if (nextRef && nextRef.focus) {
    nextRef.focus()
  }
}

// Login fields
const loginEmail = ref('')
const loginPassword = ref('')

// Register fields
const regName = ref('')
const regEmail = ref('')
const regPassword = ref('')
const regConfirm = ref('')

const switchTab = (tab) => {
  activeTab.value = tab
  error.value = ''
}

const handleLogin = async () => {
  if (!loginEmail.value || !loginPassword.value) {
    error.value = 'Please fill in all fields'
    return
  }
  
  loading.value = true
  error.value = ''
  try {
    await authStore.login(loginEmail.value, loginPassword.value)
    router.replace('/home')
  } catch (err) {
    error.value = err.response?.data?.message || 'Login failed. Please check your credentials.'
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  if (!regName.value || !regEmail.value || !regPassword.value || !regConfirm.value) {
    error.value = 'Please fill in all fields'
    return
  }
  
  if (regPassword.value !== regConfirm.value) {
    error.value = 'Passwords do not match'
    return
  }
  
  loading.value = true
  error.value = ''
  try {
    console.log('Starting registration...');
    await authStore.register({
      username: regName.value,
      email: regEmail.value,
      password: regPassword.value
    })
    console.log('Registration successful, redirecting...');
    router.replace('/home')
  } catch (err) {
    error.value = err.response?.data?.message || 'Registration failed.'
  } finally {
    loading.value = false
  }
}

const slideOffset = computed(() => {
  return activeTab.value === 'login' 
    ? '0%' 
    : 'calc(-50% - 40px)' // Move half the width PLUS half the gap
})

</script>

<template>
  <div class="page">
    <!-- BG -->
    <div class="bg">
      <div class="orb orb--1"></div>
      <div class="orb orb--2"></div>
      <div class="grid-overlay"></div>
    </div>

    <!-- BRAND -->
    <div class="brand">
      <span class="brand-dot"></span>
      <span class="brand-name">Wellpath</span>
    </div>

    <!-- CARD -->
    <div class="card-wrap">
      <div class="card">

        <!-- TAB SWITCHER -->
        <div class="tabs">
          <div class="tabs__track">
            <div class="tabs__indicator" :style="{ left: activeTab === 'login' ? '4px' : 'calc(50% + 0px)' }"></div>
            <button :class="['tabs__btn', { 'tabs__btn--active': activeTab === 'login' }]" @click="switchTab('login')">Sign In</button>
            <button :class="['tabs__btn', { 'tabs__btn--active': activeTab === 'register' }]" @click="switchTab('register')">Register</button>
          </div>
        </div>

        <!-- SLIDER VIEWPORT -->
        <div class="slider-viewport">
          <div class="slider-track" :style="{ transform: `translateX(${slideOffset})` }">

            <!-- LOGIN PANEL -->
            <div class="panel">
              <div class="panel__head">
                <h2 class="panel__title">Welcome back</h2>
                <p class="panel__sub">Sign in to continue your wellness journey</p>
              </div>

              <!-- Error Message -->
              <div v-if="error" class="error-msg">
                {{ error }}
              </div>

              <div class="fields">
                <div class="field">
                  <label class="field__label">Email</label>
                  <div class="field__wrap">
                    <svg class="field__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>
                    <input v-model="loginEmail" type="email" placeholder="you@example.com" class="field__input" @keyup.enter="focusNext(loginPassRef)" />
                  </div>
                </div>
                <div class="field">
                  <label class="field__label">Password</label>
                  <div class="field__wrap">
                    <svg class="field__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input ref="loginPassRef" v-model="loginPassword" type="password" placeholder="••••••••" class="field__input" @keyup.enter="handleLogin" />
                  </div>
                </div>
                <div class="field__row">
                  <label class="checkbox-label">
                    <input type="checkbox" class="checkbox" /> Remember me
                  </label>
                  <a href="#" class="forgot">Forgot password?</a>
                </div>
              </div>
              <button class="submit-btn" :disabled="loading" @click="handleLogin">
                <span v-if="loading">Signing in...</span>
                <template v-else>
                  Sign In
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </template>
              </button>
              <p class="switch-hint">Don't have an account? <span @click="switchTab('register')">Register</span></p>
            </div>

            <!-- REGISTER PANEL -->
            <div class="panel">
              <div class="panel__head">
                <h2 class="panel__title">Create account</h2>
                <p class="panel__sub">Join Wellpath and start your journey today</p>
              </div>

              <!-- Error Message -->
              <div v-if="error" class="error-msg">
                {{ error }}
              </div>

              <div class="fields">
                <div class="field">
                  <label class="field__label">Full Name</label>
                  <div class="field__wrap">
                    <svg class="field__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                    <input v-model="regName" type="text" placeholder="Your name" class="field__input" @keyup.enter="focusNext(regEmailRef)" />
                  </div>
                </div>
                <div class="field">
                  <label class="field__label">Email</label>
                  <div class="field__wrap">
                    <svg class="field__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>
                    <input ref="regEmailRef" v-model="regEmail" type="email" placeholder="you@example.com" class="field__input" @keyup.enter="focusNext(regPassRef)" />
                  </div>
                </div>
                <div class="field">
                  <label class="field__label">Password</label>
                  <div class="field__wrap">
                    <svg class="field__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input ref="regPassRef" v-model="regPassword" type="password" placeholder="Min. 8 characters" class="field__input" @keyup.enter="focusNext(regConfirmRef)" />
                  </div>
                </div>
                <div class="field">
                  <label class="field__label">Confirm Password</label>
                  <div class="field__wrap">
                    <svg class="field__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 13c0 5-3.5 7.5-8 8.5C7.5 20.5 4 18 4 13V6l8-3 8 3v7z"/></svg>
                    <input ref="regConfirmRef" v-model="regConfirm" type="password" placeholder="••••••••" class="field__input" @keyup.enter="handleRegister" />
                  </div>
                </div>
              </div>
              <button class="submit-btn" :disabled="loading" @click="handleRegister">
                <span v-if="loading">Processing...</span>
                <template v-else>
                  Create Account
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </template>
              </button>
              <p class="switch-hint">Already have an account? <span @click="switchTab('login')">Sign in</span></p>
            </div>

          </div>
        </div>

      </div>
    </div>

    <p class="footer-note">© 2026 Wellpath · All rights reserved</p>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.page {
  font-family: 'DM Sans', sans-serif;
  background: #080b12;
  color: #e8edf5;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 40px 20px;
}

/* BG */
.bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.orb {
  position: absolute; border-radius: 50%;
  filter: blur(80px); opacity: 0.15;
}
.orb--1 {
  width: 600px; height: 600px;
  background: radial-gradient(circle, #3b9eff, transparent 70%);
  top: -150px; left: -150px;
  animation: drift 14s ease-in-out infinite alternate;
}
.orb--2 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, #5ee7b0, transparent 70%);
  bottom: -100px; right: -100px;
  animation: drift 18s ease-in-out infinite alternate-reverse;
}
@keyframes drift {
  from { transform: translate(0,0); }
  to { transform: translate(50px, 40px); }
}
.grid-overlay {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent);
}

/* BRAND */
.brand {
  position: relative; z-index: 1;
  display: flex; align-items: center; gap: 10px;
  font-family: 'Sora', sans-serif;
  font-weight: 600; font-size: 20px;
  margin-bottom: 36px;
}
.brand-dot {
  width: 9px; height: 9px; border-radius: 50%;
  background: linear-gradient(135deg, #5ee7b0, #3b9eff);
  box-shadow: 0 0 12px rgba(94,231,176,0.7);
}
.brand-name { color: #f0f4ff; }

/* CARD */
.card-wrap {
  position: relative; z-index: 1;
  width: 100%; max-width: 440px;
}
.card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px;
  overflow: hidden;
  backdrop-filter: blur(12px);
  box-shadow: 0 40px 80px rgba(0,0,0,0.4);
}

/* TABS */
.tabs { padding: 16px 16px 0; }
.tabs__track {
  position: relative;
  display: grid; grid-template-columns: 1fr 1fr;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px;
  padding: 4px;
  height: 46px;
}
.tabs__indicator {
  position: absolute;
  top: 4px; bottom: 4px;
  width: calc(50% - 4px);
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  transition: left 0.38s cubic-bezier(0.4,0,0.2,1);
}
.tabs__btn {
  position: relative; z-index: 1;
  background: none; border: none;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px; font-weight: 500;
  color: rgba(255,255,255,0.35);
  cursor: pointer;
  border-radius: 10px;
  transition: color 0.25s;
}
.tabs__btn--active { color: #f0f4ff; }

/* SLIDER */
.slider-viewport {
  overflow: hidden;
  padding: 28px 28px 24px;
}
.slider-track {
  padding: auto;
  display: flex;
  width: 200%;
  will-change: transform;
  align-items: flex-start;
  transition: transform 0.38s cubic-bezier(0.4,0,0.2,1);
  gap: 40px;
}
.panel {
  width: 50%;
  flex-shrink: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-right: 1px;
}

/* PANEL CONTENT */
.panel__head { display: flex; flex-direction: column; gap: 6px; }
.panel__title {
  font-family: 'Sora', sans-serif;
  font-size: 22px; font-weight: 600;
  color: #f0f4ff; letter-spacing: -0.5px;
}
.panel__sub { font-size: 13.5px; color: rgba(255,255,255,0.35); font-weight: 300; }

/* FIELDS */
.fields { display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 7px; }
.field__label { font-size: 12.5px; color: rgba(255,255,255,0.45); letter-spacing: 0.3px; }
.field__wrap {
  position: relative;
  display: flex; align-items: center;
}
.field__icon {
  position: absolute; left: 14px;
  color: rgba(255,255,255,0.25);
  pointer-events: none; flex-shrink: 0;
}
.field__input {
  width: 100%;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 12px;
  padding: 12px 14px 12px 42px;
  color: #e8edf5;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
}
.field__input::placeholder { color: rgba(255,255,255,0.2); }
.field__input:focus {
  border-color: rgba(94,231,176,0.4);
  background: rgba(255,255,255,0.06);
}
.field__row {
  display: flex; align-items: center;
  justify-content: space-between;
  margin-top: -4px;
}
.checkbox-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: rgba(255,255,255,0.35); cursor: pointer;
}
.checkbox {
  accent-color: #5ee7b0;
  width: 14px; height: 14px; cursor: pointer;
}
.forgot {
  font-size: 13px; color: rgba(94,231,176,0.7);
  text-decoration: none; transition: color 0.2s;
}
.forgot:hover { color: #5ee7b0; }

/* SUBMIT */
.submit-btn {
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 14px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #5ee7b0, #3b9eff);
  color: #070b12;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px; font-weight: 600;
  cursor: pointer;
  box-shadow: 0 0 30px rgba(94,231,176,0.15);
  transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
  margin-top: 4px;
}
.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 40px rgba(94,231,176,0.3);
}
.submit-btn:active { transform: scale(0.97); }
.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.error-msg {
  background: rgba(255, 75, 75, 0.1);
  border: 1px solid rgba(255, 75, 75, 0.2);
  color: #ff8080;
  padding: 12px;
  border-radius: 12px;
  font-size: 13px;
  text-align: center;
}

.switch-hint {
  text-align: center;
  font-size: 13px;
  color: rgba(255,255,255,0.28);
}
.switch-hint span {
  color: rgba(94,231,176,0.8);
  cursor: pointer;
  transition: color 0.2s;
}
.switch-hint span:hover { color: #5ee7b0; }

.footer-note {
  position: relative; z-index: 1;
  margin-top: 28px;
  font-size: 12px;
  color: rgba(255,255,255,0.15);
}
</style>
