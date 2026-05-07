import type { Chapter } from './contentTypes'

const cache = new Map<string, Promise<Chapter>>()

function fileIdFromSlug(slug: string): string {
  return slug.replace(/\//g, '-')
}

export function loadChapter(slug: string): Promise<Chapter> {
  const fileId = fileIdFromSlug(slug)
  let p = cache.get(fileId)
  if (!p) {
    p = import(`../content/${fileId}.json`).then((mod) => mod.default as Chapter)
    cache.set(fileId, p)
  }
  return p
}

export function prefetchChapter(slug: string | undefined | null) {
  if (!slug) return
  loadChapter(slug).catch(() => {
    cache.delete(fileIdFromSlug(slug))
  })
}
