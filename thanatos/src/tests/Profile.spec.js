import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Profile from '../components/Profile.vue'
import { createPinia, setActivePinia } from 'pinia'

// Mock dependencies
vi.mock('../stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: '1', username: 'testuser', profile_url: 'http://old.com' },
    logout: vi.fn()
  }))
}))

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    replace: vi.fn()
  }))
}))

vi.mock('../supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn()
      }))
    }
  }
}))

vi.mock('../api/api', () => ({
  default: {
    post: vi.fn()
  }
}))

describe('Profile.vue (Unit)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders initial data from authStore', () => {
    const wrapper = mount(Profile)
    const usernameInput = wrapper.find('input[type="text"]')
    expect(usernameInput.element.value).toBe('testuser')
    
    const avatarImg = wrapper.find('img')
    expect(avatarImg.attributes('src')).toBe('http://old.com')
  })

  it('renders initials when profile_url is missing', async () => {
    const { useAuthStore } = await import('../stores/auth')
    useAuthStore.mockReturnValueOnce({
      user: { id: '1', username: 'Gellért', profile_url: '' }
    })
    
    const wrapper = mount(Profile)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('.avatar-circle span').text()).toBe('G')
  })

  it('updates profile_url when file is uploaded', async () => {
    const { supabase } = await import('../supabase')
    supabase.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'http://new.com/img.png' } })
    })

    const wrapper = mount(Profile)
    const file = new File([''], 'test.png', { type: 'image/png' })
    const input = wrapper.find('input[type="file"]')
    
    // Simulate file change
    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')
    
    expect(wrapper.vm.profileUrl).toBe('http://new.com/img.png')
  })

  it('calls API and updates store on save', async () => {
    const { default: api } = await import('../api/api')
    api.post.mockResolvedValue({ data: { username: 'newname' } })
    
    const wrapper = mount(Profile)
    await wrapper.find('.btn-save').trigger('click')
    
    expect(api.post).toHaveBeenCalled()
    expect(wrapper.find('.status-msg').text()).toContain('successfully')
  })
})
