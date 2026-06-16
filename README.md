# The Night You Were Here

A non-official, non-commercial The 1975 fan tribute: five album rooms, seven live acts, and a personal archive ticket.

## Public Notice

This project is an independent fan work. It is not affiliated with, endorsed by, sponsored by, or officially connected to The 1975, Dirty Hit, Polydor, Interscope, or any related rights holder.

The 1975 name, album artwork, song titles, lyrics, concert footage, recordings, trademarks, and related materials belong to their respective rights holders. This site does not sell tickets, merchandise, audio, video, advertising, subscriptions, or any other commercial product.

If you are a rights holder and want credited material removed, replaced, or corrected, contact the site owner through the public repository or release channel. The relevant material should be taken down promptly after a valid request.

## Privacy

The fan nickname, journey progress, selected ticket style, and audio settings are stored only in the visitor's browser local storage. This static site has no account system, no backend database, and no intentional analytics collection.

## Media Deployment

Do not commit concert video files to this repository. The release build is designed to publish the static site shell separately from video media:

- static site: GitHub Pages, Cloudflare Pages, or another static host
- video media: an HTTPS object storage/CDN origin that supports HTTP Range requests

For production, set:

```powershell
$env:VITE_PUBLIC_SITE_URL='https://your-final-domain'
$env:VITE_MEDIA_BASE_URL='https://your-media-domain/live/v1'
npm run build:release
```

The release script fails if `dist/` contains MP4 files or unresolved release tokens.

## GitHub Pages

This repository includes `.github/workflows/deploy-pages.yml`. After creating the GitHub repository:

1. Enable GitHub Pages with **Source: GitHub Actions**.
2. Add repository variables:
   - `VITE_MEDIA_BASE_URL`: final HTTPS media prefix
   - `VITE_PUBLIC_SITE_URL`: optional override when using a custom domain
3. Push `main`.

Use a root Pages site such as `https://<username>.github.io/` or a custom domain. A project path such as `https://<username>.github.io/<repo>/` needs extra base-path work because the current app uses root-relative static asset URLs.

## Local Development

```powershell
npm install
npm run dev
```

Local video files can live under `public/assets/user-media/video/msg/`. That folder is ignored by Git except for its README.

## Verification

```powershell
npm test
npm run media:verify
npm run build
npm run test:e2e
```

Before a public release, also run `npm run build:release` with HTTPS production environment variables and verify remote media with `npm run media:verify:remote`.
