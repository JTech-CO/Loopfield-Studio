# Loopfield Studio maintenance

## Preserve the production domain on every update

- The production URL is `https://loopfield.studio/`.
- Keep the root `CNAME` file tracked, containing exactly `loopfield.studio` and a trailing newline. Preserve it during updates, packaging, repository imports, and history changes. Do not delete or change it unless the user explicitly requests a domain migration.
- Include `CNAME` in the static deployment artifact. For branch-based GitHub Pages publication, the root file preserves the domain mapping. With GitHub Actions publication, the repository's Pages Custom domain setting is also required; an artifact file alone does not configure that setting.
- Run `node --test tests/*.test.mjs` before committing an update. The custom-domain regression test must pass; do not remove or weaken it to bypass a missing or changed `CNAME`.
- Before an authorized push or history replacement, fetch and inspect the remote branch and retain any remote domain-setting commits. Do not force-push or reset remote history without explicit user authorization.
- Preserve the existing HTTPS configuration. Do not change remote Pages settings or DNS unless the user authorizes that change.

## Local delivery

- Preserve unrelated user edits.
- Commit completed changes locally. Do not push to GitHub unless the user explicitly authorizes the agent to push; a report that the user has pushed is not authorization for another push.
- When verifying a public deployment, check both the HTTP response and actual application startup/rendering. A successful deployment run alone does not establish that the custom domain works.
