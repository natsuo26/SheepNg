# @sheep-ng/ui

The `@sheep-ng` component library. Standalone, zoneless-friendly Angular components.

```sh
nx test ui     # unit tests
nx build ui    # package to dist/libs/ui
```

## The theme layer

Components carry no per-instance style API. Every colour, metric, radius and
timing resolves from `--sheep-*` custom properties emitted by the theme layer,
so two buttons in one app cannot drift apart. **To change how components look,
change the theme — not the call site.**

| File                                | Role                                                                                                                                          |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/styles/_sheep-primitives.scss` | Raw scales: tonal ramps, space, radius, type stacks. No component reads these.                                                                |
| `src/styles/_sheep-theme-spec.scss` | The style spec in code: semantic roles and tone stops per theme, plus invariant scales and control metrics. **Edit this to change the look.** |
| `src/styles/sheep-theme.scss`       | Entry point. Emits `:root`, the `prefers-color-scheme` fallback, and `[data-sheep-theme]`.                                                    |

Import the entry point once, from the app's global stylesheet:

```scss
@use '@sheep-ng/ui/styles/sheep-theme';
```

Sass does not read TypeScript path mappings, so **inside this repo** the app
resolves it through a Sass load path instead — `stylePreprocessorOptions.includePaths`
in `apps/demo-app/project.json` points at `libs/ui/src/styles`, and the app
writes `@use 'sheep-theme';`. Published consumers use the package path above,
which works because `ng-package.json` ships `src/styles` to `styles/`.

### Choosing a theme

Selection is attribute-driven and SSR-safe — the initial paint needs no JS:

```html
<html data-sheep-theme="dark"></html>
```

With no attribute the theme follows `prefers-color-scheme`. The attribute can
also scope a theme to a subtree (a dark toolbar on a light page).

`SheepThemeService` owns that attribute — the attribute, not the service, is
the source of truth for paint. It exposes `preference()` (including `system`),
`resolved()`, `set()` and `toggle()`, and persists the choice to
`localStorage` under `sheep-ng:theme`. `SheepThemeSwitcherComponent`
(`<sheep-theme-switcher>`) is the ready-made Light / Dark / System control.

To avoid a flash of the wrong theme, paint the remembered value before boot —
see the inline script in `apps/demo-app/src/index.html`.

## Scope

This library ships **components and a theme**. It does not ship layout.

There is no `sheep-stack`, `sheep-row` or `sheep-grid` here, and there should
not be: a layout DSL is not a standard part of a component library. It is a
second, parallel way to write CSS that every consumer then has to learn, and
it competes with the platform primitives — flexbox, grid, semantic HTML — that
already do the job and that consumers already know.

Pages that need documentation chrome own it themselves. `libs/demo` keeps its
page vocabulary in `libs/demo/src/styles/_demo-kit.scss`, private to that
library, built from the same `--sheep-*` roles the components read. It
re-themes in step with them and ships to nobody.

## `sheep-button`

```ts
import { SheepButtonComponent } from '@sheep-ng/ui';
```

```html
<sheep-button tone="danger" (click)="remove()">Delete project</sheep-button>
```

It renders a real `<button>`, so keyboard interaction, form submission and
assistive-technology semantics are the platform's, not a reimplementation.

`outline` is the default and the library's signature: an accent line on a
transparent ground. `solid` exists but is reserved for the single most
important action in a view — the library never floods a large area with a tone.

### Inputs

| Input       | Type                                                 | Default   | Notes                                                   |
| ----------- | ---------------------------------------------------- | --------- | ------------------------------------------------------- |
| `variant`   | `outline \| solid \| soft \| ghost \| link`          | `outline` | Visual weight.                                          |
| `tone`      | `primary \| neutral \| success \| warning \| danger` | `primary` | Semantic colour.                                        |
| `size`      | `sm \| md \| lg`                                     | `md`      | Shared with every control in the library.               |
| `shape`     | `rounded \| square`                                  | `rounded` | `square` is the icon-only 1:1 box.                      |
| `type`      | `button \| submit \| reset`                          | `button`  | Defaults to `button` so it never submits by accident.   |
| `disabled`  | `boolean`                                            | `false`   | Accepts the bare attribute: `<sheep-button disabled>`.  |
| `loading`   | `boolean`                                            | `false`   | Shows a spinner, sets `aria-busy`, and blocks re-entry. |
| `ariaLabel` | `string \| null`                                     | `null`    | Required when the button has no text.                   |

There is no `click` output — the native button's event bubbles, so bind
`(click)` on `<sheep-button>` directly. It does not fire while disabled or
loading. `focus()` on the component instance forwards to the native button.

There is no `fullWidth` input: the caller sizes the wrapper.

### Content slots

```html
<sheep-button variant="soft" tone="success">
  <svg sheepButtonStart>…</svg>
  Approve
  <svg sheepButtonEnd>…</svg>
</sheep-button>
```

An empty slot collapses, so it contributes no gap. Projected `svg` and `img`
are sized to the control's icon scale; paint is left alone, since an icon
declares its own `fill`/`stroke` — normally `currentColor`.

While `loading`, the spinner takes the leading slot's place so the button keeps
its width instead of jumping.

Icon-only buttons need an accessible name:

```html
<sheep-button shape="square" ariaLabel="Delete item">
  <svg sheepButtonStart>…</svg>
</sheep-button>
```

### Accessibility

Focus is a 2px accent outline, never the browser default and never a soft glow.
`prefers-reduced-motion` drops the transitions and slows the spinner, and
`forced-colors` hands the palette over to system colours.
