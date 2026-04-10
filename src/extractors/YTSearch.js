import yts from 'yt-search'

export class YTSearch {
  constructor(options = {}) {
    this.cache = new Map()
    this.cacheTTL = options.cacheTTL || 300000 
  }

  async findOne(query) {
    const cacheKey = query.toLowerCase().trim()
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    const search = await yts(query)
    if (!search.videos.length) return null

    const result = search.videos[0]
    
    this.cache.set(cacheKey, result)
    setTimeout(() => this.cache.delete(cacheKey), this.cacheTTL)

    return result
  }

  async getInfo(url) {
    const videoId = this._extractId(url)
    if (!videoId) return null

    try {
      const search = await yts({ videoId })
      return search || null
    } catch (e) {
      return null
    }
  }

  _extractId(url) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/)
    return match ? match[1] : null
  }
}
