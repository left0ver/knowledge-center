import { defineConfig } from 'vitepress'
export default defineConfig({
  lang: 'zh-Hans',
  title: "leftover's 知识库",
  description: '存放一些自己的一些学习笔记',
  srcDir:"src",
  lastUpdated:true,
  appearance:"dark",
  sitemap: {
    hostname: 'https://note.leftover.cn',
  },
  markdown: {
    lineNumbers: true
  },
  themeConfig: {
    nav: [
    ],
    outline:{
      level: [1,3],
      label:"大纲"
    },
    editLink: {
      pattern: 'https://github.com/left0ver/knowledge-center/edit/main/src/:path',
      text: '在Github上编辑此页'
    },
    lastUpdated: {
      text: '上一次更新时间',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'medium'
      }
    },
    sidebarMenuLabel:"菜单",
    returnToTopLabel:"返回顶部",
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },
    search: {
      provider: 'local'
    },
    footer: {
      message: 'Released under the CC BY-NC-SA License.',
      copyright: 'Copyright © 2024-present <a href="https://github.com/left0ver">leftover</a>'
    },
    sidebar: [
      {
        text: 'Java',
        base:"/Java/",
        collapsed: false,
        items: [
          { text: 'JavaSE', link: 'JavaSE' },
          { text: 'JavaWeb', link: 'JavaWeb' },
          {text: 'Spring', link: 'spring6'},
          { text: 'SpringMVC', link: 'springmvc' },
          { text: 'Mybatis', link: 'Mybatis' },
          { text: 'Mybatis-plus', link: 'Mybatis-plus' },
          { text: 'Springboot', link: 'springboot' },
          { text: 'JSR', link: 'JSR' },
          {text: 'SQL',link: 'sql'},
          {text: 'Maven', link: 'Maven'},          
          {text: 'Java面试题', link: 'Java面试题'}          
        ]
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/left0ver/knowledge-center' }
    ]
  }
})
