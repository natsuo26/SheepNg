import { Directive } from '@angular/core';
import { CdkHeaderCellDef } from '@angular/cdk/table';

/**
 * The template for this column's header cell.
 *
 * ```html
 * <sheep-header-cell *sheepHeaderCellDef>Name</sheep-header-cell>
 * ```
 *
 * Structural for symmetry with `*sheepCellDef` and because the header is
 * rendered by the table, not by the markup order: it takes no context, and a
 * header cell has nothing to be handed.
 */
@Directive({
  selector: '[sheepHeaderCellDef]',
  providers: [
    { provide: CdkHeaderCellDef, useExisting: SheepHeaderCellDefDirective },
  ],
})
export class SheepHeaderCellDefDirective extends CdkHeaderCellDef {}
