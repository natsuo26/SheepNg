import { SheepTableComponent } from './sheep-table.component';
import { SheepCellComponent } from './sheep-cell/sheep-cell.component';
import { SheepHeaderCellComponent } from './sheep-header-cell/sheep-header-cell.component';
import { SheepTablePaginatorComponent } from './sheep-table-paginator/sheep-table-paginator.component';
import { SheepCellDefDirective } from './directives/sheep-cell-def.directive';
import { SheepColumnDefDirective } from './directives/sheep-column-def.directive';
import { SheepHeaderCellDefDirective } from './directives/sheep-header-cell-def.directive';
import { SheepTableEmptyDirective } from './directives/sheep-table-empty.directive';
import { SheepTableToolbarDirective } from './directives/sheep-table-toolbar.directive';

/**
 * Everything a table is composed from, ready to drop into a component's
 * `imports`.
 *
 * ```ts
 * @Component({ imports: [SHEEP_TABLE], ... })
 * ```
 *
 * Three kinds of thing live in here. `sheep-table` is the table itself. Three
 * definition directives — `sheepColumnDef`, `*sheepHeaderCellDef`,
 * `*sheepCellDef` — say what a column is and are never rendered. The rest are
 * the elements those definitions produce: a header cell, a body cell, and two
 * slots for the strip above the table and the message that replaces it when
 * there is nothing to show.
 *
 * Every piece is standalone and can be imported one at a time, but they are
 * only useful together — a `*sheepCellDef` with no `sheep-table` above it
 * matches nothing. Importing the set is the normal case, and it costs nothing a
 * caller does not use: a directive that is never written is never instantiated.
 */
export const SHEEP_TABLE = [
  SheepTableComponent,
  SheepColumnDefDirective,
  SheepHeaderCellDefDirective,
  SheepCellDefDirective,
  SheepHeaderCellComponent,
  SheepCellComponent,
  SheepTableToolbarDirective,
  SheepTableEmptyDirective,
  SheepTablePaginatorComponent,
] as const;
