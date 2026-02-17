import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
    id: number
    name: string
    email: string
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const initialized = ref(false)

    const isAuthenticated = computed(() => !!user.value)

    async function init() {
        if (initialized.value) return
        initialized.value = true

        const authToken = useCookie('auth_token')
        if (authToken.value) {
            await fetchUser()
        }
    }

    async function register(name: string, email: string, password: string, passwordConfirmation: string) {
        loading.value = true
        error.value = null
        try {
            const { apiFetch, authToken } = useApi()
            const data = await apiFetch<{ user: User; token: string }>('/register', {
                method: 'POST',
                body: { name, email, password, password_confirmation: passwordConfirmation },
            })
            authToken.value = data.token
            user.value = data.user
            return data
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Registration failed'
            throw e
        } finally {
            loading.value = false
        }
    }

    async function login(email: string, password: string) {
        loading.value = true
        error.value = null
        try {
            const { apiFetch, authToken } = useApi()
            const data = await apiFetch<{ user: User; token: string }>('/login', {
                method: 'POST',
                body: { email, password },
            })
            authToken.value = data.token
            user.value = data.user
            return data
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Login failed'
            throw e
        } finally {
            loading.value = false
        }
    }

    async function logout() {
        try {
            const { apiFetch, authToken } = useApi()
            await apiFetch('/logout', { method: 'POST' })
            authToken.value = null
            user.value = null
        } catch {
            // Clear local state even on error
            const authToken = useCookie('auth_token')
            authToken.value = null
            user.value = null
        }
    }

    async function fetchUser() {
        try {
            const { apiFetch } = useApi()
            user.value = await apiFetch<User>('/user')
        } catch {
            user.value = null
        }
    }

    return {
        user,
        loading,
        error,
        isAuthenticated,
        initialized,
        init,
        register,
        login,
        logout,
        fetchUser,
    }
})
