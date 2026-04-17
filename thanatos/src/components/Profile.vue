<template>
  <div class="page">

    <!-- NAVBAR - bal felső sarok back gombbal -->
    <nav class="navbar">
      <button class="back-btn" @click="router.replace('/home')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back
      </button>
    </nav>

    <!-- HÁTTÉR -->
    <div class="hero__bg">
      <div class="orb orb--1"></div>
      <div class="orb orb--2"></div>
      <div class="grid-overlay"></div>
    </div>

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
          <p class="av-name">{{ displayName || 'Display Name' }}</p>
          <p class="av-handle">@{{ username || 'felhasznalonev' }}</p>
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
        <button class="btn-logout" @click="handleLogout">
          <svg class="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const username    = ref('johndoe')
const displayName = ref('John Doe')
const fullName    = ref('Doe John')

const initials = computed(() => {
  const name = displayName.value.trim()
  if (!name) return '?'
  const parts = name.split(' ').filter(Boolean)
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
})

function handleSave() {
  const data = {
    username:    username.value,
    displayName: displayName.value,
    fullName:    fullName.value,
  }
  console.log('Mentett adatok:', data)
  alert(`Mentve!\n\nUsername: ${data.username}\nDisplay Name: ${data.displayName}\nTeljes Név: ${data.fullName}`)
}

function handleLogout() {
  console.log('Logout')
}
</script>

<style scoped>
/* --- ALAP OLDAL STRUKTÚRA --- */
.page {
  font-family: 'DM Sans', sans-serif;
  background: #080b12;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #e8edf5;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

/* --- NAVBAR --- */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  padding: 14px 28px;
  background: rgba(8, 11, 18, 0.9);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  padding: 6px 14px;
  border-radius: 100px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.2s;
}

.back-btn:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.25);
}

/* --- HÁTTÉR --- */
.hero__bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.18;
}

.orb--1 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, #3b9eff, transparent 70%);
  top: -100px;
  left: -100px;
}

.orb--2 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #5ee7b0, transparent 70%);
  bottom: -80px;
  right: -80px;
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent);
}

/* --- BRAND DOT --- */
.brand-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5ee7b0, #3b9eff);
  box-shadow: 0 0 10px rgba(94, 231, 176, 0.6);
  margin-bottom: 12px;
}

/* --- KÁRTYA --- */
.profile-card {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  padding: 40px;
  border-radius: 28px;
  width: 100%;
  max-width: 680px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  box-sizing: border-box;
  margin: 100px 16px 40px;
}

.profile-header h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 4px;
}

.profile-header p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0 0 28px;
}

/* --- AVATAR --- */
.avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.avatar-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5ee7b0, #3b9eff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: #080b12;
  flex-shrink: 0;
}

.avatar-info p { margin: 0; }
.av-name { font-size: 15px; font-weight: 600; color: #e8edf5; }
.av-handle { font-size: 13px; color: rgba(255, 255, 255, 0.4); margin-top: 2px; }

/* --- 2 OSZLOPOS GRID --- */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 32px;
  margin-bottom: 32px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.25);
  margin: 0 0 16px;
}

/* --- MEZŐK --- */
.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 7px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-wrapper {
  position: relative;
}

.input-prefix {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.3);
  font-size: 15px;
  pointer-events: none;
}

.input-group input {
  width: 100%;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 13px 16px;
  color: white;
  font-size: 15px;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.2s;
  outline: none;
}

.input-group input.has-prefix {
  padding-left: 32px;
}

.input-group input:focus {
  border-color: #5ee7b0;
  background: rgba(0, 0, 0, 0.4);
  box-shadow: 0 0 0 3px rgba(94, 231, 176, 0.08);
}

.input-group input::placeholder {
  color: rgba(255, 255, 255, 0.2);
}

/* --- GOMBOK --- */
.actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.btn-save {
  background: linear-gradient(135deg, #5ee7b0, #3b9eff);
  color: #080b12;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: transform 0.2s, opacity 0.2s;
  width: 260px;
}

.btn-save:hover {
  transform: translateY(-2px);
  opacity: 0.9;
}

.btn-logout {
  background: transparent;
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 14px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 260px;
}

.btn-logout:hover {
  background: rgba(239, 68, 68, 0.05);
  border-color: rgba(239, 68, 68, 0.5);
}

.logout-icon {
  width: 15px;
  height: 15px;
  opacity: 0.8;
}

/* --- RESZPONZÍV --- */
@media (max-width: 560px) {
  .profile-card {
    padding: 28px 20px;
    margin-top: 80px;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .btn-save,
  .btn-logout {
    width: 100%;
  }
}
</style>
