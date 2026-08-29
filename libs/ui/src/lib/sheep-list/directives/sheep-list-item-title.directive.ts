import { Directive } from '@angular/core';

/** The row's primary text. One per row. */
@Directive({
  selector: '[sheepListItemTitle]',
  host: { class: 'sheep-list-item__title' },
})
export class SheepListItemTitleDirective {}
