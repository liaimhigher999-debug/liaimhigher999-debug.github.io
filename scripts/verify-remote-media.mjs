const baseUrl = process.env.VITE_MEDIA_BASE_URL?.trim().replace(/\/+$/, '')
if (!baseUrl) {
  console.error('[remote-media] VITE_MEDIA_BASE_URL is required.')
  process.exit(1)
}

const files = [
  '01-happiness.mp4',
  '02-if-youre-too-shy.mp4',
  '03-its-not-living.mp4',
  '04-paris.mp4',
  '05-robbers.mp4',
  '06-the-sound.mp4',
  '07-when-we-are-together.mp4',
]

const failures = []
for (const quality of ['1080', '720']) {
  for (const filename of files) {
    const url = `${baseUrl}/${quality}/${filename}`
    try {
      const response = await fetch(url, { headers: { Range: 'bytes=0-1023' } })
      const contentRange = response.headers.get('content-range')
      const acceptRanges = response.headers.get('accept-ranges')
      const contentType = response.headers.get('content-type')
      const bytes = new Uint8Array(await response.arrayBuffer())

      if (response.status !== 206) failures.push(`${url}: expected 206, received ${response.status}`)
      if (acceptRanges !== 'bytes') failures.push(`${url}: missing Accept-Ranges: bytes`)
      if (!contentRange?.startsWith('bytes 0-1023/')) failures.push(`${url}: invalid Content-Range`)
      if (!contentType?.startsWith('video/mp4')) failures.push(`${url}: invalid Content-Type`)
      if (bytes.length !== 1024) failures.push(`${url}: expected 1024 bytes, received ${bytes.length}`)
      console.log(`[remote-media] ${quality}/${filename} ${response.status} ${contentRange ?? ''}`)
    } catch (error) {
      failures.push(`${url}: ${error instanceof Error ? error.message : error}`)
    }
  }
}

if (failures.length) {
  console.error('\nRemote media verification failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('\n[remote-media] All 14 production videos support byte-range playback.')
