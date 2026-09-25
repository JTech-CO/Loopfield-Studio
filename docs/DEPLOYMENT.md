# Static hosting and domains

**English** · [한국어](DEPLOYMENT-KR.md) · [README](../README.md)

## GitHub Pages

Place `index.html`, `js/`, `css/` and `assets/` at the repository root, without another nested project folder. Select **Settings → Pages → Build and deployment → Source → GitHub Actions**. The included `.github/workflows/pages.yml` deploys on a main push or manual dispatch. After changing Source, manually run Deploy Loopfield Studio if needed. Adjust the workflow branch if your default branch is not main. Organization policies may require deployment permission or approval.

There is no build, server, database or npm dependency installation. The workflow runs Node tests and packages static files. `.nojekyll` is included. Relative asset paths work beneath a repository-name URL prefix.

Alternatively, disable/remove the workflow and choose **Deploy from a branch → main / (root)**. Do not operate both deployment methods simultaneously.

## Social previews

The site's canonical URL is [Loopfield Studio](https://jtech-co.github.io/Loopfield-Studio/). `index.html` contains Open Graph and Twitter metadata with an absolute URL for `assets/presets/og-site.png`. Keep those URLs in sync if the domain or repository name changes.

For the GitHub repository preview, manually upload `assets/presets/og-repository.png` under **Settings → General → Social preview**. Merely committing this file does not configure GitHub's repository-level preview. The README also displays it. The two images are generated artwork inspired by the supplied Julia-set reference, not exact shader output. Their source reference was supplied by the project owner.

This update is committed locally only. No remote push, Pages deployment or GitHub setting change is performed as part of it.

## Custom domains

No arbitrary CNAME is included. Configure a domain you own in Pages, then follow GitHub's official DNS guide. Apex and subdomain records differ; consult the current guide rather than copying hard-coded IPs. Enable Enforce HTTPS when the certificate is ready. DNS propagation and certificate issuance are outside app code.

Browser storage is origin-specific. Export project JSON at the old origin and import it at the new domain; autosaved projects and language preferences do not migrate automatically.

## Localhost

```sh
python -m http.server 8000
```

Open [localhost:8000](http://localhost:8000). `file://` is unsupported due to ES modules and encoder security requirements. Plain HTTP at another device's LAN IP is not the localhost exception. Use HTTPS hosting for remote phone checks.

## Before publishing

Run graphics tests in `tests/browser.html`, then verify actual native MP4 encoding/decoding starting at 1080p. Test QHD, DCI 2K and UHD on target devices. Verify direct saving, cancellation, JSON backup/restore, and long/60-fps videos separately.

The app has no membership, payment or public-gallery backend. Pages serves files; each visitor's device performs rendering.

Official references: [Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages).
