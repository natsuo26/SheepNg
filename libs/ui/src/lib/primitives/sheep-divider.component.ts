import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Orientation of a `sheep-divider`. */
export type SheepDividerOrientation = 'horizontal' | 'vertical';

/**
 * A hairline rule in the theme's line colour.
 *
 * Presentational, so it is hidden from assistive technology — a separator
 * that carries meaning belongs in the document structure, not here.
 */
@Component({
  selector: 'sheep-divider',
  imports: [],
  template: '',
  styleUrl: './sheep-divider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[attr.data-orientation]': 'orientation()',
  },
})
export class SheepDividerComponent {
  /** `vertical` stretches to the height of its flex row. */
  readonly orientation = input<SheepDividerOrientation>('horizontal');
}
