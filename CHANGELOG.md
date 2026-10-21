## 0.1.0 (2026-10-21)

First public release of `@sheep-ng/ui`: standalone, signal-based Angular 22
components on a single theme layer, with light and dark themes built in.

### 🚀 Features

- **theme:** `sheep-theme` stylesheet emitting the `--sheep-*` roles, with
  `prefers-color-scheme` fallback and `[data-sheep-theme]` scopes;
  `SheepThemeService` and `sheep-theme-switcher`
- **button:** `sheep-button` — five variants, five tones, three sizes, loading
  state, and `shape="square"` for icon-only buttons
- **input:** `sheep-input` with label, hint, prefix and suffix slots, signal
  forms support, and the `sheepPassword`, `sheepEmail`, `sheepNumber`,
  `sheepCounter` and `sheepValidate` directives
  ([#3](https://github.com/natsuo26/SheepNg/pull/3),
  [#10](https://github.com/natsuo26/SheepNg/pull/10))
- **chip:** `sheep-chip` and `sheep-chip-set` — filter, action, input and
  read-only chips ([#7](https://github.com/natsuo26/SheepNg/pull/7))
- **badge:** `sheep-badge` with tones, two emphasis levels and runtime colours
- **nav-bar:** `sheep-nav-bar` and `sheep-nav-bar-item` — router-aware current
  item via `aria-current`, overflow scrolling with step buttons
  ([#10](https://github.com/natsuo26/SheepNg/pull/10))
- **list:** `sheep-list` and `sheep-list-item`, virtual-scroll ready
- **tree:** `sheep-tree` — flattened rendering, so depth stays cheap
  ([#9](https://github.com/natsuo26/SheepNg/pull/9))
- **table:** `sheep-table` on `cdk/table` with sorting, filtering, paging and
  automatic virtual scrolling for large data sets
  ([#5](https://github.com/natsuo26/SheepNg/pull/5))
- **dialog:** `sheep-dialog` on a native `<dialog>`, with header, body and footer
  ([#4](https://github.com/natsuo26/SheepNg/pull/4))
- **side-sheet:** `sheep-side-sheet` anchored to the left or right edge
  ([#8](https://github.com/natsuo26/SheepNg/pull/8))
- **tooltip:** `sheepTooltip` directive on a single top-layer surface
  ([#6](https://github.com/natsuo26/SheepNg/pull/6))
- **tooling:** ships `AGENTS.md` and a generated `custom-elements.json` so
  editors and AI assistants can read the full API

### ❤️ Thank You

- Abhay Kumar @natsuo26
