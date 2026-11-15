<script setup lang="ts">
import { onSlideEnter, onSlideLeave } from '@slidev/client'
import { computed, onUnmounted, ref } from 'vue'

const props = defineProps<{
  src: string
  alt: string
}>()

const nonce = ref(1)
const cachedBlob = ref<Blob | null>(null)
const activeObjectUrl = ref<string | null>(null)
const isActive = ref(false)

onSlideEnter(() => {
  isActive.value = true
  nonce.value += 1
  if (activeObjectUrl.value) {
    URL.revokeObjectURL(activeObjectUrl.value)
    activeObjectUrl.value = null
  }
  if (cachedBlob.value) {
    activeObjectUrl.value = URL.createObjectURL(cachedBlob.value)
  } else {
    void fetch(props.src)
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (blob) cachedBlob.value = blob
      })
      .catch(() => undefined)
  }
})

onSlideLeave(() => {
  isActive.value = false
  if (activeObjectUrl.value) {
    URL.revokeObjectURL(activeObjectUrl.value)
    activeObjectUrl.value = null
  }
})

onUnmounted(() => {
  if (activeObjectUrl.value) {
    URL.revokeObjectURL(activeObjectUrl.value)
    activeObjectUrl.value = null
  }
})

const imgSrc = computed(() => {
  if (!isActive.value) return undefined
  if (activeObjectUrl.value) return activeObjectUrl.value
  return `${props.src}?play=${nonce.value}`
})
</script>

<template>
  <img
    v-if="isActive"
    :key="nonce"
    :src="imgSrc"
    :alt="alt"
    class="h-full w-full object-contain rounded-lg"
  />
</template>
