/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MEDIA_BASE_URL?: string
  readonly VITE_PUBLIC_SITE_URL?: string
  readonly VITE_LIVE_VIDEO_PROVIDER?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
