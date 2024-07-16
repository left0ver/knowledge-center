import type { Plugin } from 'vite'
import { replacer } from '../theme/utils'
import { getReadingTime } from '../theme/utils'
import { log } from 'console'

export function MarkdownTransform(): Plugin {
  return {
    // https://github.com/chodocs/chodocs
    name: 'chodocs-md-transform',
    enforce: 'pre',
    async transform(code, id) {
      if (!id.match(/\.md\b/))
        return null
      const [ i] = id.split('/').slice(-1)
      // cut index.md
      if (i === 'index.md')
        return code

      const { footer } = await getDocsMarkdown()
      code = replacer(code, footer, 'FOOTER', 'tail')
      const { readTime, words } = getReadingTime(code)
      code = code
        .replace(/(#\s.+?\n)/, `$1\n\n<PageInfo readTime="${readTime}" words="${words}"/>\n`)

      return code
    },
  }
}

export async function getDocsMarkdown() {
  const CopyRightSection = `
  <CopyRight/>`

  const footer = `${CopyRightSection}\n`

  return {
    footer,
  }
}
