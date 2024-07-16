<template>
  <div>
    <section
      class="border-b-1 border-[var(--vp-c-divider)] w-full border-b-solid mt-6 pb-3 flex gap-2 mb-3 flex-wrap max-w-[85%] text-sm"
    >
      <div class="flex gap-1 items-center">
        <octicon:feed-person-16 />
        作者:<span>
          {{ author }}
        </span>
      </div>
      <div class="flex gap-1 items-center">
        <bi:file-earmark-word-fill />
        字数统计:<span>{{ words }} 字</span>
      </div>
      <div class="flex gap-1 items-center">
        <ooui:clock />
        阅读时长:<span>{{ readTime }} 分钟</span>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useData } from 'vitepress'
import { getDate, getFromNow } from '../utils'

defineProps<{
  readTime: string
  words: string
}>()
const defaultAuthor = 'leftover'
const author = ref(defaultAuthor)
const { frontmatter, page } = useData()
if (frontmatter.value?.author)
  author.value = frontmatter.value?.author
</script>
