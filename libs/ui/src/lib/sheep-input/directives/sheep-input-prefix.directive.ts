import { Directive } from '@angular/core';

/**
 * Content before the value, inside the box — a currency mark, a scheme, an
 * icon.
 *
 * Decoration, not a second control: it sits outside the input, so it is not in
 * the value and not in the tab order. An `svg` or `img` marked with it is
 * squared to the control's icon metric.
 */
@Directive({
  selector: '[sheepInputPrefix]',
})
export class SheepInputPrefixDirective {}
