<script setup lang="ts">
defineProps<{
  id: string
  label: string
  checked: boolean
}>()

const emit = defineEmits<{ 'update:checked': [boolean] }>()
</script>

<template>
  <label :for="id" class="layer-item">
    <span class="layer-checkbox-wrap">
      <input
        :id="id"
        type="checkbox"
        class="layer-checkbox"
        :checked="checked"
        @change="(e) => emit('update:checked', (e.target as HTMLInputElement).checked)"
      />
      <span class="layer-checkmark" />
    </span>
    <span class="layer-label">{{ label }}</span>
  </label>
</template>

<style scoped>
.layer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.layer-item:hover {
  background: rgba(60, 160, 255, 0.07);
}

.layer-checkbox {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.layer-checkbox-wrap {
  position: relative;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.layer-checkmark {
  display: block;
  width: 16px;
  height: 16px;
  border: 1.5px solid rgba(80, 180, 255, 0.3);
  border-radius: 4px;
  background: rgba(8, 14, 24, 0.6);
  transition:
    border-color 0.15s,
    background 0.15s;
}

.layer-checkbox:checked ~ .layer-checkmark {
  background: rgba(50, 160, 220, 0.25);
  border-color: rgba(80, 180, 255, 0.7);
}

.layer-checkbox:checked ~ .layer-checkmark::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 5px;
  width: 4px;
  height: 8px;
  border: 1.5px solid rgba(140, 210, 255, 0.9);
  border-top: none;
  border-left: none;
  transform: rotate(45deg);
}

.layer-label {
  font-size: 13px;
  color: rgba(160, 210, 240, 0.7);
  letter-spacing: 0.02em;
  transition: color 0.15s;
}

.layer-item:hover .layer-label {
  color: rgba(160, 210, 240, 0.95);
}
</style>
