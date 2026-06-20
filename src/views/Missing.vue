<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="missing">
    <div class="missing-code">404</div>
    <div class="missing-label">Page not found</div>
    <p class="missing-hint">This route hasn't been wired up yet.</p>
    <button class="missing-back" @click="router.push('/')">Back to Dashboard</button>
  </div>
</template>

<style scoped>
.missing {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 64px);
  gap: 12px;
  text-align: center;
}

.missing-code {
  font-size: 96px;
  font-weight: 800;
  letter-spacing: -4px;
  color: rgba(60, 170, 220, 0.15);
  line-height: 1;
}

.missing-label {
  font-size: 22px;
  font-weight: 600;
  color: rgba(140, 210, 255, 0.8);
  letter-spacing: 0.04em;
}

.missing-hint {
  font-size: 13px;
  color: rgba(140, 210, 255, 0.35);
  margin-top: 4px;
}

.missing-back {
  margin-top: 16px;
  padding: 8px 22px;
  background: rgba(60, 160, 255, 0.1);
  border: 1px solid rgba(80, 180, 255, 0.25);
  border-radius: 6px;
  color: rgba(140, 210, 255, 0.85);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.missing-back:hover {
  background: rgba(60, 160, 255, 0.2);
  border-color: rgba(80, 180, 255, 0.5);
}
</style>
