import { SheepDialogComponent } from './sheep-dialog.component';
import { SheepDialogHeaderComponent } from './sheep-dialog-header/sheep-dialog-header.component';
import { SheepDialogBodyComponent } from './sheep-dialog-body/sheep-dialog-body.component';
import { SheepDialogFooterComponent } from './sheep-dialog-footer/sheep-dialog-footer.component';

/**
 * The dialog and its three parts, ready to drop into a component's `imports`.
 *
 * ```ts
 * @Component({ imports: [SHEEP_DIALOG], ... })
 * ```
 *
 * Each piece is standalone and can be imported one at a time, but they are
 * only useful together — a `sheep-dialog-footer` with no dialog around it is
 * a row of buttons on the page. Importing the set is the normal case.
 */
export const SHEEP_DIALOG = [
  SheepDialogComponent,
  SheepDialogHeaderComponent,
  SheepDialogBodyComponent,
  SheepDialogFooterComponent,
] as const;
