import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';
import type {
  SheepAlign,
  SheepJustify,
  SheepSpace,
} from './primitives.constants';

/**
 * A horizontal cluster.
 *
 * The counterpart to `sheep-stack`: lays its children out in a row with one
 * gap from the space scale, wrapping by default so a cluster of controls
 * never overflows a narrow viewport.
 *
 * ```html
 * <sheep-row gap="3">
 *   <sheep-button>Cancel</sheep-button>
 *   <sheep-button variant="solid">Publish</sheep-button>
 * </sheep-row>
 * ```
 */
@Component({
  selector: 'sheep-row',
  imports: [],
  template: '<ng-content />',
  styleUrl: './sheep-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-gap]': 'gap()',
    '[attr.data-align]': 'align()',
    '[attr.data-justify]': 'justify()',
    '[attr.data-nowrap]': 'wrap() ? null : ""',
  },
})
export class SheepRowComponent {
  /** Step from the theme space scale. */
  readonly gap = input<SheepSpace>('3');

  /** Cross-axis alignment of the children. */
  readonly align = input<SheepAlign>('center');

  /** Main-axis distribution. */
  readonly justify = input<SheepJustify>('start');

  /** Wraps onto more lines when the row runs out of room. */
  readonly wrap = input(true, { transform: booleanAttribute });
}
