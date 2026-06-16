import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { networkInterfaces } from 'node:os'
import { extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const host = '0.0.0.0'
const port = 5173
const root = resolve(fileURLToPath(new URL('../dist/', import.meta.url)))
const fallback = join(root, 'index.html')

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.ogg': 'audio/ogg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
}

const sendFile = (request, response, filePath) => {
  const stats = statSync(filePath)
  const contentType = contentTypes[extname(filePath)] ?? 'application/octet-stream'
  const range = request.headers.range

  if (!range) {
    response.writeHead(200, {
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
      'Content-Length': stats.size,
      'Content-Type': contentType,
    })

    if (request.method === 'HEAD') {
      response.end()
      return
    }

    createReadStream(filePath).pipe(response)
    return
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range)
  if (!match) {
    response.writeHead(416, {
      'Content-Range': `bytes */${stats.size}`,
    })
    response.end()
    return
  }

  const [, rawStart, rawEnd] = match
  let start = rawStart ? Number(rawStart) : 0
  let end = rawEnd ? Number(rawEnd) : stats.size - 1

  if (!rawStart && rawEnd) {
    start = Math.max(stats.size - Number(rawEnd), 0)
    end = stats.size - 1
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start < 0 || end >= stats.size) {
    response.writeHead(416, {
      'Content-Range': `bytes */${stats.size}`,
    })
    response.end()
    return
  }

  response.writeHead(206, {
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-cache',
    'Content-Length': end - start + 1,
    'Content-Range': `bytes ${start}-${end}/${stats.size}`,
    'Content-Type': contentType,
  })

  if (request.method === 'HEAD') {
    response.end()
    return
  }

  createReadStream(filePath, { start, end }).pipe(response)
}

if (!existsSync(fallback)) {
  throw new Error('dist/index.html is missing. Run npm.cmd run build first.')
}

createServer((request, response) => {
  const pathname = new URL(request.url ?? '/', `http://${host}:${port}`).pathname
  const requestedPath = pathname === '/' ? 'index.html' : pathname.slice(1)
  const candidate = resolve(root, requestedPath)

  if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) {
    response.writeHead(403)
    response.end('Forbidden')
    return
  }

  const filePath = existsSync(candidate) && statSync(candidate).isFile() ? candidate : fallback
  sendFile(request, response, filePath)
}).listen(port, host, () => {
  console.log(`The 1975 local site is available at http://127.0.0.1:${port}/`)

  const addresses = Object.values(networkInterfaces())
    .flat()
    .filter((address) => address?.family === 'IPv4' && !address.internal)
    .map((address) => address.address)

  addresses.forEach((address) => {
    console.log(`Phone preview on the same Wi-Fi: http://${address}:${port}/`)
  })
})
