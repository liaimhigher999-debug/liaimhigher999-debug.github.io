# User media slots

This directory is intentionally ignored except for this file. Add local,
non-commercial media here, then enable the matching cue or scene in
`src/data/experience.ts`.

Do not commit these media files. Do not publish them to a public CDN unless you
have confirmed the rights needed for public streaming in this fan experience.

The album rooms and live waiting scenes are intentionally silent. Live videos
use their own concert audio.

## Seven-scene live tour videos

```text
video/msg/01-happiness.mp4
video/msg/02-if-youre-too-shy.mp4
video/msg/03-its-not-living.mp4
video/msg/04-paris.mp4
video/msg/05-robbers.mp4
video/msg/06-the-sound.mp4
video/msg/07-when-we-are-together.mp4
```

Run `npm run media:prepare` after replacing a source edit. It creates 1080p HQ
and 720p H.264 variants under `video/msg/web/1080/` and `video/msg/web/720/`,
plus JPEG posters and `media-manifest.json`, without changing the originals.

Run `npm run media:verify` before publishing. Production releases use
`VITE_MEDIA_BASE_URL` and keep every MP4 outside the static site bundle.
