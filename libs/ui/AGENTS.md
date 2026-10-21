# @sheep-ng/ui — guide for coding agents

This file is for AI coding assistants (and the people driving them) working in an
app that depends on `@sheep-ng/ui`. It covers how to use the library correctly. The
complete, generated API — every input with its type and default, every output,
slot and method — is in **`custom-elements.json`** next to this file; read it
rather than guessing an input name.

Working on this library's own source rather than using it? Read the repository's
root `AGENTS.md` instead; this file describes the published API only.

## What this library is

Angular 22 standalone components, signal-based (`input()`, `model()`, `output()`),
`OnPush`, and zoneless-safe. It ships **components and a theme — no layout
system**: there is no stack, row, grid or container component. Lay pages out
with plain HTML, flexbox and CSS grid.

Peer dependencies: `@angular/core`, `@angular/cdk` and `@angular/forms`, all `^22`.

## Setup (once per app)

1. Import the theme once, from the app's **global** stylesheet (for example
   `src/styles.scss`). Without it, every component renders unstyled:

   ```scss
   @use '@sheep-ng/ui/styles/sheep-theme';
   ```

2. Optionally pin a theme. With no attribute the theme follows the OS
   (`prefers-color-scheme`). The attribute can also be put on a subtree:

   ```html
   <html data-sheep-theme="dark">  <!-- or "light" -->
   ```

   To let users switch, drop `<sheep-theme-switcher />` somewhere, or inject
   `SheepThemeService` and call `set('light' | 'dark' | 'system')` or `toggle()`.
   The service stores the choice in `localStorage` under `sheep-ng:theme`. To
   avoid a flash of the wrong theme on load, paint the stored value from an
   inline script in `index.html` before Angular boots.

## Importing

Everything comes from the package root. Multi-part components export a **set**:
spread the set into `imports` rather than naming each piece.

```ts
import { SHEEP_INPUT, SheepButtonComponent } from '@sheep-ng/ui';

@Component({
  imports: [SheepButtonComponent, SHEEP_INPUT],
  // ...
})
```

| Set | Contains |
| --- | --- |
| `SHEEP_INPUT` | `sheep-input`, its slot directives and the `sheepPassword` / `sheepEmail` / `sheepNumber` / `sheepCounter` / `sheepValidate` directives |
| `SHEEP_LIST` | `sheep-list`, `sheep-list-item` and the row slot directives |
| `SHEEP_TABLE` | `sheep-table`, column definition directives, cells, toolbar, empty state, paginator |
| `SHEEP_DIALOG` | `sheep-dialog` and its header, body and footer |
| `SHEEP_SIDE_SHEET` | `sheep-side-sheet` and its header, body and footer |
| `SHEEP_CHIP` | `sheep-chip` and `sheep-chip-set` |
| `SHEEP_NAV_BAR` | `sheep-nav-bar` and the `sheep-nav-bar-item` attribute |

Imported singly: `SheepButtonComponent`, `SheepBadgeComponent`,
`SheepTreeComponent`, `SheepTooltipDirective`, `SheepThemeSwitcherComponent`.

## Rules that hold everywhere

- **No per-instance styling.** Components publish no CSS custom properties and no
  style inputs, by design. Do not reach into them with `::ng-deep`, `!important`
  or by overriding their internal class names: those are private and will
  change. Pick from the appearance inputs (`variant`, `tone`, `size`, `shape`,
  `emphasis`) instead.
  - The only exception is `sheep-badge`, whose `color`, `textColor` and
    `iconColor` take any CSS colour, for data-driven colours known only at
    runtime.
  - To change the look app-wide, override the theme's `--sheep-*` roles (for
    example `--sheep-color-accent`) at `:root` or on a `[data-sheep-theme]`
    scope. Never override them per component.
- **Shared scales.** `tone` is always `'primary' | 'neutral' | 'success' |
  'warning' | 'danger'`, and `size` is always `'sm' | 'md' | 'lg'` (default
  `md`). Every control of the same size has the same height, so a button, an
  input and a chip line up on a row.
- **Real elements for interactive things.** Clickable chips, list rows and nav
  items are written *on* an `<a>` or `<button>`, never wrapped around one:
  `<button sheep-chip>`, `<a sheep-list-item routerLink="…">`,
  `<a sheep-nav-bar-item>`.
- **State is two-way where it belongs.** `open`, `value`, `expanded` and
  `selected` are `model()`s: bind them with `[(open)]="signal"`. Dismissals write
  back, so do not mirror the state yourself.
- **Accessible names.** Icon-only controls need `ariaLabel`. A dialog or side
  sheet without a header needs `ariaLabel`. A tooltip is a *description*, not a
  name.

## Components

### `sheep-button`

```html
<sheep-button (click)="save()">Save</sheep-button>
<sheep-button variant="solid" type="submit" [loading]="saving()">Submit</sheep-button>
<sheep-button variant="ghost" shape="square" ariaLabel="Close"><svg>…</svg></sheep-button>
```

- `variant`: `outline` (default) | `solid` | `soft` | `ghost` | `link`. Use
  `solid` for the one primary action in a view.
- There is no separate icon button: use `shape="square"`.
- Slots: `[sheepButtonStart]`, `[sheepButtonEnd]`.
- `type` defaults to `button`, so it never submits a form by accident.

### `sheep-input` (single-line input)

```html
<sheep-input [(value)]="name" required>
  <span sheepInputLabel>Display name</span>
  <span sheepInputHint>Shown on your profile.</span>
</sheep-input>

<sheep-input sheepEmail autocomplete="email" [(value)]="email">
  <span sheepInputLabel>Email</span>
</sheep-input>

<sheep-input sheepPassword autocomplete="new-password" [(value)]="password">
  <span sheepInputLabel>Password</span>
</sheep-input>

<sheep-input sheepNumber min="0" step="0.01" [(value)]="price">
  <span sheepInputLabel>Price</span>
  <span sheepInputPrefix>$</span>
</sheep-input>
```

- **The value is always a string**, including under `sheepNumber`. Convert
  where you use it: `Number(price())`. `""` means nothing was entered, not zero.
- Numbers use the `sheepNumber` directive, never `type="number"` (which is not
  in the `type` list). The directive gives a number pad, filters out
  non-numeric keystrokes, steps with Arrow Up/Down and validates `min`, `max`
  and `step`. A mouse wheel never changes the value. The decimal separator is
  always `.`.
- Slots: `[sheepInputLabel]`, `[sheepInputHint]`, `[sheepInputPrefix]`,
  `[sheepInputSuffix]`. Do not add your own `id`, `for` or
  `aria-describedby`; the field wires its parts together.
- Other directives: `sheepCounter` (a character count, against `maxLength`
  when one is set) and `[sheepValidate]="fn"`, a `SheepFieldValidator`:
  `(value: string) => string | null`, where the string is the message to
  show. It may also return a `SheepFieldError` or an array of them.
- Signal forms: `<sheep-input [formField]="form.email">` binds value, errors,
  disabled, touched and the native constraints. The errors that `sheepEmail`,
  `sheepNumber` and `sheepValidate` raise are display-only; the form cannot see
  them. On a form-bound field, put the same rules in the form's schema
  (`email()`, `min()`, `max()`, `validate()`).
- Error text can be localised with
  `provideSheepInputMessages({ errors: { required: '…' } })`.

### `sheep-chip` / `sheep-chip-set`

```html
<sheep-chip-set ariaLabel="Filters">
  <button sheep-chip [selected]="archived()" (click)="toggleArchived()">Archived</button>
</sheep-chip-set>
<sheep-chip removable (removed)="drop(tag)">{{ tag }}</sheep-chip>
<sheep-chip variant="soft" tone="success">Passing</sheep-chip>
```

- `selected` is three-state: leave it unset for a chip that has no selection.
- `removable` only works on a plain `<sheep-chip>`; a button inside a button is
  invalid HTML.

### `sheep-badge`

```html
<sheep-badge tone="danger" label="3" />
<sheep-badge [color]="label.hex" [label]="label.name" emphasis="high" />
```

Not a control: it is smaller than the control sizes, and nothing is aimed at it.
Icon slot: `[sheepBadgeIcon]`.

### `sheep-nav-bar`

```html
<sheep-nav-bar ariaLabel="Main">
  <a sheepNavBarStart routerLink="/">Acme</a>
  <a sheep-nav-bar-item routerLink="/inbox" routerLinkActive ariaCurrentWhenActive="page">Inbox</a>
  <a sheep-nav-bar-item routerLink="/reports" routerLinkActive ariaCurrentWhenActive="page">Reports</a>
  <sheep-theme-switcher sheepNavBarEnd />
</sheep-nav-bar>
```

- The current item is marked by `aria-current`. With the router, use
  `routerLinkActive ariaCurrentWhenActive="page"`, which needs `RouterLink` and
  `RouterLinkActive` in `imports`. Without the router, bind `[active]` on the
  item. Use one or the other on an item, never both.
- Items that do not fit scroll sideways, with edge fades and step buttons. Do
  not wrap the bar in a scroll container of your own.
- The bar is not sticky. Pin it from the page's own CSS
  (`position: sticky; top: 0`) if needed.
- Slots: `[sheepNavBarStart]`, `[sheepNavBarEnd]`; on items,
  `[sheepNavBarItemStart]` and `[sheepNavBarItemEnd]`.

### `sheep-list`

```html
<sheep-list divided>
  <h3 sheepListSubheader>Recent</h3>
  <a sheep-list-item routerLink="/doc/1" [selected]="isCurrent(1)">
    <svg sheepListItemIcon>…</svg>
    <div sheepListItemTitle>Quarterly report</div>
    <div sheepListItemLine>Edited 2 days ago</div>
    <span sheepListItemMeta>3.2 MB</span>
  </a>
  <hr sheepListDivider />
</sheep-list>
```

Rows work inside a `cdk-virtual-scroll-viewport`; use
`SHEEP_LIST_ROW_HEIGHT[size]` (a per-size record) as its `itemSize`.

### `sheep-tree`

```html
<sheep-tree [nodes]="folders" [(expanded)]="open" [(selected)]="current" />
```

- `nodes` is `SheepTreeNode[]`, where a node is
  `{ id: string; label: string; children?: SheepTreeNode[]; disabled?: boolean }`.
- `expanded` is a `ReadonlySet<string>` of node ids; replace it rather than
  mutating it.
- Rows have a fixed height per size (`SHEEP_TREE_ROW_HEIGHT[size]`), so the tree
  virtualises.

### `sheep-table`

```html
<sheep-table [data]="employees()">
  <div sheepTableToolbar>…</div>

  <ng-container sheepColumnDef="name" sortable filterable>
    <sheep-header-cell *sheepHeaderCellDef>Name</sheep-header-cell>
    <sheep-cell *sheepCellDef="let row">{{ row.name }}</sheep-cell>
  </ng-container>

  <ng-container sheepColumnDef="salary" sortable align="end" width="120px">
    <sheep-header-cell *sheepHeaderCellDef>Salary</sheep-header-cell>
    <sheep-cell *sheepCellDef="let row">{{ row.salary | currency }}</sheep-cell>
  </ng-container>

  <p sheepTableEmpty>No employees match.</p>
</sheep-table>
```

- Columns are declared once, as a name plus two templates. No row template and
  no `displayedColumns` are needed, unless the visible columns change; for that,
  use `columns`.
- The table filters, sorts and pages its own `data`: pass the full array, not a
  page. `sort`, `filters`, `pageIndex` and `pageSize` are two-way if you need to
  own them.
- Past `virtualThreshold` rows the paginator gives way to virtual scrolling.
- `sheep-table-paginator` can also be used on its own.

### `sheep-dialog` and `sheep-side-sheet`

```html
<sheep-dialog [(open)]="confirming" (closed)="onClosed($event)">
  <sheep-dialog-header>Delete project?</sheep-dialog-header>
  <sheep-dialog-body>This cannot be undone.</sheep-dialog-body>
  <sheep-dialog-footer>
    <sheep-button variant="ghost" (click)="confirming.set(false)">Cancel</sheep-button>
    <sheep-button variant="solid" tone="danger" (click)="delete()">Delete</sheep-button>
  </sheep-dialog-footer>
</sheep-dialog>

<sheep-side-sheet side="right" size="sm" [(open)]="filtering">
  <sheep-side-sheet-header>Filters</sheep-side-sheet-header>
  <sheep-side-sheet-body>…</sheep-side-sheet-body>
  <sheep-side-sheet-footer align="between">…</sheep-side-sheet-footer>
</sheep-side-sheet>
```

- Both are built on a native `<dialog>`: the focus trap, the backdrop, Escape
  and the top layer come from the browser. Do not add a z-index or an overlay.
- `closed` emits `'close' | 'escape' | 'backdrop'`.
- `dismissible="false"` turns off Escape, the backdrop and the header's close
  button, for a step that must be finished.
- Use a dialog when the page must stop; use a side sheet when it only steps
  aside (filters, a detail record, a form).

### `sheepTooltip`

```html
<sheep-button [sheepTooltip]="'Archive ' + folder.name">Archive</sheep-button>
```

- A directive, not an element; options are `sheepTooltipPlacement` and
  `sheepTooltipDisabled`.
- `sheep-tooltip` and `SheepTooltipService` are its internals. Never write
  `<sheep-tooltip>` or call the service yourself.

### `sheep-theme-switcher`

`<sheep-theme-switcher />` is a Light / Dark / System segmented control over
`SheepThemeService`. It has no inputs.

## Do not

- Add `--sheep-button-*`-style variables, `[style]`, or `::ng-deep` overrides to
  restyle a component.
- Use `type="number"` on `sheep-input`, or expect a numeric value from it.
- Wrap `<a>` or `<button>` inside `sheep-chip`, `sheep-list-item` or
  `sheep-nav-bar-item`. Write the attribute on the element.
- Build layout wrappers out of library components. Use HTML and CSS.
- Write `<sheep-tooltip>`, or use `SheepInputFeatures` unless you are writing
  your own `sheep-input` feature directive.
