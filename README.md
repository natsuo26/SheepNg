# SheepNg

An Nx monorepo for the **`@sheep-ng`** Angular UI component library, its demos, and a demo app.

- **Nx** 23.1.2
- **Angular** 22.0.4 — standalone, zoneless (no `zone.js`)
- **TypeScript** 6.0.3

## Structure

| Project        | Path                | Import path      | Purpose                                                        |
| -------------- | ------------------- | ---------------- | -------------------------------------------------------------- |
| `ui`           | `libs/ui`           | `@sheep-ng/ui`   | The component library. Publishable (ng-packagr).               |
| `demo`         | `libs/demo`         | `@sheep-ng/demo` | One demo component per UI component. Buildable, not published. |
| `demo-app`     | `apps/demo-app`     | —                | The single app that renders the demos.                         |
| `demo-app-e2e` | `apps/demo-app-e2e` | —                | Playwright e2e tests for `demo-app`.                           |

Dependencies flow one way:

```
demo-app  →  @sheep-ng/demo  →  @sheep-ng/ui
```

`demo-app` holds routing and layout only — every component demo lives in `libs/demo` so the
demos stay versioned alongside the library.

## Components

Everything ships from `@sheep-ng/ui`. Components made of several parts export a set you can
spread into `imports` rather than naming each piece.

| Component        | Import                                    | Notes                                                              |
| ---------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| `sheep-button`   | `SheepButtonComponent`                    | Five variants, five tones, three sizes. `shape="square"` is the icon button. |
| `sheep-input`    | `SHEEP_INPUT`                             | Single-line input. Label, hint, prefix/suffix; password, email, number, counter and validation directives. |
| `sheep-chip`     | `SHEEP_CHIP`                              | Chip and chip set. A control, so it takes the control metrics.     |
| `sheep-badge`    | `SheepBadgeComponent`                     | Not a control — rides the smaller badge metrics. The one component with colour hooks. |
| `sheep-nav-bar`  | `SHEEP_NAV_BAR`                           | Bar and item. Current item is `aria-current`, so `routerLinkActive` drives it. Overflow scrolls. |
| `sheep-side-sheet` | `SHEEP_SIDE_SHEET`                      | Modal panel on the left or right edge. Header, body, footer.       |
| `sheep-list`     | `SHEEP_LIST`                              | Rows composed at the call site. Drops into a CDK virtual viewport. |
| `sheep-tree`     | `SheepTreeComponent`                      | Flattened, not nested — depth is padding, so deep trees stay cheap. |
| `sheep-table`    | `SHEEP_TABLE`                             | Built on `cdk/table`. Column defs, toolbar, empty state, paginator. |
| `sheep-dialog`   | `SHEEP_DIALOG`                            | Modal popup on a native `<dialog>`. Header, body, footer.          |
| `sheepTooltip`   | `SheepTooltipDirective`                   | A directive, not an element.                                       |
| Theme            | `SheepThemeService`, `SheepThemeSwitcherComponent` | Owns the `data-sheep-theme` attribute.                    |

There is no separate number field: `<sheep-input sheepNumber min="0" step="0.01">` covers it, and a
dedicated component would re-expose the same label, hint, sizes and validation and drift from it.
`sheep-input` was previously `sheep-text-field` — see the rename note below.

## Renamed: `sheep-text-field` → `sheep-input`

A breaking change. Every name moved together, so a find-and-replace in this order migrates a
consumer:

| Was | Now |
| --- | --- |
| `SHEEP_TEXT_FIELD` (and `SHEEP_TEXT_FIELD_*`) | `SHEEP_INPUT` (and `SHEEP_INPUT_*`) |
| `SheepTextField*` (component, directives, types, `provideSheepTextFieldMessages`) | `SheepInput*` |
| `sheepTextFieldLabel` / `Hint` / `Prefix` / `Suffix` | `sheepInputLabel` / `Hint` / `Prefix` / `Suffix` |
| `<sheep-text-field>` | `<sheep-input>` |

`sheepPassword`, `sheepEmail`, `sheepCounter` and `sheepValidate` keep their names.

## The theme layer

Three files in `libs/ui/src/styles/`, in order:

1. `_sheep-primitives.scss` — raw scales. No component reads these.
2. `_sheep-theme-spec.scss` — the style spec in code: semantic roles, five stops per tone per
   theme, and the invariants. **This is the one file to edit to change the look.**
3. `sheep-theme.scss` — the entry point. Import it once from the app's global stylesheet.

```scss
@use '@sheep-ng/ui/styles/sheep-theme';
```

```html
<html data-sheep-theme="dark">
```

With no attribute the theme follows `prefers-color-scheme`, and the attribute can be scoped to
a subtree. Components consume only the `--sheep-*` roles the theme emits and publish no
per-instance style hooks, so two buttons in one app cannot drift apart. If a caller needs
something the spec does not offer, add a variant to the spec rather than a hook to the
component.

## Prerequisites

- Node.js 20+ (developed on 24.19.0)
- npm 10+

## Getting started

```sh
npm install
npx nx serve demo-app        # http://localhost:4200
```

## Commands

```sh
npx nx build ui              # package the library → dist/libs/ui
npx nx test ui               # unit tests (Vitest)
npx nx lint ui               # ESLint

npx nx run-many -t build     # build everything
npx nx run-many -t test lint # test + lint everything

npx nx e2e demo-app-e2e      # Playwright (starts demo-app automatically)
npx nx graph                 # visualize the dependency graph
```

Nx caches task results, so repeat runs are near-instant. `npx nx reset` clears the cache.

## Adding a component

1. Generate it in the library and export it from the public entrypoint:

   ```sh
   npx nx g @nx/angular:component --path=libs/ui/src/lib/button/button --export
   ```

2. Generate its demo:

   ```sh
   npx nx g @nx/angular:component --path=libs/demo/src/lib/button-demo/button-demo --export
   ```

   Import the component from `@sheep-ng/ui` (never by relative path across libraries).

3. Add a route for the demo in `apps/demo-app/src/app/app.routes.ts`, and flip the component's
   `ready` flag in `apps/demo-app/src/app/app.ts` so the nav links to it.

Both libraries default to SCSS and standalone components — see `generators` in `nx.json`.

Style the component from the `--sheep-*` roles only. Every interactive control sits on the
three `--sheep-ctl-{sm|md|lg}-*` size sets, so a new control lines up on a row with the
existing ones rather than inventing its own metrics.

## Conventions

|                 | `ui`                      | `demo`                      | `demo-app`               |
| --------------- | ------------------------- | --------------------------- | ------------------------ |
| Selector prefix | `sheep-`                  | `sheep-demo-`               | `sheep-app-`             |
| Tags            | `type:ui`, `scope:shared` | `type:demo`, `scope:shared` | `type:app`, `scope:demo` |

Anything exported from `libs/ui/src/index.ts` is public API — treat changes there as breaking.

## Publishing

`@sheep-ng/ui` is published from its build output (`dist/libs/ui`) via
[Nx release](https://nx.dev/features/manage-releases). Versions resolve from git tags
(`v{version}`), falling back to `libs/ui/package.json`.

```sh
npx nx release --dry-run     # preview version bump + changelog
npx nx release
```

To test a publish without hitting npm, run the local Verdaccio registry first:

```sh
npx nx local-registry         # http://localhost:4873
```

## Known issues

- `sheep-theme.service.spec.ts` fails under Vitest: `localStorage` is undefined in the jsdom
  environment the spec runs in, so the four theme service cases throw in `beforeEach`. Every
  other suite passes.
- The Nx daemon can refuse commands when the drive letter case does not match (`d:\` vs
  `D:\`). Prefix with `NX_DAEMON=false` to work around it.
- Generators emit `@nx/eslint:lint` executor targets, which are deprecated and removed in
  Nx 24. Migrate with `npx nx g @nx/eslint:convert-to-inferred`.
- `@nx/enforce-module-boundaries` is configured with the default permissive constraint
  (`*` may depend on `*`), so the project tags above are documentation, not enforcement.

# SheepNg — Lines of Code

**Command**

```bash
npx cloc . \
  --exclude-dir=node_modules,dist,.angular,coverage,.git,.nx,tmp,.vscode \
  --not-match-f='package-lock\.json'
```

**Scan summary**

| Metric | Value |
|---|---|
| Files counted | 215 |
| Tool | cloc v2.06 |
| Duration | 0.38 s |
| Throughput | 565 files/s, 52,717 lines/s |

## Results

| Language | Files | Blank | Comment | Code |
|---|---:|---:|---:|---:|
| TypeScript | 110 | 1,477 | 2,941 | 6,892 |
| SCSS | 38 | 629 | 745 | 2,845 |
| HTML | 28 | 163 | 73 | 2,682 |
| Markdown | 4 | 184 | 0 | 582 |
| JSON | 22 | 0 | 0 | 561 |
| JavaScript | 5 | 5 | 64 | 135 |
| SVG | 6 | 0 | 0 | 45 |
| YAML | 1 | 5 | 6 | 17 |
| INI | 1 | 2 | 0 | 11 |
| **SUM** | **215** | **2,465** | **3,829** | **13,770** |
