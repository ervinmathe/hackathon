<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const showDropdown = ref(false)
const scrolled = ref(false)
const heroVisible = ref(false)
const submitted = ref(false)
const authStore = useAuthStore()

const handleScroll = () => { scrolled.value = window.scrollY > 20 }
onMounted(() => { setTimeout(() => (heroVisible.value = true), 100); window.addEventListener('scroll', handleScroll) })
onBeforeUnmount(() => window.removeEventListener('scroll', handleScroll))

const closeDropdown = (e) => {
  if (!e?.target?.closest('.profile-container')) showDropdown.value = false
}

function logout() {
  authStore.logout(router)
}

// Form state
const name = ref('')
const age = ref('')
const fitnessLevel = ref('')
const hoursPerWeek = ref(5)
const injuries = ref('')
const extraNotes = ref('')

const selectedSports = ref([])
const selectedGoals = ref([])
const selectedSetting = ref('')
const selectedTime = ref('')

const sports = ['Football','Basketball','Running','Swimming','Cycling','Gym / weightlifting','Yoga','Tennis','Martial arts','Hiking','Dance','Volleyball']
const goals = ['Lose weight','Build muscle','Improve endurance','Reduce stress','Meet people','Stay consistent','Compete']
const settings = ['Indoors','Outdoors','Both']
const times = ['Early morning','Morning','Afternoon','Evening','Late night']
const levels = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'athlete', label: 'Competitive athlete' },
]

function toggleSport(s) {
  const i = selectedSports.value.indexOf(s)
  i === -1 ? selectedSports.value.push(s) : selectedSports.value.splice(i, 1)
}
function toggleGoal(g) {
  const i = selectedGoals.value.indexOf(g)
  i === -1 ? selectedGoals.value.push(g) : selectedGoals.value.splice(i, 1)
}

const tags = computed(() => {
  const t = []
  if (fitnessLevel.value) t.push(fitnessLevel.value)
  selectedSports.value.forEach(s => t.push(s.toLowerCase().replace(/ \/ /g, '-')))
  selectedGoals.value.forEach(g => t.push(g.toLowerCase().replace(/ /g, '-')))
  if (selectedSetting.value) t.push(selectedSetting.value.toLowerCase())
  if (selectedTime.value) t.push(selectedTime.value.toLowerCase().replace(/ /g, '-'))
  if (hoursPerWeek.value) t.push(hoursPerWeek.value + 'h/week')
  return t
})

const formError = ref('')

function submitForm() {
  if (!name.value.trim() || !age.value || !fitnessLevel.value) {
    formError.value = 'Please fill in your name, age, and fitness level.'
    return
  }
  formError.value = ''
  const profile = {
    name: name.value.trim(),
    age: age.value,
    fitnessLevel: fitnessLevel.value,
    sports: selectedSports.value,
    goals: selectedGoals.value,
    setting: selectedSetting.value,
    preferredTime: selectedTime.value,
    hoursPerWeek: hoursPerWeek.value,
    injuries: injuries.value.trim(),
    notes: extraNotes.value.trim(),
    tags: tags.value,
    savedAt: new Date().toISOString()
  }
  localStorage.setItem('wellpath_profile', JSON.stringify(profile))
  submitted.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function goToPhysical() {
  router.push('/physical-health')
}
</script>

<template>
  <div class="page" @click="closeDropdown($event)">

    <!-- NAVBAR -->
    <nav :class="['navbar', { 'navbar--scrolled': scrolled }]">
      <button class="back-btn" @click="router.push('/physical-health')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
      <div class="navbar__brand">
        <span class="brand-dot"></span>
        <span class="brand-name">Wellpath</span>
      </div>
      <div class="navbar__actions">
        
        <div class="profile-container" @click.stop="showDropdown = !showDropdown">
          <div class="avatar">
            <img v-if="authStore.user?.profile_url" :src="authStore.user.profile_url" alt="Profile" />
            <span v-else class="avatar-fallback">{{ authStore.user?.username?.charAt(0).toUpperCase() || 'U' }}</span>
          </div>
          <Transition name="dropdown">
            <div v-if="showDropdown" class="dropdown">
              <a href="/profile" class="dropdown__item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                Profile
              </a>
              <div class="dropdown__divider"></div>
              <a href="#" @click.prevent="logout()" class="dropdown__item dropdown__item--danger">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign Out
              </a>
            </div>
          </Transition>
        </div>
      </div>
    </nav>

    <!-- SUCCESS STATE -->
    <template v-if="submitted">
      <section class="success-hero">
        <div class="orb orb--1"></div>
        <div class="orb orb--2"></div>
        <div class="grid-overlay"></div>
        <div class="success-content">
          <div class="success-check">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5ee7b0" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h1 class="success-title">Profile saved!</h1>
          <p class="success-sub">Your sporting profile is ready. Here are your tags — we'll use these to find the best places for you.</p>
          <div class="tags-row">
            <span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <div class="success-actions">
            <button class="btn btn--primary" @click="goToPhysical">Find places for me</button>
            <button class="btn btn--ghost" @click="submitted = false">Edit profile</button>
          </div>
        </div>
      </section>
    </template>

    <!-- FORM STATE -->
    <template v-else>
      <section class="hero">
        <div class="orb orb--1"></div>
        <div class="orb orb--2"></div>
        <div class="grid-overlay"></div>
        <div :class="['hero__content', { 'hero__content--visible': heroVisible }]">
          <div class="step-badge">Sporting profile</div>
          <h1 class="hero__title">Tell us about<br /><em class="hero__title-em">your fitness</em></h1>
          <p class="hero__sub">We'll tag your profile so our AI can recommend the right places and activities near you.</p>
        </div>
      </section>

      <div class="form-outer">

        <!-- STEP 1 -->
        <div class="step-header">
          <span class="step-num">01</span>
          <div>
            <div class="step-label">The basics</div>
            <div class="step-title">Who are you?</div>
          </div>
        </div>
        <div class="card">
          <div class="field-row">
            <div class="field">
              <label>Full name</label>
              <input v-model="name" type="text" placeholder="e.g. Alex Popescu" />
            </div>
            <div class="field">
              <label>Age</label>
              <input v-model="age" type="number" placeholder="e.g. 21" min="10" max="99" />
            </div>
          </div>
          <div class="field">
            <label>Fitness level</label>
            <div class="level-grid">
              <button
                v-for="l in levels" :key="l.value"
                :class="['level-btn', { active: fitnessLevel === l.value }]"
                @click="fitnessLevel = l.value"
              >{{ l.label }}</button>
            </div>
          </div>
        </div>

        <!-- STEP 2 -->
        <div class="step-header">
          <span class="step-num">02</span>
          <div>
            <div class="step-label">Activities</div>
            <div class="step-title">What do you play?</div>
          </div>
        </div>
        <div class="card">
          <div class="field">
            <label>Sports & activities <span class="label-hint">select all that apply</span></label>
            <div class="toggle-grid">
              <button
                v-for="s in sports" :key="s"
                :class="['toggle', { active: selectedSports.includes(s) }]"
                @click="toggleSport(s)"
              >{{ s }}</button>
            </div>
          </div>
          <div class="field">
            <label>Your goals <span class="label-hint">select all that apply</span></label>
            <div class="toggle-grid">
              <button
                v-for="g in goals" :key="g"
                :class="['toggle', { active: selectedGoals.includes(g) }]"
                @click="toggleGoal(g)"
              >{{ g }}</button>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label>Preferred setting</label>
              <div class="toggle-grid">
                <button
                  v-for="s in settings" :key="s"
                  :class="['toggle', { active: selectedSetting === s }]"
                  @click="selectedSetting = s"
                >{{ s }}</button>
              </div>
            </div>
            <div class="field">
              <label>Best time of day</label>
              <div class="toggle-grid">
                <button
                  v-for="t in times" :key="t"
                  :class="['toggle', { active: selectedTime === t }]"
                  @click="selectedTime = t"
                >{{ t }}</button>
              </div>
            </div>
          </div>
        </div>

        <!-- STEP 3 -->
        <div class="step-header">
          <span class="step-num">03</span>
          <div>
            <div class="step-label">Availability</div>
            <div class="step-title">Your schedule & limits</div>
          </div>
        </div>
        <div class="card">
          <div class="field">
            <label>Hours per week available <span class="label-hint">{{ hoursPerWeek }}h</span></label>
            <div class="range-wrap">
              <span class="range-edge">1h</span>
              <input type="range" v-model="hoursPerWeek" min="1" max="20" step="1" class="range-input" />
              <span class="range-edge">20h</span>
            </div>
          </div>
          <div class="field">
            <label>Injuries or physical limitations</label>
            <textarea v-model="injuries" placeholder="e.g. Knee injury, avoid high impact, lower back issues..."></textarea>
          </div>
          <div class="field">
            <label>Anything else we should know?</label>
            <textarea v-model="extraNotes" placeholder="e.g. I prefer solo activities, I love being outdoors, I'm new to the city..."></textarea>
          </div>
        </div>

        <!-- TAGS PREVIEW -->
        <div v-if="tags.length > 0" class="tags-preview">
          <div class="tags-preview__label">Your profile tags so far</div>
          <div class="tags-row">
            <span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </div>

        <!-- ERROR -->
        <p v-if="formError" class="form-error">{{ formError }}</p>

        <!-- SUBMIT -->
        <button class="submit-btn" @click="submitForm">
          Save profile & get recommendations
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>

      </div>
    </template>

    <footer class="footer">
      <div class="footer__inner">
        <div class="footer__brand">
          <span class="brand-dot brand-dot--sm"></span>
          <span>Wellpath</span>
        </div>
        <p class="footer__copy">© 2026 Wellpath. All rights reserved.</p>
      </div>
    </footer>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.page {
  font-family: 'DM Sans', sans-serif;
  background: #080b12;
  color: #e8edf5;
  min-height: 100vh;
  overflow-x: hidden;
}

/* NAVBAR */
.navbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 40px;
  transition: all 0.4s ease;
}
.navbar--scrolled {
  background: rgba(8,11,18,0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding: 14px 40px;
}
.navbar__brand { display: flex; align-items: center; gap: 10px; font-family: 'Sora', sans-serif; font-weight: 600; font-size: 17px; }
.brand-dot { width: 8px; height: 8px; border-radius: 50%; background: linear-gradient(135deg,#5ee7b0,#3b9eff); box-shadow: 0 0 10px rgba(94,231,176,0.6); }
.brand-dot--sm { width: 6px; height: 6px; }
.brand-name { color: #f0f4ff; }
.navbar__actions { display: flex; align-items: center; gap: 14px; }
.back-btn {
  display: flex; align-items: center; gap: 6px;
  background: none; border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.5); font-size: 13px; padding: 6px 14px;
  border-radius: 100px; cursor: pointer; font-family: inherit;
}
.back-btn:hover { color: #e8edf5; border-color: rgba(255,255,255,0.25); }
.profile-container { position: relative; cursor: pointer; }
.avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg,#1e2d45,#0f1929);
  border: 1.5px solid rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center;
}
.avatar-fallback { font-size: 13px; font-weight: 600; color: #8baacc; }
.dropdown {
  position: absolute; top: calc(100% + 10px); right: 0;
  background: #0f1929; border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px; padding: 6px; min-width: 160px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5); z-index: 200;
}
.dropdown__item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; border-radius: 8px; font-size: 13.5px;
  color: rgba(255,255,255,0.7); text-decoration: none; transition: all 0.15s;
}
.dropdown__item:hover { background: rgba(255,255,255,0.06); color: #fff; }
.dropdown__item--danger:hover { background: rgba(239,68,68,0.1); color: #f87171; }
.dropdown__divider { height: 1px; background: rgba(255,255,255,0.06); margin: 4px 0; }
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px) scale(0.97); }

/* HERO */
.hero {
  position: relative;
  min-height: 60vh;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; padding: 120px 40px 80px;
}
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.15; pointer-events: none; }
.orb--1 { width: 500px; height: 500px; background: radial-gradient(circle,#3b9eff,transparent 70%); top: -100px; left: -100px; animation: drift 12s ease-in-out infinite alternate; }
.orb--2 { width: 400px; height: 400px; background: radial-gradient(circle,#5ee7b0,transparent 70%); bottom: -80px; right: -80px; animation: drift 15s ease-in-out infinite alternate-reverse; }
@keyframes drift { from { transform: translate(0,0); } to { transform: translate(40px,30px); } }
.grid-overlay {
  position: absolute; inset: 0; pointer-events: none;
  background-image: linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent);
}
.hero__content { position: relative; text-align: center; max-width: 640px; opacity: 0; transform: translateY(30px); transition: all 0.9s cubic-bezier(0.22,1,0.36,1); }
.hero__content--visible { opacity: 1; transform: translateY(0); }
.step-badge {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 11px; text-transform: uppercase; letter-spacing: 2px;
  color: rgba(94,231,176,0.8); margin-bottom: 20px;
  border: 1px solid rgba(94,231,176,0.2); padding: 6px 16px; border-radius: 100px;
}
.hero__title { font-family: 'Sora', sans-serif; font-size: clamp(36px,6vw,68px); font-weight: 700; line-height: 1.08; letter-spacing: -2px; color: #f0f4ff; margin-bottom: 20px; }
.hero__title-em { font-style: italic; font-weight: 300; background: linear-gradient(135deg,#5ee7b0,#3b9eff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.hero__sub { font-size: 17px; color: rgba(255,255,255,0.4); line-height: 1.65; font-weight: 300; max-width: 440px; margin: 0 auto; }

/* FORM LAYOUT */
.form-outer { max-width: 760px; margin: 0 auto; padding: 0 24px 80px; }

.step-header { display: flex; align-items: flex-start; gap: 20px; margin: 48px 0 20px; }
.step-num { font-family: 'Sora', sans-serif; font-size: 48px; font-weight: 700; color: rgba(255,255,255,0.06); line-height: 1; flex-shrink: 0; }
.step-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: rgba(94,231,176,0.6); margin-bottom: 4px; }
.step-title { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 600; color: #f0f4ff; letter-spacing: -0.5px; }

.card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 20px; padding: 28px;
}

.field { margin-bottom: 24px; }
.field:last-child { margin-bottom: 0; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 560px) { .field-row { grid-template-columns: 1fr; } }

label {
  display: block; font-size: 11px; text-transform: uppercase;
  letter-spacing: 1.5px; color: rgba(255,255,255,0.4); margin-bottom: 10px; font-weight: 500;
}
.label-hint { text-transform: none; letter-spacing: 0; color: rgba(255,255,255,0.25); font-size: 11px; }

input[type=text], input[type=number], textarea {
  width: 100%; background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.09); color: #e8edf5;
  border-radius: 12px; padding: 13px 16px; font-size: 14px;
  font-family: inherit; outline: none; transition: border-color 0.2s;
}
input[type=text]:focus, input[type=number]:focus, textarea:focus { border-color: rgba(94,231,176,0.35); background: rgba(255,255,255,0.06); }
textarea { resize: vertical; min-height: 90px; }
input[type=number]::-webkit-inner-spin-button { opacity: 0.3; }

/* LEVEL GRID */
.level-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
@media (max-width: 560px) { .level-grid { grid-template-columns: repeat(2,1fr); } }
.level-btn {
  padding: 12px 8px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.09);
  background: transparent; color: rgba(255,255,255,0.4); font-size: 13px;
  cursor: pointer; font-family: inherit; transition: all 0.2s; text-align: center;
}
.level-btn:hover { border-color: rgba(255,255,255,0.18); color: rgba(255,255,255,0.7); }
.level-btn.active { border-color: #5ee7b0; color: #5ee7b0; background: rgba(94,231,176,0.08); }

/* TOGGLES */
.toggle-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.toggle {
  padding: 8px 16px; border-radius: 100px; border: 1px solid rgba(255,255,255,0.09);
  background: transparent; color: rgba(255,255,255,0.4); font-size: 13px;
  cursor: pointer; font-family: inherit; transition: all 0.18s;
}
.toggle:hover { border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); }
.toggle.active { border-color: #5ee7b0; color: #5ee7b0; background: rgba(94,231,176,0.08); }

/* RANGE */
.range-wrap { display: flex; align-items: center; gap: 14px; }
.range-edge { font-size: 12px; color: rgba(255,255,255,0.3); min-width: 24px; }
.range-input {
  flex: 1; -webkit-appearance: none; height: 4px;
  background: rgba(255,255,255,0.1); border-radius: 4px; outline: none; cursor: pointer;
}
.range-input::-webkit-slider-thumb {
  -webkit-appearance: none; width: 18px; height: 18px;
  border-radius: 50%; background: #5ee7b0; cursor: pointer;
  box-shadow: 0 0 8px rgba(94,231,176,0.4);
}

/* TAGS */
.tags-preview {
  margin-top: 32px; padding: 20px 24px;
  background: rgba(94,231,176,0.04); border: 1px solid rgba(94,231,176,0.12);
  border-radius: 16px;
}
.tags-preview__label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(94,231,176,0.6); margin-bottom: 12px; }
.tags-row { display: flex; flex-wrap: wrap; gap: 8px; }
.tag {
  font-size: 12px; padding: 5px 14px; border-radius: 100px;
  background: rgba(94,231,176,0.08); border: 1px solid rgba(94,231,176,0.2); color: #5ee7b0;
}

/* ERROR */
.form-error { color: #f87171; font-size: 13px; margin-top: 16px; text-align: center; }

/* SUBMIT */
.submit-btn {
  width: 100%; margin-top: 28px; padding: 18px;
  border-radius: 100px; border: none;
  background: linear-gradient(135deg,#5ee7b0,#3b9eff);
  color: #070b12; font-size: 15px; font-weight: 700;
  cursor: pointer; font-family: inherit;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  transition: all 0.25s;
}
.submit-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 40px rgba(94,231,176,0.25); }
.submit-btn:active { transform: scale(0.98); }

/* SUCCESS */
.success-hero {
  position: relative; min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; padding: 120px 40px 80px;
}
.success-content { position: relative; text-align: center; max-width: 600px; }
.success-check {
  width: 72px; height: 72px; border-radius: 50%;
  background: rgba(94,231,176,0.1); border: 1px solid rgba(94,231,176,0.3);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 28px;
}
.success-title { font-family: 'Sora', sans-serif; font-size: clamp(36px,5vw,60px); font-weight: 700; letter-spacing: -2px; color: #f0f4ff; margin-bottom: 16px; }
.success-sub { font-size: 17px; color: rgba(255,255,255,0.4); line-height: 1.65; font-weight: 300; margin-bottom: 28px; }
.success-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-top: 32px; }

/* BUTTONS */
.btn {
  padding: 14px 32px; border-radius: 100px; font-family: 'DM Sans', sans-serif;
  font-size: 15px; font-weight: 500; cursor: pointer; border: none;
  transition: all 0.2s; letter-spacing: 0.2px;
}
.btn--primary { background: linear-gradient(135deg,#5ee7b0,#3b9eff); color: #070b12; box-shadow: 0 0 30px rgba(94,231,176,0.2); }
.btn--primary:hover { transform: translateY(-2px); box-shadow: 0 8px 40px rgba(94,231,176,0.35); }
.btn--ghost { background: transparent; color: rgba(255,255,255,0.55); border: 1px solid rgba(255,255,255,0.12); }
.btn--ghost:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.85); }

/* FOOTER */
.footer { border-top: 1px solid rgba(255,255,255,0.05); padding: 32px 40px; }
.footer__inner { max-width: 760px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.footer__brand { display: flex; align-items: center; gap: 8px; font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.4); }
.footer__copy { font-size: 12.5px; color: rgba(255,255,255,0.2); }
</style>