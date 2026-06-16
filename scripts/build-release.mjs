import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const maxDistBytes = 15 * 1024 * 1024
const maxAssetBytes = 25 * 1024 * 1024

const requireHttps = (name) => {
  const value = process.env[name]?.trim().replace(/\/+$/, '')
  if (!value) throw new Error(`${name} is required for release builds.`)
  const url = new URL(value)
  if (url.protocol !== 'https:') throw new Error(`${name} must use HTTPS.`)
  return value
}

const run = (command, args, label) => {
  console.log(`\n[release] ${label}`)
  const npmCli = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')
  const executable = command === 'npm' ? process.execPath : command
  const commandArgs = command === 'npm' ? [npmCli, ...args] : args
  const result = spawnSync(executable, commandArgs, {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
  })
  if (result.error) {
    console.error(`[release] ${result.error.message}`)
    process.exit(1)
  }
  if (result.status !== 0) process.exit(result.status ?? 1)
}

const walk = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = join(directory, entry.name)
  return entry.isDirectory() ? walk(path) : [path]
})

let publicSiteUrl
let mediaBaseUrl
try {
  publicSiteUrl = requireHttps('VITE_PUBLIC_SITE_URL')
  mediaBaseUrl = requireHttps('VITE_MEDIA_BASE_URL')
} catch (error) {
  console.error(`[release] ${error instanceof Error ? error.message : error}`)
  process.exit(1)
}

run('npm', ['test'], 'unit tests')
run('npm', ['run', 'media:verify'], 'media metadata verification')
run('npm', ['run', 'build'], 'production application build')

const mediaOrigin = new URL(mediaBaseUrl).origin
for (const filename of ['index.html', 'robots.txt', 'sitemap.xml', '_headers']) {
  const file = join(dist, filename)
  const content = readFileSync(file, 'utf8')
    .replaceAll('__PUBLIC_SITE_URL__', publicSiteUrl)
    .replaceAll('__MEDIA_ORIGIN__', mediaOrigin)
  writeFileSync(file, content)
}

const files = walk(dist)
const unresolvedTokens = files
  .filter((file) => ['.html', '.txt', '.xml', ''].includes(extname(file)))
  .filter((file) => readFileSync(file, 'utf8').includes('__PUBLIC_SITE_URL__') || readFileSync(file, 'utf8').includes('__MEDIA_ORIGIN__'))
if (unresolvedTokens.length) {
  console.error(`[release] unresolved release tokens:\n${unresolvedTokens.join('\n')}`)
  process.exit(1)
}

const localAssetReferences = new Set()
for (const file of files.filter((path) => ['.html', '.css', '.js'].includes(extname(path)))) {
  const content = readFileSync(file, 'utf8')
  for (const match of content.matchAll(/["'(](\/assets\/[^"')?#]+)/g)) {
    localAssetReferences.add(match[1])
  }
}

const missingAssets = [...localAssetReferences].filter((reference) => !existsSync(join(dist, reference.slice(1))))
if (missingAssets.length) {
  console.error(`[release] missing local assets:\n${missingAssets.join('\n')}`)
  process.exit(1)
}

const videos = files.filter((file) => extname(file).toLowerCase() === '.mp4')
if (videos.length) {
  console.error(`[release] dist must not contain MP4 files:\n${videos.join('\n')}`)
  process.exit(1)
}

const oversized = files.filter((file) => statSync(file).size > maxAssetBytes)
if (oversized.length) {
  console.error(`[release] static assets exceed 25 MiB:\n${oversized.join('\n')}`)
  process.exit(1)
}

const totalBytes = files.reduce((sum, file) => sum + statSync(file).size, 0)
if (totalBytes > maxDistBytes) {
  console.error(`[release] dist is ${(totalBytes / 1024 / 1024).toFixed(1)} MiB; limit is 15 MiB.`)
  process.exit(1)
}

console.log(`[release] Ready: ${files.length} files, ${(totalBytes / 1024 / 1024).toFixed(1)} MiB, no bundled video.`)
