# Releasing `setup-temporal`

This repository is a JavaScript GitHub Action. The executable that GitHub runs
is checked in under `dist/setup-temporal`, so every source change that affects
the action must be built and committed before it is released.

## Versioning and tags

Use semantic versioning and create an immutable, annotated tag for every
release, for example `v0.2.0`.

Consumers can choose either form:

```yaml
# Receives compatible v0 updates.
uses: temporalio/setup-temporal@v0

# Stays on this exact release.
uses: temporalio/setup-temporal@v0.2.0
```

`v0` is the moving major-version tag. Move it only after publishing a new
backwards-compatible `v0.x.y` release. Do not move it for a breaking change;
publish that release under a new major tag (such as `v1`) instead.

## Release procedure

1. Prepare and merge a release PR to `main`. Set `package.json` to the next
   version (without the `v` prefix), regenerate the committed bundle, and wait
   for the Validate workflow to pass.

   ```bash
   npm ci
   npm run build
   ```

   Commit any change under `dist/setup-temporal` with the source change. The
   action executes that checked-in bundle, not the TypeScript source.

   If the **Verify generated bundle is committed** PR check fails, run the two
   commands above from the repository root, review the changes under
   `dist/setup-temporal`, and commit them. If `npm run build` itself fails, fix
   the reported source or dependency compatibility error before regenerating
   the bundle.

2. In GitHub, open **Actions** → **Release** → **Run workflow**. Select
   `main`, enter the corresponding semantic release tag (for example,
   `v0.2.0`), and run it.

3. The workflow runs the action on Linux, macOS, and Windows; rebuilds and
   checks the committed bundle; verifies the requested tag matches
   `package.json`; creates the immutable GitHub Release; and then advances the
   compatible major tag (`v0` for `v0.2.0`).

The workflow only runs from `main`, accepts stable `vMAJOR.MINOR.PATCH` tags,
and refuses to overwrite an existing release tag. It has `contents: write`
permission because it creates tags and the GitHub Release; the major tag is the
only tag it force-updates.

## Rollback

Do not delete or reuse the immutable release tag. If a bad compatible release
was made, publish a new patch release with the fix and move `v0` forward to it.
If `v0` was accidentally moved, repoint only `v0` to the last known-good
immutable tag and communicate that correction to consumers.
