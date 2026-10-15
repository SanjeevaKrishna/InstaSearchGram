import { postsBatch1 } from './posts-1'
import { postsBatch2 } from './posts-2'
import { postsBatch3 } from './posts-3'
import { postsBatch4 } from './posts-4'

// Combine all 20 in-depth blog posts
export const allBlogPosts = [
  ...postsBatch1,
  ...postsBatch2,
  ...postsBatch3,
  ...postsBatch4
]

export function getAllPosts() {
  return allBlogPosts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
}

export function getPostBySlug(slug) {
  if (!slug) return null
  return allBlogPosts.find(p => p.slug === slug) || null
}

export function getAllCategories() {
  const cats = new Set(allBlogPosts.map(p => p.category))
  return ['All', ...Array.from(cats)]
}

export function getRelatedPosts(currentSlug, limit = 3) {
  const current = getPostBySlug(currentSlug)
  if (!current) return allBlogPosts.slice(0, limit)
  return allBlogPosts
    .filter(p => p.slug !== currentSlug)
    .filter(p => p.category === current.category)
    .slice(0, limit)
}
