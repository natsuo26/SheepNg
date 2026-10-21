# @sheep-ng/ui

Standalone, signal-based Angular components with a single theme layer: buttons,
inputs, chips, badges, a nav bar, lists, a tree, a table, dialogs, side sheets
and tooltips. Zoneless-ready, `OnPush` throughout, light and dark themes built in.

## Install

```sh
npm install @sheep-ng/ui @angular/cdk
```

Requires Angular 22 (`@angular/core`, `@angular/forms` and `@angular/cdk`, all `^22`).

## Quick start

1. Import the theme once, from your app's **global** stylesheet (`src/styles.scss`).
   Without it the components render unstyled.

   ```scss
   @use '@sheep-ng/ui/styles/sheep-theme';
   ```

2. Import components into a standalone component and use them:

   ```ts
   import { Component, signal } from '@angular/core';
   import { SHEEP_INPUT, SheepButtonComponent } from '@sheep-ng/ui';

   @Component({
     selector: 'app-profile',
     imports: [SheepButtonComponent, SHEEP_INPUT],
     template: `
       <sheep-input [(value)]="name" required>
         <span sheepInputLabel>Display name</span>
       </sheep-input>
       <sheep-button variant="solid" (click)="save()">Save</sheep-button>
     `,
   })
   export class Profile {
     protected readonly name = signal('');
     protected save(): void {}
   }
   ```

Multi-part components export a set to spread into `imports`: `SHEEP_INPUT`,
`SHEEP_LIST`, `SHEEP_TABLE`, `SHEEP_DIALOG`, `SHEEP_SIDE_SHEET`, `SHEEP_CHIP`,
`SHEEP_NAV_BAR`. The rest are imported singly: `SheepButtonComponent`,
`SheepBadgeComponent`, `SheepTreeComponent`, `SheepTooltipDirective`,
`SheepThemeSwitcherComponent`.

## For AI assistants and tooling

The package ships two files for coding assistants and editor tooling:

- **`AGENTS.md`**: how to use the library correctly, including the rules and
  the common mistakes.
- **`custom-elements.json`**: a [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest)
  of the whole public API: every element and directive, with input types and
  defaults, outputs, slots and the import to use. `package.json` points at it
  through the standard `customElements` field.

## The theme layer

Components carry no per-instance style API. Every colour, metric, radius and
timing resolves from `--sheep-*` custom properties emitted by the theme layer,
so two buttons in one app cannot drift apart. **To change how components look,
change the theme — not the call site.**

Import the entry point once, from the app's global stylesheet:

```scss
@use '@sheep-ng/ui/styles/sheep-theme';
```

It emits the `--sheep-*` roles on `:root`, a `prefers-color-scheme` fallback,
and a `[data-sheep-theme]` scope per theme. To re-brand, override roles after
the import, at `:root` or on a `[data-sheep-theme]` scope, never per
component:

```scss
@use '@sheep-ng/ui/styles/sheep-theme';

:root {
  --sheep-color-accent: #0f766e;
}
```

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

To avoid a flash of the wrong theme, paint the remembered value before Angular
boots, from an inline script in `index.html`'s `<head>`:

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem('sheep-ng:theme');
      if (t === 'light' || t === 'dark') {
        document.documentElement.setAttribute('data-sheep-theme', t);
      }
    } catch (e) {
      /* storage unavailable: fall back to prefers-color-scheme */
    }
  })();
</script>
```

## Scope

This library ships **components and a theme**. It does not ship layout.

There is no `sheep-stack`, `sheep-row` or `sheep-grid` here, and there should
not be: a layout DSL is not a standard part of a component library. It is a
second, parallel way to write CSS that every consumer then has to learn, and
it competes with the platform primitives — flexbox, grid, semantic HTML — that
already do the job and that consumers already know.

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

## `sheep-input`

```ts
import { SHEEP_INPUT } from '@sheep-ng/ui';
```

```html
<sheep-input [(value)]="name" required>
  <span sheepInputLabel>Display name</span>
  <span sheepInputHint>Shown on your profile.</span>
</sheep-input>
```

It renders a real `<input>`, so typing, selection, autofill, IME composition and
the password manager are the platform's. The component owns the label, the hint
and the error line, and wires the `id`, `for`, `aria-describedby`,
`aria-invalid` and `aria-errormessage` between them — the call site never labels
an input by hand.

### A rule, not a box

The field is one hairline under the value, with empty space doing the framing,
so a column of fields reads as a page of writing rather than a stack of
containers. There are no side or top borders in either variant, and the value
starts flush with the label above it — the look depends on that column being
straight.

The height follows from the type rather than from the shared control scale: a
button's height is the size of a thing you press, and standing a rule off from
its text by that much reads as a gap rather than as an underline. So an
`underline` field is shorter than a button of the same `size`. `soft` — a sunk
ground under the same rule, for a form dense enough that the rows need telling
apart — keeps the button's height, because it has a ground to fill.

### The label floats

At rest the label stands where the value will be, in place of a placeholder. It
lifts to the row above on focus, and stays there once there is a value:

Only the label moves. Its row is reserved whether it is occupied or not, so the
rule never shifts and a column of fields does not jitter as one is filled in.
There is nothing to switch on, and two cases resolve themselves:

- A field given a `placeholder` keeps its label lifted for good. The two would
  otherwise print on top of each other, and the placeholder is the one that was
  asked for.
- A leading prefix keeps its width but fades out while the label rests over it,
  so the value never shifts sideways under the caret.

`SHEEP_INPUT` is the field plus its nine directives, ready to drop into a
component's `imports`. The pieces are standalone and importable one at a time,
but a directive that is never written is never instantiated, so importing the
set costs nothing.

### Signal forms

The field implements `FormValueControl<string>`, so `[formField]` binds it end
to end and nothing else appears at the call site:

```html
<form (submit)="onSubmit($event)">
  <sheep-input [formField]="f.email">
    <span sheepInputLabel>Email</span>
  </sheep-input>
</form>
```

`required`, `minLength`, `maxLength` and `pattern` come down from the schema and
reach the native input as real attributes. `errors`, `disabled`, `readonly`,
`invalid`, `pending` and `touched` come down too; blur goes back up as `touch`,
which is what `submit()` and `debounce('blur')` are keyed on.

Reactive forms bridge through `compatForm()` in `@angular/forms/signals/compat`.
The field deliberately ships no `ControlValueAccessor`: `[formField]` picks the
CVA path over the control contract when one is present, which would cost the
errors, touched and constraint bindings above.

### Errors

An error is `{ kind, message? }` — the shape signal forms uses. Text resolves
from the error's own `message` first, then from `SHEEP_INPUT_MESSAGES`,
which is where `required` and `email` get one sentence for the whole app.
A `kind` with no text renders nothing rather than leaking the kind.

```ts
providers: [
  provideSheepInputMessages({
    errors: { required: 'Bitte ausfüllen.' },
    showPassword: 'Passwort anzeigen',
  }),
];
```

Errors stay hidden until `touched`, which signal forms sets on blur and on every
field at `submit()`. A field raises its own on blur, so it behaves the same with
no form behind it. Handing errors in directly — the ones a server sent back —
means setting `touched` alongside them.

### Directives

Everything past a value and a label is a directive on the host element, so a
plain field carries none of their weight.

| Directive              | Adds                                                          |
| ---------------------- | ------------------------------------------------------------- |
| `sheepInputLabel`  | The label. Projected into a real `<label for>`.               |
| `sheepInputHint`   | Guidance in the footer, referenced by `aria-describedby`.     |
| `sheepInputPrefix` | Content before the value, inside the box.                     |
| `sheepInputSuffix` | Content after the value, inside the box.                      |
| `sheepPassword`        | `type="password"` plus a reveal toggle.                       |
| `sheepEmail`           | `type="email"`, the mobile keyboard hints, and the check.     |
| `sheepNumber`          | A number pad, a keystroke filter, Arrow Up/Down stepping and `min` / `max` / `step` checks. The value stays a string. |
| `sheepCounter`         | A count in the footer, against `maxLength` when there is one. |
| `[sheepValidate]`      | A rule of your own: `(value: string) => string \| null`.      |

`sheepPassword` and `sheepEmail` set the type themselves, so there is no
`type="password"` beside them to drift out of sync.

Write your own by implementing `SheepInputFeature` and registering with the
`SheepInputFeatures` the field provides. Each hook is a plain function of
the field's state called inside the field's own `computed`s, so a signal the
feature reads on the way through is tracked as if the field had read it.

Numbers use `sheepNumber`, not `type="number"`:

```html
<sheep-input sheepNumber min="0" step="0.01" [(value)]="price">
  <span sheepInputLabel>Price</span>
  <span sheepInputPrefix>$</span>
</sheep-input>
```

**Who owns validity.** `sheepEmail`, `sheepNumber` and `sheepValidate` raise errors the _field_
renders. A signal form cannot see them, so a form-bound field would show the
message while the form still thought itself valid. On a form-bound field, put
the rule in the schema — `email()`, `min()`, `max()`, `validate()` — where the form can act on it.
Reach for the directives on a field with no form behind it.

### Inputs

| Input                     | Type                                                | Default     | Notes                                        |
| ------------------------- | --------------------------------------------------- | ----------- | -------------------------------------------- |
| `value`                   | `model<string>`                                     | `''`        | Two-way, and bound by `[formField]`.         |
| `variant`                 | `underline \| soft`                                 | `underline` | Visual weight.                               |
| `size`                    | `sm \| md \| lg`                                    | `md`        | Shared with every control in the library.    |
| `type`                    | `text \| password \| email \| search \| tel \| url` | `text`      | A feature directive overrides it.            |
| `placeholder`             | `string \| null`                                    | `null`      | Not a label — it is gone once typing starts. |
| `autocomplete`            | `string \| null`                                    | `null`      | Worth setting on every real form field.      |
| `ariaLabel`               | `string \| null`                                    | `null`      | Required when no label is projected.         |
| `disabled`                | `boolean`                                           | `false`     | Bare attribute allowed. Blocks focus.        |
| `readonly`                | `boolean`                                           | `false`     | Keeps the value selectable and focusable.    |
| `required`                | `boolean`                                           | `false`     | Native, plus an asterisk on the label.       |
| `pending`                 | `boolean`                                           | `false`     | Spinner, for an async rule in flight.        |
| `touched`                 | `boolean`                                           | `false`     | The gate on showing errors.                  |
| `invalid`                 | `boolean`                                           | `false`     | Invalid with nothing to say.                 |
| `errors`                  | `ValidationError[]`                                 | `[]`        | Filled by `[formField]`.                     |
| `name`                    | `string`                                            | `''`        | Empty means no attribute at all.             |
| `minLength` / `maxLength` | `number \| undefined`                               | `undefined` | Reach the input as real attributes.          |
| `pattern`                 | `RegExp[]`                                          | `[]`        | The first one reaches the DOM.               |

There is no `value` output beside the model, and no `fullWidth`: the field fills
its column, and the caller sizes the column.

`focus()` on the component instance forwards to the native input. `reset()`
forgets the blur it has seen, and so the errors it was showing.

### Accessibility

This is the one control in the library that does not take the 2px accent
outline on focus: an outline is a box, and a box is what the field is defined by
not having. Instead the rule under the value doubles in weight, takes the
accent, and grows out of the centre — a larger indicator than the outline it
replaces, not a quieter one. The label takes the accent with it.

The reveal toggle is a real focusable button, but takes no focus on a mouse
click, so the caret stays where it was mid-word.
`prefers-reduced-motion` drops every transition, including the label's, and
`forced-colors` hands the palette over to system colours.

## `sheep-dialog`

```ts
import { SHEEP_DIALOG } from '@sheep-ng/ui';
```

```html
<sheep-dialog [(open)]="confirming">
  <sheep-dialog-header>Delete project</sheep-dialog-header>

  <sheep-dialog-body>This cannot be undone.</sheep-dialog-body>

  <sheep-dialog-footer>
    <sheep-button (click)="confirming.set(false)">Cancel</sheep-button>
    <sheep-button tone="danger" variant="solid" (click)="remove()"> Delete </sheep-button>
  </sheep-dialog-footer>
</sheep-dialog>
```

The dialog owns being open, being modal and being dismissed. It owns nothing
about what is inside it: the three parts are slots, and the footer's buttons
and what they do are the caller's.

The parts are ordered by the component, not by the markup — the header is
always the first row and the footer always the last, so a dialog cannot be
assembled upside down. The body is the only part that scrolls: the panel stops
growing at the viewport and the header and footer stay put.

Underneath is a native `<dialog>` opened with `showModal()`, so the focus trap,
the backdrop, the top-layer stacking and Escape are the platform's, not a
reimplementation of them. It follows that an ancestor's `overflow` or
`transform` cannot clip the panel, and that no `z-index` needs choosing.

`SHEEP_DIALOG` is the dialog and its three parts, ready to drop into a
component's `imports`.

### State

`open` is the state, and it is two-way — nothing opens or closes the dialog
behind the caller's back. A dismissal writes `false` back and says why:

```html
<sheep-dialog [(open)]="editing" (closed)="track($event)">…</sheep-dialog>
```

`show()` and `close(reason?)` on the component instance are the same state,
called instead of bound. Bind `[(open)]` rather than `[open]`: a one-way
binding is re-applied on the next check, which would reopen a dialog the user
just dismissed.

Content is created with the caller's view, not when the dialog opens. Wrap an
expensive body in `@if` at the call site if that matters.

### Inputs and outputs

| Input / output | Type                          | Default | Notes                                                         |
| -------------- | ----------------------------- | ------- | ------------------------------------------------------------- |
| `open`         | `boolean`                     | `false` | Two-way. The single source of truth for whether it shows.     |
| `size`         | `sm \| md \| lg`              | `md`    | Panel width and interior density, together.                   |
| `dismissible`  | `boolean`                     | `true`  | Escape, backdrop click and the header's close button, as one. |
| `ariaLabel`    | `string \| null`              | `null`  | The name, when there is no header to take it from.            |
| `(closed)`     | `close \| escape \| backdrop` | —       | Emits once closed, with what closed it.                       |
| `align`        | `end \| start \| between`     | `end`   | On `sheep-dialog-footer`. Where the buttons sit on the row.   |

Actions read left to right in rising commitment, so the one the dialog is for
goes last. `align="between"` pushes a destructive or secondary action away from
the pair the eye lands on.

### Accessibility

A modal needs an accessible name. `sheep-dialog-header` carries the id the
dialog points `aria-labelledby` at, so it is announced by the words on screen;
a dialog with no header wants `ariaLabel` instead.

The close button in the header is the dismissal Escape and the backdrop already
offer, made visible — it appears exactly when `dismissible` is set, so the
three ways out cannot disagree. A dialog that must be answered turns it off and
puts the answers in the footer.

Clicking off the dialog is a pointer gesture with no keyboard counterpart, so
the backdrop is not focusable; Escape is the keyboard's way out. A drag that
starts inside the panel and ends outside it does not dismiss, so selecting text
past the panel's edge cannot throw the dialog away.

`prefers-reduced-motion` drops the entry animation, and `forced-colors` gives
the panel a system-coloured border.

## More components

`sheep-chip`, `sheep-badge`, `sheep-nav-bar`, `sheep-list`, `sheep-tree`,
`sheep-table`, `sheep-side-sheet` and `sheepTooltip` are covered with examples in
`AGENTS.md`, and in full, input by input, in `custom-elements.json`.

## License

MIT
