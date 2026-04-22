<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 card-hover">
    <div class="flex justify-between items-start">
      <div>
        <p class="text-gray-500 text-sm font-medium">{{ title }}</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ value }}</p>
        <p v-if="subText" class="text-xs text-gray-400 mt-3">{{ subText }}</p>
      </div>
      <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="iconBgClass">
        <component :is="iconComponent" class="w-5 h-5" :class="iconColorClass" />
      </div>
    </div>
    <div v-if="stats?.length" class="mt-3 flex justify-between text-xs text-gray-500 border-t pt-2">
      <span v-for="(stat, idx) in stats" :key="idx">
        {{ stat.label }}: <span :class="stat.valueClass">{{ stat.value }}</span>
      </span>
    </div>
    <div v-if="linkText" class="mt-3 text-right">
      <a href="#" class="text-indigo-600 text-xs font-medium hover:underline">{{ linkText }} -></a>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  value: [String, Number],
  subText: String,
  stats: Array,
  linkText: String,
  iconComponent: Object,
  iconBgClass: { type: String, default: 'bg-blue-50' },
  iconColorClass: { type: String, default: 'text-blue-600' }
})
</script>
