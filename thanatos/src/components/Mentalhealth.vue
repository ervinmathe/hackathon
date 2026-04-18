<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
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
let pollingInterval = null
const activeChannel = ref(null)
const posts = ref([])
const selectedPost = ref(null)
const showPostModal = ref(false)
const showCreateModal = ref(false)
const showCreateEventModal = ref(false)
const showEditModal = ref(false)
const editingPost = ref({ title: '', description: '', content: '' })
const isSubmitting = ref(false)

// New post form
const newPost = ref({
  title: '',
  description: '',
  content: ''
})

// New event form
const newEvent = ref({
  title: '',
  description: '',
  location: '',
  start_date: '',
  start_time: '',
  end_date: '',
  end_time: ''
})

const selectedFiles = ref([])

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files)
  selectedFiles.value = [...selectedFiles.value, ...files]
}

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1)
}

const fetchMyChannels = async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return
    const allRes = await api.get('/forums')
    const myRes = await api.get(`/forums/my/${userId}`)
    const myForumIds = myRes.data.map(f => f.id)
    allChannels.value = allRes.data.map(ch => ({
      ...ch,
      icon: '🌿',
      color: '#5ee7b0',
      joined: myForumIds.includes(ch.id)
    }))
  } catch (err) {
    console.error('Failed to fetch forums', err)
  }
}

const fetchEvents = async () => {
  try {
    const userId = authStore.user?.id
    const res = await api.get('/calendar', {
      params: { 
        userId: userId,
        category: 'MENTAL'
      }
    })
    events.value = res.data.map(e => ({ ...e, icon: '📅' }))
  } catch (err) {
    console.error('Failed to fetch events', err)
  }
}

const handleLogout = () => {
  authStore.logout(router)
}

const toggleInterest = async (event) => {
  try {
    const userId = authStore.user?.id
    if (!userId) return
    // Explicit object with userId key
    await api.post(`/calendar/${event.id}/interest`, { userId: userId })
    fetchEvents()
  } catch (err) {
    console.error('Failed to toggle interest', err)
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

const selectChannel = (channel) => {
  activeChannel.value = channel
  fetchPosts(channel.id)
}

const toggleJoin = async (channel) => {
  try {
    const userId = authStore.user?.id
    if (!userId) return
    if (channel.joined) {
      await api.delete(`/forums/${channel.id}/leave?userId=${userId}`)
      channel.joined = false
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

const openPost = async (post) => {
  try {
    const res = await api.get(`/posts/${post.id}`)
    selectedPost.value = res.data
    showPostModal.value = true
  } catch (err) {
    console.error('Failed to fetch post details', err)
  }
}

const submitPost = async () => {
  if (!newPost.value.title.trim() || !newPost.value.content.trim()) {
    alert('Title and Content are required!')
    return
  }
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    const userId = authStore.user?.id
    if (!userId || !activeChannel.value) { isSubmitting.value = false; return; }
    const formData = new FormData()
    formData.append('title', newPost.value.title)
    formData.append('description', newPost.value.description)
    formData.append('content', newPost.value.content)
    formData.append('forum_id', activeChannel.value.id)
    formData.append('author_id', userId)
    selectedFiles.value.forEach(file => { formData.append('attachments', file) })
    await api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    showCreateModal.value = false
    newPost.value = { title: '', description: '', content: '' }
    selectedFiles.value = []
    fetchPosts(activeChannel.value.id)
  } catch (err) {
    console.error('Failed to create post', err)
  } finally {
    isSubmitting.value = false
  }
}

const submitEdit = async () => {
  if (!editingPost.value.title.trim() || !editingPost.value.content.trim()) {
    alert('Title and Content are required!')
    return
  }
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    await api.patch(`/posts/${editingPost.value.id}`, editingPost.value)
    showEditModal.value = false
    if (activeChannel.value) fetchPosts(activeChannel.value.id)
    if (showPostModal.value) {
      const res = await api.get(`/posts/${editingPost.value.id}`)
      selectedPost.value = res.data
    }
  } catch (err) {
    console.error('Failed to update post', err)
  } finally {
    isSubmitting.value = false
  }
}

const deletePost = async (post, e) => {
  if (e) e.stopPropagation()
  if (!confirm('Are you sure you want to delete this post?')) return
  try {
    await api.delete(`/posts/${post.id}`)
    if (activeChannel.value) fetchPosts(activeChannel.value.id)
    showPostModal.value = false
  } catch (err) {
    console.error('Failed to delete post', err)
  }
}

const openEditModal = (post, e) => {
  if (e) e.stopPropagation()
  editingPost.value = { ...post }
  showEditModal.value = true
}

const submitEvent = async () => {
  if (!newEvent.value.title.trim() || !newEvent.value.start_date || !newEvent.value.start_time) {
    alert('Title, Start Date and Start Time are required!')
    return
  }

  // Combine date and time
  const startFull = `${newEvent.value.start_date}T${newEvent.value.start_time}`
  const endFull = (newEvent.value.end_date && newEvent.value.end_time) 
    ? `${newEvent.value.end_date}T${newEvent.value.end_time}` 
    : null

  // Interval validation
  if (endFull && new Date(endFull) <= new Date(startFull)) {
    alert('End time must be after start time!')
    return
  }

  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    const userId = authStore.user?.id
    if (!userId) { isSubmitting.value = false; return; }

    await api.post('/calendar', {
      title: newEvent.value.title,
      description: newEvent.value.description,
      location: newEvent.value.location,
      start_time: startFull,
      end_time: endFull,
      category: 'MENTAL',
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

const togglePin = async (post, e) => {
  e.stopPropagation()
  try {
    await api.patch(`/posts/${post.id}/pin`)
    if (activeChannel.value) fetchPosts(activeChannel.value.id)
  } catch (err) {
    console.error('Failed to toggle pin', err)
  }
}

const canPin = computed(() => ['ADMIN', 'LESSADMIN'].includes(authStore.user?.role))
const canManagePost = (post) => {
  if (!authStore.user) return false
  return authStore.user.id === post.author_id || ['ADMIN', 'LESSADMIN'].includes(authStore.user.role)
}

const searchResults = computed(() => {
  if (!searchQuery.value.trim()) return []
  return allChannels.value.filter(c =>
    c.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
  )
})

onMounted(() => {
  fetchMyChannels()
  fetchEvents()
  pollingInterval = setInterval(fetchEvents, 10000)
})

const showDropdown = ref(false)

const closeDropdown = (e) => {
    if (!e.target.closest('.profile-container')) showDropdown.value = false
}

function logout() {
    localStorage.removeItem('isAuthenticated')
    router.push('/')
}

onBeforeUnmount(() => {
  if (pollingInterval) clearInterval(pollingInterval)
})
</script>

<template>
  <div class="page" @click="closeDropdown()">
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
        <div class="profile-container" @click.stop="showDropdown = !showDropdown">
        <div class="avatar"><span>{{ authStore.user?.username?.charAt(0).toUpperCase() || 'U' }}</span></div>
        <Transition name="dropdown">
            <div v-if="showDropdown" class="dropdown">
              <a href="/profile" class="dropdown__item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                Profile
              </a>
              <div class="dropdown__divider"></div>
              <a href="#" @click.prevent="handleLogout()" class="dropdown__item dropdown__item--danger">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign Out
              </a>
            </div>
          </Transition>
          </div>
      </div>
    </nav>

    <div class="layout">
      <!-- SIDEBAR -->
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

        <template v-if="activeTab === 'forums'">
          <div class="sidebar__section-label">Discover Channels</div>
          <div class="channel-list">
            <div v-for="ch in allChannels" :key="ch.id"
                 :class="['channel-item', { 'channel-item--active': activeChannel?.id === ch.id }]"
                 @click="selectChannel(ch)">
              <span class="ch-icon" :style="{ background: ch.color + '18', borderColor: ch.color + '30' }">{{ ch.icon }}</span>
              <div class="ch-info">
                <span class="ch-name">{{ ch.name }}</span>
                <span class="ch-status" v-if="ch.joined">Joined</span>
              </div>
            </div>
          </div>
          <div class="add-channel">
            <button class="add-btn" @click="showSearch = !showSearch">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Search All
            </button>
            <div v-if="showSearch" class="search-box">
              <input v-model="searchQuery" placeholder="Filter..." class="search-input" />
            </div>
          </div>
        </template>
        <template v-else>
          <div class="sidebar__section-label">Events</div>
          <div class="event-types">
            <span class="event-tag event-tag--active">All Sessions</span>
          </div>
        </template>
      </aside>

      <!-- CONTENT -->
      <main class="content">
        <template v-if="activeTab === 'forums'">
          <div v-if="!activeChannel" class="empty-state">
            <span class="empty-icon">🌿</span>
            <h3>Select a channel</h3>
            <p>Choose a topic from the sidebar to join the conversation.</p>
          </div>
          <template v-else>
            <div class="content__header">
              <div class="content__header-left">
                <span class="ch-icon ch-icon--lg" :style="{ background: activeChannel.color + '18' }">{{ activeChannel.icon }}</span>
                <div>
                  <h2 class="content__title">{{ activeChannel.name }}</h2>
                  <p class="content__sub">{{ activeChannel.description || 'Community discussion' }}</p>
                </div>
              </div>
              <button class="join-btn" :class="{ 'join-btn--leave': activeChannel.joined }" @click="toggleJoin(activeChannel)">
                {{ activeChannel.joined ? 'Joined' : 'Join' }}
              </button>
            </div>

            <!-- COMPOSER -->
            <div v-if="activeChannel.joined" class="composer" @click="showCreateModal = true">
              <div class="composer-avatar">{{ authStore.user?.username?.charAt(0) }}</div>
              <div class="composer-input">Write something to the community…</div>
              <button class="composer-btn">Post</button>
            </div>

            <!-- POST FEED -->
            <div class="posts-feed">
              <div v-for="post in posts" :key="post.id" class="post-card" 
                   :class="{ 'post-card--pinned': post.is_pinned }" @click="openPost(post)">
                <div class="post-card__head">
                  <div class="post-user">
                    <div class="post-avatar"><span>{{ post.author_name?.charAt(0) }}</span></div>
                    <div>
                      <div class="post-author">{{ post.author_name }}</div>
                      <div class="post-time">{{ new Date(post.created_at).toLocaleDateString() }}</div>
                    </div>
                  </div>
                  <div class="post-badges">
                    <span v-if="post.is_pinned" class="pinned-badge">📌 PINNED</span>
                    <button v-if="canPin" class="pin-action-btn" @click.stop="togglePin(post, $event)">
                      {{ post.is_pinned ? 'Unpin' : 'Pin' }}
                    </button>
                  </div>
                </div>
                <h3 class="post-title">{{ post.title }}</h3>
                <p class="post-desc">{{ post.description }}</p>
                <div class="post-footer">
                  <span class="post-stat">💬 Comments</span>
                  <span v-if="post.attachments_count" class="post-stat">📎 {{ post.attachments_count }} Files</span>
                </div>
              </div>
              <div v-if="posts.length === 0" class="empty-state">
                <p>No materials shared yet.</p>
              </div>
            </div>
          </template>
        </template>

        <template v-else>
          <div class="content__header">
            <div>
              <h2 class="content__title">Community Events</h2>
              <p class="content__sub">Workshops and sessions for you</p>
            </div>
            <button class="composer-btn" @click="showCreateEventModal = true">+ Propose Event</button>
          </div>
          <div class="events-grid">
            <div v-for="ev in events" :key="ev.id" class="event-card">
              <div class="event-card__top">
                <span class="event-icon">{{ ev.icon }}</span>
                <span class="event-badge" :class="{ 'event-badge--pending': !ev.is_approved }">
                  {{ ev.is_approved ? 'Approved' : 'Pending' }}
                </span>
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
                  {{ ev.is_interested ? 'Interested ✓' : 'Interested' }}
                </button>
              </div>
            </div>
          </div>
        </template>
      </main>

      <!-- RIGHT PANEL -->
      <aside class="right-panel">
        <div class="rp-section">
          <div class="rp-label">Featured</div>
          <div class="rp-event-card">
            <span class="rp-event-icon">🧘</span>
            <div>
              <div class="rp-event-title">Weekly Zen</div>
              <div class="rp-event-time">Tomorrow · 6:00 PM</div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- MODALS -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-card">
        <div class="modal-head"><h3>New Post</h3><button class="close-btn" @click="showCreateModal = false">×</button></div>
        <div class="modal-body">
          <input v-model="newPost.title" placeholder="Title" class="modal-input" />
          <textarea v-model="newPost.content" placeholder="What's on your mind?" class="modal-textarea"></textarea>
          <div class="file-upload-zone">
            <label class="file-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              Add Attachments
              <input type="file" multiple @change="handleFileSelect" hidden />
            </label>
            <div class="file-list">
              <div v-for="(f, i) in selectedFiles" :key="i" class="file-tag">
                {{ f.name }} <span @click="removeFile(i)">×</span>
              </div>
            </div>
          </div>
          <button class="submit-btn" :disabled="isSubmitting" @click="submitPost">
            {{ isSubmitting ? 'Posting...' : 'Share Post' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showPostModal && selectedPost" class="modal-overlay" @click.self="showPostModal = false">
      <div class="modal-card modal-card--lg">
        <div class="modal-head">
          <div class="post-user">
            <div class="post-avatar"><span>{{ selectedPost.author_name?.charAt(0) }}</span></div>
            <div>
              <div class="post-author">{{ selectedPost.author_name }}</div>
              <div class="post-time">{{ new Date(selectedPost.created_at).toLocaleString() }}</div>
            </div>
          </div>
          <div class="modal-actions">
            <button v-if="canManagePost(selectedPost)" @click="openEditModal(selectedPost)" class="action-btn">Edit</button>
            <button v-if="canManagePost(selectedPost)" @click="deletePost(selectedPost)" class="action-btn action-btn--danger">Delete</button>
            <button class="close-btn" @click="showPostModal = false">×</button>
          </div>
        </div>
        <div class="modal-body modal-body--detail">
          <h2 class="detail-title">{{ selectedPost.title }}</h2>
          <p class="detail-content">{{ selectedPost.content }}</p>
          <div v-if="selectedPost.attachments?.length" class="attachments-section">
            <label>Attachments</label>
            <div class="attachments-list">
              <a v-for="att in selectedPost.attachments" :key="att.id" :href="api.defaults.baseURL + att.file_url" target="_blank" class="att-link">
                📎 {{ att.file_name }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-card">
        <div class="modal-head"><h3>Edit Post</h3><button class="close-btn" @click="showEditModal = false">×</button></div>
        <div class="modal-body">
          <input v-model="editingPost.title" class="modal-input" />
          <textarea v-model="editingPost.content" class="modal-textarea"></textarea>
          <button class="submit-btn" :disabled="isSubmitting" @click="submitEdit">Save Changes</button>
        </div>
      </div>
    </div>

    <div v-if="showCreateEventModal" class="modal-overlay" @click.self="showCreateEventModal = false">
      <div class="modal-card">
        <div class="modal-head"><h3>Propose Event</h3><button class="close-btn" @click="showCreateEventModal = false">×</button></div>
        <div class="modal-body">
          <div class="input-group">
            <label class="modal-label">Event Name</label>
            <input v-model="newEvent.title" placeholder="e.g. Study Group" class="modal-input" />
          </div>
          <div class="input-group">
            <label class="modal-label">Location</label>
            <input v-model="newEvent.location" placeholder="Room, Online, etc." class="modal-input" />
          </div>
          <div class="input-group">
            <label class="modal-label">Description</label>
            <textarea v-model="newEvent.description" placeholder="Details..." class="modal-textarea" style="min-height: 80px;"></textarea>
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
          
          <button class="submit-btn" :disabled="isSubmitting" @click="submitEvent" style="margin-top: 10px;">
            {{ isSubmitting ? 'Submitting...' : 'Submit for Approval' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.page {
  font-family: var(--universalfontstyle);
  background: var(--universalbackgrounbcolor); color: var(--universalprimarytextcolor);
  height: 100vh; display: flex; flex-direction: column; overflow: hidden;
}

/* NAVBAR */
.navbar {
  padding: 14px 28px; background: var(--universalbackgrounbcolor);
  backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex; justify-content: space-between; align-items: center; z-index: 100;
}
.back-btn {
  display: flex; align-items: center; gap: 8px; background: none; border: 1px solid rgba(255,255,255,0.1);
  color: var(--universalsecondarytextcolor); font-size: 13px; padding: 6px 16px; border-radius: 100px; cursor: pointer;
}
.navbar__brand { display: flex; align-items: center; gap: 10px; font-family: var(--universalfontstyle); font-weight: 600; font-size: 16px; }
.brand-dot { width: 8px; height: 8px; border-radius: 50%; background: #5ee7b0; }
.brand-divider { color: rgba(255,255,255,0.1); margin: 0 4px; }
.brand-sub { color: var(--universalsecondarytextcolor); }
.role-badge { font-size: 10px; font-weight: 700; color: #3b9eff; background: rgba(59, 158, 255, 0.1); padding: 4px 10px; border-radius: 100px; margin-right: 12px; border: 1px solid rgba(59, 158, 255, 0.2); }
.signout-btn-nav {
  display: flex; align-items: center; gap: 6px;
  background: none; border: 1px solid rgba(255,255,255,0.08);
  color: var(--universalsecondarytextcolor); font-size: 12px; padding: 6px 12px;
  border-radius: 8px; cursor: pointer; margin-right: 12px;
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
  cursor: pointer; transition: border-color 0.2s;
}
.navbar__right .avatar:hover { border-color: rgba(94,231,176,0.5); }

/* LAYOUT */
.layout { display: flex; flex: 1; overflow: hidden; }

/* SIDEBAR */
.sidebar {
  width: 260px; background: var(--universalbackgrounbcolor); border-right: 1px solid rgba(255,255,255,0.05);
  display: flex; flex-direction: column; padding: 20px 0;
}
.sidebar__tabs { padding: 0 16px 20px; display: flex; gap: 8px; }
.tab {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 10px; border-radius: 12px; font-size: 13px; font-weight: 500;
  background: none; border: none; color: var(--universalsecondarytextcolor); cursor: pointer;
}
.tab--active { background: rgba(94, 231, 176, 0.1); color: #5ee7b0; }
.sidebar__section-label { font-size: 11px; text-transform: uppercase; color: var(--universalsecondarytextcolor); padding: 0 20px 12px; letter-spacing: 1px; opacity: 0.5; }

.channel-list { flex: 1; overflow-y: auto; padding: 0 12px; display: flex; flex-direction: column; gap: 4px; }
.channel-item {
  display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 12px;
  cursor: pointer; transition: all 0.2s;
}
.channel-item:hover { background: rgba(255,255,255,0.03); }
.channel-item--active { background: rgba(59, 158, 255, 0.08); }
.channel-item--active .ch-name { color: #3b9eff; font-weight: 600; }
.ch-icon {
  width: 32px; height: 32px; border-radius: 10px; border: 1px solid transparent;
  display: flex; align-items: center; justify-content: center; font-size: 16px;
}
.ch-info { flex: 1; display: flex; flex-direction: column; }
.ch-name { font-size: 14px; color: var(--universalprimarytextcolor); opacity: 0.8; }
.ch-status { font-size: 10px; color: #5ee7b0; opacity: 0.8; }

.add-channel { padding: 16px 16px 0; }
.add-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 10px; border-radius: 12px; background: rgba(255,255,255,0.03);
  border: 1px dashed rgba(255,255,255,0.1); color: var(--universalsecondarytextcolor);
  font-size: 13px; cursor: pointer;
}
.search-input {
  width: 100%; margin-top: 10px; padding: 10px; border-radius: 10px; background: #161c27;
  border: 1px solid rgba(255,255,255,0.1); color: var(--universalprimarytextcolor); outline: none; font-size: 13px;
}

/* CONTENT */
.content { flex: 1; overflow-y: auto; padding: 32px; display: flex; flex-direction: column; gap: 24px; }
.content__header { display: flex; justify-content: space-between; align-items: flex-start; }
.content__header-left { display: flex; align-items: center; gap: 18px; }
.content__title { font-family: var(--universalfontstyle); font-size: 24px; font-weight: 600; }
.content__sub { color: var(--universalsecondarytextcolor); font-size: 14px; margin-top: 4px; }

.join-btn {
  padding: 10px 24px; border-radius: 100px; background: #5ee7b0; color: var(--universalbackgrounbcolor);
  border: none; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.join-btn--leave { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; }

/* COMPOSER */
.composer {
  display: flex; align-items: center; gap: 14px; padding: 16px 20px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
  border-radius: 18px; cursor: pointer; transition: border-color 0.2s;
}
.composer:hover { border-color: rgba(255,255,255,0.15); }
.composer-avatar {
  width: 36px; height: 36px; border-radius: 50%; background: #1e2d45;
  display: flex; align-items: center; justify-content: center; font-weight: 600; color: #8baacc;
}
.composer-input { flex: 1; color: var(--universalsecondarytextcolor); font-size: 15px; }
.composer-btn {
  padding: 8px 18px; border-radius: 100px; background: var(--universalprimarytextcolor); color: var(--universalbackgrounbcolor);
  border: none; font-weight: 600; font-size: 13px; cursor: pointer;
}

/* POST FEED */
.posts-feed { display: flex; flex-direction: column; gap: 16px; }
.post-card {
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px; padding: 24px; cursor: pointer; transition: all 0.2s;
}
.post-card:hover { border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.03); }
.post-card--pinned { border-left: 4px solid #5ee7b0; background: rgba(94, 231, 176, 0.02); }

.post-card__head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.post-user { display: flex; align-items: center; gap: 12px; }
.post-avatar {
  width: 40px; height: 40px; border-radius: 12px; background: rgba(255,255,255,0.05);
  display: flex; align-items: center; justify-content: center; font-weight: 700;
}
.post-author { font-size: 15px; font-weight: 500; color: var(--universalprimarytextcolor); }
.post-time { font-size: 12px; color: var(--universalsecondarytextcolor); }

.post-title { font-family: var(--universalfontstyle); font-size: 18px; margin-bottom: 8px; }
.post-desc { color: var(--universalsecondarytextcolor); font-size: 15px; line-height: 1.6; margin-bottom: 18px; opacity: 0.8; }
.post-footer { display: flex; gap: 16px; }
.post-stat { font-size: 12px; color: var(--universalsecondarytextcolor); }

.pinned-badge { font-size: 10px; font-weight: 700; color: #5ee7b0; background: rgba(94, 231, 176, 0.1); padding: 4px 10px; border-radius: 100px; }
.pin-action-btn { background: none; border: 1px solid rgba(255,255,255,0.1); color: var(--universalprimarytextcolor); font-size: 11px; padding: 4px 12px; border-radius: 8px; cursor: pointer; margin-left: 8px; }

/* MODALS */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;
}
.modal-card {
  background: var(--universalbackgrounbcolor); border: 1px solid rgba(255,255,255,0.08); border-radius: 28px;
  width: 100%; max-width: 520px; padding: 32px; box-shadow: 0 40px 100px rgba(0,0,0,0.6);
}
.modal-card--lg { max-width: 800px; }
.modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.modal-head h3 { font-family: var(--universalfontstyle); font-size: 20px; }
.modal-body { display: flex; flex-direction: column; gap: 16px; }
.modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.modal-label { font-size: 11px; text-transform: uppercase; color: var(--universalsecondarytextcolor); margin-bottom: 6px; display: block; letter-spacing: 0.5px; opacity: 0.6; }

.modal-input, .modal-textarea {
  width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px; padding: 14px 18px; color: var(--universalprimarytextcolor); font-family: inherit; outline: none; transition: border-color 0.2s;
  color-scheme: dark; /* Crucial for visible native icons in dark mode */
}
/* Ensure the calendar/clock icon is clickable and visible */
input[type="datetime-local"]::-webkit-calendar-picker-indicator {
  cursor: pointer;
  filter: invert(1);
  opacity: 0.6;
}
input[type="datetime-local"] {
  min-height: 50px;
}
.modal-input:focus, .modal-textarea:focus { border-color: #5ee7b0; }
.modal-textarea { min-height: 150px; resize: vertical; }

.file-upload-zone { border: 1px dashed rgba(255,255,255,0.1); border-radius: 14px; padding: 16px; }
.file-label { display: flex; align-items: center; gap: 8px; color: #5ee7b0; font-size: 14px; cursor: pointer; }
.file-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.file-tag { background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 6px; font-size: 12px; display: flex; gap: 6px; }
.file-tag span { color: #f87171; cursor: pointer; }

.submit-btn {
  background: #5ee7b0; color: var(--universalbackgrounbcolor); border: none; padding: 16px; border-radius: 14px;
  font-weight: 700; cursor: pointer; transition: transform 0.2s;
}
.submit-btn:hover { transform: translateY(-2px); }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.close-btn { background: none; border: none; color: var(--universalprimarytextcolor); font-size: 32px; cursor: pointer; line-height: 1; }
.action-btn { padding: 6px 16px; border-radius: 100px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: var(--universalprimarytextcolor); font-size: 13px; cursor: pointer; }
.action-btn--danger { color: #f87171; border-color: rgba(239,68,68,0.2); }

.detail-title { font-family: var(--universalfontstyle); font-size: 28px; margin-bottom: 12px; }
.detail-content { font-size: 16px; color: var(--universalprimarytextcolor); opacity: 0.8; line-height: 1.7; white-space: pre-wrap; }
.attachments-section { margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.06); }
.attachments-section label { font-size: 11px; text-transform: uppercase; color: var(--universalsecondarytextcolor); letter-spacing: 1px; display: block; margin-bottom: 12px; opacity: 0.5; }
.att-link { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; background: rgba(255,255,255,0.04); border-radius: 10px; color: #5ee7b0; text-decoration: none; font-size: 14px; }

/* EVENTS GRID */
.events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.event-card {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 20px;
  padding: 24px; display: flex; flex-direction: column; gap: 12px;
}
.event-badge { font-size: 11px; padding: 4px 12px; border-radius: 100px; background: rgba(94, 231, 176, 0.1); color: #5ee7b0; font-weight: 600; }
.event-badge--pending { background: rgba(255, 167, 38, 0.1); color: #ffa726; }
.event-card__title { font-family: var(--universalfontstyle); font-size: 17px; }
.event-card__meta { font-size: 13px; color: var(--universalsecondarytextcolor); display: flex; flex-direction: column; gap: 4px; }
.event-rsvp { margin-top: 8px; padding: 12px; border-radius: 12px; border: 1px solid #5ee7b0; color: #5ee7b0; background: none; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.event-rsvp--active { background: #5ee7b0; color: var(--universalbackgrounbcolor); }

/* RIGHT PANEL */
.right-panel { width: 280px; background: var(--universalbackgrounbcolor); border-left: 1px solid rgba(255,255,255,0.05); padding: 32px 20px; }
.rp-label { font-size: 11px; text-transform: uppercase; color: var(--universalsecondarytextcolor); margin-bottom: 16px; opacity: 0.5; }
.rp-event-card { display: flex; gap: 14px; align-items: center; background: rgba(255,255,255,0.02); padding: 16px; border-radius: 16px; }
.rp-event-icon { font-size: 24px; }
.rp-event-title { font-size: 14px; font-weight: 500; }
.rp-event-time { font-size: 12px; color: var(--universalsecondarytextcolor); margin-top: 2px; }

.empty-state { text-align: center; padding: 60px 20px; color: var(--universalsecondarytextcolor); }
.empty-icon { font-size: 40px; margin-bottom: 16px; display: block; opacity: 0.3; }

@media (max-width: 1000px) { .right-panel { display: none; } }
@media (max-width: 900px) {
  .right-panel { display: none; }
}
@media (max-width: 600px) {
  .sidebar { width: 200px; min-width: 200px; }
  .content { padding: 20px 16px; }
}

.profile-container { position: relative; cursor: pointer; }
.dropdown {
  position: absolute; top: calc(100% + 10px); right: 0;
  background: #0f1929;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 6px;
  min-width: 160px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  z-index: 200;
}
.dropdown__item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; border-radius: 8px;
  font-size: 13.5px; color: rgba(255,255,255,0.7);
  text-decoration: none; transition: all 0.15s;
  font-family: 'DM Sans', sans-serif;
}
.dropdown__item:hover { background: rgba(255,255,255,0.06); color: #fff; }
.dropdown__item--danger:hover { background: rgba(239,68,68,0.1); color: #f87171; }
.dropdown__divider { height: 1px; background: rgba(255,255,255,0.06); margin: 4px 0; }
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px) scale(0.97); }
</style>
