# Production Launch Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix sharing reliably, serve the seven concert videos at desktop-first 1080p quality with dependable seeking, and take the complete fan experience through a production-grade launch audit and deployment.

**Architecture:** Keep the Vite/React application as a small static site, but move all concert video variants to a dedicated Cloudflare R2 custom domain. The player receives explicit 1080p and 720p sources from environment-driven media URLs; sharing and media verification move into small testable modules. Cloudflare Pages serves the site shell, while R2/CDN serves versioned video objects with byte-range support and long-lived caching.

**Tech Stack:** React 19, TypeScript, Vite 6, Vitest, Playwright, FFmpeg/ffprobe, Cloudflare Pages, Cloudflare R2.

---

## Audit Baseline

- Current unit baseline: `37` tests pass and `npm run build` succeeds.
- The current share flow has a confirmed failure: when `navigator.share()` exists but rejects, it reports `SHARE CANCELLED` and never attempts clipboard fallback.
- All seven current production video files are `1280x720`, not 1080p. They range from `52.2 MB` to `99.6 MB` and dominate the `483.7 MB` build.
- All seven current Web MP4 files are H.264/AAC, have `moov` before `mdat`, and preserve the edited source durations.
- The edited 1080p masters use keyframe gaps of roughly `8.3s` (`8.6s` on the 23.976 fps clip), so production variants need a shorter fixed GOP to make long-distance seeking consistently responsive.
- Local serving correctly returns `206 Partial Content`, `Accept-Ranges: bytes`, and a valid `Content-Range`.
- The application has no browser end-to-end suite, no media integrity command, no production social metadata, and loads Google Fonts from an external runtime import.
- Cloudflare Pages cannot host these video objects directly because its documented maximum single asset size is `25 MiB`; videos must be separated from the Pages deployment.

## Assumptions And Release Decisions

- Desktop is the primary launch target. Mobile receives a smoke test, not a redesign.
- The seven edited source videos in `public/assets/user-media/video/msg/` remain untouched.
- Desktop defaults to `1080P HQ`; `720P` is available as a fallback and manual quality choice.
- Videos are stored under a versioned R2 path such as `/live/v1/1080/01-happiness.mp4` so production objects can be cached immutably.
- The site itself is deployed to Cloudflare Pages over HTTPS; videos use an R2 custom domain on the same parent domain when possible.
- The final public domain and media domain are release inputs. Production builds must fail clearly when either required environment variable is missing.
- Concert footage must be cleared for public use before launch. The site remains identified as a non-commercial fan project.

## Task 1: Make Sharing Reliable And Testable

**Files:**
- Create: `src/domain/share.ts`
- Create: `src/domain/share.test.ts`
- Modify: `src/App.tsx`

- [ ] Extract a `shareNight()` function from `ArchiveExperience` into `src/domain/share.ts`.
- [ ] Define a small result union: `shared`, `copied`, `cancelled`, or `failed`.
- [ ] Build the public share URL from `VITE_PUBLIC_SITE_URL` in production and `window.location.origin + window.location.pathname` during local development.
- [ ] Attempt Web Share first only when `navigator.share` exists.
- [ ] Treat `AbortError` as a genuine user cancellation and do not show an error.
- [ ] When Web Share throws any other error, continue automatically to clipboard copy.
- [ ] Attempt `navigator.clipboard.writeText()` only in a secure context.
- [ ] Add a final hidden-textarea plus `document.execCommand('copy')` fallback for browsers where Clipboard is unavailable or denied.
- [ ] Return `failed` only after all automatic routes fail; reveal a compact selectable URL field so the visitor can copy manually.
- [ ] Keep the existing visual language and map results to `NIGHT SHARED`, `LINK COPIED`, `SHARE CANCELLED`, or `COPY THIS LINK`.
- [ ] Reuse the same copy helper in `ArchiveDrawer`; remove its separate fragile clipboard-only implementation.
- [ ] Add unit tests covering native success, native rejection followed by clipboard success, Clipboard rejection followed by legacy copy, explicit `AbortError`, and total failure.
- [ ] Verify: `npm test -- src/domain/share.test.ts`.

## Task 2: Add Production URL Configuration

**Files:**
- Create: `src/env.ts`
- Create: `src/vite-env.d.ts`
- Create: `.env.production.example`
- Modify: `src/data/experience.ts`
- Modify: `vite.config.ts`

- [ ] Add typed `VITE_PUBLIC_SITE_URL` and `VITE_MEDIA_BASE_URL` environment variables.
- [ ] Normalize trailing slashes once in `src/env.ts`.
- [ ] Keep local development compatible by falling back to `/assets/user-media/video/msg` only outside production.
- [ ] In production, throw a clear build-time error when either URL is absent or is not HTTPS.
- [ ] Change the live-scene data helper to compose poster and video URLs from the configured media base.
- [ ] Keep filenames stable so replacing an edit only requires rerunning the media pipeline and uploading the new versioned prefix.
- [ ] Update source-path tests to assert HTTPS media URLs in production configuration and no Windows absolute paths.
- [ ] Verify: `npm test -- src/domain/experience.test.ts` and `npm run build` with production environment values set.

## Task 3: Produce 1080p HQ And 720p Fallback Variants

**Files:**
- Modify: `scripts/prepare-live-media.mjs`
- Create: `scripts/verify-live-media.mjs`
- Modify: `package.json`
- Generated, ignored: `public/assets/user-media/video/msg/web/1080/`
- Generated, ignored: `public/assets/user-media/video/msg/web/720/`
- Generated, ignored: `public/assets/user-media/video/msg/posters/`
- Generated, ignored: `public/assets/user-media/video/msg/media-manifest.json`

- [ ] Use `ffprobe` to read each source frame rate and calculate a two-second GOP (`60` frames at 30 fps, `48` at 23.976 fps).
- [ ] Generate `1080P HQ` as H.264 High Profile, source frame rate, `1920x1080`, CRF `18`, preset `slow`, maximum video rate `10 Mbps`, buffer `20 Mbps`, `yuv420p`, two-second fixed keyframes, and `+faststart`.
- [ ] Copy the existing AAC audio stream when compatible to avoid another lossy audio encode; otherwise encode AAC at `192 kbps`.
- [ ] Generate `720P` as H.264 High Profile, `1280x720`, CRF `21`, preset `slow`, maximum video rate `4 Mbps`, buffer `8 Mbps`, `yuv420p`, the same two-second keyframe cadence, and `+faststart`.
- [ ] Generate one `1280x720` JPEG poster per scene from a verified non-black frame between seconds `2` and `5`.
- [ ] Write a manifest containing filename, duration, dimensions, fps, codecs, bitrate, byte size, and SHA-256 for every output.
- [ ] Preserve the current edited durations exactly within `0.1s`; fail the script on mismatch.
- [ ] Add `npm run media:verify` to validate all 14 variants and seven posters.
- [ ] Make verification fail on missing streams, dimensions, non-H.264 video, non-AAC audio, non-`yuv420p`, missing faststart, duration mismatch, or keyframe intervals over `2.2s`.
- [ ] Make `npm run media:verify` run `ffmpeg -v error -xerror -i "$file" -f null NUL` for every generated MP4.
- [ ] Record VMAF or SSIM against each source; require VMAF `>=95` for the 1080p variant unless the source itself contains a lower-quality encode that cannot be improved.
- [ ] Verify: `npm run media:prepare -- --force` then `npm run media:verify`.

## Task 4: Add Explicit Quality Selection Without Regressing Controls

**Files:**
- Modify: `src/data/types.ts`
- Modify: `src/data/experience.ts`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src/domain/experience.test.ts`

- [ ] Replace the single `MediaAsset.src` with `sources.high` and `sources.standard`, while retaining one poster and alt text.
- [ ] Default to `high` on desktop.
- [ ] Default to `standard` only when `navigator.connection.saveData` is true or `effectiveType` is `2g`/`slow-2g`; do not silently reduce quality for ordinary desktop connections.
- [ ] Add a restrained `1080P / 720P` selector inside the existing player controls.
- [ ] When quality changes, capture `currentTime`, paused state, volume, and control lock state; switch the source; restore time after `loadedmetadata`; resume only if the video was previously playing.
- [ ] Keep the existing play/pause, screen-click pause, Space key, +/-10 seconds, draggable progress, volume, exit, lock, and auto-hide behavior unchanged.
- [ ] Continue preloading only metadata for the current and next scene; preload the first scene during the Box transition.
- [ ] Do not use a Service Worker for the large videos.
- [ ] Add tests for source selection and state restoration after a quality switch.
- [ ] Verify manually that a quality switch at 40%, while paused and while playing, returns to the same timestamp within `0.25s`.

## Task 5: Remove Videos From The Pages Build

**Files:**
- Modify: `vite.config.ts`
- Modify: `.gitignore`
- Modify: `public/assets/user-media/README.md`
- Create: `scripts/build-release.mjs`
- Modify: `package.json`

- [ ] Change the existing prune plugin so every generated MP4 directory is excluded from `dist`, not only the seven source files.
- [ ] Keep posters in R2 with the videos so media URLs have one origin and one cache policy.
- [ ] Add `npm run build:release` that validates environment variables, runs unit tests, runs media manifest verification, builds the app, and confirms there are no `.mp4` files in `dist`.
- [ ] Fail release builds when `dist` exceeds `15 MB` before source maps or when an individual static shell asset exceeds the target hosting limit.
- [ ] Keep all source and generated media ignored by Git.
- [ ] Inspect and remove the accidental root artifact `window.innerWidth})` only after confirming it is not referenced.
- [ ] Verify: `npm run build:release`; expected `dist` contains the site shell and images only.

## Task 6: Configure R2/CDN For Smooth Seeking

**Deployment configuration:** Cloudflare dashboard or infrastructure repository.

- [ ] Create a private R2 bucket for the seven video sets and posters.
- [ ] Attach a custom media domain; do not use the rate-limited development URL for production traffic.
- [ ] Upload files under a versioned prefix such as `/live/v1/1080/`, `/live/v1/720/`, and `/live/v1/posters/`.
- [ ] Set `Content-Type: video/mp4` for MP4 and `image/jpeg` for posters.
- [ ] Set `Cache-Control: public, max-age=31536000, immutable` on versioned media objects.
- [ ] Configure CORS to allow `GET`, `HEAD`, and `Range` requests from the final site origin.
- [ ] Confirm the CDN returns `206 Partial Content`, `Accept-Ranges: bytes`, and the requested `Content-Range`.
- [ ] Confirm a request near the end of each video returns quickly and does not download the file from byte zero.
- [ ] Confirm media URLs do not expose source-directory listings or credentials.
- [ ] Verify with: `curl -I -H "Range: bytes=0-1023" "$VITE_MEDIA_BASE_URL/live/v1/1080/01-happiness.mp4"`.
- [ ] Repeat the range check for all 14 MP4 objects before release.

## Task 7: Add Browser-Level Regression Coverage

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/share.spec.ts`
- Create: `e2e/video-player.spec.ts`
- Create: `e2e/journey.spec.ts`
- Create: `e2e/archive.spec.ts`
- Modify: `package.json`

- [ ] Install Playwright as a dev dependency and pin the browser version in the lockfile.
- [ ] Add `npm run test:e2e` against `vite preview` or `scripts/serve-dist.mjs`.
- [ ] Test share success, system-share rejection with clipboard fallback, clipboard denial with legacy fallback, and user cancellation.
- [ ] Test all video controls: play/pause button, Space, click-to-pause, drag seek forward, drag seek backward, +/-10, volume, lock, exit, and auto-hide/reveal.
- [ ] Assert `video.currentTime` tracks the progress control after seeking, not merely the visual thumb position.
- [ ] Test video end advances exactly once and the seventh scene enters the quote, signature, and Archive flow.
- [ ] Test ticket front, back, and vertical two-sided PNG downloads.
- [ ] Test localStorage restoration and reset behavior.
- [ ] Test Archive album cards and full track-list reveals.
- [ ] Run visual/overlap checks at `1355x898` and `1440x1000`; add a `390x844` smoke test only.
- [ ] Run a reduced-motion flow and assert no blocked navigation.
- [ ] Fail tests on uncaught page errors, console errors, missing local assets, or failed media requests.
- [ ] Verify: `npm run test:e2e`.

## Task 8: Finish Public Metadata, Fonts, And Security Headers

**Files:**
- Modify: `index.html`
- Create: `public/og-preview.jpg`
- Create: `public/robots.txt`
- Create: `public/sitemap.xml`
- Create: `public/_headers`
- Modify: `src/styles.css`
- Add self-hosted font files under: `public/assets/fonts/`

- [ ] Add a concise bilingual description, canonical URL, `theme-color`, Open Graph tags, and Twitter card tags.
- [ ] Use a dedicated `1200x630` social preview that remains legible in light and dark share surfaces.
- [ ] Ensure the document title and metadata are stored as valid UTF-8 and contain no mojibake.
- [ ] Replace the runtime Google Fonts import with self-hosted WOFF2 files for Cormorant Garamond, IBM Plex Mono, and the selected Chinese serif.
- [ ] Keep robust local fallbacks for every font family.
- [ ] Add `robots.txt` and `sitemap.xml` using the final public site URL.
- [ ] Add security headers: Content Security Policy, `X-Content-Type-Options: nosniff`, strict referrer policy, and a narrow Permissions Policy.
- [ ] Add cache rules: HTML revalidates, hashed JS/CSS are immutable, and ordinary images receive a long cache.
- [ ] Allow the media custom domain in CSP `media-src` and `img-src`.
- [ ] Verify the production page with browser DevTools: no CSP violations, mixed content, blocked fonts, or missing preview image.

## Task 9: Complete Accessibility And Interaction Audit

**Files:**
- Modify only the components/styles implicated by audit findings in `src/App.tsx` and `src/styles.css`.

- [ ] Keyboard-walk the full journey and confirm focus is visible and follows phase transitions.
- [ ] Confirm every icon-only player control has an accessible name and tooltip where needed.
- [ ] Confirm focus cannot reach auto-hidden or locked controls.
- [ ] Confirm modal/drawer focus returns to the element that opened it.
- [ ] Confirm Chinese and English text do not overflow at the two desktop acceptance sizes.
- [ ] Check color contrast for pink, network-color, and photographic introduction surfaces.
- [ ] Confirm motion reduction preserves all state changes and video playback controls.
- [ ] Confirm ticket tilt does not interfere with buttons and is disabled for reduced motion.
- [ ] Verify with Playwright screenshots and a manual keyboard pass.

## Task 10: Stage, Observe, And Launch

**Files:**
- Create: `docs/release-checklist.md`
- Create: `docs/rollback.md`

- [ ] Put the application code and deployment configuration under private Git version control before release; keep original/generated videos and secrets excluded.
- [ ] Create a verified pre-launch backup and tag the tested production revision so code rollback does not depend on the local machine.
- [ ] Deploy the site shell to a Cloudflare Pages preview URL with production environment variables.
- [ ] Upload the media prefix to R2 before deploying the page that references it.
- [ ] Run unit, build, E2E, media verification, and range checks against staging.
- [ ] Complete one uninterrupted start-to-Archive journey on Chrome and Edge desktop.
- [ ] Complete targeted share checks on Chrome/Edge desktop and one Web Share-capable mobile browser.
- [ ] Confirm all seven scenes start within the agreed buffering threshold on a normal broadband profile.
- [ ] Confirm seek forward/backward works near 10%, 50%, and 90% for all seven videos.
- [ ] Confirm the site is usable when Web Share, Clipboard, and reduced motion are each independently unavailable/enabled.
- [ ] Add lightweight privacy-respecting error monitoring only if the user approves its provider; do not block launch on analytics.
- [ ] Document the deployed site version and media prefix so rollback can restore the previous Pages deployment and previous R2 prefix independently.
- [ ] Launch only after the footage permission check is complete.

## Final Release Gate

- [ ] `npm test` passes.
- [ ] `npm run media:verify` passes all seven sources, fourteen outputs, and seven posters.
- [ ] `npm run build:release` passes and `dist` contains no video files.
- [ ] `npm run test:e2e` passes at both desktop target sizes.
- [ ] Production share succeeds or falls back to a copied/manual link; it never dead-ends on a non-cancel error.
- [ ] Production video requests return `206` for byte ranges.
- [ ] Desktop defaults to 1080p HQ and every scene can seek accurately in both directions.
- [ ] No console errors, CSP violations, broken assets, overlaps, or unreadable text remain.
- [ ] Social preview, title, description, favicon, canonical URL, robots, and sitemap are correct on the final domain.
- [ ] A rollback path is documented and tested before DNS is switched.

## Reference Requirements

- Cloudflare Pages limits: https://developers.cloudflare.com/pages/platform/limits/
- Cloudflare R2 custom domains: https://developers.cloudflare.com/r2/buckets/public-buckets/#custom-domains
- Cloudflare R2 CORS: https://developers.cloudflare.com/r2/buckets/cors/
- MDN Web Share API: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
- MDN Clipboard `writeText`: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText
