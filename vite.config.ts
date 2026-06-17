import { createLogger, defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, createReadStream, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, Plugin } from 'vite'

const configDir = dirname(fileURLToPath(import.meta.url))
const videoRoute = '/assets/user-media/video/msg/'
const videoRoot = resolve(configDir, 'public/assets/user-media/video/msg')
const serveVideoRange = (request: IncomingMessage, response: ServerResponse, next: Connect.NextFunction) => {
  const url = request.url ? new URL(request.url, 'http://localhost') : null
  if (!url?.pathname.startsWith(videoRoute) || !url.pathname.endsWith('.mp4')) {
    next()
    return
  }

  const relativePath = decodeURIComponent(url.pathname.slice(videoRoute.length))
  const filePath = resolve(videoRoot, relativePath)
  if (!filePath.startsWith(videoRoot) || !existsSync(filePath)) {
    next()
    return
  }

  const stat = statSync(filePath)
  const range = request.headers.range
  response.setHeader('Accept-Ranges', 'bytes')
  response.setHeader('Cache-Control', 'no-cache')
  response.setHeader('Content-Type', 'video/mp4')

  if (!range) {
    response.statusCode = 200
    response.setHeader('Content-Length', stat.size)
    if (request.method === 'HEAD') {
      response.end()
      return
    }

    createReadStream(filePath).pipe(response)
    return
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range)
  if (!match) {
    response.statusCode = 416
    response.setHeader('Content-Range', `bytes */${stat.size}`)
    response.end()
    return
  }

  const [, rawStart, rawEnd] = match
  let start = rawStart ? Number(rawStart) : 0
  let end = rawEnd ? Number(rawEnd) : stat.size - 1

  if (!rawStart && rawEnd) {
    start = Math.max(stat.size - Number(rawEnd), 0)
    end = stat.size - 1
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start < 0 || end >= stat.size) {
    response.statusCode = 416
    response.setHeader('Content-Range', `bytes */${stat.size}`)
    response.end()
    return
  }

  response.statusCode = 206
  response.setHeader('Content-Length', end - start + 1)
  response.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`)
  if (request.method === 'HEAD') {
    response.end()
    return
  }

  createReadStream(filePath, { start, end }).pipe(response)
}

const videoRangePlugin = (): Plugin => ({
  name: 'local-video-range',
  configureServer(server) {
    server.middlewares.use(serveVideoRange)
  },
  configurePreviewServer(server) {
    server.middlewares.use(serveVideoRange)
  },
})

const siteMetaPlugin = (publicSiteUrl: string): Plugin => ({
  name: 'site-meta-url',
  transformIndexHtml(html) {
    return html.split('__PUBLIC_SITE_URL__').join(publicSiteUrl.replace(/\/+$/, ''))
  },
})

const copyReleasePublicPlugin = (enabled: boolean): Plugin => {
  let outputRoot = resolve(configDir, 'dist')
  const publicRoot = resolve(configDir, 'public')
  const excludedRoot = resolve(publicRoot, 'assets/user-media')

  const copyDirectory = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const source = join(directory, entry.name)
      if (source === excludedRoot || source.startsWith(`${excludedRoot}\\`) || source.startsWith(`${excludedRoot}/`)) {
        continue
      }

      const destination = resolve(outputRoot, relative(publicRoot, source))
      if (entry.isDirectory()) {
        mkdirSync(destination, { recursive: true })
        copyDirectory(source)
      } else {
        mkdirSync(dirname(destination), { recursive: true })
        copyFileSync(source, destination)
      }
    }
  }

  return {
    name: 'copy-release-public-without-media',
    config() {
      return enabled ? { publicDir: false } : undefined
    },
    configResolved(config) {
      outputRoot = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      if (!enabled) {
        return
      }

      copyDirectory(publicRoot)
    },
  }
}

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, configDir, '')
  const liveVideoProvider = environment.VITE_LIVE_VIDEO_PROVIDER || (mode === 'production' ? 'bilibili' : 'local')
  const externalMedia = environment.VITE_MEDIA_BASE_URL?.startsWith('https://') ?? false
  const friendPackage = environment.VITE_FRIEND_PACKAGE === 'true'
  const excludeUserMedia = externalMedia || liveVideoProvider === 'bilibili' || friendPackage
  const publicSiteUrl = environment.VITE_PUBLIC_SITE_URL || 'http://127.0.0.1:5173'
  const logger = createLogger()
  const warn = logger.warn
  logger.warn = (message, options) => {
    if (externalMedia && message.includes("didn't resolve at build time") && message.includes('/assets/')) {
      return
    }
    warn(message, options)
  }

  return {
    customLogger: logger,
    plugins: [
      videoRangePlugin(),
      siteMetaPlugin(publicSiteUrl),
      copyReleasePublicPlugin(excludeUserMedia),
      react(),
    ],
  }
})
