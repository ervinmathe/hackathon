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

import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

///const center = new LatLng(userCoords.value.lat, userCoords.value.lng)
const router = useRouter()
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


const categories = [
    'All',
    'Strength',
    'Cardio',
    'Sports',
    'Outdoor',
    'Recovery',
    'Group',
    'Solo'
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

const events = ref([
    { id: 1, title: 'Sunrise Yoga in the Park', date: 'Apr 22, 2026', time: '6:30 AM', host: 'Zen Flow', type: 'Class', attendees: 45, icon: '🧘' },
    { id: 2, title: '5K Community Run', date: 'Apr 25, 2026', time: '8:00 AM', host: 'Runners Club', type: 'Meetup', attendees: 128, icon: '🏃' },
])

const filteredActivities = computed(() => places.value
)


const performGoogleSearch = async (filterInterval = null) => {
    // filterInterval example: { day: 1, openHour: 8, closeHour: 20 }
    // day: 0=Sun, 1=Mon, ..., 6=

    if (timeRangeInvalid.value) return
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
            maxResultCount: 30,
            fields: ['id', 'displayName', 'formattedAddress', 'rating', 'types', 'location', 'photos']
        }

        const { places: results } = await Place.searchByText(request)

        if (results && results.length > 0) {
            const mapped = await Promise.all(results.map(async (p) => {
                let photoUrl = null
                let openingHours = null

                try {
                    // ✅ Fetch both photos AND opening hours in one call
                    await p.fetchFields({ fields: ['photos', 'regularOpeningHours'] })
                    photoUrl = p.photos?.[0]?.getURI({ maxWidth: 800 }) ?? null
                    openingHours = p.regularOpeningHours ?? null
                } catch (e) {
                    console.warn('Detail fetch failed for', p.displayName, e)
                }

                openingHours = p.regularOpeningHours ?? null

                // Replace isOpen() with a manual check
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

            // ✅ Filter by interval if provided
            places.value = filterInterval
                ? mapped.filter(place => isOpenDuringInterval(place.openingHours, filterInterval))
                : mapped

            if (places.value.length === 0) {
                locationError.value = "No activities found open during that time."
            } else {
                places.value.sort((a, b) => {
                    const ratingA = a.rating !== 'N/A' ? a.rating : 0;
                    const ratingB = b.rating !== 'N/A' ? b.rating : 0;
                    return ratingB - ratingA;
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

// ✅ Check if a place is open during an entire interval on a given day
const isOpenDuringInterval = (openingHours, { day, openHour, closeHour }) => {
    if (!openingHours?.periods) return false  // no data → exclude

    return openingHours.periods.some(period => {
        const opens = period.open
        const closes = period.close

        if (!opens || !closes) return false
        if (opens.day !== day) return false  // wrong day

        // Convert to minutes for easy comparison
        const placeOpen = opens.hour * 60 + (opens.minute ?? 0)
        const placeClose = closes.hour * 60 + (closes.minute ?? 0)
        const wantOpen = openHour * 60
        const wantClose = closeHour * 60

        // Place must be open for the entire requested interval
        return placeOpen <= wantOpen && placeClose >= wantClose
    })
}

const getLocationAndSearch = () => {
    if (timeRangeInvalid.value) return
    isLoading.value = true
    if (!navigator.geolocation) {
        locationError.value = "Geolocation not supported"
        isLoading.value = false
        return
    }
    navigator.geolocation.getCurrentPosition(
        (position) => {
            //console.log('LAT:', position.coords.latitude)
            //console.log('LNG:', position.coords.longitude)
            //console.log('ACCURACY:', position.coords.accuracy, 'meters')
            userCoords.value = { lat: position.coords.latitude, lng: position.coords.longitude }
            performGoogleSearch()
        },
        (err) => {
            locationError.value = 'Could not get GPS location'
            isLoading.value = false
        },
        { enableHighAccuracy: true }
    )
}

onMounted(async () => {
    try {
        const permission = await navigator.permissions.query({ name: 'geolocation' })
        if (permission.state === 'denied') {
            locationError.value = 'denied'
            isLoading.value = false
            return
        }
    } catch (e) {
        // permissions API not supported, just proceed
    }
    getLocationAndSearch()

    watch(searchQuery, (newVal) => {
        if (newVal.trim() === '') {
            performGoogleSearch()

        }
    })
})


function openOnMaps(act) {
    if (!act) return
    const query = encodeURIComponent(act.name)
    const url = `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${act.id}`
    window.open(url, '_blank')
}

function setcategoryAndQuerry(cat) {
    selectedCategory.value = cat
    searchQuery.value = cat === 'All'
        ? 'gyms and parks'
        : placeQueries[cat].join(' OR ')
    performGoogleSearch()
}

function openDistanceDroppdown() {
    showDistanceDropdown.value = !showDistanceDropdown.value
}

function setSearchRadius(radius) {
    searchRadius.value = radius
    showDistanceDropdown.value = false
    if (userCoords.value) {
        performGoogleSearch()
    }
}

const showDropdown = ref(false)

const closeDropdown = (e) => {
    if (!e.target?.closest('.profile-container')) showDropdown.value = false
}

function logout() {
    localStorage.removeItem('isAuthenticated')
    router.push('/')
}

function getAISuggestion() {
    // Placeholder for AI suggestion
    console.log("AI Suggestion clicked!")
}

const timeRangeInvalid = computed(() => {
    const [startH, startM] = activityStartHour.value.split(':').map(Number)
    const [endH, endM] = activityEndHour.value.split(':').map(Number)
    const startMins = startH * 60 + startM
    const endMins = endH * 60 + endM
    return startMins >= endMins  // still blocks same time
})



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
                    <div class="avatar"><span class="avatar-fallback">U</span></div>
                    <Transition name="dropdown">
                        <div v-if="showDropdown" class="dropdown">
                            <a href="/profile" class="dropdown__item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2">
                                    <circle cx="12" cy="8" r="4" />
                                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                </svg>
                                Profile
                            </a>
                            <div class="dropdown__divider"></div>
                            <a href="#" @click.prevent="logout()" class="dropdown__item dropdown__item--danger">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2">
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

        <!-- MAIN LAYOUT -->
        <div class="layout">

            <!-- LEFT SIDEBAR (DESIGN 1) -->
            <aside class="sidebar">
                <div class="sidebar__tabs">
                    <button :class="['tab', { 'tab--active': activeTab === 'discover' }]"
                        @click="activeTab = 'discover'">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        Discover
                    </button>
                    <button :class="['tab', { 'tab--active': activeTab === 'events' }]" @click="activeTab = 'events'">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
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

                <!--<div class="sidebar-footer" v-if="locationError">
                    <p class="error-msg">{{ locationError }}</p>
                    <button class="retry-btn" @click="getLocationAndSearch">Retry Location</button>
                </div>-->
                <div class="sidebar-button-div">
                    <button class="sidebar-btn" @click="router.push('/physical-activity-recommendation')">AI recomendation</button>
                </div>
            </aside>

            <!-- MAIN CONTENT -->
            <main class="content">

                <!-- DISCOVER SECTION -->
                <template v-if="activeTab === 'discover'">
                    <div class="search-hero">
                        <div class="google-search-bar">
                            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input v-model="searchQuery" type="text"
                                placeholder="Search Google for gyms, parks, or activity..." class="main-search-input"
                                @keyup.enter="getLocationAndSearch" />
                            <button @click="getLocationAndSearch" class="search-action-btn">Search {{ searchRadius
                                }}km</button>
                        </div>
                    </div>

                    <div class="results-header">
                        <h3>{{ selectedCategory }} Results <span v-if="!isLoading">({{ filteredActivities.length
                        }})</span></h3>
                    </div>

                    <!-- LISTINGS (DESIGN 1 STYLE) -->
                    <div class="listings-grid">
                        <template v-if="isLoading">
                            <div v-for="i in 3" :key="i" class="skeleton-card"></div>
                        </template>

                        <template v-else>
                            <div v-for="act in filteredActivities" :key="act.id" class="listing-card">
                                <div v-if="act.photo != null" class="listing-card-photo">
                                    <img :src="act.photo" alt="Photo of {{ act.name }}" class="listing-photo" />
                                    <span class="listing-dist">{{ act.distance }} away</span>
                                </div>
                                <div v-if="act.photo == null" class="listing-card__visual"
                                    :style="{ borderBottom: '1px solid ' + act.color + '20' }">
                                    <span class="listing-emoji">{{ act.icon }}</span>
                                    <span class="listing-dist">{{ act.distance }} away</span>
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
                            <p>Try searching for something else within 20km.</p>
                        </div>
                    </div>
                </template>

                <!-- EVENTS SECTION (DESIGN 1 STYLE) -->
                <template v-else>
                    <div class="content__header">
                        <div>
                            <h2 class="content__title">Activity Events</h2>
                            <p class="content__sub">Join community meetups within your area</p>
                        </div>
                    </div>
                    <div class="events-grid">
                        <div v-for="ev in events" :key="ev.id" class="event-card">
                            <div class="event-card__top">
                                <span class="event-icon">{{ ev.icon }}</span>
                                <span class="event-badge">{{ ev.type }}</span>
                            </div>
                            <h3 class="event-card__title">{{ ev.title }}</h3>
                            <div class="event-card__meta">
                                <span>📅 {{ ev.date }}</span>
                                <span>🕐 {{ ev.time }}</span>
                            </div>
                            <div class="event-card__footer">
                                <span class="event-host">by {{ ev.host }}</span>
                                <span class="event-attendees">{{ ev.attendees }} going</span>
                            </div>
                            <button class="event-rsvp">Join Event</button>
                        </div>
                    </div>
                </template>
            </main>

            <!-- RIGHT PANEL (DESIGN 1 STYLE) -->
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
                            <span>Set start hour</span>
                            <input type="time" v-model="activityStartHour" class="time-input" />
                        </div>
                        <div class="setting-row align-center">
                            <span>Set end hour</span>
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
                            <div class="rp-event-time">{{ ev.date }}</div>
                        </div>
                    </div>
                </div>


            </aside>

        </div>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Sans:wght@400;500;700&display=swap');

.page {
    font-family: 'DM Sans', sans-serif;
    background: #080b12;
    color: #e8edf5;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

/* NAVBAR */
.navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
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
}

.navbar__brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Sora', sans-serif;
    font-weight: 600;
    font-size: 15px;
}

.brand-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #5ee7b0;
}

.brand-divider {
    color: rgba(255, 255, 255, 0.2);
    margin: 0 4px;
}

.brand-sub {
    color: rgba(255, 255, 255, 0.4);
}

.loc-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #5ee7b0;
    background: rgba(94, 231, 176, 0.1);
    padding: 6px 12px;
    border-radius: 100px;
    margin-right: 15px;
}

.pulse-dot {
    width: 6px;
    height: 6px;
    background: #5ee7b0;
    border-radius: 50%;
    animation: pulse 2s infinite;
}

/* LAYOUT */
.layout {
    display: flex;
    flex: 1;
    height: calc(100vh - 65px);
    overflow: hidden;
}

/* SIDEBAR */
.sidebar {
    width: 240px;
    background: #0a0e18;
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    padding: 20px 0;
    display: flex;
    flex-direction: column;
}

.sidebar__tabs {
    padding: 0 16px 20px;
    display: flex;
    gap: 8px;
}

.tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.3);
    cursor: pointer;
}

.tab--active {
    background: rgba(94, 231, 176, 0.1);
    color: #5ee7b0;
}

.sidebar__section-label {
    font-size: 12.5px;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.3);
    padding: 0 20px 12px;
}

.category-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 0 12px;
}

.cat-item {
    text-align: left;
    padding: 10px 16px;
    border-radius: 10px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
    cursor: pointer;
}

.cat-item--active {
    background: rgba(59, 158, 255, 0.08);
    color: #3b9eff;
    font-weight: 600;
}

.sidebar-button-div {
    margin: 10px ;
    margin-top: 60px;
}

.sidebar-btn {
    width: 100%;
    padding: 12px;
    background: linear-gradient(135deg ,#5ee7b0, #3b9eff);
    border: none;
    color: #fff;
    font-weight: 600;
    border-radius: 10px;
    cursor: pointer;
}

/* SEARCH HERO */
.search-hero {
    margin-bottom: 32px;
}

.google-search-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #161c27;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 8px 8px 8px 20px;
    border-radius: 100px;
}

.main-search-input {
    background: none;
    border: none;
    outline: none;
    color: #fff;
    flex: 1;
    font-size: 15px;
}

.search-action-btn {
    background: #fff;
    color: #000;
    border: none;
    padding: 10px 20px;
    border-radius: 100px;
    font-weight: 700;
    cursor: pointer;
    font-size: 13px;
}

/* LISTINGS (DESIGN 1) */
.content {
    flex: 1;
    overflow-y: auto;
    padding: 32px;
}

.listings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
}

.listing-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 20px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.listing-card:hover {
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 8px 16px rgba(94, 231, 176, 0.1);
    transform: translateY(-5px);
    transition: all 0.3s ease;
}

.listing-card-photo {
    position: relative;
    width: 100%;
    height: 140px;
    overflow: hidden;
}

.listing-photo {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.listing-card__visual {
    height: 140px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
}

.listing-emoji {
    font-size: 44px;
}

.listing-dist {
    position: absolute;
    bottom: 12px;
    font-size: 11px;
    background: rgba(0, 0, 0, 0.3);
    padding: 4px 10px;
    border-radius: 100px;
    backdrop-filter: blur(4px);
}

.listing-card__body {
    padding: 20px;
    flex: 1;
}

.listing-meta {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
}

.listing-type {
    font-size: 11px;
    text-transform: uppercase;
    font-weight: 700;
}

.listing-title {
    font-family: 'Sora', sans-serif;
    font-size: 17px;
    margin-bottom: 6px;
}

.listing-address {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.4);
    margin-bottom: 15px;
}

.tag {
    font-size: 10px;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.5);
    margin-right: 5px;
}

.view-btn {
    width: 100%;
    padding: 14px;
    background: none;
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    color: #5ee7b0;
    font-weight: 600;
    cursor: pointer;
}

/* EVENTS (DESIGN 1) */
.events-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
}

.event-card {
    background: #111722;
    padding: 20px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.event-badge {
    font-size: 10px;
    background: rgba(94, 231, 176, 0.1);
    color: #5ee7b0;
    padding: 4px 8px;
    border-radius: 6px;
}

.event-rsvp {
    margin-top: 8px;
    padding: 10px;
    border-radius: 10px;
    border: 1px solid #5ee7b0;
    background: none;
    color: #5ee7b0;
    font-weight: 600;
    cursor: pointer;
}

/* RIGHT PANEL */
.right-panel {
    width: 260px;
    background: #0a0e18;
    border-left: 1px solid rgba(255, 255, 255, 0.05);
    padding: 24px 16px;
}

.rp-section {
    margin-bottom: 32px;
}

.rp-label {
    font-size: 12.5px;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.4);
    margin-bottom: 16px;
}

.rp-event-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.03);
    padding: 12px;
    border-radius: 12px;
}

.settings-card {
    background: rgba(255, 255, 255, 0.03);
    padding: 16px;
    border-radius: 12px;
}

.setting-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    margin-bottom: 8px;
}

.align-center {
    align-items: center;
}

.time-input {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 13px;
    outline: none;
    font-family: inherit;
}

.time-input::-webkit-calendar-picker-indicator {
    filter: invert(1);
    opacity: 0.7;
    cursor: pointer;
}

.time-error-msg {
    color: #f87171;
    font-size: 11.5px;
    margin-top: 8px;
    text-align: right;
    font-weight: 500;
}

.highlight {
    color: #3b9eff;
    font-weight: 600;
}

.highlight:hover {
    text-decoration: underline;
    cursor: pointer;
}

.highlight-green {
    color: #5ee7b0;
    font-weight: 600;
}

.distance-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 5px;
    background: #111722;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 4px 0;
    z-index: 10;
    min-width: 80px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
}

.distance-dropdown div {
    padding: 8px 12px;
    cursor: pointer;
    font-size: 13px;
    color: #e8edf5;
    transition: background-color 0.2s, color 0.2s;
    text-align: right;
}

.distance-dropdown div:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #5ee7b0;
}

.skeleton-card {
    height: 300px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 20px;
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0% {
        opacity: 0.5;
    }

    50% {
        opacity: 0.8;
    }

    100% {
        opacity: 0.5;
    }
}

.navbar__right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.profile-container {
    position: relative;
    cursor: pointer;
}

.avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1e2d45, #0f1929);
    border: 1.5px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: border-color 0.2s;
}

.avatar:hover {
    border-color: rgba(94, 231, 176, 0.5);
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
    font-family: 'DM Sans', sans-serif;
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
</style>