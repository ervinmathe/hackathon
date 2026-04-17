<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../supabase'
import api from '../api/api'

const router = useRouter()
const authStore = useAuthStore()

// Local state for the profile fields
const username = ref(authStore.user?.username || '')
const profileUrl = ref(authStore.user?.profile_url || '')
const isSubmitting = ref(false)
const statusMsg = ref('')

onMounted(() => {
  if (authStore.user) {
    username.value = authStore.user.username || ''
    profileUrl.value = authStore.user.profile_url || ''
  }
})

const initials = computed(() => {
  return username.value.charAt(0).toUpperCase() || 'U'
})

const fileInput = ref(null)

function triggerFileInput() {
  fileInput.value.click()
}

async function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  try {
    isSubmitting.value = true
    statusMsg.value = 'Uploading image...'

    const fileExt = file.name.split('.').pop()
    const fileName = `${authStore.user.id}-${Math.random()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // 1. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (error) throw error

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    profileUrl.value = publicUrl
    statusMsg.value = 'Image uploaded! Click Save to confirm.'
  } catch (error) {
    console.error('Upload error:', error)
    statusMsg.value = 'Upload failed: ' + error.message
  } finally {
    isSubmitting.value = false
  }
}

async function handleSave() {
  if (isSubmitting.value) return
  
  try {
    isSubmitting.value = true
    statusMsg.value = 'Saving profile...'

    const response = await api.post(`/auth/profile/${authStore.user.id}`, {
      username: username.value,
      profile_url: profileUrl.value
    })

    // Update local store
    authStore.user = { ...authStore.user, ...response.data }
    localStorage.setItem('user', JSON.stringify(authStore.user))
    
    statusMsg.value = 'Profile updated successfully!'
  } catch (error) {
    console.error('Save error:', error)
    statusMsg.value = 'Error: ' + (error.response?.data?.message || error.message)
  } finally {
    isSubmitting.value = false
  }
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

    <!-- NAVBAR -->
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
        <p>Manage your student profile and identity</p>
      </header>

      <!-- AVATAR PREVIEW & UPLOAD -->
      <div class="avatar-section">
        <div class="avatar-circle" @click="triggerFileInput" style="cursor: pointer; position: relative; overflow: hidden;">
          <img v-if="profileUrl" :src="profileUrl" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;" />
          <span v-else>{{ initials }}</span>
          <div class="avatar-overlay">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </div>
        </div>
        <input type="file" ref="fileInput" @change="handleFileUpload" accept="image/*" style="display: none;" />
        
        <div class="avatar-info">
          <p class="av-name">{{ username || 'User' }}</p>
          <p class="av-handle">@{{ username || 'username' }}</p>
          <button class="btn-ghost-sm" @click="triggerFileInput" :disabled="isSubmitting">Change Photo</button>
        </div>
      </div>

      <div v-if="statusMsg" :class="['status-msg', { 'status-msg--err': statusMsg.includes('Error') || statusMsg.includes('failed') }]">
        {{ statusMsg }}
      </div>

      <!-- 2 OSZLOPOS FORM GRID -->
      <div class="form-grid">
        <div class="form-col">
          <p class="section-label">Identity</p>
          <div class="input-group">
            <label>Username</label>
            <div class="input-wrapper">
              <span class="input-prefix">@</span>
              <input v-model="username" class="has-prefix" type="text" placeholder="username" />
            </div>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="btn-save" @click="handleSave" :disabled="isSubmitting">
          {{ isSubmitting ? 'Updating...' : 'Save Changes' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--universalbackgrounbcolor);
  color: var(--universalprimarytextcolor);
  font-family: var(--universalfontstyle);
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
.orb--1 { width: 600px; height: 600px; background: var(--universalaccentcolor); top: -200px; left: -100px; }
.orb--2 { width: 500px; height: 500px; background: #8b5cf6; bottom: -100px; right: -50px; }
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
  background: rgba(9, 12, 17, 0.5);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  z-index: 100;
}
.back-btn {
  display: flex;
  align-items: center; gap: 8px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
  padding: 8px 16px; border-radius: 10px;
  font-size: 14px; cursor: pointer; transition: all 0.2s;
}
.back-btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }

.signout-btn-nav { display: flex; align-items: center; gap: 6px; background: none; border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); font-size: 11px; padding: 6px 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.signout-btn-nav:hover { background: rgba(239, 68, 68, 0.1); color: #f87171; border-color: rgba(239, 68, 68, 0.2); }

/* PROFIL KÁRTYA */
.profile-card {
  position: relative; z-index: 10;
  width: 100%; max-width: 720px;
  background: rgba(13, 17, 23, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px; padding: 40px;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
}

.profile-header { margin-bottom: 32px; }
.brand-dot { width: 10px; height: 10px; background: var(--universalaccentcolor); border-radius: 50%; margin-bottom: 12px; box-shadow: 0 0 15px var(--universalaccentcolor); }
.profile-header h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 4px; }
.profile-header p { color: var(--universalsecondarytextcolor); font-size: 14px; }

/* AVATAR SECTION */
.avatar-section {
  display: flex; align-items: center; gap: 20px;
  padding: 24px; background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05); border-radius: 20px;
  margin-bottom: 24px;
}
.avatar-circle {
  width: 80px; height: 80px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 2px solid rgba(109, 168, 255, 0.2);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: 700; color: var(--universalaccentcolor);
}
.avatar-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.2s;
}
.avatar-circle:hover .avatar-overlay { opacity: 1; }

.av-name { font-size: 18px; font-weight: 600; margin-bottom: 2px; }
.av-handle { font-size: 14px; color: var(--universalsecondarytextcolor); margin-bottom: 8px; }

.btn-ghost-sm {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 12px; cursor: pointer;
}

.status-msg {
  padding: 12px; border-radius: 10px; font-size: 13px;
  background: rgba(110, 231, 183, 0.1); color: #6ee7b7;
  margin-bottom: 20px; text-align: center;
}
.status-msg--err { background: rgba(239, 68, 68, 0.1); color: #f87171; }

/* FORM GRID */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
@media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } }

.section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--universalaccentcolor); margin-bottom: 20px; }

.input-group { margin-bottom: 20px; }
.input-group label { display: block; font-size: 13px; font-weight: 500; color: var(--universalsecondarytextcolor); margin-bottom: 8px; }
.input-wrapper { position: relative; display: flex; align-items: center; }
.input-prefix { position: absolute; left: 14px; color: rgba(255,255,255,0.2); font-size: 14px; }

input {
  width: 100%; background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
  padding: 12px 16px; color: #fff; font-size: 14px; transition: all 0.2s;
}
input.has-prefix { padding-left: 32px; }
input:focus { outline: none; border-color: var(--universalaccentcolor); background: rgba(109, 168, 255, 0.05); }

/* ACTIONS */
.actions { display: flex; flex-direction: column; gap: 12px; align-items: center; }
.btn-save {
  width: 100%; background: var(--universalaccentcolor); color: #030712;
  border: none; padding: 14px; border-radius: 12px; font-size: 15px; font-weight: 700;
  cursor: pointer; transition: all 0.2s;
}
.btn-save:hover { transform: translateY(-1px); box-shadow: 0 10px 20px -5px rgba(109, 168, 255, 0.4); }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
</style>