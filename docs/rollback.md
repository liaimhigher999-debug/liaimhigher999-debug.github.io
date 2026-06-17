# Production Rollback

The public site shell and Bilibili embed configuration are versioned in Git. Local MP4 media remains a private development path and is not published with GitHub Pages.

## Site Rollback

1. In Cloudflare Pages, select the last verified deployment.
2. Promote that deployment to production.
3. Confirm the home page and Archive load.

## Media Rollback

1. If a Bilibili upload is removed or replaced, update the affected BVID in `src/data/experience.ts`.
2. Rebuild and deploy the site shell.
3. Confirm the affected embedded player loads from the public page.
4. For a private MP4 deployment only, restore `VITE_MEDIA_BASE_URL` to the last verified prefix and run `npm run media:verify:remote`.

Never commit generated MP4 files to the public repository.

## Emergency Checks

- If videos fail but the site works, verify R2 CORS, content type, byte-range responses, and the media prefix first.
- If sharing fails, confirm HTTPS and test the copy fallback before rolling back the full experience.
- If the page shell fails, restore the previous Pages deployment; R2 objects do not need to change.
