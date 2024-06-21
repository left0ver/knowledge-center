<script setup>
import DefaultTheme from 'vitepress/theme'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #nav-bar-content-after
>
      <div class="page-view">
      <span  id="busuanzi_container_site_uv">本站总访问量<span id="busuanzi_value_site_pv"></span>次</span>
      </div>
    </template>
  </Layout>
</template>

<style lang="less">
  .page-view {
    padding-left: 14px;
    font-size: 14px;
    font-weight: 400;
    color: #1565C0;
  }
</style>
