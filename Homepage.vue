<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const showDropdown = ref(false)
const scrolled = ref(false)
const heroVisible = ref(false)
const cardsVisible = ref(false)

const handleScroll = () => {
  scrolled.value = window.scrollY > 20
  if (window.scrollY > 100) cardsVisible.value = true
}

onMounted(() => {
  setTimeout(() => (heroVisible.value = true), 100)
  window.addEventListener('scroll', handleScroll)
})

onBeforeUnmount(() => window.removeEventListener('scroll', handleScroll))

const closeDropdown = (e) => {
  if (!e.target.closest('.profile-container')) showDropdown.value = false
}

const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
};


function logout() {
  authStore.logout(router)
}

</script>

<template>
  <div class="page" @click="closeDropdown">

    <!-- NAVBAR -->
    <nav :class="['navbar', { 'navbar--scrolled': scrolled }]">
      <div class="navbar__brand">
        <span class="brand-dot"></span>
        <span class="brand-name">Wellpath</span>
      </div>

      <div class="navbar__actions">
        <span class="nav-label">Your dashboard</span>
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
              <a href="#" @click.prevent="logout" class="dropdown__item dropdown__item--danger">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign Out
              </a>
            </div>
          </Transition>
        </div>
      </div>
    </nav>

    <!-- HERO -->
    <section class="hero">
      <div class="hero__bg">
        <div class="orb orb--1"></div>
        <div class="orb orb--2"></div>
        <div class="grid-overlay"></div>
      </div>
      <div :class="['hero__content', { 'hero__content--visible': heroVisible }]">
        
        <h1 class="hero__title">
          Take control of<br />
          <em class="hero__title-em">your health</em>
        </h1>
        <p class="hero__sub">
          A unified space for students to develop their body mind and body.
        </p>
        <div class="hero__ctas">
          <button class="btn btn--primary" @click="scrollToSection('select-section')">Get Started</button>
          <button class="btn btn--ghost" @click="router.push('/learnmore')">Learn more</button>
        </div>
      </div>

      <div class="hero__scroll-hint">
        <span>Scroll</span>
        <div class="scroll-line"></div>
      </div>
    </section>

    <section id="select-section">
      <div :class="['select-section__inner', { 'select-section__inner--visible': cardsVisible }]">
        <div class="section-label">Choose your focus</div>
        <h2 class="section-title">Where do you want to begin?</h2>

        <div class="cards">
          <div class="card card--mental" @click="router.push('/mental-health')">
            <div class="card__glow"></div>
            <div class="card__top">
              <div class="card__icon-wrap">
                <span class="card__icon">🧠</span>
              </div>
              <div class="card__arrow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </div>
            </div>
            <h3 class="card__title">Mental Health</h3>
            <p class="card__desc">Helping students balance studying, mental well-being, and social life through community and events.</p>
            <div class="card__tags">
              <span class="tag">Responses</span>
              <span class="tag">Social activity</span>
              <span class="tag">Focus</span>
            </div>
          </div>

          <div class="card card--physical" @click="router.push('/physical-health')">
            <div class="card__glow"></div>
            <div class="card__top">
              <div class="card__icon-wrap">
                <span class="card__icon">🏃‍♂️</span>
              </div>
              <div class="card__arrow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </div>
            </div>
            <h3 class="card__title">Physical Health</h3>
            <p class="card__desc">A platform for students to feel better through movement, fitness, and active community events.</p>
            <div class="card__tags">
              <span class="tag">Fitness</span>
              <span class="tag">Recovery</span>
            </div>
          </div>
        </div>
      </div>
    </section>

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
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.page {
  font-family: var(--universalfontstyle);
  background: var(--universalbackgrounbcolor);
  color: var(--universalprimarytextcolor);
  min-height: 100vh;
  overflow-x: hidden;
}

/* ── NAVBAR ── */
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
  background: var(--universalbackgrounbcolor);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding: 14px 40px;
}
.navbar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--universalfontstyle);
  font-weight: 600;
  font-size: 17px;
  letter-spacing: -0.3px;
}
.brand-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5ee7b0, #3b9eff);
  box-shadow: 0 0 10px rgba(94,231,176,0.6);
}
.brand-dot--sm { width: 6px; height: 6px; }
.brand-name { color: var(--universalprimarytextcolor); }
.navbar__actions { display: flex; align-items: center; gap: 20px; }
.nav-label { font-size: 13px; color: var(--universalsecondarytextcolor); letter-spacing: 0.3px; }

/* Profile */
.profile-container { position: relative; cursor: pointer; }
.avatar {
  width: 38px; height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e2d45, #0f1929);
  border: 1.5px solid rgba(255,255,255,0.12);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  transition: border-color 0.2s;
}
.avatar:hover { border-color: rgba(94,231,176,0.5); }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar-fallback { font-size: 14px; font-weight: 600; color: #8baacc; }
.dropdown {
  position: absolute; top: calc(100% + 10px); right: 0;
  background: #0f1929;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 6px;
  min-width: 160px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}
.dropdown__item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 13.5px;
  color: var(--universalsecondarytextcolor);
  text-decoration: none;
  transition: all 0.15s;
}
.dropdown__item:hover { background: rgba(255,255,255,0.06); color: var(--universalprimarytextcolor); }
.dropdown__item--danger:hover { background: rgba(239,68,68,0.1); color: #f87171; }
.dropdown__divider { height: 1px; background: rgba(255,255,255,0.06); margin: 4px 0; }

.dropdown-enter-active, .dropdown-leave-active { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px) scale(0.97); }

/* ── HERO ── */
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.hero__bg { position: absolute; inset: 0; pointer-events: none; }
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
  animation: drift 12s ease-in-out infinite alternate;
}
.orb--2 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, #5ee7b0, transparent 70%);
  bottom: -80px; right: -80px;
  animation: drift 15s ease-in-out infinite alternate-reverse;
}
@keyframes drift {
  from { transform: translate(0, 0); }
  to { transform: translate(40px, 30px); }
}
.grid-overlay {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent);
}

.hero__content {
  position: relative;
  text-align: center;
  max-width: 720px;
  padding: 0 24px;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.9s cubic-bezier(0.22,1,0.36,1);
}
.hero__content--visible { opacity: 1; transform: translateY(0); }


.pulse-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #5ee7b0;
  box-shadow: 0 0 8px #5ee7b0;
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 8px #5ee7b0; }
  50% { opacity: 0.5; box-shadow: 0 0 20px #5ee7b0; }
}

.hero__title {
  font-family: var(--universalfontstyle);
  font-size: clamp(44px, 7vw, 80px);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -2px;
  color: var(--universalprimarytextcolor);
  margin-bottom: 24px;
}
.hero__title-em {
  font-style: italic;
  font-weight: 300;
  background: linear-gradient(135deg, #5ee7b0 0%, #3b9eff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero__sub {
  font-size: 18px;
  color: var(--universalsecondarytextcolor);
  line-height: 1.65;
  max-width: 480px;
  margin: 0 auto 40px;
  font-weight: 300;
}
.hero__ctas { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

.btn {
  padding: 14px 32px;
  border-radius: 100px;
  font-family: var(--universalfontstyle);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
  letter-spacing: 0.2px;
}
.btn:active { transform: scale(0.96); }
.btn--primary {
  background: linear-gradient(135deg, #5ee7b0, #3b9eff);
  color: var(--universalbackgrounbcolor);
  box-shadow: 0 0 30px rgba(94,231,176,0.2);
}
.btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 40px rgba(94,231,176,0.35);
}
.btn--ghost {
  background: transparent;
  color: var(--universalsecondarytextcolor);
  border: 1px solid rgba(255,255,255,0.12);
}
.btn--ghost:hover {
  background: rgba(255,255,255,0.05);
  color: var(--universalprimarytextcolor);
  border-color: rgba(255,255,255,0.2);
  transform: translateY(-1px);
}

.hero__scroll-hint {
  position: absolute;
  bottom: 40px; left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--universalsecondarytextcolor);
}
.scroll-line {
  width: 1px; height: 48px;
  background: linear-gradient(to bottom, rgba(255,255,255,0.2), transparent);
  animation: scrollPulse 2s ease-in-out infinite;
}
@keyframes scrollPulse {
  0%, 100% { opacity: 0.3; transform: scaleY(1); }
  50% { opacity: 0.8; transform: scaleY(1.1); }
}

/* ── SELECT SECTION ── */
#select-section {
  padding: 120px 40px;
  max-width: 1100px;
  margin: 0 auto;
}
.select-section__inner {
  opacity: 0;
  transform: translateY(40px);
  transition: all 0.8s cubic-bezier(0.22,1,0.36,1);
}
.select-section__inner--visible { opacity: 1; transform: translateY(0); }

.section-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 2.5px;
  color: var(--universalaccentcolor);
  margin-bottom: 14px;
  font-weight: 500;
}
.section-title {
  font-family: var(--universalfontstyle);
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 600;
  color: var(--universalprimarytextcolor);
  letter-spacing: -1px;
  margin-bottom: 56px;
}

/* ── CARDS ── */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}
.card {
  position: relative;
  border-radius: 20px;
  padding: 36px;
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.03);
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
}
.card:hover {
  transform: translateY(-6px);
  border-color: rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.055);
}
.card:active { transform: translateY(-2px) scale(0.99); }

.card__glow {
  position: absolute;
  width: 300px; height: 300px;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0;
  transition: opacity 0.4s;
  pointer-events: none;
  top: -80px; left: -60px;
}
.card:hover .card__glow { opacity: 0.12; }
.card--mental .card__glow { background: #3b9eff; }
.card--physical .card__glow { background: #5ee7b0; }

.card__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
}
.card__icon-wrap {
  width: 60px; height: 60px;
  border-radius: 16px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  display: flex; align-items: center; justify-content: center;
  font-size: 28px;
  transition: transform 0.3s ease;
}
.card:hover .card__icon-wrap { transform: scale(1.08) rotate(-3deg); }
.card__arrow {
  color: var(--universalsecondarytextcolor);
  transition: all 0.3s;
  margin-top: 4px;
}
.card:hover .card__arrow {
  color: var(--universalprimarytextcolor);
  transform: translate(3px, -3px);
}

.card__title {
  font-family: var(--universalfontstyle);
  font-size: 22px;
  font-weight: 600;
  color: var(--universalprimarytextcolor);
  letter-spacing: -0.5px;
  margin-bottom: 12px;
}
.card__desc {
  font-size: 15px;
  color: var(--universalsecondarytextcolor);
  line-height: 1.65;
  font-weight: 300;
  margin-bottom: 28px;
}
.card__tags { display: flex; gap: 8px; flex-wrap: wrap; }
.tag {
  font-size: 11.5px;
  color: var(--universalsecondarytextcolor);
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 100px;
  padding: 4px 12px;
  letter-spacing: 0.3px;
  transition: all 0.2s;
}
.card:hover .tag {
  background: rgba(255,255,255,0.08);
  color: var(--universalprimarytextcolor);
}

/* ── FOOTER ── */
.footer {
  border-top: 1px solid rgba(255,255,255,0.05);
  padding: 32px 40px;
}
.footer__inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.footer__brand {
  display: flex; align-items: center; gap: 8px;
  font-family: var(--universalfontstyle);
  font-size: 14px;
  font-weight: 600;
  color: var(--universalsecondarytextcolor);
}
.footer__copy { font-size: 12.5px; color: var(--universalsecondarytextcolor); opacity: 0.5; }

/* ── RESPONSIVE ── */
@media (max-width: 600px) {
  .navbar { padding: 16px 20px; }
  .navbar--scrolled { padding: 12px 20px; }
  .select-section { padding: 80px 20px; }
  .nav-label { display: none; }
}
</style>