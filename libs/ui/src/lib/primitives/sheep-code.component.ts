import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A block of code, on the theme's recessed surface.
 *
 * Takes the snippet as a string rather than projected content: Angular
 * collapses whitespace in templates, so projected code would arrive with its
 * newlines already stripped. A bound string keeps its line breaks, and needs
 * no HTML escaping of `<` either.
 *
 * ```html
 * <sheep-code [code]="snippet" />
 * ```
 *
 * Long lines scroll inside the block rather than widening the page.
 */
@Component({
  selector: 'sheep-code',
  imports: [],
  template: '<pre><code>{{ code() }}</code></pre>',
  styleUrl: './sheep-code.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SheepCodeComponent {
  /** The snippet to render. Newlines and indentation are preserved. */
  readonly code = input.required<string>();
}
