import { Directive } from '@angular/core';

/**
 * The leading icon of a row.
 *
 * Sized by the list's density — an `<svg>` or `<img>` marked with it is squared
 * to the row's icon metric. Paint is left alone: the icon declares its own
 * fill/stroke, normally `currentColor`.
 */
@Directive({
  selector: '[sheepListItemIcon]',
  host: { class: 'sheep-list-item__icon' },
})
export class SheepListItemIconDirective {}
