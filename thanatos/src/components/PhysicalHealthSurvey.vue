<template>
  <div class="page">

    <div class="hero__bg">
      <div class="orb orb--1"></div>
      <div class="orb orb--2"></div>
      <div class="grid-overlay"></div>
    </div>

    <div class="top-label">Physical Health Kérdőív</div>

    <!-- EREDMÉNY -->
    <div v-if="finished" class="survey-card result-card">
      <div class="brand-dot"></div>
      <h2>✓ Válaszod sikeresen elmentettük.</h2>
    </div>

    <!-- KÉRDŐÍV -->
    <div v-else class="survey-card">

      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
      </div>
      <p class="progress-label">{{ currentIndex + 1 }} / {{ flow.length }}</p>

      <div class="brand-dot"></div>

      <transition name="fade" mode="out-in">
        <div :key="currentQuestionId" class="question-block">

          <h2 class="question-text">{{ currentQuestion.text }}</h2>

          <div class="options">
            <button
              v-for="opt in currentQuestion.options"
              :key="opt.value"
              class="option-btn"
              :class="{ selected: answers[currentQuestionId] === opt.value }"
              @click="answers[currentQuestionId] = opt.value"
            >
              <span class="option-letter">{{ opt.label }}</span>
              <span class="option-text">{{ opt.text }}</span>
              <span class="option-check">
                <svg v-if="answers[currentQuestionId] === opt.value" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
            </button>
          </div>

        </div>
      </transition>

      <div class="nav-buttons">
        <button class="btn-back" :disabled="currentIndex === 0" @click="goBack">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>
        <button class="btn-continue" :disabled="!answers[currentQuestionId]" @click="goNext">
          {{ currentIndex === flow.length - 1 ? 'Befejezés' : 'Continue' }}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// --- ÖSSZES KÉRDÉS ---
const questions = {
  q1: {
    id: 'q1',
    text: 'Sportolsz jelenleg?',
    options: [
      { label: 'A', value: 'igen', text: 'Igen' },
      { label: 'B', value: 'nem',  text: 'Nem'  },
    ],
  },
  q2: {
    id: 'q2',
    text: 'Szeretnél sportolni?',
    options: [
      { label: 'A', value: 'igen', text: 'Igen' },
      { label: 'B', value: 'nem',  text: 'Nem'  },
    ],
  },
  q3: {
    id: 'q3',
    text: 'A mindennapi teendőid (pl. házimunka, kertészkedés, lépcsőzés) során úgy érzed, hogy kellően megmozgatod magad?',
    options: [
      { label: 'A', value: 'igen', text: 'Igen' },
      { label: 'B', value: 'nem',  text: 'Nem'  },
    ],
  },
  q4: {
    id: 'q4',
    text: 'Van olyan testi tüneted (pl. fájdalom, fáradékonyság, légszomj), ami visszatart a fizikai aktivitástól?',
    options: [
      { label: 'A', value: 'igen', text: 'Igen' },
      { label: 'B', value: 'nem',  text: 'Nem'  },
    ],
  },
  q5: {
    id: 'q5',
    text: 'Örülnél annak, ha a munkahelyeden / iskoládban lenne mozgásra ösztönző program?',
    options: [
      { label: 'A', value: 'igen', text: 'Igen' },
      { label: 'B', value: 'nem',  text: 'Nem'  },
    ],
  },
  q6: {
    id: 'q6',
    text: 'Tudnál heti 2–3 alkalommal 20–30 percet szánni egy otthoni, egyszerű mozgásformára (pl. séta, YouTube-torna)?',
    options: [
      { label: 'A', value: 'igen', text: 'Igen' },
      { label: 'B', value: 'nem',  text: 'Nem'  },
    ],
  },
  q7: {
    id: 'q7',
    text: 'Úgy érzed, hogy a környezeted (járdák, parkok, edzőtermek hiánya) akadályoz a sportolásban?',
    options: [
      { label: 'A', value: 'igen', text: 'Igen' },
      { label: 'B', value: 'nem',  text: 'Nem'  },
    ],
  },
  q8: {
    id: 'q8',
    text: 'Szerinted segítene, ha lenne egy „edzőpartner", aki motiválna?',
    options: [
      { label: 'A', value: 'igen', text: 'Igen' },
      { label: 'B', value: 'nem',  text: 'Nem'  },
    ],
  },
}

const answers = ref({})
const currentIndex = ref(0)
const finished = ref(false)

/*
  ELÁGAZÁSI LOGIKA:
  Sportol (q1=igen) → q3 → q4 → q5 → vége
  Nem sportol (q1=nem) → q2 → q4 → q6 → q7 → q8 → vége
*/
const flow = computed(() => {
  const q1 = answers.value['q1']
  if (!q1) return ['q1']
  if (q1 === 'igen') return ['q1', 'q3', 'q4', 'q5']
  return ['q1', 'q2', 'q4', 'q6', 'q7', 'q8']
})

const currentQuestionId = computed(() => flow.value[currentIndex.value])
const currentQuestion   = computed(() => questions[currentQuestionId.value])

const progressPct = computed(() =>
  (currentIndex.value / flow.value.length) * 100
)

// Ha q1 változik, töröljük a többi választ (hogy ne maradjon szemét)
watch(() => answers.value['q1'], () => {
  const keep = { q1: answers.value['q1'] }
  answers.value = keep
  if (currentIndex.value > 0) currentIndex.value = 1
})

function goNext() {
  if (!answers.value[currentQuestionId.value]) return
  if (currentIndex.value < flow.value.length - 1) {
    currentIndex.value++
  } else {
    // TODO: itt hívd meg az API-t az exportData értékével
    console.log('Mentendő adatok:', exportData.value)
    finished.value = true
  }
}

function goBack() {
  if (currentIndex.value > 0) currentIndex.value--
}

/*
  TAG LOGIKA:
  q1=igen → aktiv
  q1=nem, q2=igen → inaktiv_motivalt
  q1=nem, q2=nem  → inaktiv_demotivalt
  q4=igen → testi_akadaly
  q3=igen → napi_mozgas_elegendo
  q6=igen → otthoni_mozgasra_kesz
  q7=igen → kornyezeti_akadaly
  q8=igen → edzopartner_igeny
*/
const exportData = computed(() => {
  const a = answers.value
  const tags = []

  if (a.q1 === 'igen') tags.push('aktiv')
  if (a.q1 === 'nem' && a.q2 === 'igen') tags.push('inaktiv_motivalt')
  if (a.q1 === 'nem' && a.q2 === 'nem')  tags.push('inaktiv_demotivalt')
  if (a.q3 === 'igen') tags.push('napi_mozgas_elegendo')
  if (a.q4 === 'igen') tags.push('testi_akadaly')
  if (a.q5 === 'igen') tags.push('program_igeny')
  if (a.q6 === 'igen') tags.push('otthoni_mozgasra_kesz')
  if (a.q7 === 'igen') tags.push('kornyezeti_akadaly')
  if (a.q8 === 'igen') tags.push('edzopartner_igeny')

  return {
    answers: a,
    tags,
  }
})
</script>

<style scoped>
.page {
  font-family: 'DM Sans', sans-serif;
  background: #080b12;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #e8edf5;
  position: relative;
  overflow: hidden;
  padding: 40px 16px;
  box-sizing: border-box;
}

.top-label {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
  white-space: nowrap;
}

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
  width: 600px; height: 600px;
  background: radial-gradient(circle, #3b9eff, transparent 70%);
  top: -100px; left: -100px;
}

.orb--2 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, #5ee7b0, transparent 70%);
  bottom: -80px; right: -80px;
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent);
}

.brand-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5ee7b0, #3b9eff);
  box-shadow: 0 0 10px rgba(94, 231, 176, 0.6);
  margin-bottom: 20px;
}

.survey-card {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  padding: 40px;
  border-radius: 28px;
  width: 100%;
  max-width: 540px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  box-sizing: border-box;
}

.progress-bar {
  width: 100%;
  height: 3px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 100px;
  margin-bottom: 8px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #5ee7b0, #3b9eff);
  border-radius: 100px;
  transition: width 0.4s ease;
}

.progress-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  margin: 0 0 24px;
  text-align: right;
}

.question-text {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 28px;
  line-height: 1.45;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 8px;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 16px 18px;
  color: #e8edf5;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.option-btn:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
}

.option-btn.selected {
  border-color: #5ee7b0;
  background: rgba(94, 231, 176, 0.07);
  box-shadow: 0 0 0 3px rgba(94, 231, 176, 0.08);
}

.option-letter {
  width: 28px; height: 28px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.07);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

.selected .option-letter {
  background: rgba(94, 231, 176, 0.15);
  color: #5ee7b0;
}

.option-text { flex: 1; font-weight: 500; }

.option-check {
  width: 20px; height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5ee7b0;
  flex-shrink: 0;
}

.nav-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  padding: 8px 16px;
  border-radius: 100px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.2s;
}

.btn-back:hover:not(:disabled) {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.25);
}

.btn-back:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.btn-continue {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #5ee7b0, #3b9eff);
  color: #080b12;
  border: none;
  padding: 10px 22px;
  border-radius: 100px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: transform 0.2s, opacity 0.2s;
}

.btn-continue:hover:not(:disabled) {
  transform: translateY(-1px);
  opacity: 0.9;
}

.btn-continue:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
}

.result-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 40px;
}

.result-card h2 {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
  color: #e8edf5;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from { opacity: 0; transform: translateX(16px); }
.fade-leave-to   { opacity: 0; transform: translateX(-16px); }

@media (max-width: 560px) {
  .survey-card { padding: 28px 20px; }
  .question-text { font-size: 17px; }
}
</style>
