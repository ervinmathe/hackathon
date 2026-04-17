<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Local state for the profile fields
const username = ref(authStore.user?.username || '')
const displayName = ref(authStore.user?.displayName || '')
const fullName = ref(authStore.user?.fullName || '')

const initials = computed(() => {
  return username.value.charAt(0).toUpperCase() || 'U'
})

function handleSave() {
  console.log('Saving profile...', {
    username: username.value,
    displayName: displayName.value,
    fullName: fullName.value
  })
  // logic for updating user profile
}

function handleLogout() {
  authStore.logout(router)
}
</script>

<template>
  <div class="page">
    <div class="hero__bg">
      <div class="orb orb--1"></div>
      <div class="orb orb--2"></div>
      <div class="grid-overlay"></div>
    </div>

    <!-- NAVBAR - bal felső sarok back gombbal -->
    <nav class="navbar">
      <button class="back-btn" @click="router.replace('/home')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back
      </button>
      <div class="navbar__actions">
         <button class="signout-btn-nav" @click="handleLogout">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
        </button>
      </div>
    </nav>

    <!-- PROFIL KÁRTYA -->
    <div class="profile-card">
      <header class="profile-header">
        <div class="brand-dot"></div>
        <h1>Account Settings</h1>
        <p>Módosítsd a profiladataidat</p>
      </header>

      <!-- AVATAR PREVIEW -->
      <div class="avatar-section">
        <div class="avatar-circle">{{ initials }}</div>
        <div class="avatar-info">
          <p class="av-name">{{ displayName || username || 'User' }}</p>
          <p class="av-handle">@{{ username || 'username' }}</p>
        </div>
      </div>

      <!-- 2 OSZLOPOS FORM GRID -->
      <div class="form-grid">

        <!-- 1. OSZLOP -->
        <div class="form-col">
          <p class="section-label">Azonosítás</p>

          <div class="input-group">
            <label>Username</label>
            <div class="input-wrapper">
              <span class="input-prefix">@</span>
              <input
                v-model="username"
                class="has-prefix"
                type="text"
                placeholder="felhasznalonev"
              />
            </div>
          </div>

          <div class="input-group">
            <label>Display Name</label>
            <input
              v-model="displayName"
              type="text"
              placeholder="Ahogy megjelensz mások számára"
            />
          </div>
        </div>

        <!-- 2. OSZLOP -->
        <div class="form-col">
          <p class="section-label">Személyes adatok</p>

          <div class="input-group">
            <label>Teljes Név</label>
            <input
              v-model="fullName"
              type="text"
              placeholder="Vezetéknév Keresztnév"
            />
          </div>
        </div>

      </div>

      <!-- GOMBOK - középen, egymás alatt -->
      <div class="actions">
        <button class="btn-save" @click="handleSave">Save Changes</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: #030712;
  color: #f0f4ff;
  font-family: 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  position: relative;
  overflow: hidden;
}

/* HÁTTÉR */
.hero__bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 0;
  pointer-events: none;
}
.orb {
  position: absolute;
  filter: blur(120px);
  border-radius: 50%;
  opacity: 0.15;
}
.orb--1 {
  width: 600px; height: 600px;
  background: #3b82f6;
  top: -200px; left: -100px;
}
.orb--2 {
  width: 500px; height: 500px;
  background: #8b5cf6;
  bottom: -100px; right: -50px;
}
.grid-overlay {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 32px 32px;
}

/* NAVBAR */
.navbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 70px;
  padding: 0 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(3, 7, 18, 0.5);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  z-index: 100;
}
.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.back-btn:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.2);
}

.signout-btn-nav { display: flex; align-items: center; gap: 6px; background: none; border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); font-size: 11px; padding: 6px 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.signout-btn-nav:hover { background: rgba(239, 68, 68, 0.1); color: #f87171; border-color: rgba(239, 68, 68, 0.2); }

/* PROFIL KÁRTYA */
.profile-card {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 720px;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
}

.profile-header {
  margin-bottom: 32px;
}
.brand-dot {
  width: 10px; height: 10px;
  background: #3b82f6;
  border-radius: 50%;
  margin-bottom: 12px;
  box-shadow: 0 0 15px #3b82f6;
}
.profile-header h1 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin-bottom: 4px;
}
.profile-header p {
  color: rgba(255,255,255,0.4);
  font-size: 14px;
}

/* AVATAR SECTION */
.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 20px;
  margin-bottom: 32px;
}
.avatar-circle {
  width: 70px; height: 70px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  color: #3b82f6;
}
.av-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 2px;
}
.av-handle {
  font-size: 14px;
  color: rgba(255,255,255,0.4);
}

/* FORM GRID */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 40px;
}
@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
}

.section-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #3b82f6;
  margin-bottom: 20px;
}

.input-group {
  margin-bottom: 20px;
}
.input-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255,255,255,0.6);
  margin-bottom: 8px;
}
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.input-prefix {
  position: absolute;
  left: 14px;
  color: rgba(255,255,255,0.3);
  font-size: 14px;
}
input {
  width: 100%;
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 12px 16px;
  color: #fff;
  font-size: 14px;
  transition: all 0.2s;
}
input.has-prefix {
  padding-left: 32px;
}
input:focus {
  outline: none;
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

/* ACTIONS */
.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}
.btn-save {
  width: 100%;
  background: #3b82f6;
  color: #fff;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-save:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.4);
}
</style>