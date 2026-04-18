import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Homepage from '../components/Homepage.vue'
import { createPinia, setActivePinia } from 'pinia'

// Mock dependencies
vi.mock('../stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: '1', username: 'Gellért' }
  }))
}))

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush
  }))
}))

describe('Homepage.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders the brand name Wellpath', () => {
    const wrapper = mount(Homepage)
    expect(wrapper.text()).toContain('Wellpath')
  })

  it('renders exactly 2 main feature cards (Mental and Physical Health)', () => {
    const wrapper = mount(Homepage)
    const cards = wrapper.findAll('.card')
    expect(cards.length).toBe(2)
  })

  it('navigates to mental-health when the card is clicked', async () => {
    const wrapper = mount(Homepage)
    const mentalHealthCard = wrapper.findAll('.card').find(c => c.text().includes('Mental Health'))
    await mentalHealthCard.trigger('click')
    expect(mockPush).toHaveBeenCalledWith('/mental-health')
  })

  it('toggles dropdown and calls logout', async () => {
    const { useAuthStore } = await import('../stores/auth')
    const mockLogout = vi.fn()
    useAuthStore.mockReturnValue({
        user: { username: 'Gellért' },
        logout: mockLogout
    })

    const wrapper = mount(Homepage)
    
    // Open dropdown
    await wrapper.find('.profile-container').trigger('click')
    expect(wrapper.find('.dropdown').exists()).toBe(true)

    // Click Sign Out
    const signOutBtn = wrapper.find('.dropdown__item--danger')
    await signOutBtn.trigger('click')
    expect(mockLogout).toHaveBeenCalled()
  })
})
