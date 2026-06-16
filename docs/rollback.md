# Production Rollback

The site shell and video media are versioned independently so either can be rolled back without replacing the other.

## Site Rollback

1. In Cloudflare Pages, select the last verified deployment.
2. Promote that deployment to production.
3. Confirm the home page, Archive, and share metadata load.

## Media Rollback

1. Keep every published media set under an immutable version prefix such as `/live/v1/` or `/live/v2/`.
2. Restore `VITE_MEDIA_BASE_URL` to the last verified prefix.
3. Rebuild and deploy only the site shell.
4. Run `npm run media:verify:remote` against the restored prefix.

Never overwrite a production media prefix in place. Upload edited videos under a new version so cached files and rollback remain deterministic.

## Emergency Checks

- If videos fail but the site works, verify R2 CORS, content type, byte-range responses, and the media prefix first.
- If sharing fails, confirm HTTPS and test the copy fallback before rolling back the full experience.
- If the page shell fails, restore the previous Pages deployment; R2 objects do not need to change.
