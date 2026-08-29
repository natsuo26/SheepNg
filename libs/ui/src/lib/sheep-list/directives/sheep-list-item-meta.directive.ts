import { Directive } from '@angular/core';

/** Trailing content — a timestamp, a badge, an icon button. */
@Directive({
  selector: '[sheepListItemMeta]',
  host: { class: 'sheep-list-item__meta' },
})
export class SheepListItemMetaDirective {}
