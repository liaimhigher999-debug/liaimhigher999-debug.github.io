# Production Release Checklist

## Required Inputs

- Final HTTPS site URL for `VITE_PUBLIC_SITE_URL`.
- Bilibili embeds for the seven public live acts.
- Cloudflare/R2 access only if publishing a separate private MP4 build.
- Written confirmation that the concert footage and credited reference assets may be published in this non-commercial fan experience.
- Public repository or release contact path for rights-holder removal requests.

## Public Video Embeds

1. Confirm the seven Bilibili embedded players load.
2. Confirm each Bilibili page remains public and playable.
3. Confirm the public site explains that video playback is provided by embedded Bilibili players and remains subject to Bilibili/rights-holder handling.

## Optional MP4 Media Upload

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
$env:VITE_LIVE_VIDEO_PROVIDER='bilibili'
npm run build:release
npm run test:e2e
```

Upload `dist/` to GitHub Pages or Cloudflare Pages. Do not upload the source or generated MP4 folders to Pages.

## Browser Acceptance

- Chrome and Edge at `1355x898` and `1440x1000`.
- Every public act opens its Bilibili embedded player after the entrance effect.
- Bilibili playback controls remain usable inside the embedded player.
- `BACK TO ACT`, `NEXT ACT`, and `FINISH THE NIGHT` move through the public live flow.
- The seventh act enters the closing quote, signature, Archive, and ticket flow exactly once.
- Front, back, and both ticket downloads produce PNG files.
- DevTools shows no page errors, CSP violations, mixed content, missing fonts, or failed assets.
- Social preview resolves at `/og-preview.jpg` and metadata points to the final domain.

## Launch Gate

- `npm audit --audit-level=high` reports zero vulnerabilities.
- `npm test` passes.
- For private MP4 releases only, `npm run media:verify:decode` passes.
- `npm run build:release` reports no MP4 files and a bundle below 15 MiB.
- `npm run test:e2e` passes.
- Footage permission is confirmed before public media is made available.
- The site includes a visible non-official, non-commercial, rights-holder removal, and local-storage privacy notice.
- Rollback steps have been reviewed before DNS is changed.

If footage permission is not confirmed, do not publish the video media to a public CDN. A noindex static shell is still not a substitute for rights clearance.
