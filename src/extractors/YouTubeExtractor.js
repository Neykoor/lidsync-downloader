import { spawn } from 'child_process'
import { EventEmitter } from 'events'

export class YouTubeExtractor extends EventEmitter {
  constructor(options = {}) {
    super()
    this.ytDlpPath = options.ytDlpPath || 'yt-dlp'
    this.timeout = options.timeout || 120000
  }

  async extractAudioUrl(videoUrl) {
    return new Promise((resolve, reject) => {
      const args = [
        videoUrl,
        '-f', 'bestaudio[ext=m4a]/bestaudio',
        '--get-url',
        '--no-playlist',
        '--quiet'
      ]

      let output = ''
      let error = ''

      const process = spawn(this.ytDlpPath, args, { timeout: this.timeout })

      process.stdout.on('data', (data) => {
        output += data.toString()
      })

      process.stderr.on('data', (data) => {
        error += data.toString()
      })

      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`yt-dlp error: ${error || code}`))
        } else {
          resolve(output.trim().split('\n')[0])
        }
      })

      process.on('error', reject)
    })
  }

  async downloadStream(videoUrl, options = {}) {
    return new Promise((resolve, reject) => {
      const args = [
        videoUrl,
        '-f', 'bestaudio',
        '--extract-audio',
        '--audio-format', 'mp3',
        '-o', '-',
        '--no-playlist',
        '--newline',
        '--progress-template', '%(progress._percent_str)s|%(progress._speed_str)s'
      ]

      const chunks = []
      const process = spawn(this.ytDlpPath, args)

      process.stdout.on('data', (chunk) => {
        chunks.push(chunk)
        this.emit('data', chunk)
      })

      process.stderr.on('data', (data) => {
        const line = data.toString()
        if (line.includes('%')) {
          const parts = line.split('|')
          this.emit('progress', {
            percent: parseFloat(parts[0].replace('%', '').trim()) || 0,
            speed: parts[1]?.trim() || '0KiB/s'
          })
        }
      })

      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Exit code: ${code}`))
        } else {
          resolve(Buffer.concat(chunks))
        }
      })

      process.on('error', reject)
    })
  }
}
