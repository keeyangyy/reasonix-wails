# Releasing Reasonix

This fork ships one user-facing release line: Windows x64 desktop, distributed
from `keeyangyy/reasonix-wails`. There is no npm package, no Homebrew tap, no
CLI multi-platform matrix and no R2/CDN mirror.

## What a release contains

| Asset | Notes |
| --- | --- |
| `Reasonix-windows-amd64.exe` | Portable, self-updating build — the artifact clients download |
| `Reasonix-windows-amd64.exe.minisig` | Minisign signature for the updater artifact |
| `Reasonix-windows-amd64-installer.exe` | NSIS installer: first install, shortcuts and uninstall entry |
| `reasonix-cli-windows-amd64.exe` | Standalone CLI, same version stamp |
| `latest.json` | Update manifest for this exact tag |

Every release also writes `latest.json` and `versions.json` onto the fixed
`wails-latest` anchor release, which is what installed clients poll.

## Tag convention

`vMAJOR.MINOR.PATCH` for a stable release, `vMAJOR.MINOR.PATCH-beta.N` for a
pre-release. The numbers belong to this line; they have nothing to do with the
upstream 1.x series.

Exactly three numeric segments are required: the NSIS installer derives
`VIProductVersion` from `${version}.0`, so a four-segment tag such as
`v0.1.0.1` would become an invalid five-segment version and fail the build. A
`-beta.N` suffix is stripped before it reaches NSIS, so `v0.1.0-beta.1` builds
as `0.1.0`.

## Recommended flow

1. Merge everything to `main` and let the **CI** workflow run on that exact
   commit.
2. Actions → **Release (manual)**, enter `X.Y.Z` (no leading `v`).
3. The workflow waits for the CI run on `HEAD` to finish. A red run is retried
   once; if it is still red the release aborts and **no tag is created**.
4. On green it creates the annotated tag `vX.Y.Z`, creates the GitHub Release
   as a **draft**, then dispatches **Release Windows**.
5. **Release Windows** builds the desktop app, installer and CLI, uploads the
   assets, publishes the release, signs the updater executable, writes `latest.json`,
   and refreshes the `wails-latest` anchor catalog.
6. The release is never public without its assets: the draft is flipped only
   after the upload step.

Pushing a tag directly also works — `release-windows.yml` listens to
`v[0-9]*` — but it skips the "CI must be green first" gate. Use the manual flow
unless you are deliberately re-publishing an existing tag.

## Manual publish / recovery

To rebuild or re-upload assets for a tag that already exists:

```sh
gh workflow run release-windows.yml -f tag=v0.1.0
```

The verify job refuses any tag whose shape is not `vX.Y.Z(-beta.N)?`, and any
tag that is not an ancestor of `origin/main`. Assets are uploaded with
`--clobber`, so re-running is safe and idempotent; it does not move or delete
the tag.

For a release whose build failed after the draft was created, re-dispatch and
let the same job finish the upload and publish steps.

## Signing

The updater executable and the update manifest are signed with Minisign. The workflow
reads `MINISIGN_PRIVATE_KEY` and `MINISIGN_PASSWORD` from repository secrets
and runs `desktop/cmd/sign`; no local `minisign` CLI is needed.

Clients verify against the public key baked into the desktop binary and the
repository's own anchor, so a release signed with any other key will be
rejected by installed clients rather than silently accepted.

Authenticode signing is **not** configured. Windows SmartScreen will warn on
first run until an OV/EV certificate is added.

## Version catalog and the update panel

`wails-latest` holds `latest.json` (always the newest published release) and
`versions.json` (the full catalog the update panel lists from). Both are
overwritten by every release; the per-tag release keeps its own immutable
`latest.json` because catalog entries point at `<tag>/latest.json`.

The panel shows the five most recent versions plus up to three most recent
stable ones. A pre-release tag is recorded with the `beta` channel, a stable
tag with `stable`.

## Before the first public release

- Configure `MINISIGN_PRIVATE_KEY` and `MINISIGN_PASSWORD` repository secrets.
- Confirm `wails-latest` exists and points at this line, not the upstream
  1.38.x line.
- Verify the `CI` workflow has actually run on `main` (it is the only gate the
  manual flow trusts).
