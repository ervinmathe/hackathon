<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import api from '../api/api'
import { useAuthStore } from '../stores/auth'

// 1. Initialize variables
const router = useRouter()
const authStore = useAuthStore()
const activeTab = ref('discover')
const searchQuery = ref('')
const selectedCategory = ref('All')
const isLoading = ref(false)
const userCoords = ref(null)
const locationError = ref(null)
const places = ref([])


setOptions({
    apiKey: "AIzaSyDuXiUzwNIlxXIlnO9Z-mJ51sdUV2lPC1Q",
    version: "weekly",
    libraries: ["places"]
})

// 3. Logic to get coordinates
const getLocationAndSearch = () => {
    isLoading.value = true
    if (!navigator.geolocation) {
        locationError.value = "Geolocation not supported"
        isLoading.value = false
        return
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            userCoords.value = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            }
            performGoogleSearch()
        },
        (error) => {
            isLoading.value = false
            locationError.value = "Location access denied."
        }
    )
}

const performGoogleSearch = async () => {
    if (!userCoords.value) return;
    isLoading.value = true;

    try {
        // 1. Import the NEW Place class and the search function
        const { Place } = await importLibrary("places");

        // 2. Define your search request
        // The 'New' API uses 'textQuery' instead of 'keyword'
        const request = {
            textQuery: searchQuery.value || 'gyms and parks',
            locationBias: {
                center: { lat: userCoords.value.lat, lng: userCoords.value.lng },
                radius: 5000 // 5km radius
            },
            maxResultCount: 15,
            // Field masking: Only ask for what you need to save money/quota
            fields: ['id', 'displayName', 'formattedAddress', 'rating', 'types', 'location']
        };

        // 3. Execute the search
        const { places: results } = await Place.searchByText(request);

        if (results && results.length > 0) {
            places.value = results.map(p => ({
                id: p.id,
                name: p.displayName, // New API uses displayName
                address: p.formattedAddress,
                rating: p.rating || 'N/A',
                type: p.types ? p.types[0] : 'activity',
                icon: '📍',
                tags: p.types ? p.types.slice(0, 3) : [],
                color: '#5ee7b0'
            }));
            locationError.value = null;
        } else {
            locationError.value = "No activities found in this area.";
        }
    } catch (err) {

        console.error("New Places API Search failed:", err);
        locationError.value = "API is warming up. Please try again in a few minutes.";
    } finally {
        isLoading.value = false;
    }
}

const fetchEvents = async () => {
    try {
        const userId = authStore.user?.id
        const res = await api.get('/calendar', {
            params: { 
                userId,
                category: 'PHYSICAL'
            }
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

const handleLogout = () => {
    authStore.logout(router)
}

onMounted(() => {
    getLocationAndSearch()
    fetchEvents()
})

const categories = ['All', 'Gym', 'Park', 'Studio', 'Pool', 'Sports']

const filteredActivities = computed(() => {
    if (selectedCategory.value === 'All') return places.value
    // Normalize string comparison for categories
    return places.value.filter(act => 
        act.type.toLowerCase().includes(selectedCategory.value.toLowerCase())
    )
})

const events = ref([
    { id: 1, title: 'Sunrise Yoga in the Park', date: 'Apr 22, 2026', time: '6:30 AM', host: 'Zen Flow', type: 'Class', attendees: 45, icon: '🧘' },
    { id: 2, title: '5K Community Run', date: 'Apr 25, 2026', time: '8:00 AM', host: 'Runners Club', type: 'Meetup', attendees: 128, icon: '🏃' },
])


</script>

<template>
    <div class="page">
        <!-- NAVBAR -->
        <nav class="navbar">
            <button class="back-btn" @click="router.replace('/home')">
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
                <button class="signout-btn-nav" @click="handleLogout">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sign Out
                </button>
                <div v-if="userCoords" class="loc-badge">
                    <span class="pulse-dot"></span> 20km Active
                </div>
                <div class="avatar"><span>{{ authStore.user?.username?.charAt(0).toUpperCase() || 'U' }}</span></div>
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
                        @click="selectedCategory = cat">
                        {{ cat }}
                    </button>
                </div>

                <div class="sidebar-footer" v-if="locationError">
                    <p class="error-msg">{{ locationError }}</p>
                    <button class="retry-btn" @click="getLocationAndSearch">Retry Location</button>
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
                            <button @click="getLocationAndSearch" class="search-action-btn">Search 20km</button>
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
                                <div class="listing-card__visual"
                                    :style="{ background: act.color + '15', borderBottom: '1px solid ' + act.color + '20' }">
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
                                <button class="view-btn">View on Google Maps</button>
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
                                <span class="event-badge" v-if="ev.location">{{ ev.location }}</span>
                            </div>
                            <h3 class="event-card__title">{{ ev.title }}</h3>
                            <div class="event-card__meta">
                                <div class="meta-row"><span>📅 {{ new Date(ev.start_time).toLocaleDateString() }}</span></div>
                                <div class="meta-row"><span>🕐 {{ new Date(ev.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span></div>
                                <div v-if="ev.location" class="meta-row"><span>📍 {{ ev.location }}</span></div>
                            </div>
                            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between;">
                                <span style="font-size: 11px; color: rgba(255,255,255,0.3); font-weight: 500;">🔥 {{ ev.interests_count || 0 }} interested</span>
                                <button 
                                    class="event-rsvp" 
                                    :class="{ 'event-rsvp--active': ev.is_interested }"
                                    @click="toggleInterest(ev)"
                                >
                                    {{ ev.is_interested ? 'Interested ✓' : 'Join Event' }}
                                </button>
                            </div>
                        </div>
                    </div>
                </template>
            </main>

            <!-- RIGHT PANEL (DESIGN 1 STYLE) -->
            <aside class="right-panel">
                <div class="rp-section">
                    <div class="rp-label">Search Settings</div>
                    <div class="settings-card">
                        <div class="setting-row">
                            <span>Radius</span>
                            <span class="highlight">20 km</span>
                        </div>
                        <div class="setting-row">
                            <span>Location</span>
                            <span class="highlight-green">Enabled</span>
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

.signout-btn-nav {
  display: flex; align-items: center; gap: 6px;
  background: none; border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.4); font-size: 12px; padding: 6px 12px;
  border-radius: 8px; cursor: pointer; margin-right: 12px;
  transition: all 0.2s;
}
.signout-btn-nav:hover { background: rgba(239, 68, 68, 0.1); color: #f87171; border-color: rgba(239, 68, 68, 0.2); }

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
    font-size: 10px;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.2);
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
    transition: all 0.2s;
}

.event-rsvp--active {
    background: #5ee7b0;
    color: #080b12;
}

/* RIGHT PANEL */
.right-panel {
    width: 260px;
    background: #0a0e18;
    border-left: 1px solid rgba(255, 255, 255, 0.05);
    padding: 24px 16px;
}

.rp-label {
    font-size: 10px;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.3);
    margin-bottom: 16px;
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

.highlight {
    color: #3b9eff;
    font-weight: 600;
}

.highlight-green {
    color: #5ee7b0;
    font-weight: 600;
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
</style>