# Production Release Checklist

## Required Inputs

- Final HTTPS site URL for `VITE_PUBLIC_SITE_URL`.
- Final HTTPS R2 custom-domain prefix for `VITE_MEDIA_BASE_URL`.
- Cloudflare account access for Pages and R2.
- Written confirmation that the concert footage and credited reference assets may be published in this non-commercial fan experience.
- Public repository or release contact path for rights-holder removal requests.

## Media Upload

1. Upload `public/assets/user-media/video/msg/web/1080/*.mp4` to `<media-base>/1080/`.
2. Upload `public/assets/user-media/video/msg/web/720/*.mp4` to `<media-base>/720/`.
3. Upload `public/assets/user-media/video/msg/posters/*.jpg` to `<media-base>/posters/`.
4. Set MP4 content type to `video/mp4` and posters to `image/jpeg`.
5. Set versioned objects to `Cache-Control: public, max-age=31536000, immutable`.
6. Apply an R2 CORS policy based on `deploy/r2-cors.example.json` using the real site origin.
7. Run `npm run media:verify:remote` with the production media environment variable.

## Site Build

```powershell
$env:VITE_PUBLIC_SITE_URL='https://your-final-domain'
$env:VITE_MEDIA_BASE_URL='https://your-media-domain/live/v1'
npm run build:release
npm run test:e2e
```

Upload `dist/` to Cloudflare Pages. Do not upload the source or generated MP4 folders to Pages.

## Browser Acceptance

- Chrome and Edge at `1355x898` and `1440x1000`.
- Share succeeds or falls back to a copied/manual link.
- Every act starts in 1080P on desktop and can switch to 720P without losing its timestamp.
- Seek to roughly 10%, 50%, and 90% in both directions on all seven videos.
- Play/pause button, click-to-pause, Space, +/-10 seconds, volume, lock, exit, and control auto-hide all work.
- The seventh act enters the closing quote, signature, Archive, and ticket flow exactly once.
- Front, back, and both ticket downloads produce PNG files.
- DevTools shows no page errors, CSP violations, mixed content, missing fonts, or failed assets.
- Social preview resolves at `/og-preview.jpg` and metadata points to the final domain.

## Launch Gate

- `npm audit --audit-level=high` reports zero vulnerabilities.
- `npm test` passes.
- `npm run media:verify:decode` passes.
- `npm run media:verify:remote` passes against R2.
- `npm run build:release` reports no MP4 files and a bundle below 15 MiB.
- `npm run test:e2e` passes.
- Footage permission is confirmed before public media is made available.
- The site includes a visible non-official, non-commercial, rights-holder removal, and local-storage privacy notice.
- Rollback steps have been reviewed before DNS is changed.

If footage permission is not confirmed, do not publish the video media to a public CDN. A noindex static shell is still not a substitute for rights clearance.
