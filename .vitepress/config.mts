import { defineConfig } from 'vitepress'
export default defineConfig({
  lang: 'zh-Hans',
  title: "leftover's 知识库",
  description: '存放一些自己的一些学习笔记',
  srcDir:"src",
  lastUpdated:true,
  sitemap: {
    hostname: 'https://note.leftover.cn',
  },
  
  head: [
    [
      'script',
      { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=GTM-PZPSHWWJ' }
    ],
    [
      'script',
      {},
      `window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'GTM-PZPSHWWJ');`
    ],
    ["script", { src: "/_vercel/insights/script.js", defer: '' }],
    ["script",{src: "/_vercel/speed-insights/script.js",defer: ''}],
    
    ["script",{src:"https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js",defer:''}]
  ],
  cleanUrls:true,
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
        dateStyle: 'medium',
        timeStyle: undefined
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
      { icon: {
        svg:'<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg t="1718948873393" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1545" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M512 512m-497.58814815 0a497.58814815 497.58814815 0 1 0 995.1762963 0 497.58814815 497.58814815 0 1 0-995.1762963 0Z" fill="#1296db" p-id="1546"></path><path d="M344.31279408 786.43806815V237.56193185h177.21419851c62.42910815 0 109.25093925 10.92266667 140.47762963 32.7558637 31.21455408 21.83319703 46.82183111 54.88033185 46.82183111 99.10499556 0 13.72615111-1.61412741 27.08821333-4.83024592 40.11045926-3.21611852 13.02224592-8.192 24.98863408-14.90337186 35.91130074-6.72350815 10.92266667-15.12182518 20.58315852-25.1949511 28.98147556-10.07312592 8.39831703-21.97883259 14.97618963-35.69284742 19.73361778 13.71401482 2.24521482 26.80907852 6.65069037 39.26091852 13.22856296a116.69777067 116.69777067 0 0 1 32.7558637 25.61972148c9.38135703 10.4978963 16.79663408 22.88905482 22.25796742 37.16133926 5.46133333 14.27228445 8.192 30.23151408 8.192 47.87768888 0 55.99687111-18.76271408 98.06127408-56.27600592 126.19320889-37.52542815 28.13193482-91.68971852 42.21003852-162.51714372 42.21003853H344.31279408zM601.32314075 387.4816c0-10.35226075-1.67480889-19.73361778-5.03656297-28.13193482-3.36175408-8.39831703-8.75026963-15.53445925-16.16554667-21.42056296-7.41527703-5.87396741-16.94226963-10.42507852-28.55670519-13.65333333-11.62657185-3.21611852-25.69253925-4.83024592-42.21003851-4.83024592h-62.57474371v145.29573925h62.57474371c16.79663408 0 31.00823703-2.02676148 42.62267259-6.09242074 11.61443555-4.05352297 21.12929185-9.66049185 28.55670518-16.79663407 7.41527703-7.13614222 12.73097482-15.32814222 15.95922964-24.56386371 3.21611852-9.22358518 4.83024592-19.16321185 4.83024593-29.8067437z m-82.32049778 314.54852741c16.51749925 0 31.00823703-2.09957925 43.46007703-6.29873778 12.45184-4.19915852 22.88905482-10.01244445 31.28737185-17.42772148 8.39831703-7.41527703 14.7577363-16.16554667 19.10253037-26.2508089 4.33265778-10.07312592 6.50505482-20.85015703 6.50505481-32.33109333 0-23.78714075-8.89590518-42.41635555-26.66344295-55.85123555-17.77967408-13.43488-45.00138667-20.15838815-81.67727408-20.15838815h-64.24955259v158.31798519h72.23523556z" fill="#ffffff" p-id="1547"></path></svg>'
    }, 
    link: 'https://blog.leftover.cn',
    ariaLabel:"博客"
  },
      { icon: 'github', link: 'https://github.com/left0ver/knowledge-center' },
    ]
  }
})    
