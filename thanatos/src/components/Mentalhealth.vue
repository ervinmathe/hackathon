<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/api'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const activeTab = ref('forums')
const searchQuery = ref('')
const showSearch = ref(false)

const allChannels = ref([])
const events = ref([])
const myChannels = ref([])
const activeChannel = ref(null)
const posts = ref([])

const fetchMyChannels = async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    // 1. Fetch ALL available forums for discovery
    const allRes = await api.get('/forums')
    
    // 2. Fetch specific forums for THIS user
    const myRes = await api.get(`/forums/my?userId=${userId}`)
    const myForumIds = myRes.data.map(f => f.id)

    allChannels.value = allRes.data.map(ch => ({
      ...ch,
      icon: '🌿', // Placeholder icon
      color: '#5ee7b0', // Placeholder color
      joined: myForumIds.includes(ch.id)
    }))
  } catch (err) {
    console.error('Failed to fetch forums', err)
  }
}

const fetchEvents = async () => {
  try {
    const res = await api.get('/calendar')
    events.value = res.data.map(e => ({
      ...e,
      icon: '📅'
    }))
  } catch (err) {
    console.error('Failed to fetch events', err)
  }
}

const fetchPosts = async (forumId) => {
  try {
    const res = await api.get(`/forums/${forumId}/posts`)
    posts.value = res.data
  } catch (err) {
    console.error('Failed to fetch posts', err)
  }
}

onMounted(() => {
  fetchMyChannels()
  fetchEvents()
})

const selectChannel = (channel) => {
  activeChannel.value = channel
  fetchPosts(channel.id)
}

const searchResults = computed(() => {
  if (!searchQuery.value.trim()) return []
  return allChannels.value.filter(c =>
    c.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
  )
})

const toggleJoin = async (channel) => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    if (channel.joined) {
      // Logic for leaving
      await api.delete(`/forums/${channel.id}/leave?userId=${userId}`)
      channel.joined = false
      // If we are currently viewing this channel, we should stay but we are no longer joined
    } else {
      await api.post(`/forums/${channel.id}/join`, { userId })
      channel.joined = true
      activeChannel.value = channel
      fetchPosts(channel.id)
    }
  } catch (err) {
    console.error('Failed to toggle join', err)
  }
}
</script>

<template>
  <div class="page">
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

    <!-- NAVBAR -->
    <nav class="navbar">
      <button class="back-btn" @click="router.replace('/home')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>
      <div class="navbar__brand">
        <span class="brand-dot"></span>
        <span>Wellpath</span>
        <span class="brand-divider">/</span>
        <span class="brand-sub">Mental Health</span>
      </div>
      <div class="navbar__right">
        <div class="avatar"><span>{{ authStore.user?.username?.charAt(0).toUpperCase() || 'U' }}</span></div>
      </div>
    </nav>

    <!-- MAIN LAYOUT -->
    <div class="layout">

      <!-- LEFT SIDEBAR -->
      <aside class="sidebar">
        <div class="sidebar__tabs">
          <button :class="['tab', { 'tab--active': activeTab === 'forums' }]" @click="activeTab = 'forums'">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Forums
          </button>
          <button :class="['tab', { 'tab--active': activeTab === 'events' }]" @click="activeTab = 'events'">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Events
          </button>
        </div>

        <!-- FORUMS SIDEBAR -->
        <template v-if="activeTab === 'forums'">
          <div class="sidebar__section-label">Explore Channels</div>
          <div class="channel-list">
            <div
              v-for="ch in allChannels" :key="ch.id"
              :class="['channel-item', { 'channel-item--active': activeChannel?.id === ch.id }]"
              @click="selectChannel(ch)"
            >
              <span class="ch-icon" :style="{ background: ch.color + '18', borderColor: ch.color + '40' }">{{ ch.icon }}</span>
              <div class="ch-info">
                <span class="ch-name">{{ ch.name }}</span>
              </div>
              <div class="ch-active-dot" v-if="activeChannel?.id === ch.id"></div>
            </div>
            <div v-if="allChannels.length === 0" class="ch-empty">No channels found.</div>
          </div>

          <!-- ADD CHANNEL -->
          <div class="add-channel">
            <button class="add-btn" @click="showSearch = !showSearch">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Find channels
            </button>
            <Transition name="fade-slide">
              <div v-if="showSearch" class="search-box">
                <input
                  v-model="searchQuery"
                  placeholder="Search channels…"
                  class="search-input"
                  autofocus
                />
                <div class="search-results">
                  <div v-if="!searchQuery" class="search-hint">Type to search all channels</div>
                  <div v-else-if="searchResults.length === 0" class="search-hint">No results found</div>
                  <div
                    v-for="ch in searchResults" :key="ch.id"
                    class="search-result-item"
                    @click="selectChannel(ch)"
                  >
                    <span class="ch-icon ch-icon--sm" :style="{ background: ch.color + '18' }">{{ ch.icon }}</span>
                    <div class="ch-info">
                      <span class="ch-name">{{ ch.name }}</span>
                    </div>
                    <button
                      :class="['join-btn', { 'join-btn--leave': ch.joined }]"
                      @click.stop="toggleJoin(ch)"
                    >{{ ch.joined ? 'Joined' : '+ Join' }}</button>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </template>

        <!-- EVENTS SIDEBAR -->
        <template v-else>
          <div class="sidebar__section-label">Upcoming</div>
          <div class="event-types">
            <span class="event-tag event-tag--active">All</span>
            <span class="event-tag">Live</span>
            <span class="event-tag">Webinar</span>
            <span class="event-tag">Workshop</span>
          </div>
        </template>
      </aside>

      <!-- MAIN CONTENT -->
      <main class="content">

        <!-- FORUMS CONTENT -->
        <template v-if="activeTab === 'forums'">
          <div v-if="!activeChannel" class="empty-state">
            <span class="empty-icon">💬</span>
            <h3>Select a channel to begin</h3>
            <p>Join channels from the sidebar to see posts here.</p>
          </div>
          <template v-else>
            <div class="content__header">
              <div class="content__header-left">
                <span class="ch-icon ch-icon--lg" :style="{ background: activeChannel.color + '18', borderColor: activeChannel.color + '30' }">{{ activeChannel.icon }}</span>
                <div>
                  <h2 class="content__title">{{ activeChannel.name }}</h2>
                  <p class="content__sub">{{ activeChannel.description || 'Welcome to the community' }}</p>
                </div>
              </div>
              <button class="leave-btn" @click="toggleJoin(activeChannel)">{{ activeChannel.joined ? 'Joined' : 'Join' }}</button>
            </div>

            <!-- POST COMPOSER -->
            <div class="composer">
              <span class="composer-avatar">U</span>
              <div class="composer-input">Write something to the community…</div>
              <button class="composer-btn">Post</button>
            </div>

            <!-- POSTS -->
            <div class="posts">
              <div v-for="post in posts" :key="post.id" class="post" :style="post.is_pinned ? 'border-left: 4px solid #ffd54f; background: #fffdf0;' : ''">
                <span class="post-avatar">👤</span>
                <div class="post-body">
                  <div class="post-meta">
                    <span v-if="post.is_pinned" style="font-size: 10px; font-weight: bold; color: #fbc02d; margin-right: 8px;">📌 PINNED</span>
                    <span class="post-user">{{ post.author_name || 'Anonymous' }}</span>
                    <span class="post-time">{{ new Date(post.created_at).toLocaleDateString() }}</span>
                  </div>
                  <h4 style="margin: 4px 0;"><%= post.title %></h4>
                  <p class="post-content">{{ post.content }}</p>
                  
                  <div v-if="post.attachments && post.attachments.length > 0" class="post-attachments" style="margin-top: 10px;">
                    <div v-for="att in post.attachments" :key="att.id" style="font-size: 12px; margin-bottom: 4px;">
                      <a :href="'http://localhost:3000' + att.file_url" target="_blank">📎 {{ att.file_name }}</a>
                    </div>
                  </div>

                  <div class="post-actions">
                    <button class="post-action">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      {{ post.likes }}
                    </button>
                    <button class="post-action">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      {{ post.comments }} replies
                    </button>
                    <button class="post-action">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </template>

        <!-- EVENTS CONTENT -->
        <template v-else>
          <div class="content__header">
            <div>
              <h2 class="content__title">Community Events</h2>
              <p class="content__sub">Live sessions, webinars and workshops to support your journey</p>
            </div>
            <button class="composer-btn">+ Create event</button>
          </div>
          <div class="events-grid">
            <div v-for="ev in events" :key="ev.id" class="event-card">
              <div class="event-card__top">
                <span class="event-icon">{{ ev.icon }}</span>
                <span v-if="!ev.is_approved" style="background: #fff3e0; color: #e65100; padding: 2px 8px; border-radius: 100px; font-size: 10px; font-weight: bold;">Pending approval</span>
                <span v-else class="event-badge">Approved</span>
              </div>
              <h3 class="event-card__title">{{ ev.title }}</h3>
              <div class="event-card__meta">
                <span>🕐 {{ new Date(ev.start_time).toLocaleString('hu-HU') }}</span>
              </div>
              <div class="event-card__footer">
                <span class="event-host">by {{ ev.author_name }}</span>
              </div>
              <button class="event-rsvp">Interested</button>
            </div>
          </div>
        </template>

      </main>

      <!-- RIGHT PANEL -->
      <aside class="right-panel">
        <div class="rp-section">
          <div class="rp-label">Explore Channels</div>
          <div class="rp-channels">
            <div v-for="ch in allChannels.slice(0, 5)" :key="ch.id" class="rp-channel" @click="selectChannel(ch)">
              <span class="ch-icon ch-icon--sm" :style="{ background: ch.color + '18' }">{{ ch.icon }}</span>
              <div class="ch-info">
                <span class="ch-name">{{ ch.name }}</span>
              </div>
              <button class="join-btn" @click.stop="toggleJoin(ch)">{{ ch.joined ? 'Joined' : '+ Join' }}</button>
            </div>
          </div>
        </div>

        <div class="rp-section">
          <div class="rp-label">Next Event</div>
          <div class="rp-event-card">
            <span class="rp-event-icon">🧘</span>
            <div>
              <div class="rp-event-title">Group Meditation</div>
              <div class="rp-event-time">Apr 22 · 7:00 PM</div>
            </div>
          </div>
        </div>
      </aside>

    </div>
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
  display: flex;
  flex-direction: column;
}

/* NAVBAR */
.navbar {
  position: sticky; top: 0; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 28px;
  background: rgba(8,11,18,0.9);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.back-btn {
  display: flex; align-items: center; gap: 6px;
  background: none; border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.5); font-size: 13px;
  padding: 6px 14px; border-radius: 100px; cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.2s;
}
.back-btn:hover { color: #fff; border-color: rgba(255,255,255,0.25); }
.navbar__brand {
  display: flex; align-items: center; gap: 8px;
  font-family: 'Sora', sans-serif; font-weight: 600; font-size: 15px;
}
.brand-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: linear-gradient(135deg, #5ee7b0, #3b9eff);
  box-shadow: 0 0 8px rgba(94,231,176,0.5);
}
.brand-divider { color: rgba(255,255,255,0.2); font-weight: 300; }
.brand-sub { color: rgba(255,255,255,0.4); font-weight: 400; }
.navbar__right .avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: linear-gradient(135deg, #1e2d45, #0f1929);
  border: 1.5px solid rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: #8baacc; font-weight: 600;
}

/* LAYOUT */
.layout {
  display: flex;
  flex-direction: row;
  flex: 1;
  height: calc(100vh - 57px);
  overflow: hidden;
}

/* SIDEBAR */
.sidebar {
  width: 260px; min-width: 260px;
  background: #0a0e18;
  border-right: 1px solid rgba(255,255,255,0.05);
  display: flex; flex-direction: column;
  overflow-y: auto;
  padding: 16px 0;
}
.sidebar::-webkit-scrollbar { width: 4px; }
.sidebar::-webkit-scrollbar-track { background: transparent; }
.sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

.sidebar__tabs {
  display: flex; gap: 4px;
  padding: 0 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  margin-bottom: 16px;
}
.tab {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
  padding: 9px 10px; border-radius: 10px;
  font-size: 13px; font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  background: none; border: none; color: rgba(255,255,255,0.35);
  cursor: pointer; transition: all 0.2s;
}
.tab:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7); }
.tab--active { background: rgba(94,231,176,0.1); color: #5ee7b0; }

.sidebar__section-label {
  font-size: 10.5px; text-transform: uppercase; letter-spacing: 2px;
  color: rgba(255,255,255,0.22); padding: 0 16px 10px; font-weight: 500;
}

/* CHANNEL LIST */
.channel-list { display: flex; flex-direction: column; gap: 2px; padding: 0 8px; }
.channel-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; border-radius: 10px;
  cursor: pointer; transition: all 0.18s;
  position: relative;
}
.channel-item:hover { background: rgba(255,255,255,0.05); }
.channel-item--active { background: rgba(94,231,176,0.08); }
.ch-icon {
  width: 34px; height: 34px; border-radius: 10px;
  border: 1px solid transparent;
  display: flex; align-items: center; justify-content: center;
  font-size: 17px; flex-shrink: 0;
}
.ch-icon--sm { width: 28px; height: 28px; border-radius: 8px; font-size: 14px; }
.ch-icon--lg { width: 44px; height: 44px; border-radius: 12px; font-size: 22px; border: 1px solid transparent; }
.ch-info { flex: 1; min-width: 0; }
.ch-name { display: block; font-size: 13.5px; font-weight: 500; color: rgba(255,255,255,0.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ch-members { font-size: 11px; color: rgba(255,255,255,0.3); }
.ch-active-dot { width: 6px; height: 6px; border-radius: 50%; background: #5ee7b0; flex-shrink: 0; }
.ch-empty { font-size: 12.5px; color: rgba(255,255,255,0.25); padding: 12px 10px; }

/* ADD CHANNEL */
.add-channel { padding: 12px 8px 0; }
.add-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 9px; border-radius: 10px;
  background: rgba(94,231,176,0.07); border: 1px dashed rgba(94,231,176,0.2);
  color: rgba(94,231,176,0.7); font-size: 13px;
  font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s;
}
.add-btn:hover { background: rgba(94,231,176,0.12); color: #5ee7b0; }
.search-box { margin-top: 10px; }
.search-input {
  width: 100%; padding: 9px 12px; border-radius: 10px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  color: #e8edf5; font-size: 13px; font-family: 'DM Sans', sans-serif;
  outline: none; transition: border-color 0.2s;
}
.search-input:focus { border-color: rgba(94,231,176,0.4); }
.search-input::placeholder { color: rgba(255,255,255,0.25); }
.search-results { margin-top: 8px; display: flex; flex-direction: column; gap: 2px; }
.search-hint { font-size: 12px; color: rgba(255,255,255,0.25); text-align: center; padding: 12px 0; }
.search-result-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px; border-radius: 8px;
  transition: background 0.15s;
}
.search-result-item:hover { background: rgba(255,255,255,0.04); }
.join-btn {
  padding: 5px 12px; border-radius: 100px; font-size: 12px;
  font-family: 'DM Sans', sans-serif; cursor: pointer; font-weight: 500;
  background: rgba(94,231,176,0.12); border: 1px solid rgba(94,231,176,0.3);
  color: #5ee7b0; transition: all 0.2s; white-space: nowrap;
}
.join-btn:hover { background: rgba(94,231,176,0.22); }
.join-btn--leave { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #f87171; }
.join-btn--leave:hover { background: rgba(239,68,68,0.2); }

/* EVENTS SIDEBAR */
.event-types { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 12px; }
.event-tag {
  padding: 5px 12px; border-radius: 100px; font-size: 12px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.2s;
}
.event-tag:hover, .event-tag--active {
  background: rgba(94,231,176,0.1); border-color: rgba(94,231,176,0.3); color: #5ee7b0;
}

/* MAIN CONTENT */
.content {
  flex: 1; overflow-y: auto;
  padding: 28px 32px;
  display: flex; flex-direction: column; gap: 20px;
}
.content::-webkit-scrollbar { width: 4px; }
.content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

.content__header {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
}
.content__header-left { display: flex; align-items: center; gap: 14px; }
.content__title {
  font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 600;
  color: #f0f4ff; letter-spacing: -0.5px;
}
.content__sub { font-size: 13px; color: rgba(255,255,255,0.35); margin-top: 3px; }
.leave-btn {
  padding: 8px 18px; border-radius: 100px; font-size: 13px;
  background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
  color: #f87171; cursor: pointer; font-family: 'DM Sans', sans-serif;
  transition: all 0.2s; white-space: nowrap;
}
.leave-btn:hover { background: rgba(239,68,68,0.15); }

/* COMPOSER */
.composer {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 18px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px;
}
.composer-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: linear-gradient(135deg, #1e2d45, #0f1929);
  border: 1.5px solid rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: #8baacc; font-weight: 600; flex-shrink: 0;
}
.composer-input {
  flex: 1; font-size: 14px; color: rgba(255,255,255,0.25);
  cursor: text; padding: 4px 0;
}
.composer-btn {
  padding: 8px 20px; border-radius: 100px; font-size: 13px; font-weight: 500;
  background: linear-gradient(135deg, #5ee7b0, #3b9eff);
  border: none; color: #070b12; cursor: pointer;
  font-family: 'DM Sans', sans-serif; transition: all 0.2s;
}
.composer-btn:hover { opacity: 0.9; transform: translateY(-1px); }

/* POSTS */
.posts { display: flex; flex-direction: column; gap: 12px; }
.post {
  display: flex; gap: 14px;
  padding: 18px; background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.06); border-radius: 14px;
  transition: border-color 0.2s;
}
.post:hover { border-color: rgba(255,255,255,0.1); }
.post-avatar {
  width: 38px; height: 38px; border-radius: 50%;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; flex-shrink: 0;
}
.post-body { flex: 1; }
.post-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.post-user { font-size: 13.5px; font-weight: 500; color: rgba(255,255,255,0.8); }
.post-time { font-size: 12px; color: rgba(255,255,255,0.28); }
.post-content { font-size: 14.5px; color: rgba(255,255,255,0.65); line-height: 1.6; margin-bottom: 14px; font-weight: 300; }
.post-actions { display: flex; gap: 4px; }
.post-action {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 8px;
  background: none; border: none; color: rgba(255,255,255,0.3);
  font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif;
  transition: all 0.15s;
}
.post-action:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.65); }

/* EMPTY STATE */
.empty-state {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px;
  color: rgba(255,255,255,0.25); text-align: center;
}
.empty-icon { font-size: 48px; opacity: 0.4; }
.empty-state h3 { font-family: 'Sora', sans-serif; font-size: 18px; color: rgba(255,255,255,0.4); }
.empty-state p { font-size: 14px; }

/* EVENTS GRID */
.events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.event-card {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
  border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 10px;
  transition: all 0.25s;
}
.event-card:hover { border-color: rgba(255,255,255,0.12); transform: translateY(-3px); }
.event-card__top { display: flex; align-items: center; justify-content: space-between; }
.event-icon { font-size: 28px; }
.event-badge {
  font-size: 11px; padding: 3px 10px; border-radius: 100px;
  background: rgba(94,231,176,0.1); border: 1px solid rgba(94,231,176,0.25); color: #5ee7b0;
}
.event-card__title { font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 600; color: #f0f4ff; line-height: 1.4; }
.event-card__meta { display: flex; gap: 14px; font-size: 12px; color: rgba(255,255,255,0.35); }
.event-card__footer { display: flex; justify-content: space-between; font-size: 12px; color: rgba(255,255,255,0.3); margin-top: 2px; }
.event-host { font-style: italic; }
.event-rsvp {
  margin-top: 4px; padding: 9px; border-radius: 10px; font-size: 13px; font-weight: 500;
  background: rgba(94,231,176,0.1); border: 1px solid rgba(94,231,176,0.25);
  color: #5ee7b0; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s;
}
.event-rsvp:hover { background: rgba(94,231,176,0.2); }

/* RIGHT PANEL */
.right-panel {
  width: 240px; min-width: 240px;
  background: #0a0e18;
  border-left: 1px solid rgba(255,255,255,0.05);
  padding: 20px 16px;
  display: flex; flex-direction: column; gap: 28px;
  overflow-y: auto;
}
.rp-label {
  font-size: 10.5px; text-transform: uppercase; letter-spacing: 2px;
  color: rgba(255,255,255,0.22); margin-bottom: 12px; font-weight: 500;
}
.rp-section {}
.rp-channels { display: flex; flex-direction: column; gap: 4px; }
.rp-channel {
  display: flex; align-items: center; gap: 8px;
  padding: 8px; border-radius: 10px; transition: background 0.15s;
}
.rp-channel:hover { background: rgba(255,255,255,0.04); }
.rp-event-card {
  display: flex; align-items: center; gap: 12px;
  padding: 12px; border-radius: 12px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
}
.rp-event-icon { font-size: 24px; }
.rp-event-title { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.75); }
.rp-event-time { font-size: 11.5px; color: rgba(255,255,255,0.3); margin-top: 2px; }

/* TRANSITIONS */
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-8px); }

@media (max-width: 900px) {
  .right-panel { display: none; }
}
@media (max-width: 600px) {
  .sidebar { width: 200px; min-width: 200px; }
  .content { padding: 20px 16px; }
}
</style>