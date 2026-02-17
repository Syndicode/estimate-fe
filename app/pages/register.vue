<template>
    <div class="auth-page">
        <div class="auth-card">
            <div class="auth-header">
                <h1 class="auth-logo">Esti<span>Mate</span></h1>
                <p class="auth-subtitle">Create your account</p>
            </div>

            <form class="auth-form" @submit.prevent="handleRegister">
                <div v-if="authStore.error" class="auth-error">
                    {{ authStore.error }}
                </div>

                <div class="form-group">
                    <label for="name">Name</label>
                    <input
                        id="name"
                        v-model="name"
                        type="text"
                        placeholder="Your name"
                        required
                        autocomplete="name"
                    />
                </div>

                <div class="form-group">
                    <label for="email">Email</label>
                    <input
                        id="email"
                        v-model="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        autocomplete="email"
                    />
                </div>

                <div class="form-group">
                    <label for="password">Password</label>
                    <input
                        id="password"
                        v-model="password"
                        type="password"
                        placeholder="Min. 8 characters"
                        required
                        minlength="8"
                        autocomplete="new-password"
                    />
                </div>

                <div class="form-group">
                    <label for="password_confirmation">Confirm Password</label>
                    <input
                        id="password_confirmation"
                        v-model="passwordConfirmation"
                        type="password"
                        placeholder="Repeat password"
                        required
                        autocomplete="new-password"
                    />
                </div>

                <button type="submit" class="auth-btn" :disabled="authStore.loading">
                    {{ authStore.loading ? 'Creating account...' : 'Create Account' }}
                </button>
            </form>

            <div class="auth-footer">
                <p>Already have an account? <NuxtLink to="/login">Sign in</NuxtLink></p>
                <p class="auth-skip"><NuxtLink to="/">Continue without account →</NuxtLink></p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')

async function handleRegister() {
    try {
        await authStore.register(name.value, email.value, password.value, passwordConfirmation.value)
        await navigateTo('/')
    } catch {
        // error displayed via authStore.error
    }
}

onMounted(() => {
    if (authStore.isAuthenticated) {
        navigateTo('/')
    }
})
</script>

<style scoped>
.auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-primary);
    padding: 1.5rem;
}

.auth-card {
    width: 100%;
    max-width: 420px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-radius: 16px;
    padding: 2.5rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.auth-header {
    text-align: center;
    margin-bottom: 2rem;
}

.auth-logo {
    font-size: 2rem;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.03em;
}

.auth-logo span {
    background: var(--gradient-accent);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.auth-subtitle {
    color: var(--text-tertiary);
    margin-top: 0.5rem;
    font-size: 0.95rem;
}

.auth-error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    margin-bottom: 1rem;
}

.auth-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.form-group label {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-secondary);
}

.form-group input {
    padding: 0.75rem 1rem;
    background: var(--bg-primary);
    border: 1px solid var(--border-primary);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 0.95rem;
    font-family: inherit;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.form-group input::placeholder {
    color: var(--text-tertiary);
}

.auth-btn {
    padding: 0.8rem;
    background: var(--gradient-accent);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
    margin-top: 0.5rem;
}

.auth-btn:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
}

.auth-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.auth-footer {
    text-align: center;
    margin-top: 1.5rem;
    font-size: 0.875rem;
    color: var(--text-tertiary);
}

.auth-footer a {
    color: var(--accent-primary);
    text-decoration: none;
    font-weight: 500;
}

.auth-footer a:hover {
    text-decoration: underline;
}

.auth-skip {
    margin-top: 0.75rem;
    font-size: 0.8rem;
}

.auth-skip a {
    color: var(--text-tertiary) !important;
}

.auth-skip a:hover {
    color: var(--text-secondary) !important;
}
</style>
