import { Directive } from '@angular/core';

/**
 * A secondary line under the title. Repeat it for a two- or three-line row.
 *
 * The row's height follows its content, so there is no `lines` input to keep in
 * sync with how many of these are present.
 */
@Directive({
  selector: '[sheepListItemLine]',
  host: { class: 'sheep-list-item__line' },
})
export class SheepListItemLineDirective {}
