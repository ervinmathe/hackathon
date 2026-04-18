<script>
function loadGoogleMaps() {
    return new Promise((resolve) => {
        if (window.google?.maps) return resolve()
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDuXiUzwNIlxXIlnO9Z-mJ51sdUV2lPC1Q&libraries=places&v=weekly`
        script.async = true
        script.onload = resolve
        document.head.appendChild(script)
    })
}
</script>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/api'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// UI state
const activeTab = ref('discover')
const searchQuery = ref('')
const selectedCategory = ref('All')
const isLoading = ref(false)
const userCoords = ref(null)
const locationError = ref(null)
const places = ref([])
const searchRadius = ref(20)
const showDistanceDropdown = ref(false)
const activityStartHour = ref('08:00')
const activityEndHour = ref('20:00')
const showDropdown = ref(false)

// Event modal state
const showCreateEventModal = ref(false)
const isSubmitting = ref(false)
const newEvent = ref({
    title: '',
    description: '',
    location: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: ''
})

const categories = [
    'All', 'Strength', 'Cardio', 'Sports', 'Outdoor', 'Recovery', 'Group', 'Solo'
]

const placeQueries = {
    Strength: ['gym', 'fitness center'],
    Cardio: ['running track', 'stadium', 'fitness center'],
    Sports: ['football field', 'basketball court', 'sports complex'],
    Outdoor: ['park', 'hiking area'],
    Recovery: ['spa', 'wellness center', 'yoga studio'],
    Group: ['sports club', 'recreation center'],
    Solo: ['gym', 'running track', 'park']
}

const events = ref([])

const filteredActivities = computed(() => places.value)

const timeRangeInvalid = computed(() => {
    const [startH, startM] = activityStartHour.value.split(':').map(Number)
    const [endH, endM] = activityEndHour.value.split(':').map(Number)
    return (startH * 60 + startM) >= (endH * 60 + endM)
})

const performGoogleSearch = async (filterInterval = null) => {
    if (!userCoords.value) return
    isLoading.value = true
    locationError.value = null

    try {
        await loadGoogleMaps()
        const { Place } = await google.maps.importLibrary("places")

        const lat = userCoords.value.lat
        const lng = userCoords.value.lng
        const delta = searchRadius.value / 111

        const request = {
            textQuery: searchQuery.value || 'gyms and parks',
            locationRestriction: new google.maps.LatLngBounds(
                { lat: lat - delta, lng: lng - delta },
                { lat: lat + delta, lng: lng + delta }
            ),
            maxResultCount: 20,
            fields: ['id', 'displayName', 'formattedAddress', 'rating', 'types', 'location', 'photos']
        }

        const { places: results } = await Place.searchByText(request)

        if (results && results.length > 0) {
            const mapped = await Promise.all(results.map(async (p) => {
                let photoUrl = null
                let openingHours = null

                try {
                    await p.fetchFields({ fields: ['photos', 'regularOpeningHours'] })
                    photoUrl = p.photos?.[0]?.getURI({ maxWidth: 800 }) ?? null
                    openingHours = p.regularOpeningHours ?? null
                } catch (e) {
                    console.warn('Detail fetch failed for', p.displayName, e)
                }

                openingHours = p.regularOpeningHours ?? null

                const now = new Date()
                const today = now.getDay()
                const currentMinutes = now.getHours() * 60 + now.getMinutes()

                const isOpenNow = openingHours?.periods?.some(period => {
                    if (period.open?.day !== today) return false
                    const openMin = period.open.hour * 60 + (period.open.minute ?? 0)
                    const closeMin = period.close?.hour * 60 + (period.close?.minute ?? 0)
                    return currentMinutes >= openMin && currentMinutes < closeMin
                }) ?? null

                return {
                    id: p.id,
                    name: p.displayName,
                    address: p.formattedAddress,
                    rating: p.rating || 'N/A',
                    type: p.types?.[0] || 'activity',
                    icon: '📍',
                    tags: p.types?.slice(0, 3) || [],
                    color: '#5ee7b0',
                    photo: photoUrl,
                    openingHours,
                    isOpenNow: isOpenNow ?? false
                }
            }))

            places.value = filterInterval
                ? mapped.filter(place => isOpenDuringInterval(place.openingHours, filterInterval))
                : mapped

            if (places.value.length === 0) {
                locationError.value = "No activities found open during that time."
            } else {
                places.value.sort((a, b) => {
                    const rA = a.rating !== 'N/A' ? a.rating : 0
                    const rB = b.rating !== 'N/A' ? b.rating : 0
                    return rB - rA
                })
            }
        } else {
            locationError.value = "No activities found in this area."
        }
    } catch (err) {
        console.error("Search failed:", err)
        locationError.value = "Search failed: " + err.message
    } finally {
        isLoading.value = false
    }
}

const isOpenDuringInterval = (openingHours, { day, openHour, closeHour }) => {
    if (!openingHours?.periods) return false
    return openingHours.periods.some(period => {
        const opens = period.open
        const closes = period.close
        if (!opens || !closes) return false
        if (opens.day !== day) return false
        const placeOpen = opens.hour * 60 + (opens.minute ?? 0)
        const placeClose = closes.hour * 60 + (closes.minute ?? 0)
        const wantOpen = openHour * 60
        const wantClose = closeHour * 60
        return placeOpen <= wantOpen && placeClose >= wantClose
    })
}

const getLocationAndSearch = () => {
    isLoading.value = true
    if (!navigator.geolocation) {
        locationError.value = "Geolocation not supported"
        isLoading.value = false
        return
    }
    navigator.geolocation.getCurrentPosition(
        (position) => {
            userCoords.value = { lat: position.coords.latitude, lng: position.coords.longitude }
            performGoogleSearch()
        },
        () => {
            locationError.value = 'Could not get GPS location'
            isLoading.value = false
        },
        { enableHighAccuracy: true }
    )
}


let pollingInterval = null

const fetchEvents = async () => {
    try {
        const userId = authStore.user?.id
        const res = await api.get('/calendar', {
            params: { userId, category: 'PHYSICAL' }
        })
        events.value = res.data.map(e => ({ ...e, icon: '🏃' }))
    } catch (err) {
        console.error('Failed to fetch events', err)
    }
}

const toggleInterest = async (event) => {
    try {
        const userId = authStore.user?.id
        if (!userId) return
        await api.post(`/calendar/${event.id}/interest`, { userId })
        fetchEvents()
    } catch (err) {
        console.error('Failed to toggle interest', err)
    }
}

const submitEvent = async () => {
    if (!newEvent.value.title.trim() || !newEvent.value.start_date || !newEvent.value.start_time) {
        alert('Title, Start Date and Start Time are required!')
        return
    }
    const startFull = `${newEvent.value.start_date}T${newEvent.value.start_time}`
    const endFull = (newEvent.value.end_date && newEvent.value.end_time)
        ? `${newEvent.value.end_date}T${newEvent.value.end_time}`
        : null
    if (endFull && new Date(endFull) <= new Date(startFull)) {
        alert('End time must be after start time!')
        return
    }
    if (isSubmitting.value) return
    isSubmitting.value = true
    try {
        const userId = authStore.user?.id
        if (!userId) { isSubmitting.value = false; return }
        await api.post('/calendar', {
            title: newEvent.value.title,
            description: newEvent.value.description,
            location: newEvent.value.location,
            start_time: startFull,
            end_time: endFull,
            category: 'PHYSICAL',
            created_by: userId,
            university_id: authStore.user.university_id,
            enrollment_id: authStore.user.enrollment_id
        })
        showCreateEventModal.value = false
        newEvent.value = { title: '', description: '', location: '', start_date: '', start_time: '', end_date: '', end_time: '' }
        fetchEvents()
        alert('Event submitted for approval!')
    } catch (err) {
        console.error('Failed to create event', err)
    } finally {
        isSubmitting.value = false
    }
}

// ── Lifecycle ──────────────────────────────────────────────

onMounted(async () => {
    try {
        const permission = await navigator.permissions.query({ name: 'geolocation' })
        if (permission.state === 'denied') {
            locationError.value = 'denied'
            isLoading.value = false
            return
        }
    } catch (e) { /* permissions API not supported */ }

    getLocationAndSearch()
    fetchEvents()
    pollingInterval = setInterval(fetchEvents, 10000)
})

onBeforeUnmount(() => {
    if (pollingInterval) clearInterval(pollingInterval)
})

// ── Watchers ───────────────────────────────────────────────

watch(searchQuery, (newVal) => {
    if (newVal.trim() === '') performGoogleSearch()
})

// ── Helpers ────────────────────────────────────────────────

function openOnMaps(act) {
    if (!act) return
    const query = encodeURIComponent(act.name)
    const url = `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${act.id}`
    window.open(url, '_blank')
}

function setcategoryAndQuerry(cat) {
    selectedCategory.value = cat
    searchQuery.value = cat === 'All' ? 'gyms and parks' : placeQueries[cat].join(' OR ')
    performGoogleSearch()
}

function openDistanceDroppdown() {
    showDistanceDropdown.value = !showDistanceDropdown.value
}

function setSearchRadius(radius) {
    searchRadius.value = radius
    showDistanceDropdown.value = false
    if (userCoords.value) performGoogleSearch()
}

const closeDropdown = (e) => {
    if (!e?.target?.closest('.profile-container')) showDropdown.value = false
}

const handleLogout = () => {
    authStore.logout(router)
}
</script>

<template>
    <div class="page" @click="closeDropdown($event)">
        <nav class="navbar">
            <button class="back-btn" @click="router.push('/home')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
            </button>
            <div class="navbar__brand">
                <span class="brand-dot"></span>
                <span>Wellpath</span>
                <span class="brand-divider">/</span>
                <span class="brand-sub">Physical Activity</span>
            </div>
            <div class="navbar__right">
                <div v-if="userCoords" class="loc-badge">
                    <span class="pulse-dot"></span> {{ searchRadius }}km Active
                </div>
                <div class="profile-container" @click.stop="showDropdown = !showDropdown">
                    <div class="avatar">
                        <span class="avatar-fallback">{{ authStore.user?.username?.charAt(0).toUpperCase() || 'U' }}</span>
                    </div>
                    <Transition name="dropdown">
                        <div v-if="showDropdown" class="dropdown">
                            <a href="/profile" class="dropdown__item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                                Profile
                            </a>
                            <div class="dropdown__divider"></div>
                            <a href="#" @click.prevent="handleLogout" class="dropdown__item dropdown__item--danger">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                                Sign Out
                            </a>
                        </div>
                    </Transition>
                </div>
            </div>
        </nav>

        <div class="layout">
            <aside class="sidebar">
                <div class="sidebar__tabs">
                    <button :class="['tab', { 'tab--active': activeTab === 'discover' }]" @click="activeTab = 'discover'">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        Discover
                    </button>
                    <button :class="['tab', { 'tab--active': activeTab === 'events' }]" @click="activeTab = 'events'">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        Events
                    </button>
                </div>

                <div class="sidebar__section-label">Quick Filters</div>
                <div class="category-list">
                    <button v-for="cat in categories" :key="cat"
                        :class="['cat-item', { 'cat-item--active': selectedCategory === cat }]"
                        @click="setcategoryAndQuerry(cat)">
                        {{ cat }}
                    </button>
                </div>

                <div class="sidebar-button-div">
                    <button class="sidebar-btn" @click="router.push('/physical-activity-recommendation')">AI recommendation</button>
                </div>
            </aside>

            <main class="content">
                <template v-if="activeTab === 'discover'">
                    <div class="search-hero">
                        <div class="google-search-bar">
                            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            <input v-model="searchQuery" type="text" placeholder="Search Google for gyms, parks, or activity..." class="main-search-input" @keyup.enter="getLocationAndSearch" />
                            <button @click="getLocationAndSearch" class="search-action-btn">Search {{ searchRadius }}km</button>
                        </div>
                    </div>

                    <div class="results-header">
                        <h3>{{ selectedCategory }} Results <span v-if="!isLoading">({{ filteredActivities.length }})</span></h3>
                    </div>

                    <div class="listings-grid">
                        <template v-if="isLoading">
                            <div v-for="i in 3" :key="i" class="skeleton-card"></div>
                        </template>
                        <template v-else>
                            <div v-for="act in filteredActivities" :key="act.id" class="listing-card">
                                <div v-if="act.photo" class="listing-card-photo">
                                    <img :src="act.photo" :alt="act.name" class="listing-photo" />
                                </div>
                                <div v-else class="listing-card__visual">
                                    <span class="listing-emoji">{{ act.icon }}</span>
                                </div>
                                <div class="listing-card__body">
                                    <div class="listing-meta">
                                        <span class="listing-type" :style="{ color: act.color }">{{ act.type }}</span>
                                        <span class="listing-rating">⭐ {{ act.rating }}</span>
                                    </div>
                                    <h4 class="listing-title">{{ act.name }}</h4>
                                    <p class="listing-address">{{ act.address }}</p>
                                    <div class="listing-tags">
                                        <span v-for="tag in act.tags" :key="tag" class="tag">{{ tag }}</span>
                                    </div>
                                </div>
                                <button class="view-btn" @click="openOnMaps(act)">View on Google Maps</button>
                            </div>
                        </template>

                        <div v-if="filteredActivities.length === 0 && !isLoading" class="empty-state">
                            <span class="empty-icon">📍</span>
                            <h3>No results in range</h3>
                            <p>Try searching for something else within {{ searchRadius }}km.</p>
                        </div>
                    </div>
                </template>

                <template v-else>
                    <div class="content__header">
                        <div>
                            <h2 class="content__title">Activity Events</h2>
                            <p class="content__sub">Join community meetups within your area</p>
                        </div>
                        <button class="propose-btn" @click="showCreateEventModal = true">+ Propose Event</button>
                    </div>
                    <div class="events-grid">
                        <div v-for="ev in events" :key="ev.id" class="event-card">
                            <div class="event-card__top">
                                <span class="event-icon">{{ ev.icon }}</span>
                                <span class="event-badge" v-if="ev.location">{{ ev.location }}</span>
                            </div>
                            <h3 class="event-card__title">{{ ev.title }}</h3>
                            <div class="event-card__meta">
                                <div class="meta-row"><span>📅 {{ new Date(ev.start_time).toLocaleDateString() }}</span></div>
                                <div class="meta-row"><span>🕐 {{ new Date(ev.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span></div>
                                <div v-if="ev.location" class="meta-row"><span>📍 {{ ev.location }}</span></div>
                            </div>
                            <div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:space-between;">
                                <span style="font-size:11px;color:rgba(255,255,255,0.3);font-weight:500;">🔥 {{ ev.interests_count || 0 }} interested</span>
                                <button class="event-rsvp" :class="{ 'event-rsvp--active': ev.is_interested }" @click="toggleInterest(ev)">
                                    {{ ev.is_interested ? 'Interested ✓' : 'Join Event' }}
                                </button>
                            </div>
                        </div>
                    </div>
                </template>
            </main>

            <aside class="right-panel">
                <div class="rp-section">
                    <div class="rp-label">Search Settings</div>
                    <div class="settings-card">
                        <div class="setting-row" style="position: relative;">
                            <span>Radius</span>
                            <span class="highlight" @click="openDistanceDroppdown()">{{ searchRadius }} km ▾</span>
                            <div v-if="showDistanceDropdown" class="distance-dropdown">
                                <div @click="setSearchRadius(5)">5 km</div>
                                <div @click="setSearchRadius(10)">10 km</div>
                                <div @click="setSearchRadius(20)">20 km</div>
                            </div>
                        </div>
                        <div class="setting-row">
                            <span>Location</span>
                            <span class="highlight-green">Enabled</span>
                        </div>
                    </div>
                </div>

                <div class="rp-section">
                    <div class="rp-label">Set Activity Interval</div>
                    <div class="settings-card">
                        <div class="setting-row align-center">
                            <span>Start hour</span>
                            <input type="time" v-model="activityStartHour" class="time-input" />
                        </div>
                        <div class="setting-row align-center">
                            <span>End hour</span>
                            <input type="time" v-model="activityEndHour" class="time-input" />
                        </div>
                        <div v-if="timeRangeInvalid" class="time-error-msg">
                            Start time must be before end time.
                        </div>
                    </div>
                </div>

                <div class="rp-section">
                    <div class="rp-label">Upcoming Near You</div>
                    <div v-for="ev in events.slice(0, 1)" :key="ev.id" class="rp-event-card">
                        <span class="rp-event-icon">{{ ev.icon }}</span>
                        <div>
                            <div class="rp-event-title">{{ ev.title }}</div>
                            <div class="rp-event-time">{{ new Date(ev.start_time).toLocaleDateString() }}</div>
                        </div>
                    </div>
                </div>
            </aside>
        </div>

        <!-- CREATE EVENT MODAL -->
        <div v-if="showCreateEventModal" class="modal-overlay" @click.self="showCreateEventModal = false">
            <div class="modal-card">
                <div class="modal-head">
                    <h3>Propose Physical Event</h3>
                    <button class="close-btn" @click="showCreateEventModal = false">×</button>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <label class="modal-label">Event Name</label>
                        <input v-model="newEvent.title" placeholder="e.g. Morning Run" class="modal-input" />
                    </div>
                    <div class="input-group">
                        <label class="modal-label">Location</label>
                        <input v-model="newEvent.location" placeholder="Park, Gym, etc." class="modal-input" />
                    </div>
                    <div class="input-group">
                        <label class="modal-label">Description</label>
                        <textarea v-model="newEvent.description" placeholder="Details..." class="modal-textarea"></textarea>
                    </div>
                    <div class="modal-grid">
                        <div class="input-group">
                            <label class="modal-label">Start Date</label>
                            <input v-model="newEvent.start_date" type="date" class="modal-input" />
                        </div>
                        <div class="input-group">
                            <label class="modal-label">Start Time</label>
                            <input v-model="newEvent.start_time" type="time" class="modal-input" />
                        </div>
                    </div>
                    <div class="modal-grid">
                        <div class="input-group">
                            <label class="modal-label">End Date (optional)</label>
                            <input v-model="newEvent.end_date" type="date" class="modal-input" />
                        </div>
                        <div class="input-group">
                            <label class="modal-label">End Time (optional)</label>
                            <input v-model="newEvent.end_time" type="time" class="modal-input" />
                        </div>
                    </div>
                    <button class="submit-btn" :disabled="isSubmitting" @click="submitEvent">
                        {{ isSubmitting ? 'Submitting...' : 'Submit for Approval' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Sans:wght@400;500;700&display=swap');

.page { font-family: 'DM Sans', sans-serif; background: #080b12; color: #e8edf5; min-height: 100vh; display: flex; flex-direction: column; }
.navbar { position: sticky; top: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 14px 28px; background: rgba(8,11,18,0.9); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.06); }
.back-btn { display: flex; align-items: center; gap: 6px; background: none; border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); font-size: 13px; padding: 6px 14px; border-radius: 100px; cursor: pointer; }
.navbar__brand { display: flex; align-items: center; gap: 8px; font-family: 'Sora', sans-serif; font-weight: 600; font-size: 15px; }
.brand-dot { width: 7px; height: 7px; border-radius: 50%; background: #5ee7b0; }
.brand-divider { color: rgba(255,255,255,0.2); margin: 0 4px; }
.brand-sub { color: rgba(255,255,255,0.4); }
.navbar__right { display: flex; align-items: center; gap: 12px; }
.loc-badge { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #5ee7b0; background: rgba(94,231,176,0.1); padding: 6px 12px; border-radius: 100px; }
.pulse-dot { width: 6px; height: 6px; background: #5ee7b0; border-radius: 50%; animation: pulse 2s infinite; }
.profile-container { position: relative; cursor: pointer; }
.avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg,#1e2d45,#0f1929); border: 1.5px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: border-color 0.2s; }
.avatar:hover { border-color: rgba(94,231,176,0.5); }
.avatar-fallback { font-size: 13px; font-weight: 600; color: #8baacc; }
.dropdown { position: absolute; top: calc(100% + 10px); right: 0; background: #0f1929; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 6px; min-width: 160px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); z-index: 200; }
.dropdown__item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px; font-size: 13.5px; color: rgba(255,255,255,0.7); text-decoration: none; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
.dropdown__item:hover { background: rgba(255,255,255,0.06); color: #fff; }
.dropdown__item--danger:hover { background: rgba(239,68,68,0.1); color: #f87171; }
.dropdown__divider { height: 1px; background: rgba(255,255,255,0.06); margin: 4px 0; }
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px) scale(0.97); }

.layout { display: flex; flex: 1; height: calc(100vh - 65px); overflow: hidden; }

.sidebar { width: 240px; height: 90vh; background: #0a0e18; border-right: 1px solid rgba(255,255,255,0.05); padding: 20px 0; display: flex; flex-direction: column; }
.sidebar__tabs { padding: 0 16px 20px; display: flex; gap: 8px; }
.tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border-radius: 12px; font-size: 13px; font-weight: 500; background: none; border: none; color: rgba(255,255,255,0.3); cursor: pointer; }
.tab--active { background: rgba(94,231,176,0.1); color: #5ee7b0; }
.sidebar__section-label { font-size: 12.5px; text-transform: uppercase; color: rgba(255,255,255,0.3); padding: 0 20px 12px; }
.category-list { display: flex; flex-direction: column; gap: 4px; padding: 0 12px; }
.cat-item { text-align: left; padding: 10px 16px; border-radius: 10px; background: none; border: none; color: rgba(255,255,255,0.5); font-size: 14px; cursor: pointer; }
.cat-item--active { background: rgba(59,158,255,0.08); color: #3b9eff; font-weight: 600; }
.sidebar-button-div { margin: 10px; margin-top: auto; padding-top: 16px; }
.sidebar-btn { width: 100%; padding: 12px; background: linear-gradient(135deg,#5ee7b0,#3b9eff); border: none; color: #070b12; font-weight: 700; border-radius: 10px; cursor: pointer; font-family: inherit; }
.sidebar-footer { padding: 12px 16px; }
.error-msg { color: #f87171; font-size: 12px; margin-bottom: 8px; }
.retry-btn { width: 100%; padding: 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: none; color: rgba(255,255,255,0.5); cursor: pointer; font-size: 12px; }

.content { flex: 1; overflow-y: auto; padding: 32px; }
.search-hero { margin-bottom: 32px; }
.google-search-bar { display: flex; align-items: center; gap: 12px; background: #161c27; border: 1px solid rgba(255,255,255,0.1); padding: 8px 8px 8px 20px; border-radius: 100px; }
.main-search-input { background: none; border: none; outline: none; color: #fff; flex: 1; font-size: 15px; }
.search-action-btn { background: #fff; color: #000; border: none; padding: 10px 20px; border-radius: 100px; font-weight: 700; cursor: pointer; font-size: 13px; }
.results-header { margin-bottom: 20px; }
.listings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
.listing-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; transition: all 0.3s ease; }
.listing-card:hover { border-color: rgba(255,255,255,0.15); box-shadow: 0 8px 16px rgba(94,231,176,0.1); transform: translateY(-5px); }
.listing-card-photo { position: relative; width: 100%; height: 140px; overflow: hidden; }
.listing-photo { width: 100%; height: 100%; object-fit: cover; }
.listing-card__visual { height: 140px; display: flex; align-items: center; justify-content: center; }
.listing-emoji { font-size: 44px; }
.listing-card__body { padding: 20px; flex: 1; }
.listing-meta { display: flex; justify-content: space-between; margin-bottom: 8px; }
.listing-type { font-size: 11px; text-transform: uppercase; font-weight: 700; }
.listing-title { font-family: 'Sora', sans-serif; font-size: 17px; margin-bottom: 6px; }
.listing-address { font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 15px; }
.tag { font-size: 10px; padding: 4px 8px; background: rgba(255,255,255,0.05); border-radius: 6px; color: rgba(255,255,255,0.5); margin-right: 5px; }
.view-btn { width: 100%; padding: 14px; background: none; border: none; border-top: 1px solid rgba(255,255,255,0.05); color: #5ee7b0; font-weight: 600; cursor: pointer; }
.empty-state { grid-column: 1/-1; text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.3); }
.empty-icon { font-size: 40px; display: block; margin-bottom: 16px; }

.content__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.content__title { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 600; }
.content__sub { color: rgba(255,255,255,0.4); font-size: 14px; margin-top: 4px; }
.propose-btn { padding: 10px 20px; border-radius: 100px; background: #5ee7b0; color: #070b12; border: none; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s; }
.propose-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(94,231,176,0.3); }
.events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.event-card { background: #111722; padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; gap: 10px; }
.event-card__top { display: flex; align-items: center; justify-content: space-between; }
.event-badge { font-size: 10px; background: rgba(94,231,176,0.1); color: #5ee7b0; padding: 4px 8px; border-radius: 6px; }
.event-card__title { font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 600; }
.event-card__meta { display: flex; flex-direction: column; gap: 4px; }
.meta-row { font-size: 12px; color: rgba(255,255,255,0.4); }
.event-rsvp { padding: 8px 16px; border-radius: 10px; border: 1px solid #5ee7b0; background: none; color: #5ee7b0; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 12px; }
.event-rsvp--active { background: #5ee7b0; color: #070b12; }

.right-panel { width: 260px; background: #0a0e18; border-left: 1px solid rgba(255,255,255,0.05); padding: 24px 16px; overflow-y: auto; }
.rp-section { margin-bottom: 28px; }
.rp-label { font-size: 12.5px; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 16px; }
.settings-card { background: rgba(255,255,255,0.03); padding: 16px; border-radius: 12px; }
.setting-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; }
.align-center { align-items: center; }
.highlight { color: #3b9eff; font-weight: 600; cursor: pointer; }
.highlight:hover { text-decoration: underline; }
.highlight-green { color: #5ee7b0; font-weight: 600; }
.distance-dropdown { position: absolute; top: 100%; right: 0; margin-top: 5px; background: #111722; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 4px 0; z-index: 10; min-width: 80px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; flex-direction: column; }
.distance-dropdown div { padding: 8px 12px; cursor: pointer; font-size: 13px; color: #e8edf5; text-align: right; }
.distance-dropdown div:hover { background: rgba(255,255,255,0.05); color: #5ee7b0; }
.time-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 6px; padding: 6px 10px; font-size: 13px; outline: none; font-family: inherit; }
.time-input::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.7; cursor: pointer; }
.time-error-msg { color: #f87171; font-size: 11.5px; margin-top: 8px; text-align: right; font-weight: 500; }
.rp-event-card { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 12px; }
.rp-event-icon { font-size: 20px; }
.rp-event-title { font-size: 13px; font-weight: 600; margin-bottom: 2px; }
.rp-event-time { font-size: 11px; color: rgba(255,255,255,0.35); }

.skeleton-card { height: 300px; background: rgba(255,255,255,0.02); border-radius: 20px; animation: pulse 1.5s infinite; }
@keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 0.8; } 100% { opacity: 0.5; } }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-card { background: #0f1929; border: 1px solid rgba(255,255,255,0.08); border-radius: 28px; width: 100%; max-width: 520px; padding: 32px; box-shadow: 0 40px 100px rgba(0,0,0,0.6); }
.modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.modal-head h3 { font-family: 'Sora', sans-serif; font-size: 20px; color: #f0f4ff; }
.modal-body { display: flex; flex-direction: column; gap: 16px; }
.modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.input-group { display: flex; flex-direction: column; gap: 6px; }
.modal-label { font-size: 11px; text-transform: uppercase; color: rgba(255,255,255,0.4); letter-spacing: 0.5px; }
.modal-input, .modal-textarea { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px 18px; color: #e8edf5; font-family: inherit; outline: none; transition: border-color 0.2s; color-scheme: dark; font-size: 14px; }
.modal-input:focus, .modal-textarea:focus { border-color: #5ee7b0; }
.modal-textarea { min-height: 80px; resize: vertical; }
.submit-btn { background: #5ee7b0; color: #070b12; border: none; padding: 16px; border-radius: 14px; font-weight: 700; cursor: pointer; transition: transform 0.2s; font-family: inherit; font-size: 14px; }
.submit-btn:hover { transform: translateY(-2px); }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.close-btn { background: none; border: none; color: #e8edf5; font-size: 32px; cursor: pointer; line-height: 1; }
</style>