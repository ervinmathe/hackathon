<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api/api'

// ─── BACKEND URLS ──────────────────────────────────────────────────────────────
// Replace these with your actual backend endpoints
const OPTIMIZE_PROMPT_URL = 'https://millennium-shine-latter-assure.trycloudflare.com/ai/refine'   // POST: receives { userId, guidelinePrompt, userAnswers } → returns { optimizedPrompt }
const CHAT_URL            = 'https://millennium-shine-latter-assure.trycloudflare.com/ai/ask'        // POST: receives { userId, prompt, conversationHistory } → returns { reply }
// ───────────────────────────────────────────────────────────────────────────────

const GUIDELINES = ``

const GUIDELINE_PROMPT = `Role: Prompt Engineer. Task: Take the user's question and refine it
      into a detailed, academic prompt for an AI tutor. Apply these guidelines:
      RETURN ONLY THE REFINED QUESTION, NO EXPLANATION.`
const combinedGuidelines = `${GUIDELINES}\n${GUIDELINE_PROMPT}`

const router = useRouter()
const authStore = useAuthStore()
const showDropdown = ref(false)
const scrolled = ref(false)

const handleScroll = () => { scrolled.value = window.scrollY > 20 }
onMounted(() => { window.addEventListener('scroll', handleScroll) })
onBeforeUnmount(() => window.removeEventListener('scroll', handleScroll))

const closeDropdown = (e) => {
  if (!e?.target?.closest('.profile-container')) showDropdown.value = false
}
function logout() { authStore.logout(router) }

// ─── PHASE STATE ───────────────────────────────────────────────────────────────
// 'questions' | 'optimizing' | 'chat'
const phase = ref('questions')

// ─── PRE-QUESTIONS ─────────────────────────────────────────────────────────────
const currentStep = ref(0)

const questions = [
  {
    id: 'subject',
    label: 'What subject are you studying?',
    hint: 'e.g. Calculus, Organic Chemistry, Constitutional Law',
    type: 'text',
    placeholder: 'Type your subject...'
  },
  {
    id: 'topic',
    label: 'What specific topic or chapter are you working on?',
    hint: 'e.g. Integration by parts, Aromatic compounds, Freedom of speech',
    type: 'text',
    placeholder: 'Type the topic...'
  },
  {
    id: 'purpose',
    label: 'What is your main goal right now?',
    hint: 'Choose what best describes your situation',
    type: 'choice',
    options: [
      { value: 'understand', label: 'Understand a concept', icon: '💡' },
      { value: 'exam', label: 'Prepare for an exam', icon: '📝' },
      { value: 'homework', label: 'Complete an assignment', icon: '📚' },
      { value: 'review', label: 'Review & revise material', icon: '🔁' },
    ]
  },
  {
    id: 'struggle',
    label: 'What are you finding most difficult?',
    hint: 'Be specific — this helps us tailor the explanation',
    type: 'text',
    placeholder: 'e.g. I don\'t understand why the formula changes when...'
  },
  {
    id: 'level',
    label: 'How confident do you feel about this topic right now?',
    hint: 'Be honest — there\'s no wrong answer',
    type: 'choice',
    options: [
      { value: 'lost', label: 'Completely lost', icon: '😵' },
      { value: 'basic', label: 'I get the basics', icon: '🤔' },
      { value: 'moderate', label: 'Moderate understanding', icon: '🙂' },
      { value: 'solid', label: 'Solid, need fine-tuning', icon: '💪' },
    ]
  },
  {
    id: 'examDate',
    label: 'When is your exam or deadline? (optional)',
    hint: 'Helps us prioritise what to focus on',
    type: 'choice',
    options: [
      { value: 'today', label: 'Today / tomorrow', icon: '🔥' },
      { value: 'week', label: 'This week', icon: '📅' },
      { value: 'later', label: 'More than a week', icon: '🗓️' },
      { value: 'none', label: 'No deadline', icon: '✌️' },
    ]
  }
]

const answers = ref({})
const currentAnswer = ref('')
const questionError = ref('')

const currentQuestion = computed(() => questions[currentStep.value])
const isLastStep = computed(() => currentStep.value === questions.length - 1)
const progressPct = computed(() => Math.round((currentStep.value / questions.length) * 100))

function selectChoice(val) {
  answers.value[currentQuestion.value.id] = val
  questionError.value = ''
  setTimeout(() => advanceStep(), 300)
}

function advanceStep() {
  const q = currentQuestion.value
  if (q.type === 'text') {
    if (!currentAnswer.value.trim() && q.id !== 'examDate') {
      questionError.value = 'Please enter an answer before continuing.'
      return
    }
    answers.value[q.id] = currentAnswer.value.trim()
    currentAnswer.value = ''
  }
  questionError.value = ''
  if (isLastStep.value) {
    buildAndOptimizePrompt()
  } else {
    currentStep.value++
    if (questions[currentStep.value].type === 'text') {
      nextTick(() => document.getElementById('question-input')?.focus())
    }
  }
}

function goBack() {
  if (currentStep.value > 0) {
    currentStep.value--
    if (currentQuestion.value.type === 'text') {
      currentAnswer.value = answers.value[currentQuestion.value.id] || ''
    }
  }
}

// ─── PROMPT OPTIMIZATION ───────────────────────────────────────────────────────
const optimizedPrompt = ref('')
const optimizeError = ref('')

async function buildAndOptimizePrompt() {
  phase.value = 'optimizing'
  optimizeError.value = ''

  const userAnswers = {
    subject: answers.value.subject || '',
    topic: answers.value.topic || '',
    purpose: answers.value.purpose || '',
    struggle: answers.value.struggle || '',
    level: answers.value.level || '',
    examDate: answers.value.examDate || 'none'
  }

  try {
    const res = await fetch(OPTIMIZE_PROMPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: authStore.user?.id,
        question: userAnswers,   
        custom_guidelines: combinedGuidelines,
        userAnswers
      })
    })
    if (!res.ok) throw new Error('Server error')
    const data = await res.json()
    optimizedPrompt.value = data.optimizedPrompt || buildFallbackPrompt(userAnswers)
  } catch (err) {
    console.error('Optimize prompt failed:', err)
    // Fallback: build a decent prompt locally if backend is unavailable
    optimizedPrompt.value = buildFallbackPrompt(userAnswers)
  }

  phase.value = 'chat'
  nextTick(() => {
    chatInput.value = optimizedPrompt.value
    chatInputEl.value?.focus()
  })
}

function buildFallbackPrompt(a) {
  const purposeMap = { understand: 'understand', exam: 'prepare for an exam on', homework: 'complete an assignment on', review: 'review' }
  const levelMap = { lost: 'completely lost', basic: 'have a basic understanding of', moderate: 'have a moderate understanding of', solid: 'have a solid understanding of but need fine-tuning on' }
  const deadlineMap = { today: 'My exam is today or tomorrow, so this is urgent.', week: 'My exam is this week.', later: 'I have more than a week.', none: '' }
  return `I am a university student studying ${a.subject || 'a subject'}. I need to ${purposeMap[a.purpose] || 'understand'} the topic of "${a.topic || 'this topic'}". I ${levelMap[a.level] || 'am studying'} this material. The main thing I am struggling with is: ${a.struggle || 'understanding the core concepts'}. ${deadlineMap[a.examDate] || ''} Please help me step by step.`.trim()
}

// ─── CHAT ──────────────────────────────────────────────────────────────────────
const chatInput = ref('')
const chatInputEl = ref(null)
const chatMessages = ref([])
const isSending = ref(false)
const chatContainer = ref(null)

async function sendMessage() {
  const text = chatInput.value.trim()
  if (!text || isSending.value) return

  chatMessages.value.push({ role: 'user', content: text })
  chatInput.value = ''
  isSending.value = true
  scrollChat()

  try {
    const res = await fetch(CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refined_question: text    
      })
    })
    if (!res.ok) throw new Error('Server error')
    const data = await res.json()
    chatMessages.value.push({ role: 'assistant', content: data.reply })
  } catch (err) {
    console.error('Chat request failed:', err)
    chatMessages.value.push({ role: 'assistant', content: '⚠️ Something went wrong connecting to the AI. Please try again.' })
  } finally {
    isSending.value = false
    scrollChat()
  }
}

function handleChatKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

function scrollChat() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

function resetToQuestions() {
  phase.value = 'questions'
  currentStep.value = 0
  answers.value = {}
  currentAnswer.value = ''
  chatMessages.value = []
  optimizedPrompt.value = ''
  chatInput.value = ''
}
</script>

<template>
  <div class="page" @click="closeDropdown($event)">

    <!-- NAVBAR -->
    <nav :class="['navbar', { 'navbar--scrolled': scrolled }]">
      <button class="back-btn" @click="router.push('/mental-health')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>
      <div class="navbar__brand">
        <span class="brand-dot"></span>
        <span class="brand-name">Wellpath</span>
        <span class="brand-divider">/</span>
        <span class="brand-sub">Study Assistant</span>
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

    <!-- ══════════════════════ PHASE: QUESTIONS ══════════════════════ -->
    <div v-if="phase === 'questions'" class="questions-page">
      <div class="orb orb--1"></div>
      <div class="orb orb--2"></div>
      <div class="grid-overlay"></div>

      <div class="questions-inner">
        <!-- Progress bar -->
        <div class="progress-track">
          <div class="progress-bar" :style="{ width: progressPct + '%' }"></div>
        </div>
        <div class="progress-label">{{ currentStep + 1 }} / {{ questions.length }}</div>

        <!-- Question card -->
        <Transition name="slide" mode="out-in">
          <div class="q-card" :key="currentStep">
            <div class="q-number">0{{ currentStep + 1 }}</div>
            <h2 class="q-label">{{ currentQuestion.label }}</h2>
            <p class="q-hint">{{ currentQuestion.hint }}</p>

            <!-- Text input -->
            <template v-if="currentQuestion.type === 'text'">
              <input
                id="question-input"
                v-model="currentAnswer"
                type="text"
                class="q-input"
                :placeholder="currentQuestion.placeholder"
                @keyup.enter="advanceStep"
                autofocus
              />
              <p v-if="questionError" class="q-error">{{ questionError }}</p>
              <div class="q-actions">
                <button v-if="currentStep > 0" class="q-btn-back" @click="goBack">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                  Back
                </button>
                <button class="q-btn-next" @click="advanceStep">
                  {{ isLastStep ? 'Get AI help' : 'Continue' }}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </template>

            <!-- Choice grid -->
            <template v-else>
              <div class="choice-grid">
                <button
                  v-for="opt in currentQuestion.options" :key="opt.value"
                  :class="['choice-btn', { selected: answers[currentQuestion.id] === opt.value }]"
                  @click="selectChoice(opt.value)"
                >
                  <span class="choice-icon">{{ opt.icon }}</span>
                  <span class="choice-label">{{ opt.label }}</span>
                </button>
              </div>
              <div class="q-actions" style="margin-top: 24px;">
                <button v-if="currentStep > 0" class="q-btn-back" @click="goBack">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                  Back
                </button>
              </div>
            </template>
          </div>
        </Transition>
      </div>
    </div>

    <!-- ══════════════════════ PHASE: OPTIMIZING ══════════════════════ -->
    <div v-else-if="phase === 'optimizing'" class="optimizing-page">
      <div class="orb orb--1"></div>
      <div class="orb orb--2"></div>
      <div class="grid-overlay"></div>
      <div class="optimizing-inner">
        <div class="spinner-ring"></div>
        <h2 class="optimizing-title">Building your prompt...</h2>
        <p class="optimizing-sub">Our AI is analysing your answers and crafting the perfect question for you.</p>
        <div class="optimizing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>

    <!-- ══════════════════════ PHASE: CHAT ══════════════════════ -->
    <div v-else class="chat-page">
      <!-- Left sidebar -->
      <aside class="chat-sidebar">
        <div class="sidebar-section">
          <div class="sidebar-label">Session context</div>
          <div class="context-chip" v-if="answers.subject">
            <span class="chip-icon">📘</span>
            <span>{{ answers.subject }}</span>
          </div>
          <div class="context-chip" v-if="answers.topic">
            <span class="chip-icon">🎯</span>
            <span>{{ answers.topic }}</span>
          </div>
          <div class="context-chip" v-if="answers.purpose">
            <span class="chip-icon">📝</span>
            <span>{{ { understand: 'Understanding', exam: 'Exam prep', homework: 'Assignment', review: 'Revision' }[answers.purpose] }}</span>
          </div>
          <div class="context-chip" v-if="answers.level">
            <span class="chip-icon">📊</span>
            <span>{{ { lost: 'Beginner', basic: 'Basic', moderate: 'Moderate', solid: 'Advanced' }[answers.level] }}</span>
          </div>
        </div>
        <div class="sidebar-divider"></div>
        <button class="restart-btn" @click="resetToQuestions">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>
          New session
        </button>
      </aside>

      <!-- Chat main -->
      <div class="chat-main">
        <!-- Messages -->
        <div class="messages" ref="chatContainer">
          <!-- Welcome message -->
          <div v-if="chatMessages.length === 0" class="welcome-msg">
            <div class="welcome-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5ee7b0" stroke-width="1.5"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="19" cy="5" r="3" fill="#3b9eff" stroke="none"/></svg>
            </div>
            <h3>Your personalised study session is ready</h3>
            <p>Your prompt has been optimised and placed in the input below. You can edit it or send it as-is to start.</p>
          </div>

          <TransitionGroup name="msg">
            <div
              v-for="(msg, i) in chatMessages"
              :key="i"
              :class="['message', msg.role === 'user' ? 'message--user' : 'message--ai']"
            >
              <div v-if="msg.role === 'assistant'" class="msg-avatar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5ee7b0" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
              </div>
              <div class="msg-bubble">
                <p class="msg-text" style="white-space: pre-wrap;">{{ msg.content }}</p>
              </div>
            </div>
          </TransitionGroup>

          <!-- Thinking indicator -->
          <div v-if="isSending" class="message message--ai">
            <div class="msg-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5ee7b0" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            </div>
            <div class="msg-bubble thinking">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <!-- Input bar -->
        <div class="chat-input-area">
          <div class="input-hint" v-if="chatMessages.length === 0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            Your prompt was auto-generated from your answers. Edit it or send directly.
          </div>
          <div class="chat-input-wrap">
            <textarea
              ref="chatInputEl"
              v-model="chatInput"
              class="chat-textarea"
              placeholder="Ask anything about your topic..."
              rows="1"
              @keydown="handleChatKeydown"
              @input="e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px' }"
            ></textarea>
            <button class="send-btn" @click="sendMessage" :disabled="!chatInput.trim() || isSending">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <p class="input-footer">Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line</p>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.page { font-family: 'DM Sans', sans-serif; background: #080b12; color: #e8edf5; min-height: 100vh; display: flex; flex-direction: column; overflow-x: hidden; }

/* ── NAVBAR ── */
.navbar { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 18px 40px; transition: all 0.4s ease; }
.navbar--scrolled { background: rgba(8,11,18,0.88); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.06); padding: 13px 40px; }
.navbar__brand { display: flex; align-items: center; gap: 8px; font-family: 'Sora', sans-serif; font-weight: 600; font-size: 15px; }
.brand-dot { width: 8px; height: 8px; border-radius: 50%; background: linear-gradient(135deg,#5ee7b0,#3b9eff); box-shadow: 0 0 10px rgba(94,231,176,0.5); }
.brand-name { color: #f0f4ff; }
.brand-divider { color: rgba(255,255,255,0.2); margin: 0 4px; }
.brand-sub { color: rgba(255,255,255,0.4); font-size: 14px; }
.navbar__actions { display: flex; align-items: center; gap: 14px; }
.back-btn { display: flex; align-items: center; gap: 6px; background: none; border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); font-size: 13px; padding: 6px 14px; border-radius: 100px; cursor: pointer; font-family: inherit; transition: all 0.2s; }
.back-btn:hover { color: #e8edf5; border-color: rgba(255,255,255,0.25); }
.profile-container { position: relative; cursor: pointer; }
.avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg,#1e2d45,#0f1929); border: 1.5px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar-fallback { font-size: 13px; font-weight: 600; color: #8baacc; }
.dropdown { position: absolute; top: calc(100% + 10px); right: 0; background: #0f1929; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 6px; min-width: 160px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); z-index: 200; }
.dropdown__item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px; font-size: 13.5px; color: rgba(255,255,255,0.7); text-decoration: none; transition: all 0.15s; }
.dropdown__item:hover { background: rgba(255,255,255,0.06); color: #fff; }
.dropdown__item--danger:hover { background: rgba(239,68,68,0.1); color: #f87171; }
.dropdown__divider { height: 1px; background: rgba(255,255,255,0.06); margin: 4px 0; }
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px) scale(0.97); }

/* ── SHARED BACKGROUND ── */
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.13; pointer-events: none; }
.orb--1 { width: 500px; height: 500px; background: radial-gradient(circle,#3b9eff,transparent 70%); top: -80px; left: -80px; animation: drift 12s ease-in-out infinite alternate; }
.orb--2 { width: 400px; height: 400px; background: radial-gradient(circle,#5ee7b0,transparent 70%); bottom: -60px; right: -60px; animation: drift 15s ease-in-out infinite alternate-reverse; }
@keyframes drift { from { transform: translate(0,0); } to { transform: translate(40px,30px); } }
.grid-overlay { position: absolute; inset: 0; pointer-events: none; background-image: linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(ellipse 80% 80% at 50% 50%,black,transparent); }

/* ── QUESTIONS PAGE ── */
.questions-page { position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 100px 24px 60px; overflow: hidden; }
.questions-inner { position: relative; width: 100%; max-width: 620px; }
.progress-track { width: 100%; height: 3px; background: rgba(255,255,255,0.07); border-radius: 2px; margin-bottom: 10px; overflow: hidden; }
.progress-bar { height: 100%; background: linear-gradient(90deg,#5ee7b0,#3b9eff); border-radius: 2px; transition: width 0.5s cubic-bezier(0.4,0,0.2,1); }
.progress-label { font-size: 11px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 40px; }

.q-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 24px; padding: 44px 40px 36px; }
.q-number { font-family: 'Sora', sans-serif; font-size: 56px; font-weight: 700; color: rgba(255,255,255,0.05); line-height: 1; margin-bottom: 16px; }
.q-label { font-family: 'Sora', sans-serif; font-size: clamp(20px,3.5vw,28px); font-weight: 600; color: #f0f4ff; letter-spacing: -0.5px; margin-bottom: 10px; line-height: 1.3; }
.q-hint { font-size: 14px; color: rgba(255,255,255,0.35); margin-bottom: 28px; font-weight: 300; line-height: 1.5; }

.q-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: #e8edf5; border-radius: 14px; padding: 16px 20px; font-size: 16px; font-family: inherit; outline: none; transition: border-color 0.2s; }
.q-input:focus { border-color: rgba(94,231,176,0.4); background: rgba(255,255,255,0.06); }
.q-input::placeholder { color: rgba(255,255,255,0.2); }
.q-error { color: #f87171; font-size: 12.5px; margin-top: 8px; }

.q-actions { display: flex; align-items: center; gap: 12px; margin-top: 24px; }
.q-btn-back { display: flex; align-items: center; gap: 6px; background: none; border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.4); font-size: 13px; padding: 10px 18px; border-radius: 100px; cursor: pointer; font-family: inherit; transition: all 0.2s; }
.q-btn-back:hover { color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.2); }
.q-btn-next { display: flex; align-items: center; gap: 8px; margin-left: auto; background: linear-gradient(135deg,#5ee7b0,#3b9eff); color: #070b12; border: none; padding: 12px 28px; border-radius: 100px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.2s; }
.q-btn-next:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(94,231,176,0.3); }
.q-btn-next:active { transform: scale(0.97); }

.choice-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 480px) { .choice-grid { grid-template-columns: 1fr; } }
.choice-btn { display: flex; align-items: center; gap: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px 18px; cursor: pointer; font-family: inherit; text-align: left; transition: all 0.2s; }
.choice-btn:hover { border-color: rgba(255,255,255,0.18); background: rgba(255,255,255,0.06); }
.choice-btn.selected { border-color: #5ee7b0; background: rgba(94,231,176,0.08); }
.choice-icon { font-size: 22px; flex-shrink: 0; }
.choice-label { font-size: 14px; color: rgba(255,255,255,0.7); font-weight: 400; line-height: 1.3; }
.choice-btn.selected .choice-label { color: #5ee7b0; }

/* Slide transition */
.slide-enter-active, .slide-leave-active { transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
.slide-enter-from { opacity: 0; transform: translateX(40px); }
.slide-leave-to { opacity: 0; transform: translateX(-40px); }

/* ── OPTIMIZING PAGE ── */
.optimizing-page { position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.optimizing-inner { position: relative; text-align: center; max-width: 480px; padding: 24px; }
.spinner-ring { width: 64px; height: 64px; border: 2px solid rgba(255,255,255,0.07); border-top-color: #5ee7b0; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 32px; }
@keyframes spin { to { transform: rotate(360deg); } }
.optimizing-title { font-family: 'Sora', sans-serif; font-size: 26px; font-weight: 600; color: #f0f4ff; margin-bottom: 12px; letter-spacing: -0.5px; }
.optimizing-sub { font-size: 15px; color: rgba(255,255,255,0.4); line-height: 1.65; font-weight: 300; margin-bottom: 32px; }
.optimizing-dots { display: flex; gap: 8px; justify-content: center; }
.optimizing-dots span { width: 6px; height: 6px; border-radius: 50%; background: #5ee7b0; animation: blink 1.2s infinite; }
.optimizing-dots span:nth-child(2) { animation-delay: 0.2s; }
.optimizing-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink { 0%, 80%, 100% { opacity: 0.2; } 40% { opacity: 1; } }

/* ── CHAT PAGE ── */
.chat-page { display: flex; height: 100vh; padding-top: 65px; }

.chat-sidebar { width: 220px; flex-shrink: 0; background: #0a0e18; border-right: 1px solid rgba(255,255,255,0.05); padding: 28px 16px; display: flex; flex-direction: column; gap: 0; overflow-y: auto; }
.sidebar-section { margin-bottom: 20px; }
.sidebar-label { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.3); margin-bottom: 14px; }
.context-chip { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; margin-bottom: 8px; font-size: 12.5px; color: rgba(255,255,255,0.6); line-height: 1.4; }
.chip-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
.sidebar-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 8px 0 20px; }
.restart-btn { display: flex; align-items: center; gap: 8px; background: none; border: 1px solid rgba(255,255,255,0.09); color: rgba(255,255,255,0.4); font-size: 13px; padding: 10px 14px; border-radius: 10px; cursor: pointer; font-family: inherit; transition: all 0.2s; margin-top: auto; }
.restart-btn:hover { border-color: rgba(94,231,176,0.3); color: #5ee7b0; }

.chat-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

.messages { flex: 1; overflow-y: auto; padding: 32px 40px; display: flex; flex-direction: column; gap: 20px; }
.messages::-webkit-scrollbar { width: 4px; }
.messages::-webkit-scrollbar-track { background: transparent; }
.messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

.welcome-msg { text-align: center; padding: 48px 24px; max-width: 480px; margin: 0 auto; }
.welcome-icon { width: 64px; height: 64px; border-radius: 50%; background: rgba(94,231,176,0.08); border: 1px solid rgba(94,231,176,0.2); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
.welcome-msg h3 { font-family: 'Sora', sans-serif; font-size: 18px; font-weight: 600; color: #f0f4ff; margin-bottom: 10px; }
.welcome-msg p { font-size: 14px; color: rgba(255,255,255,0.4); line-height: 1.65; }

.message { display: flex; align-items: flex-start; gap: 12px; max-width: 780px; }
.message--user { align-self: flex-end; flex-direction: row-reverse; }
.message--ai { align-self: flex-start; }
.msg-avatar { width: 32px; height: 32px; flex-shrink: 0; border-radius: 50%; background: rgba(94,231,176,0.08); border: 1px solid rgba(94,231,176,0.2); display: flex; align-items: center; justify-content: center; margin-top: 2px; }
.msg-bubble { padding: 14px 18px; border-radius: 18px; max-width: 100%; line-height: 1.65; font-size: 14.5px; }
.message--user .msg-bubble { background: linear-gradient(135deg,rgba(94,231,176,0.15),rgba(59,158,255,0.15)); border: 1px solid rgba(94,231,176,0.2); border-radius: 18px 4px 18px 18px; }
.message--ai .msg-bubble { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 4px 18px 18px 18px; }
.msg-text { color: #e8edf5; }

.thinking { display: flex; align-items: center; gap: 6px; padding: 16px 20px; }
.thinking span { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.3); animation: blink 1.2s infinite; }
.thinking span:nth-child(2) { animation-delay: 0.2s; }
.thinking span:nth-child(3) { animation-delay: 0.4s; }

/* Message transitions */
.msg-enter-active { transition: all 0.3s cubic-bezier(0.22,1,0.36,1); }
.msg-enter-from { opacity: 0; transform: translateY(12px); }

/* ── CHAT INPUT ── */
.chat-input-area { border-top: 1px solid rgba(255,255,255,0.06); padding: 20px 40px 24px; background: rgba(8,11,18,0.8); backdrop-filter: blur(12px); }
.input-hint { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: rgba(94,231,176,0.5); margin-bottom: 10px; }
.chat-input-wrap { display: flex; align-items: flex-end; gap: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 10px 10px 10px 20px; transition: border-color 0.2s; }
.chat-input-wrap:focus-within { border-color: rgba(94,231,176,0.3); }
.chat-textarea { flex: 1; background: none; border: none; outline: none; color: #e8edf5; font-size: 15px; font-family: inherit; resize: none; line-height: 1.6; max-height: 160px; overflow-y: auto; }
.chat-textarea::placeholder { color: rgba(255,255,255,0.2); }
.send-btn { width: 40px; height: 40px; border-radius: 12px; border: none; background: linear-gradient(135deg,#5ee7b0,#3b9eff); color: #070b12; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: all 0.2s; }
.send-btn:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 4px 16px rgba(94,231,176,0.35); }
.send-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.input-footer { font-size: 11px; color: rgba(255,255,255,0.2); margin-top: 10px; }
kbd { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 1px 5px; font-size: 10px; font-family: inherit; }

@media (max-width: 700px) {
  .chat-sidebar { display: none; }
  .messages { padding: 20px 16px; }
  .chat-input-area { padding: 14px 16px 18px; }
}
</style>