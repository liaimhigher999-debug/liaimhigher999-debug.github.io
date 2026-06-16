# The Night You Were Here

A non-official, non-commercial The 1975 fan tribute: five album rooms, seven live acts, and a personal archive ticket.

## Public Notice

This project is an independent fan work. It is not affiliated with, endorsed by, sponsored by, or officially connected to The 1975, Dirty Hit, Polydor, Interscope, or any related rights holder.

The 1975 name, album artwork, song titles, lyrics, concert footage, recordings, trademarks, and related materials belong to their respective rights holders. This site does not sell tickets, merchandise, audio, video, advertising, subscriptions, or any other commercial product.

If you are a rights holder and want credited material removed, replaced, or corrected, contact the site owner through the public repository or release channel. The relevant material should be taken down promptly after a valid request.

## Privacy

The fan nickname, journey progress, selected ticket style, and audio settings are stored only in the visitor's browser local storage. This static site has no account system, no backend database, and no intentional analytics collection.

## Media Deployment

Do not commit concert video files to this repository. The public release build uses Bilibili embedded players by default. The local MP4 workflow remains available for private development and testing.

For the public GitHub Pages build:

```powershell
$env:VITE_PUBLIC_SITE_URL='https://your-final-domain'
$env:VITE_LIVE_VIDEO_PROVIDER='bilibili'
npm run build:release
```

For a private/local MP4 release build, also set `VITE_LIVE_VIDEO_PROVIDER=local` and `VITE_MEDIA_BASE_URL` to an HTTPS media prefix that supports Range requests.

The release script fails if `dist/` contains MP4 files or unresolved release tokens.

## GitHub Pages

This repository includes `.github/workflows/deploy-pages.yml`. The public GitHub Pages build uses Bilibili embeds by default, so it does not need an R2 media domain.

1. Enable GitHub Pages with **Source: GitHub Actions**.
2. Optional: add `VITE_PUBLIC_SITE_URL` only when using a custom domain.
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
