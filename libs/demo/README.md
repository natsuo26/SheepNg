# @sheep-ng/demo

The showcase pages for `@sheep-ng/ui`. Private — this library is never
published; `apps/demo-app` lazy-loads a page per component.

```sh
nx test demo
```

## The page kit

Demo pages are **semantic HTML plus a class vocabulary** that lives in
`src/styles/_demo-kit.scss`. It exists here, and only here, on purpose:
documentation chrome is not a component library's job, so `@sheep-ng/ui`
ships components and a theme and nothing about how to lay out a page.

The kit reads only `--sheep-*` theme roles, so a demo page re-themes in step
with the components it frames.

A new demo page picks it up in two lines:

```scss
// input-demo.scss
@use '../../styles/demo-kit' as demo;

@include demo.kit;
```

```ts
@Component({
  templateUrl: './input-demo.html',
  styleUrl: './input-demo.scss',
})
```

Angular's emulated encapsulation scopes every rule to the component that
included it, so two pages including the kit cannot collide.

## The vocabulary

| Class                                                   | Role                                                            |
| ------------------------------------------------------- | --------------------------------------------------------------- |
| `.demo-page` / `.demo-page__head`                       | The page, and its title block.                                  |
| `.demo-title` / `.demo-lede`                            | `h1` and the intro paragraph (capped at a readable measure).     |
| `.demo-section` / `__head` / `__title` / `.demo-note`   | One documented section: `h2` plus a line of commentary.          |
| `.demo-eyebrow`                                         | Uppercase micro-label over a page or a group.                    |
| `.demo-rule`                                            | The `hr` between sections.                                       |
| `.demo-specimen`                                        | A section's examples, stacked.                                   |
| `.demo-group`                                           | One labelled slice of a specimen.                                |
| `.demo-cluster` (`--baseline`)                          | Examples side by side; wraps.                                    |
| `.demo-column`                                          | Examples stacked, sized by their content.                        |
| `.demo-vrule`                                           | A hairline between two halves of a cluster.                      |
| `.demo-code`                                            | A `pre`/`code` block on the recessed surface.                    |
| `.demo-props` / `.demo-prop` / `__head` `__name` `__default` `__type` | The API grid, one card per input.                   |

Headings are real `h1`–`h2` and sections are `<section aria-labelledby>`, so
the document outline a screen reader announces matches the one on screen.

## Code blocks

Pass snippets as a **bound string**, not projected content — Angular collapses
whitespace in templates, so projected code arrives with its newlines stripped:

```html
<pre class="demo-code"><code>{{ snippet }}</code></pre>
```
