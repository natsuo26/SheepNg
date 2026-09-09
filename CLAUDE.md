# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npx nx serve demo-app         # http://localhost:4200
npx nx build ui               # package the library -> dist/libs/ui
npx nx test ui                # unit tests (Vitest, jsdom)
npx nx lint ui                # ESLint
npx nx run-many -t test lint  # everything
npx nx e2e demo-app-e2e       # Playwright (starts demo-app itself)
```

Single test file, and a single suite/case within it:

```sh
npx nx test ui --include="**/sheep-button.component.spec.ts"
npx nx test ui --filter="^SheepButtonComponent"
```

There is no Vitest config file — `@nx/angular:unit-test` is zero-config and reads
`tsconfig.spec.json`. `package.json` has no scripts; everything goes through Nx.

## Architecture

Three projects, dependencies flowing one way:

```
demo-app  ->  @sheep-ng/demo  ->  @sheep-ng/ui
```

| Project | Path | Selector prefix | Notes |
| --- | --- | --- | --- |
| `ui` | `libs/ui` | `sheep-` | The published library (ng-packagr). |
| `demo` | `libs/demo` | `sheep-demo-` | One showcase page per component. Never published. |
| `demo-app` | `apps/demo-app` | `sheep-app-` | Routing and shell only. |

Angular 22, standalone, **zoneless** (no `zone.js`) — components use signals
(`input()`, `computed()`, `signal()`) and `ChangeDetectionStrategy.OnPush`
throughout. Cross-library imports go through the path aliases `@sheep-ng/ui` and
`@sheep-ng/demo`, never relative paths. Demo pages are lazy-loaded from
`apps/demo-app/src/app/app.routes.ts`; adding a component means adding a route
there too.

Each component folder carries an `index.ts` barrel re-exported from
`libs/ui/src/index.ts`. **Anything reachable from `libs/ui/src/index.ts` is public
API — treat changes to it as breaking.** Constants and types live in a sibling
`*.constants.ts`. `sheep-table` and `sheep-list` build on `@angular/cdk`
(`cdk/table`, `cdk/scrolling`).

## The theme layer — the load-bearing constraint

Three files in `libs/ui/src/styles/`, and the order matters:

1. `_sheep-primitives.scss` — raw scales (tonal ramps, space, radius, type stacks). **No component reads these.**
2. `_sheep-theme-spec.scss` — the style spec in code: semantic roles and a five-stop set per tone, per theme, plus invariants. **This is the one file to edit to change the look.**
3. `sheep-theme.scss` — entry point; emits `:root`, the `prefers-color-scheme` fallback, and `[data-sheep-theme]`.

The rules that hold this together:

- **Components publish no per-instance style API.** There are deliberately zero `--sheep-button-*`-style override hooks; an earlier ~30-property set was removed. Two buttons in one app cannot drift apart.
- Components consume **only** the `--sheep-*` roles emitted by the theme: `--sheep-color-*`, `--sheep-tone-{primary|neutral|success|warning|danger}-{base|hover|active|on|quiet}`, `--sheep-space-*`, `--sheep-radius-*`, `--sheep-ctl-{sm|md|lg}-*`, `--sheep-shadow-*`, `--sheep-motion-*`, `--sheep-focus-*`.
- Every interactive control sits on the three `--sheep-ctl-*` size sets, so a button, a text field and a select line up on a row. A new control uses those metrics rather than its own.
- **If a caller needs something the spec does not offer, add a variant to the spec — do not add a hook to the component.**

Theme selection is attribute-driven and SSR-safe: `<html data-sheep-theme="dark">`,
falling back to `prefers-color-scheme` when absent, and scopeable to a subtree.
`SheepThemeService` owns that attribute but **the attribute, not the service, is the
source of truth for paint** — hence the pre-boot script in
`apps/demo-app/src/index.html` that paints the remembered value (`localStorage` key
`sheep-ng:theme`) before Angular starts.

Sass does not read TypeScript path mappings. Inside this repo the app resolves the
theme via `stylePreprocessorOptions.includePaths` in `apps/demo-app/project.json`
and writes `@use 'sheep-theme';`. Published consumers use
`@use '@sheep-ng/ui/styles/sheep-theme';`, which works because `ng-package.json`
ships `src/styles` to `styles/`.

## Scope: the library ships components and a theme, not layout

There is no `sheep-stack`/`sheep-row`/`sheep-grid`, and there should not be — a
layout DSL competes with flexbox, grid and semantic HTML that consumers already
know. Documentation chrome belongs to the docs: `libs/demo/src/styles/_demo-kit.scss`
holds the demo page vocabulary (`.demo-page`, `.demo-section`, `.demo-specimen`, …),
private to `libs/demo`, built from the same `--sheep-*` roles. A demo page picks it
up with `@use '../../styles/demo-kit' as demo; @include demo.kit;` — Angular's
emulated encapsulation keeps two pages from colliding.

Related judgement calls already made: no separate `sheep-icon-button` (it is
`shape="square"` on `sheep-button`, since a second component would re-expose the
same variants/tones/sizes and drift).

## Known issues

- `nx lint ui` and `nx lint demo` fail on `@nx/dependency-checks` reporting `@angular/common` as an unused peer dependency.
- `@nx/enforce-module-boundaries` uses the default permissive constraint (`*` may depend on `*`), so the project tags are documentation, not enforcement.
- Generators emit deprecated `@nx/eslint:lint` executor targets (removed in Nx 24); migrate with `npx nx g @nx/eslint:convert-to-inferred`.
- The Nx daemon can refuse commands with a drive-letter case mismatch (`d:\` vs `D:\`). Prefix with `NX_DAEMON=false` to work around it.
