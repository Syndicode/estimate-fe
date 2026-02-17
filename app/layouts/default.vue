<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon">E</div>
        <span class="sidebar-logo-text">EstiMate</span>
      </div>
      <nav class="sidebar-nav">
        <div class="sidebar-nav-label">Navigation</div>
        <NuxtLink to="/" class="sidebar-nav-item" active-class="active">
          <span class="sidebar-nav-icon">📊</span>
          Dashboard
        </NuxtLink>
        <NuxtLink v-if="authStore.isAuthenticated" to="/templates" class="sidebar-nav-item" active-class="active">
          <span class="sidebar-nav-icon">📝</span>
          Templates
        </NuxtLink>
      </nav>
      <div style="padding: 16px 12px; border-top: 1px solid var(--color-border-subtle);">
        <button class="btn btn-primary" style="width:100%;" @click="handleCreateFromSidebar">
          ＋ New Estimate
        </button>
      </div>
      <div class="sidebar-auth">
        <template v-if="authStore.isAuthenticated">
          <div class="auth-user">
            <div class="auth-avatar">{{ authStore.user?.name?.charAt(0)?.toUpperCase() || '?' }}</div>
            <div class="auth-user-info">
              <div class="auth-user-name">{{ authStore.user?.name }}</div>
              <div class="auth-user-email">{{ authStore.user?.email }}</div>
            </div>
          </div>
          <button class="btn-logout" @click="handleLogout">Sign out</button>
        </template>
        <template v-else>
          <NuxtLink to="/login" class="btn btn-outline" style="width:100%;text-align:center;">
            Sign In
          </NuxtLink>
        </template>
      </div>
    </aside>
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const store = useEstimatesStore()
const authStore = useAuthStore()

async function handleCreateFromSidebar() {
  const est = await store.createEstimate('Untitled Estimate')
  router.push(`/estimate/${est.id}`)
}

async function handleLogout() {
  await authStore.logout()
  // Re-init estimates store without backend
  await store.init()
  router.push('/')
}
</script>

<style scoped>
.sidebar-auth {
  padding: 12px;
  border-top: 1px solid var(--color-border-subtle);
  margin-top: auto;
}

.auth-user {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.auth-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--gradient-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  color: white;
  flex-shrink: 0;
}

.auth-user-info {
  overflow: hidden;
}

.auth-user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.auth-user-email {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-logout {
  width: 100%;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  color: var(--text-tertiary);
  font-size: 0.8rem;
  font-family: inherit;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}

.btn-logout:hover {
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.4);
}

.btn-outline {
  display: block;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-family: inherit;
  cursor: pointer;
  text-decoration: none;
  transition: border-color 0.2s, color 0.2s;
}

.btn-outline:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
</style>
