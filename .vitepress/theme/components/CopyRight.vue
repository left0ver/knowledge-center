<script setup lang="ts">
import { ref } from 'vue'
import { useData } from 'vitepress'

const defaultAuthor = 'leftover'
const author = ref(defaultAuthor)
const pageHref = location.href

function getGithubLink(name: string) {
  return `https://github.com/left0ver`
}
</script>

<template>
  <div
    class="px-[1.2rem] relative py-[1rem] border-1 border-[var(--vp-c-border)]/[.55] w-full min-h-[32px] border-solid mt-[32px] leading-[24px] rounded-[4px]"
  >
    <fa6-solid:copyright class="absolute top-[1rem] right-[1.2rem] " />
    <section class="flex flex-col gap-y-[8px] overflow-hidden">
      <div>
        <span class="font-bold">文章作者：</span>
        <span>
          <a :href="getGithubLink(author)" rel="noreferrer" target="_blank">
            {{ author }}
          </a>
        </span>
      </div>
      <!-- <div>
        <span class="font-bold">文章链接：</span>
        <span>
          <a :href="pageHref" rel="noreferrer" target="_blank">
            {{ pageHref }}
          </a>
        </span>
      </div> -->
      <div>
        <span class="font-bold">版权声明：</span>
        <span>
          所有文章除特别声明外，均采用 <a
            href="https://creativecommons.org/licenses/by-nc-sa/4.0/" rel="noreferrer"
            target="_blank"
          >CC BY-NC-SA 4.0</a>
          许可协议。转载请注明来自
          <a href="https://note.leftover.cn/" rel="noreferrer" target="_blank">leftover</a></span>！
      </div>
    </section>
  </div>
</template>
