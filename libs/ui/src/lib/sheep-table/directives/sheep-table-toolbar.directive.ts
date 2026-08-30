import { Directive } from '@angular/core';

/**
 * The strip above the table: a title, a search box, the caller's actions.
 *
 * ```html
 * <sheep-table [data]="rows()">
 *   <div sheepTableToolbar>
 *     <h2>Employees</h2>
 *     <sheep-button>Export</sheep-button>
 *   </div>
 *   …
 * </sheep-table>
 * ```
 *
 * Purely a slot. The table lays it out as a row and paints nothing in it — what
 * goes there is the page's business, not the table's.
 */
@Directive({
  selector: '[sheepTableToolbar]',
  host: { class: 'sheep-table__toolbar' },
})
export class SheepTableToolbarDirective {}
