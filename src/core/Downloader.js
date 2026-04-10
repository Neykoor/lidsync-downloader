import { YouTubeExtractor } from '../extractors/YouTubeExtractor.js'
import { FormatConverter } from './FormatConverter.js'
import { YTSearch } from '../extractors/YTSearch.js'

export class LidsyncDownloader {
  constructor(options = {}) {
    this.extractor = new YouTubeExtractor(options)
    this.converter = new FormatConverter(options)
    this.searcher = new YTSearch(options)
    this.maxRetries = options.maxRetries || 3
    this.retryDelay = options.retryDelay || 1000
  }

  async download(query, options = {}) {
    const {
      searchFirst = !this._isUrl(query),
      format = 'mp3',
      quality = '192k',
      onProgress = null
    } = options

    let videoUrl = query
    let videoInfo = null

    if (searchFirst) {
      videoInfo = await this.searcher.findOne(query)
      if (!videoInfo) throw new Error('No se encontró el video')
      videoUrl = videoInfo.url
    }

    if (!videoInfo) {
      videoInfo = await this.searcher.getInfo(videoUrl)
    }

    let audioBuffer = null
    let attempts = 0

    while (attempts < this.maxRetries) {
      try {
        if (onProgress) this.extractor.on('progress', onProgress)

        audioBuffer = await this.extractor.downloadStream(videoUrl)
        
        this.extractor.removeAllListeners('progress')
        break 

      } catch (err) {
        attempts++
        if (attempts >= this.maxRetries) throw err
        await this._sleep(this.retryDelay * attempts)
      }
    }

    let finalBuffer = audioBuffer
    const isMp3 = audioBuffer.toString('hex', 0, 4).includes('fff3') || audioBuffer.toString('hex', 0, 4).includes('494433')

    if (format === 'mp3' && !isMp3) {
      finalBuffer = await this.converter.toMp3(audioBuffer, {
        bitrate: quality,
        metadata: {
          title: videoInfo.title,
          artist: videoInfo.author?.name
        }
      })
    }

    return {
      buffer: finalBuffer,
      info: {
        title: videoInfo.title,
        author: videoInfo.author?.name,
        duration: videoInfo.timestamp,
        views: videoInfo.views,
        thumbnail: videoInfo.image,
        url: videoUrl
      },
      format,
      size: finalBuffer.length
    }
  }

  _isUrl(text) {
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(text)
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
