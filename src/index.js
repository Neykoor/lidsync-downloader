import { LidsyncDownloader } from './core/Downloader.js'

let instance = null

export function createDownloader(options = {}) {
  return new LidsyncDownloader(options)
}

export function getDownloader(options = {}) {
  if (!instance) {
    instance = new LidsyncDownloader(options)
  }
  return instance
}

export { LidsyncDownloader } from './core/Downloader.js'
export { YouTubeExtractor } from './extractors/YouTubeExtractor.js'
export { FormatConverter } from './core/FormatConverter.js'

export default {
  create: createDownloader,
  get: getDownloader,
  LidsyncDownloader
}
