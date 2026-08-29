import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { SheepHeadingLevel } from './primitives.constants';

/**
 * A heading in the theme's display type.
 *
 * `level` drives both the semantics and the size, so the visual hierarchy and
 * the one assistive technology announces cannot disagree.
 *
 * The host carries `role="heading"` with an `aria-level` rather than rendering
 * an `h1`-`h4` tag, because a single `<ng-content>` cannot be projected into
 * one of several branches. Screen readers treat the two as equivalent.
 */
@Component({
  selector: 'sheep-heading',
  imports: [],
  template: '<ng-content />',
  styleUrl: './sheep-heading.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'heading',
    '[attr.aria-level]': 'level()',
    '[attr.data-level]': 'level()',
  },
})
export class SheepHeadingComponent {
  /**
   * Heading depth, 1 to 4.
   *
   * Accepts the plain-attribute form as well as a binding — `level="1"` and
   * `[level]="1"` both work — so a static page needs no binding syntax.
   */
  readonly level = input<
    SheepHeadingLevel,
    SheepHeadingLevel | `${SheepHeadingLevel}`
  >(2, { transform: (value) => Number(value) as SheepHeadingLevel });
}
