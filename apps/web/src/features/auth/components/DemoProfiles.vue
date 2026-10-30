<script setup lang="ts">
import { DEMO_PROFILES, type DemoProfile } from '../../../shared/config/demo-profiles';

defineEmits<{
  (e: 'select', profile: DemoProfile): void;
}>();
</script>

<template>
  <div class="demo-profiles-panel">
    <div class="demo-header">
      <span class="demo-badge">Modo Demo Piura FEN</span>
      <p class="demo-subtitle">
        Selecciona un perfil oficial para evaluar roles y permisos en terreno:
      </p>
    </div>

    <div class="profiles-grid">
      <button
        v-for="profile in DEMO_PROFILES"
        :key="profile.email"
        type="button"
        class="profile-card"
        :class="profile.chipClass || `role-${profile.id}`"
        @click="$emit('select', profile)"
      >
        <div class="profile-top">
          <span class="profile-icon">{{ profile.icon }}</span>
          <span class="profile-role-tag">{{ profile.label }}</span>
        </div>
        <div class="profile-email">{{ profile.email }}</div>
        <div class="profile-desc">{{ profile.sublabel }}</div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.demo-profiles-panel {
  margin-top: 1.5rem;
  padding: 1.25rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px dashed rgba(56, 189, 248, 0.35);
  border-radius: 0.75rem;
}

.demo-header {
  margin-bottom: 1rem;
}

.demo-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.35rem;
}

.demo-subtitle {
  font-size: 0.8125rem;
  color: #94a3b8;
  margin: 0;
}

.profiles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.625rem;
}

.profile-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0.75rem;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
  font-family: inherit;
  color: inherit;
}

.profile-card:hover {
  transform: translateY(-2px);
  border-color: #38bdf8;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

.profile-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 0.35rem;
}

.profile-icon {
  font-size: 1.25rem;
}

.profile-role-tag {
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 0.1rem 0.35rem;
  border-radius: 0.25rem;
  background: rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
}

.profile-email {
  font-size: 0.6875rem;
  color: #94a3b8;
  margin-bottom: 0.35rem;
  word-break: break-all;
}

.profile-desc {
  font-size: 0.6875rem;
  color: #64748b;
  line-height: 1.3;
}
</style>
