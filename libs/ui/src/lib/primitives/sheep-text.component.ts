import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';
import type { SheepTextSize, SheepTextTone } from './primitives.constants';

/**
 * Body copy, labels and inline code.
 *
 * Covers the handful of text roles a page actually needs — normal, muted,
 * faint, accent — so a caller reaches for a role rather than a colour.
 *
 * ```html
 * <sheep-text tone="muted" measure>Supporting copy.</sheep-text>
 * <sheep-text size="xs" tone="faint" uppercase>Section</sheep-text>
 * <sheep-text mono>variant</sheep-text>
 * ```
 */
@Component({
  selector: 'sheep-text',
  imports: [],
  template: '<ng-content />',
  styleUrl: './sheep-text.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-tone]': 'tone()',
    '[attr.data-size]': 'size()',
    '[attr.data-mono]': 'mono() ? "" : null',
    '[attr.data-uppercase]': 'uppercase() ? "" : null',
    '[attr.data-measure]': 'measure() ? "" : null',
    '[attr.data-block]': 'block() ? "" : null',
  },
})
export class SheepTextComponent {
  /** Which text role this is. */
  readonly tone = input<SheepTextTone>('default');

  /** Text size. `md` is the body default. */
  readonly size = input<SheepTextSize>('md');

  /** Sets the text in the theme's monospace face. */
  readonly mono = input(false, { transform: booleanAttribute });

  /** Upper-cases and tracks out — for eyebrow labels. */
  readonly uppercase = input(false, { transform: booleanAttribute });

  /** Caps the line length at a readable measure. */
  readonly measure = input(false, { transform: booleanAttribute });

  /** Lays the text out as a block instead of inline. */
  readonly block = input(false, { transform: booleanAttribute });
}
