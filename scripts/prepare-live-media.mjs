import { createHash } from 'node:crypto'
import { createReadStream, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = join(root, 'public', 'assets', 'user-media', 'video', 'msg')
const webDir = join(sourceDir, 'web')
const highDir = join(webDir, '1080')
const standardDir = join(webDir, '720')
const posterDir = join(sourceDir, 'posters')
const manifestPath = join(sourceDir, 'media-manifest.json')
const force = process.argv.includes('--force')
const files = [
  '01-happiness.mp4',
  '02-if-youre-too-shy.mp4',
  '03-its-not-living.mp4',
  '04-paris.mp4',
  '05-robbers.mp4',
  '06-the-sound.mp4',
  '07-when-we-are-together.mp4',
]

for (const directory of [highDir, standardDir, posterDir]) {
  mkdirSync(directory, { recursive: true })
}

const run = (command, args, label, stdio = 'inherit') => {
  console.log(`\n[media] ${label}`)
  const result = spawnSync(command, args, { encoding: 'utf8', stdio })
  if (result.status !== 0) {
    if (stdio === 'pipe') {
      process.stderr.write(result.stderr || result.stdout || '')
    }
    process.exit(result.status ?? 1)
  }
  return result.stdout ?? ''
}

const probe = (file) => JSON.parse(run('ffprobe', [
  '-v', 'error',
  '-show_entries', 'format=duration,size:stream=codec_type,codec_name,profile,width,height,r_frame_rate,pix_fmt,bit_rate',
  '-of', 'json',
  file,
], `probe ${file}`, 'pipe'))

const probeQuietly = (file) => {
  const result = spawnSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'json',
    file,
  ], { encoding: 'utf8' })
  if (result.status !== 0) {
    return null
  }

  try {
    return JSON.parse(result.stdout)
  } catch {
    return null
  }
}

const needsUpdate = (source, output, sourceDuration) => {
  if (force) return true
  try {
    if (statSync(source).mtimeMs > statSync(output).mtimeMs) {
      return true
    }

    const outputProbe = probeQuietly(output)
    return !outputProbe || Math.abs(Number(outputProbe.format.duration) - sourceDuration) > 0.1
  } catch {
    return true
  }
}

const posterNeedsUpdate = (source, poster) => {
  if (force) return true
  try {
    return statSync(source).mtimeMs > statSync(poster).mtimeMs
  } catch {
    return true
  }
}

const fpsValue = (rate) => {
  const [numerator, denominator = '1'] = rate.split('/').map(Number)
  return numerator / denominator
}

const sha256 = (file) => new Promise((resolveHash, reject) => {
  const hash = createHash('sha256')
  const stream = createReadStream(file)
  stream.on('error', reject)
  stream.on('data', (chunk) => hash.update(chunk))
  stream.on('end', () => resolveHash(hash.digest('hex')))
})

const encodeVideo = ({ source, output, width, crf, maxrate, bufsize, gop, copyAudio }) => {
  const audioArgs = copyAudio ? ['-c:a', 'copy'] : ['-c:a', 'aac', '-b:a', '192k']
  run('ffmpeg', [
    '-hide_banner', '-y',
    '-i', source,
    '-map', '0:v:0',
    '-map', '0:a:0?',
    '-vf', `scale=${width}:-2:flags=lanczos`,
    '-c:v', 'libx264',
    '-profile:v', 'high',
    '-preset', 'slow',
    '-crf', String(crf),
    '-maxrate', maxrate,
    '-bufsize', bufsize,
    '-pix_fmt', 'yuv420p',
    '-g', String(gop),
    '-keyint_min', String(gop),
    '-sc_threshold', '0',
    '-force_key_frames', 'expr:gte(t,n_forced*2)',
    ...audioArgs,
    '-movflags', '+faststart',
    output,
  ], `${source} -> ${width}p`)
}

const manifest = {
  version: 1,
  generatedAt: new Date().toISOString(),
  assets: [],
}

for (const filename of files) {
  const source = join(sourceDir, filename)
  const high = join(highDir, filename)
  const standard = join(standardDir, filename)
  const poster = join(posterDir, filename.replace(/\.mp4$/i, '.jpg'))
  const sourceProbe = probe(source)
  const video = sourceProbe.streams.find((stream) => stream.codec_type === 'video')
  const audio = sourceProbe.streams.find((stream) => stream.codec_type === 'audio')
  const gop = Math.max(1, Math.round(fpsValue(video.r_frame_rate) * 2))
  const copyAudio = audio?.codec_name === 'aac'

  const sourceDuration = Number(sourceProbe.format.duration)

  if (needsUpdate(source, high, sourceDuration)) {
    encodeVideo({
      source,
      output: high,
      width: 1920,
      crf: 18,
      maxrate: '10M',
      bufsize: '20M',
      gop,
      copyAudio,
    })
  } else {
    console.log(`[media] current: 1080/${filename}`)
  }

  if (needsUpdate(source, standard, sourceDuration)) {
    encodeVideo({
      source,
      output: standard,
      width: 1280,
      crf: 21,
      maxrate: '4M',
      bufsize: '8M',
      gop,
      copyAudio,
    })
  } else {
    console.log(`[media] current: 720/${filename}`)
  }

  if (posterNeedsUpdate(source, poster)) {
    run('ffmpeg', [
      '-hide_banner', '-y',
      '-ss', '00:00:03',
      '-i', source,
      '-frames:v', '1',
      '-update', '1',
      '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease:flags=lanczos,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black',
      '-q:v', '2',
      poster,
    ], `${filename} -> poster`)
  }

  const outputs = []
  for (const [quality, output] of [['high', high], ['standard', standard], ['poster', poster]]) {
    const outputProbe = quality === 'poster' ? null : probe(output)
    outputs.push({
      quality,
      path: output.slice(sourceDir.length + 1).replaceAll('\\', '/'),
      bytes: statSync(output).size,
      sha256: await sha256(output),
      ...(outputProbe ? {
        duration: Number(outputProbe.format.duration),
        streams: outputProbe.streams,
      } : {}),
    })
  }

  manifest.assets.push({
    filename,
    sourceDuration,
    sourceFps: video.r_frame_rate,
    gop,
    outputs,
  })
}

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`\n[media] Seven 1080p HQ videos, seven 720p videos, posters, and manifest are ready.`)
