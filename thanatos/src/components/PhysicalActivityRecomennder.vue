<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'



const router = useRouter()
const showDropdown = ref(false)
const scrolled = ref(false)
const heroVisible = ref(false)
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

const sports = ['Football', 'Basketball', 'Running', 'Swimming', 'Cycling', 'Gym / weightlifting', 'Yoga', 'Tennis', 'Martial arts', 'Hiking', 'Dance', 'Volleyball']
const goals = ['Lose weight', 'Build muscle', 'Improve endurance', 'Reduce stress', 'Meet people', 'Stay consistent', 'Compete']
const settings = ['Indoors', 'Outdoors', 'Both']
const times = ['Early morning', 'Morning', 'Afternoon', 'Evening', 'Late night']
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

// Results state
const formError = ref('')
const submitted = ref(false)
const loading = ref(false)
const loadingMessage = ref('')
const recommendations = ref([])
const aiSummary = ref('')
const locationError = ref('')

const loadingMessages = [
  'Locating you on the map…',
  'Scanning activities within 20 km…',
  'Matching your fitness profile…',
  'Curating personalized spots…',
]

let loadingInterval = null

function startLoadingAnimation() {
  let i = 0
  loadingMessage.value = loadingMessages[0]
  loadingInterval = setInterval(() => {
    i = (i + 1) % loadingMessages.length
    loadingMessage.value = loadingMessages[i]
  }, 2200)
}

function stopLoadingAnimation() {
  clearInterval(loadingInterval)
}

function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => {
        if (err.code === 1) {
          const e = new Error('location-denied')
          e.code = 'DENIED'
          reject(e)
        } else {
          reject(new Error('Could not get your location. Please allow location access.'))
        }
      }
    )
  })
}

async function retryLocation() {
  locationError.value = ''
  loading.value = true
  startLoadingAnimation()
  window.scrollTo({ top: 0, behavior: 'smooth' })
  try {
    const { lat, lon } = await getUserLocation()
    const profile = {
      name: name.value.trim(), age: age.value, fitnessLevel: fitnessLevel.value,
      sports: selectedSports.value, goals: selectedGoals.value, setting: selectedSetting.value,
      preferredTime: selectedTime.value, hoursPerWeek: hoursPerWeek.value,
      injuries: injuries.value.trim(), notes: extraNotes.value.trim(),
    }
    const result = await fetchRecommendations(profile, lat, lon)
    aiSummary.value = result.summary || ''
    recommendations.value = result.recommendations || []
    submitted.value = true
  } catch (err) {
    locationError.value = err.message === 'location-denied' ? 'DENIED' : (err.message || 'Something went wrong.')
  } finally {
    stopLoadingAnimation()
    loading.value = false
  }
}

async function fetchRecommendations(profile, lat, lon) {
  const prompt = `You are a local fitness and activity expert with knowledge of both physical venues and online community events. A user has provided their sporting profile and you need to recommend real, specific activities, venues, and community events they can attend within approximately 20 km of their location.

User Location: Latitude ${lat}, Longitude ${lon}
User Profile:
- Name: ${profile.name}, Age: ${profile.age}
- Fitness Level: ${profile.fitnessLevel}
- Sports & Activities: ${profile.sports.join(', ') || 'not specified'}
- Goals: ${profile.goals.join(', ') || 'not specified'}
- Preferred Setting: ${profile.setting || 'any'}
- Best Time of Day: ${profile.preferredTime || 'flexible'}
- Hours per Week: ${profile.hoursPerWeek}h
- Injuries/Limitations: ${profile.injuries || 'none'}
- Extra Notes: ${profile.notes || 'none'}

Based on this profile and location, respond ONLY with a valid JSON object in this exact structure:
{
  "summary": "A 2-3 sentence personalized overview explaining your recommendations for this user.",
  "recommendations": [
    {
      "id": 1,
      "name": "Venue, Event, or Community Group Name",
      "type": "category (e.g. Gym, Running Trail, Swimming Pool, Tennis Club, Facebook Group, Meetup Event, Local Sports Club)",
      "source": "Where this was found — one of: 'Google Maps', 'Facebook', 'Meetup', 'Instagram', 'Local Website', 'Strava Club', 'WhatsApp Community', 'Other'",
      "description": "2 sentences explaining why this suits the user specifically.",
      "distance": "Approximate distance from user in km (e.g. ~3 km), or 'Online / Local Area' for virtual communities",
      "bestFor": ["goal1", "goal2"],
      "timeOfDay": "Best time to go or typical event schedule",
      "intensity": "Low / Medium / High",
      "icon": "single emoji representing the activity",
      "link": "A relevant URL — Google Maps search URL for physical venues, or a Facebook/Meetup/Strava/other search URL for community events (e.g. https://www.facebook.com/search/events/?q=running+cluj, https://www.meetup.com/find/?keywords=cycling&location=Cluj)"
    }
  ]
}

Provide exactly 5 recommendations using a MIX of sources:
- At least 1-2 must be physical venues (gym, park, sports club) with a Google Maps link
- At least 1-2 must be community-based events or groups found on platforms like Facebook Events, Meetup.com, Strava Clubs, or local sports association websites
- The remaining can be either type

The recommendations must be real and specific to the region near those coordinates. Tailor each recommendation to the user's exact goals, fitness level, and preferences. For community events, suggest realistic search queries the user can follow to find current events on those platforms.`

  // GEMINI API INTEGRATION
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to fetch recommendations from Gemini')
  }

  // Extract text from Gemini's response structure
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Parse the JSON (Gemini will return clean JSON due to responseMimeType, but cleanup is a safe fallback)
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

const formValid = computed(() =>
  name.value.trim() && age.value && fitnessLevel.value
)

async function submitForm() {
  if (!formValid.value) {
    formError.value = 'Please fill in your name, age, and fitness level.'
    return
  }
  formError.value = ''
  loading.value = true
  locationError.value = ''
  startLoadingAnimation()
  window.scrollTo({ top: 0, behavior: 'smooth' })

  try {
    const { lat, lon } = await getUserLocation()

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
    }

    // Save profile without tags
    localStorage.setItem('wellpath_profile', JSON.stringify({ ...profile, savedAt: new Date().toISOString() }))

    const result = await fetchRecommendations(profile, lat, lon)
    aiSummary.value = result.summary || ''
    recommendations.value = result.recommendations || []
    submitted.value = true
  } catch (err) {
    locationError.value = err.message === 'location-denied' ? 'DENIED' : (err.message || 'Something went wrong. Please try again.')
  } finally {
    stopLoadingAnimation()
    loading.value = false
  }
}

function resetForm() {
  submitted.value = false
  recommendations.value = []
  aiSummary.value = ''
}

const intensityColor = (level) => {
  if (level === 'Low') return '#5ee7b0'
  if (level === 'Medium') return '#3b9eff'
  return '#f97316'
}
</script>

<template>
  <div class="page" @click="closeDropdown($event)">

    <!-- NAVBAR -->
    <nav :class="['navbar', { 'navbar--scrolled': scrolled }]">
      <button class="back-btn" @click="router.push('/physical-health')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
                Profile
              </a>
              <div class="dropdown__divider"></div>
              <a href="#" @click.prevent="logout()" class="dropdown__item dropdown__item--danger">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </a>
            </div>
          </Transition>
        </div>
      </div>
    </nav>

    <!-- LOADING STATE -->
    <template v-if="loading">
      <section class="loading-screen">
        <div class="orb orb--1"></div>
        <div class="orb orb--2"></div>
        <div class="grid-overlay"></div>
        <div class="loading-content">
          <div class="loader-ring">
            <svg class="loader-svg" viewBox="0 0 80 80">
              <circle class="loader-track" cx="40" cy="40" r="34" />
              <circle class="loader-arc" cx="40" cy="40" r="34" />
            </svg>
            <span class="loader-icon">🗺️</span>
          </div>
          <p class="loading-msg">{{ loadingMessage }}</p>
          <div class="loading-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </section>
    </template>

    <!-- RESULTS STATE -->
    <template v-else-if="submitted">
      <section class="results-hero">
        <div class="orb orb--1"></div>
        <div class="orb orb--2"></div>
        <div class="grid-overlay"></div>
        <div class="results-hero__content">
          <div class="results-badge">
            <span>📍</span>
            <span>Activities near you</span>
          </div>
          <h1 class="results-title">Your personal<br /><em class="results-title-em">activity plan</em></h1>
          <p class="results-sub">{{ aiSummary }}</p>
        </div>
      </section>

      <div class="results-outer">
        <div class="cards-grid">
          <a v-for="(rec, i) in recommendations" :key="rec.id" :href="rec.link || '#'" target="_blank"
            rel="noopener noreferrer" class="rec-card" :style="{ '--delay': i * 0.08 + 's' }">
            <div class="rec-card__top">
              <span class="rec-icon">{{ rec.icon }}</span>
              <span class="rec-type">{{ rec.type }}</span>
              <span class="rec-intensity"
                :style="{ color: intensityColor(rec.intensity), borderColor: intensityColor(rec.intensity) + '40', background: intensityColor(rec.intensity) + '12' }">{{
                  rec.intensity }}</span>
            </div>

            <h3 class="rec-name">{{ rec.name }}</h3>
            <p class="rec-desc">{{ rec.description }}</p>

            <div class="rec-meta">
              <div class="rec-meta__item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {{ rec.timeOfDay }}
              </div>
              <div class="rec-meta__item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {{ rec.distance }}
              </div>
            </div>

            <div class="rec-goals">
              <span v-for="goal in rec.bestFor" :key="goal" class="rec-goal-tag">{{ goal }}</span>
            </div>
          </a>
        </div>

        <div class="results-actions">
          <button class="btn btn--ghost" @click="resetForm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-4" />
            </svg>
            Refine my profile
          </button>
          <button class="btn btn--primary" @click="router.push('/physical-health')">
            Explore physical health
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
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
          <p class="hero__sub">We'll use your profile to find the best activities and venues within 20 km of you.</p>
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
              <button v-for="l in levels" :key="l.value" :class="['level-btn', { active: fitnessLevel === l.value }]"
                @click="fitnessLevel = l.value">{{ l.label }}</button>
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
              <button v-for="s in sports" :key="s" :class="['toggle', { active: selectedSports.includes(s) }]"
                @click="toggleSport(s)">{{ s }}</button>
            </div>
          </div>
          <div class="field">
            <label>Your goals <span class="label-hint">select all that apply</span></label>
            <div class="toggle-grid">
              <button v-for="g in goals" :key="g" :class="['toggle', { active: selectedGoals.includes(g) }]"
                @click="toggleGoal(g)">{{ g }}</button>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label>Preferred setting</label>
              <div class="toggle-grid">
                <button v-for="s in settings" :key="s" :class="['toggle', { active: selectedSetting === s }]"
                  @click="selectedSetting = s">{{ s }}</button>
              </div>
            </div>
            <div class="field">
              <label>Best time of day</label>
              <div class="toggle-grid">
                <button v-for="t in times" :key="t" :class="['toggle', { active: selectedTime === t }]"
                  @click="selectedTime = t">{{ t }}</button>
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
            <textarea v-model="injuries"
              placeholder="e.g. Knee injury, avoid high impact, lower back issues..."></textarea>
          </div>
          <div class="field">
            <label>Anything else we should know?</label>
            <textarea v-model="extraNotes"
              placeholder="e.g. I prefer solo activities, I love being outdoors, I'm new to the city..."></textarea>
          </div>
        </div>

        <!-- LOCATION NOTE -->
        <div class="location-note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>We'll request your location when you submit to find activities within 20 km.</span>
        </div>

        <!-- ERROR -->
        <div v-if="locationError === 'DENIED'" class="location-denied-box">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
  <div>
    <strong>Location access denied</strong>
    <p>Enable location in your browser's site settings, then try again.</p>
  </div>
  <button class="location-retry-btn" @click="retryLocation">Retry</button>
</div>
<p v-else-if="locationError" class="form-error">{{ locationError }}</p>
<p v-if="formError" class="form-error">{{ formError }}</p>

        <!-- SUBMIT -->
        <button class="submit-btn" @click="submitForm">
          Find activities near me
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
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

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

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
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 40px;
  transition: all 0.4s ease;
}

.navbar--scrolled {
  background: rgba(8, 11, 18, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding: 14px 40px;
}

.navbar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Sora', sans-serif;
  font-weight: 600;
  font-size: 17px;
}

.brand-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5ee7b0, #3b9eff);
  box-shadow: 0 0 10px rgba(94, 231, 176, 0.6);
}

.brand-dot--sm {
  width: 6px;
  height: 6px;
}

.brand-name {
  color: #f0f4ff;
}

.navbar__actions {
  display: flex;
  align-items: center;
  gap: 14px;
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
  font-family: inherit;
  transition: all 0.2s;
}

.back-btn:hover {
  color: #e8edf5;
  border-color: rgba(255, 255, 255, 0.25);
}

.profile-container {
  position: relative;
  cursor: pointer;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e2d45, #0f1929);
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-fallback {
  font-size: 13px;
  font-weight: 600;
  color: #8baacc;
}

.dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: #0f1929;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 6px;
  min-width: 160px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  z-index: 200;
}

.dropdown__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: all 0.15s;
}

.dropdown__item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}

.dropdown__item--danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

.dropdown__divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 4px 0;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}

/* HERO */
.hero {
  position: relative;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 120px 40px 80px;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
  pointer-events: none;
}

.orb--1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #3b9eff, transparent 70%);
  top: -100px;
  left: -100px;
  animation: drift 12s ease-in-out infinite alternate;
}

.orb--2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #5ee7b0, transparent 70%);
  bottom: -80px;
  right: -80px;
  animation: drift 15s ease-in-out infinite alternate-reverse;
}

@keyframes drift {
  from {
    transform: translate(0, 0);
  }

  to {
    transform: translate(40px, 30px);
  }
}

.grid-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent);
}

.hero__content {
  position: relative;
  text-align: center;
  max-width: 640px;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.9s cubic-bezier(0.22, 1, 0.36, 1);
}

.hero__content--visible {
  opacity: 1;
  transform: translateY(0);
}

.step-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: rgba(94, 231, 176, 0.8);
  margin-bottom: 20px;
  border: 1px solid rgba(94, 231, 176, 0.2);
  padding: 6px 16px;
  border-radius: 100px;
}

.hero__title {
  font-family: 'Sora', sans-serif;
  font-size: clamp(36px, 6vw, 68px);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -2px;
  color: #f0f4ff;
  margin-bottom: 20px;
}

.hero__title-em {
  font-style: italic;
  font-weight: 300;
  background: linear-gradient(135deg, #5ee7b0, #3b9eff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero__sub {
  font-size: 17px;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.65;
  font-weight: 300;
  max-width: 460px;
  margin: 0 auto;
}

/* LOADING */
.loading-screen {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.loading-content {
  position: relative;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.loader-ring {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loader-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.loader-track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.06);
  stroke-width: 4;
}

.loader-arc {
  fill: none;
  stroke: url(#grad);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 213;
  stroke-dashoffset: 60;
  animation: spin 1.4s linear infinite;
  stroke: #5ee7b0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loader-icon {
  font-size: 28px;
  z-index: 1;
}

.loading-msg {
  font-family: 'Sora', sans-serif;
  font-size: 17px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: -0.3px;
  transition: opacity 0.4s;
}

.loading-dots {
  display: flex;
  gap: 6px;
}

.loading-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #5ee7b0;
  opacity: 0.3;
  animation: pulse 1.4s ease-in-out infinite;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {

  0%,
  80%,
  100% {
    opacity: 0.2;
    transform: scale(0.8);
  }

  40% {
    opacity: 1;
    transform: scale(1);
  }
}

/* RESULTS HERO */
.results-hero {
  position: relative;
  min-height: 52vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 120px 40px 60px;
}

.results-hero__content {
  position: relative;
  text-align: center;
  max-width: 680px;
  animation: fadeUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.results-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: rgba(94, 231, 176, 0.8);
  margin-bottom: 20px;
  border: 1px solid rgba(94, 231, 176, 0.2);
  padding: 6px 16px;
  border-radius: 100px;
}

.results-title {
  font-family: 'Sora', sans-serif;
  font-size: clamp(32px, 5.5vw, 62px);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -2px;
  color: #f0f4ff;
  margin-bottom: 20px;
}

.results-title-em {
  font-style: italic;
  font-weight: 300;
  background: linear-gradient(135deg, #5ee7b0, #3b9eff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.results-sub {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.7;
  font-weight: 300;
}

/* RESULTS GRID */
.results-outer {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 24px 80px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 16px;
}

@media (max-width: 600px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }
}

.rec-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 20px;
  padding: 24px;
  animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--delay);
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  display: block;
  text-decoration: none;
}

.rec-card:hover {
  border-color: rgba(94, 231, 176, 0.5);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(94, 231, 176, 0.15);
  cursor: pointer;
}

.rec-card__top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.rec-icon {
  font-size: 24px;
  line-height: 1;
}

.rec-type {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: rgba(255, 255, 255, 0.3);
  flex: 1;
}

.rec-intensity {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 100px;
  border: 1px solid;
  letter-spacing: 0.5px;
}

.rec-name {
  font-family: 'Sora', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #f0f4ff;
  letter-spacing: -0.3px;
  margin-bottom: 10px;
}

.rec-desc {
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.6;
  margin-bottom: 16px;
}

.rec-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 14px;
}

.rec-meta__item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
}

.rec-meta__item svg {
  opacity: 0.6;
  flex-shrink: 0;
}

.rec-goals {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.rec-goal-tag {
  font-size: 11px;
  padding: 4px 12px;
  border-radius: 100px;
  background: rgba(59, 158, 255, 0.08);
  border: 1px solid rgba(59, 158, 255, 0.2);
  color: #3b9eff;
}

.results-actions {
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 40px;
}

/* FORM */
.form-outer {
  max-width: 760px;
  margin: 0 auto;
  padding: 0 24px 80px;
}

.step-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin: 48px 0 20px;
}

.step-num {
  font-family: 'Sora', sans-serif;
  font-size: 48px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.06);
  line-height: 1;
  flex-shrink: 0;
}

.step-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: rgba(94, 231, 176, 0.6);
  margin-bottom: 4px;
}

.step-title {
  font-family: 'Sora', sans-serif;
  font-size: 22px;
  font-weight: 600;
  color: #f0f4ff;
  letter-spacing: -0.5px;
}

.card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 20px;
  padding: 28px;
}

.field {
  margin-bottom: 24px;
}

.field:last-child {
  margin-bottom: 0;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 560px) {
  .field-row {
    grid-template-columns: 1fr;
  }
}

label {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 10px;
  font-weight: 500;
}

.label-hint {
  text-transform: none;
  letter-spacing: 0;
  color: rgba(255, 255, 255, 0.25);
  font-size: 11px;
}

input[type=text],
input[type=number],
textarea {
  width: 100%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.09);
  color: #e8edf5;
  border-radius: 12px;
  padding: 13px 16px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}

input[type=text]:focus,
input[type=number]:focus,
textarea:focus {
  border-color: rgba(94, 231, 176, 0.35);
  background: rgba(255, 255, 255, 0.06);
}

textarea {
  resize: vertical;
  min-height: 90px;
}

input[type=number]::-webkit-inner-spin-button {
  opacity: 0.3;
}

.level-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

@media (max-width: 560px) {
  .level-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.level-btn {
  padding: 12px 8px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  text-align: center;
}

.level-btn:hover {
  border-color: rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.7);
}

.level-btn.active {
  border-color: #5ee7b0;
  color: #5ee7b0;
  background: rgba(94, 231, 176, 0.08);
}

.toggle-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.toggle {
  padding: 8px 16px;
  border-radius: 100px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.18s;
}

.toggle:hover {
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
}

.toggle.active {
  border-color: #5ee7b0;
  color: #5ee7b0;
  background: rgba(94, 231, 176, 0.08);
}

.range-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
}

.range-edge {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  min-width: 24px;
}

.range-input {
  flex: 1;
  -webkit-appearance: none;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  outline: none;
  cursor: pointer;
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #5ee7b0;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(94, 231, 176, 0.4);
}

/* LOCATION NOTE */
.location-note {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
  padding: 14px 18px;
  background: rgba(59, 158, 255, 0.05);
  border: 1px solid rgba(59, 158, 255, 0.15);
  border-radius: 12px;
  font-size: 13px;
  color: rgba(59, 158, 255, 0.8);
}

.location-note svg {
  flex-shrink: 0;
  opacity: 0.7;
}

/* ERROR */
.form-error {
  color: #f87171;
  font-size: 13px;
  margin-top: 16px;
  text-align: center;
}

/* SUBMIT */
.submit-btn {
  width: 100%;
  margin-top: 28px;
  padding: 18px;
  border-radius: 100px;
  border: none;
  background: linear-gradient(135deg, #5ee7b0, #3b9eff);
  color: #070b12;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.25s;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 40px rgba(94, 231, 176, 0.25);
}

.submit-btn:active {
  transform: scale(0.98);
}

/* BUTTONS */
.btn {
  padding: 14px 28px;
  border-radius: 100px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  letter-spacing: 0.2px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn--primary {
  background: linear-gradient(135deg, #5ee7b0, #3b9eff);
  color: #070b12;
  box-shadow: 0 0 30px rgba(94, 231, 176, 0.2);
}

.btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 40px rgba(94, 231, 176, 0.35);
}

.btn--ghost {
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.btn--ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.85);
}

/* FOOTER */
.footer {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding: 32px 40px;
}

.footer__inner {
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.footer__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Sora', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
}

.footer__copy {
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.2);
}

.location-denied-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: rgba(249, 115, 22, 0.08);
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 10px;
  color: rgba(255,255,255,0.85);
  margin-bottom: 12px;
}
.location-denied-box svg { color: #f97316; flex-shrink: 0; }
.location-denied-box strong { display: block; font-size: 13px; margin-bottom: 2px; }
.location-denied-box p { font-size: 12px; color: rgba(255,255,255,0.5); margin: 0; }
.location-retry-btn {
  margin-left: auto;
  padding: 8px 18px;
  background: #96F550;
  color: #0a0a0a;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: opacity 0.2s;
}
.location-retry-btn:hover { opacity: 0.85; }
</style>