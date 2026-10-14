# Appxiom Stack Trace Deobfuscation Skill

Guidance for installing and using `@appxiom/web-map` to resolve JavaScript stack traces against local source maps.

## When to Use

- Resolving minified production stack traces to original JavaScript or TypeScript locations
- Setting up a local workflow for inspecting stack traces with matching build artifacts
- Troubleshooting why a generated frame cannot be associated with a local bundle or source map

## Privacy and Safety

- Process stack traces, bundles, and source maps locally. Do not upload them to Appxiom or another service.
- Do not fetch remote source maps or execute generated bundles. The CLI does neither.
- Keep production source maps in restricted build artifacts or private storage; do not deploy them publicly unless the project explicitly intends to expose them.
- Do not print `sourcesContent` or other source contents when sharing diagnostics.
- The CLI does not automatically enrich Appxiom issues. Pass a stack trace to the local CLI to resolve it.

## Setup

Inspect the project's package manager, build tool, output directory, and TypeScript configuration before changing files. If the user requests persistent installation, add the CLI as a development dependency:

```bash
npm install --save-dev @appxiom/web-map
```

For an ephemeral invocation, use `npx @appxiom/web-map` without changing project dependencies.

Ensure the production build emits version 3 source maps that refer to the original sources. For TypeScript compiler builds, this commonly means enabling `sourceMap` in `tsconfig.json`. For a bundler, use its production source-map option and verify where the generated `.map` files are written. Choose settings that match the existing toolchain; do not overwrite unrelated build configuration.

Production maps can expose source paths and, when `sourcesContent` is present, source code. Keep them in private build artifacts for local use rather than deploying them with public assets. Ask before changing deployment behavior if it is unclear whether maps would become publicly accessible.

## Usage

Pass a stack trace directly, from a file, or through standard input. The map directory defaults to `./dist` relative to the current working directory.

```bash
npx @appxiom/web-map --stacktrace-file ./error.txt --maps ./dist
cat ./error.txt | npx @appxiom/web-map --stdin --maps ./dist
npx @appxiom/web-map --stacktrace "TypeError: failed\n    at a (https://example.test/assets/app.js:1:42)" --json --maps ./dist
```

Use `--verbose` to inspect map association decisions. Unresolved frames are preserved; a missing map is not a reason to discard the original stack trace.

## Verification

1. Build a test stack trace using a bundle URL and line/column from the project's generated JavaScript.
2. Run the CLI with the local map directory and confirm the output points to the expected original source file and position.
3. If a frame remains unchanged, rerun with `--verbose`; verify the bundle path, map `file` metadata, `sourceRoot`, and local `sourceMappingURL` association.
4. Confirm source maps remain in private build output and are not included in public deployment or sent to an external service.

The CLI supports Chrome/Chromium and Firefox-style frames, with practical Safari-compatible forms, and source map version 3. It does not retrieve maps from remote URLs.