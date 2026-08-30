import { Directive } from '@angular/core';

/**
 * What the table shows in place of rows when it has none.
 *
 * ```html
 * <div sheepTableEmpty>No employees match that filter.</div>
 * ```
 *
 * Optional: without it the table falls back to one line from
 * `SHEEP_TABLE_MESSAGES`. Worth writing whenever the reason for the emptiness
 * is knowable — "no results for that filter" is a different message from "no
 * employees yet", and only the page knows which one it is.
 */
@Directive({
  selector: '[sheepTableEmpty]',
  host: { class: 'sheep-table__empty-slot' },
})
export class SheepTableEmptyDirective {}
