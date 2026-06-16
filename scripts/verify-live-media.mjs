import { closeSync, openSync, readSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = join(root, 'public', 'assets', 'user-media', 'video', 'msg')
const files = [
  '01-happiness.mp4',
  '02-if-youre-too-shy.mp4',
  '03-its-not-living.mp4',
  '04-paris.mp4',
  '05-robbers.mp4',
  '06-the-sound.mp4',
  '07-when-we-are-together.mp4',
]
const decode = process.argv.includes('--decode')

const run = (command, args, label) => {
  const result = spawnSync(command, args, { encoding: 'utf8' })
  if (result.status !== 0) {
    throw new Error(`${label}\n${result.stderr || result.stdout}`)
  }
  return result.stdout
}

const probe = (file) => JSON.parse(run('ffprobe', [
  '-v', 'error',
  '-show_entries', 'format=duration:stream=codec_type,codec_name,width,height,pix_fmt',
  '-of', 'json',
  file,
], `Could not probe ${file}`))

const keyframeGap = (file) => {
  const output = run('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-skip_frame', 'nokey',
    '-show_entries', 'frame=best_effort_timestamp_time',
    '-of', 'csv=p=0',
    file,
  ], `Could not inspect keyframes in ${file}`)
  const times = output.split(/\r?\n/).map(Number).filter(Number.isFinite)
  return times.slice(1).reduce((max, time, index) => Math.max(max, time - times[index]), 0)
}

const hasFastStart = (file) => {
  const descriptor = openSync(file, 'r')
  const bytes = Buffer.alloc(Math.min(statSync(file).size, 4 * 1024 * 1024))
  try {
    readSync(descriptor, bytes, 0, bytes.length, 0)
  } finally {
    closeSync(descriptor)
  }
  const text = bytes.toString('latin1')
  const moov = text.indexOf('moov')
  const mdat = text.indexOf('mdat')
  return moov >= 0 && mdat >= 0 && moov < mdat
}

const failures = []
for (const filename of files) {
  const source = probe(join(sourceDir, filename))
  const sourceDuration = Number(source.format.duration)

  for (const [quality, width, height] of [['1080', 1920, 1080], ['720', 1280, 720]]) {
    const file = join(sourceDir, 'web', quality, filename)
    try {
      const metadata = probe(file)
      const video = metadata.streams.find((stream) => stream.codec_type === 'video')
      const audio = metadata.streams.find((stream) => stream.codec_type === 'audio')
      const durationDelta = Math.abs(Number(metadata.format.duration) - sourceDuration)
      const gap = keyframeGap(file)

      if (video?.codec_name !== 'h264') failures.push(`${quality}/${filename}: video is not H.264`)
      if (video?.width !== width || video?.height !== height) failures.push(`${quality}/${filename}: expected ${width}x${height}`)
      if (video?.pix_fmt !== 'yuv420p') failures.push(`${quality}/${filename}: expected yuv420p`)
      if (audio && audio.codec_name !== 'aac') failures.push(`${quality}/${filename}: audio is not AAC`)
      if (durationDelta > 0.1) failures.push(`${quality}/${filename}: duration changed by ${durationDelta.toFixed(3)}s`)
      if (gap > 2.2) failures.push(`${quality}/${filename}: keyframe gap is ${gap.toFixed(3)}s`)
      if (!hasFastStart(file)) failures.push(`${quality}/${filename}: moov atom is not before mdat`)

      if (decode) {
        run('ffmpeg', ['-v', 'error', '-xerror', '-i', file, '-f', 'null', 'NUL'], `Decode failed for ${file}`)
      }

      console.log(`[verify] ${quality}/${filename} ${Number(metadata.format.duration).toFixed(1)}s keyframe<=${gap.toFixed(2)}s`)
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error))
    }
  }

  const poster = join(sourceDir, 'posters', filename.replace(/\.mp4$/i, '.jpg'))
  try {
    const posterProbe = probe(poster)
    const image = posterProbe.streams.find((stream) => stream.codec_type === 'video')
    if (image?.width !== 1280 || image?.height !== 720) failures.push(`${filename}: poster must be 1280x720`)
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error))
  }
}

if (failures.length) {
  console.error('\nMedia verification failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`\n[verify] All live media passed${decode ? ' metadata and full decode checks' : ' metadata checks'}.`)
