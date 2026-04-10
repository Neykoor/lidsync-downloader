import { spawn } from 'child_process'

export class FormatConverter {
  constructor(options = {}) {
    this.ffmpegPath = options.ffmpegPath || 'ffmpeg'
    this.defaultBitrate = options.defaultBitrate || '192k'
  }

  async toMp3(inputBuffer, options = {}) {
    const { bitrate = this.defaultBitrate, metadata = {} } = options

    return new Promise((resolve, reject) => {
      const args = [
        '-i', 'pipe:0',
        '-f', 'mp3',
        '-ab', bitrate,
        '-ar', '44100',
        '-id3v2_version', '3',
      ]

      if (metadata.title) args.push('-metadata', `title=${metadata.title}`)
      if (metadata.artist) args.push('-metadata', `artist=${metadata.artist}`)

      args.push('pipe:1')

      const chunks = []
      const ffmpeg = spawn(this.ffmpegPath, args)

      ffmpeg.stdin.write(inputBuffer)
      ffmpeg.stdin.end()

      ffmpeg.stdout.on('data', (chunk) => {
        chunks.push(chunk)
      })

      ffmpeg.stderr.on('data', (data) => {
        
      })

      ffmpeg.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`FFmpeg error: ${code}`))
        } else {
          resolve(Buffer.concat(chunks))
        }
      })

      ffmpeg.on('error', reject)
    })
  }

  async probe(buffer) {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-i', 'pipe:0',
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams'
      ])

      let output = ''
      
      ffprobe.stdout.on('data', (data) => {
        output += data.toString()
      })

      ffprobe.on('close', (code) => {
        try {
          resolve(JSON.parse(output))
        } catch (e) {
          reject(new Error('FFprobe parse error'))
        }
      })

      ffprobe.stdin.write(buffer)
      ffprobe.stdin.end()
    })
  }
}
