<template>
  <div
    class="rounded-xl border bg-white p-5 shadow-sm transition-all duration-200 card-hover"
    style="border-color: var(--yw-border)"
  >
    <div class="flex justify-between items-start">
      <div>
        <p class="text-sm font-medium" style="color: var(--yw-text-secondary)">{{ title }}</p>
        <p class="text-2xl font-bold mt-1" style="color: var(--yw-text-primary)">{{ value }}</p>
        <p v-if="subText" class="text-xs mt-3 text-gray-500" :class="subTextClass">
          {{ subText }}
        </p>
      </div>
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        :class="iconBgClass"
      >
        <component :is="iconComponent" class="w-5 h-5" :class="iconColorClass" />
      </div>
    </div>
    <div
      v-if="stats?.length"
      class="mt-3 flex justify-between text-xs border-t pt-2"
      style="color: var(--yw-text-secondary); border-color: var(--yw-border)"
    >
      <span v-for="(stat, idx) in stats" :key="idx">
        {{ stat.label }}: <span :class="stat.valueClass">{{ stat.value }}</span>
      </span>
    </div>
    <div v-if="linkText" class="mt-3 text-right">
      <a
        href="#"
        class="text-xs font-medium hover:underline"
        style="color: var(--yw-primary)"
        @click.prevent
        >{{ linkText }} →</a
      >
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  value: [String, Number],
  subText: String,
  subTextClass: { type: String, default: '' },
  stats: Array,
  linkText: String,
  iconComponent: Object,
  iconBgClass: { type: String, default: 'bg-[#EFF6FF]' },
  iconColorClass: { type: String, default: 'text-[#3B82F6]' }
})
</script>
