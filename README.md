# SheepNg

An Nx monorepo for the **`@sheep-ng`** Angular UI component library, its demos, and a demo app.

- **Nx** 23.1.2
- **Angular** 22.0.4 — standalone, zoneless (no `zone.js`)
- **TypeScript** 6.0.3

## Structure

| Project | Path | Import path | Purpose |
| --- | --- | --- | --- |
| `ui` | `libs/ui` | `@sheep-ng/ui` | The component library. Publishable (ng-packagr). |
| `demo` | `libs/demo` | `@sheep-ng/demo` | One demo component per UI component. Buildable, not published. |
| `demo-app` | `apps/demo-app` | — | The single app that renders the demos. |
| `demo-app-e2e` | `apps/demo-app-e2e` | — | Playwright e2e tests for `demo-app`. |

Dependencies flow one way:

```
demo-app  →  @sheep-ng/demo  →  @sheep-ng/ui
```

`demo-app` holds routing and layout only — every component demo lives in `libs/demo` so the
demos stay versioned alongside the library.

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

3. Add a route for the demo in `apps/demo-app/src/app/app.routes.ts`.

Both libraries default to SCSS and standalone components — see `generators` in `nx.json`.

## Conventions

| | `ui` | `demo` | `demo-app` |
| --- | --- | --- | --- |
| Selector prefix | `sheep-` | `sheep-demo-` | `sheep-app-` |
| Tags | `type:ui`, `scope:shared` | `type:demo`, `scope:shared` | `type:app`, `scope:demo` |

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

- `nx lint ui` and `nx lint demo` currently fail: the `@nx/dependency-checks` rule reports
  `@angular/common` as an unused peer dependency. This clears itself as soon as a real
  component uses anything from `@angular/common`.
- Generators emit `@nx/eslint:lint` executor targets, which are deprecated and removed in
  Nx 24. Migrate with `npx nx g @nx/eslint:convert-to-inferred`.
- `@nx/enforce-module-boundaries` is configured with the default permissive constraint
  (`*` may depend on `*`), so the project tags above are documentation, not enforcement.
