 interface PageInfo {
  readTime: number | string;
  words: number | string;
}
export function getWords(content: string): RegExpMatchArray | null {
  return content.match(/[\w\d\s,.\u00C0-\u024F\u0400-\u04FF]+/giu)
}

export function getChinese(content: string): RegExpMatchArray | null {
  return content.match(/[\u4E00-\u9FD5]/gu)
}

export function getEnWordCount(content: string): number {
  return getWords(content)?.reduce<number>(
    (accumulator, word) =>
      accumulator + (word.trim() === '' ? 0 : word.trim().split(/\s+/u).length),
    0,
  ) || 0
}

export function getCnWordCount(content: string): number {
  return getChinese(content)?.length || 0
}

export function getWordNumber(content: string): number {
  // 只统计中文的数量
  return getCnWordCount(content)
}

export function getReadingTime(content: string,
  cnWordPerMinute = 320,
  enwordPerMinute = 160): PageInfo {
  const count = getWordNumber(content || '')
  const words = count >= 1000 ? `${Math.round(count / 100) / 10}k` : count

  const enWord = getEnWordCount(content)
  const cnWord = getCnWordCount(content)

  // 阅读时长是中英文加起来的
  const readingTime = cnWord / cnWordPerMinute + enWord / enwordPerMinute
  const readTime = readingTime < 1 ? '1' : Number.parseInt(`${readingTime}`, 10)

  return {
    readTime,
    words,
  }
}
