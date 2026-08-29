import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { SheepSpace } from './primitives.constants';

/** Minimum comfortable column width before the grid drops a track. */
export const SHEEP_GRID_COLUMN_WIDTHS = ['sm', 'md', 'lg'] as const;

export type SheepGridColumn = (typeof SHEEP_GRID_COLUMN_WIDTHS)[number];

/**
 * A responsive grid that chooses its own column count.
 *
 * Columns are sized by a minimum width rather than a fixed number, so the
 * grid reflows on its own and the caller never writes a media query.
 *
 * ```html
 * <sheep-grid min="md" gap="2">
 *   <sheep-panel>…</sheep-panel>
 * </sheep-grid>
 * ```
 */
@Component({
  selector: 'sheep-grid',
  imports: [],
  template: '<ng-content />',
  styleUrl: './sheep-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-gap]': 'gap()',
    '[attr.data-min]': 'min()',
  },
})
export class SheepGridComponent {
  /** Step from the theme space scale. */
  readonly gap = input<SheepSpace>('3');

  /** Narrowest a column may get before the grid drops to fewer tracks. */
  readonly min = input<SheepGridColumn>('md');
}
