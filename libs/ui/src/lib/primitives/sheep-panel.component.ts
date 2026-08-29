import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';
import type { SheepSpace } from './primitives.constants';

/**
 * A bounded surface.
 *
 * Carries the theme's surface colour, hairline and corner radius, so grouped
 * content reads as one block without the caller describing what a block looks
 * like.
 */
@Component({
  selector: 'sheep-panel',
  imports: [],
  template: '<ng-content />',
  styleUrl: './sheep-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-pad]': 'padding()',
    '[attr.data-sunk]': 'sunk() ? "" : null',
  },
})
export class SheepPanelComponent {
  /** Inner padding, as a step from the theme space scale. */
  readonly padding = input<SheepSpace>('6');

  /** Recesses the panel into the page instead of lifting it off. */
  readonly sunk = input(false, { transform: booleanAttribute });
}
