import { SheepSideSheetComponent } from './sheep-side-sheet.component';
import { SheepSideSheetHeaderComponent } from './sheep-side-sheet-header/sheep-side-sheet-header.component';
import { SheepSideSheetBodyComponent } from './sheep-side-sheet-body/sheep-side-sheet-body.component';
import { SheepSideSheetFooterComponent } from './sheep-side-sheet-footer/sheep-side-sheet-footer.component';

/**
 * The side sheet and its three parts, ready to drop into a component imports.
 *
 * ```ts
 * @Component({ imports: [SHEEP_SIDE_SHEET], ... })
 * ```
 *
 * Each piece is standalone and can be imported one at a time, but they are
 * only useful together — a `sheep-side-sheet-footer` with no sheet around it
 * is a row of buttons on the page. Importing the set is the normal case.
 */
export const SHEEP_SIDE_SHEET = [
  SheepSideSheetComponent,
  SheepSideSheetHeaderComponent,
  SheepSideSheetBodyComponent,
  SheepSideSheetFooterComponent,
] as const;
