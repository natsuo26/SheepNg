import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { SheepAlign, SheepSpace } from './primitives.constants';

/**
 * Vertical rhythm.
 *
 * Stacks its children in a column with one gap from the theme's space scale.
 * Spacing is the only thing it decides, and it can only pick a step from the
 * scale — so a page built out of stacks keeps the theme's rhythm without any
 * of its own CSS.
 *
 * ```html
 * <sheep-stack gap="8">
 *   <sheep-heading>Title</sheep-heading>
 *   <sheep-text tone="muted">Supporting copy.</sheep-text>
 * </sheep-stack>
 * ```
 */
@Component({
  selector: 'sheep-stack',
  imports: [],
  template: '<ng-content />',
  styleUrl: './sheep-stack.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-gap]': 'gap()',
    '[attr.data-align]': 'align()',
  },
})
export class SheepStackComponent {
  /** Step from the theme space scale. */
  readonly gap = input<SheepSpace>('4');

  /** Cross-axis alignment of the children. */
  readonly align = input<SheepAlign>('stretch');
}
