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

The production custom domain is `loopfield.studio`. The root `CNAME` file must contain that hostname alone. Keep it tracked when publishing from **main / (root)**: removing it can clear the domain mapping even if DNS and the application deployment are healthy. A regression test protects this file.

Every update must follow the domain-preservation rules in [AGENTS.md](../AGENTS.md) and run `node --test tests/*.test.mjs` before committing. The custom workflow runs that regression test before deployment and explicitly copies `CNAME` into the static artifact; a missing file stops packaging. Branch-based publication does not run this custom workflow as a prerequisite, so the local check and preservation of the tracked root file remain necessary.

In **Settings → Pages → Custom domain**, set `loopfield.studio`. Follow GitHub's official DNS guide for apex and subdomain records, and enable **Enforce HTTPS** when the certificate is ready. If Source is **GitHub Actions**, GitHub ignores `CNAME` files for domain mapping; the repository's Custom domain setting is still required. Select a single publishing method instead of running branch publication and the custom workflow together. DNS propagation and certificate issuance are outside app code.

On 2026-10-08, the custom domain returned GitHub's 404 while the default repository URL returned HTTP 200 and both deployment runs had succeeded. Pages was configured for branch publication with `cname: null`; the earlier 2026-10-02 CNAME commit was absent from the new branch history. The local fix restores the domain file. It must be pushed and published, or the Custom domain setting restored, before the public hostname can recover. Before replacing local/remote history, incorporate remote domain-setting commits; avoid force-pushing over them.

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
