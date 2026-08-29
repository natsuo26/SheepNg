import { SheepListComponent } from './sheep-list.component';
import { SheepListItemComponent } from './sheep-list-item/sheep-list-item.component';
import { SheepListDividerDirective } from './directives/sheep-list-divider.directive';
import { SheepListItemIconDirective } from './directives/sheep-list-item-icon.directive';
import { SheepListItemLineDirective } from './directives/sheep-list-item-line.directive';
import { SheepListItemMetaDirective } from './directives/sheep-list-item-meta.directive';
import { SheepListItemTitleDirective } from './directives/sheep-list-item-title.directive';
import { SheepListSubheaderDirective } from './directives/sheep-list-subheader.directive';

/**
 * Everything a list is composed from, ready to drop into a component's
 * `imports`.
 *
 * The six directives are the vocabulary of a row: each is a class and nothing
 * more, marking which slot an element belongs to.
 *
 * The pieces are standalone and can be imported one by one, but they are only
 * useful together — a `sheepListItemTitle` with no `sheep-list-item` around it
 * does nothing. Importing the set is the normal case:
 *
 * ```ts
 * @Component({ imports: [SHEEP_LIST], ... })
 * ```
 */
export const SHEEP_LIST = [
  SheepListComponent,
  SheepListItemComponent,
  SheepListSubheaderDirective,
  SheepListDividerDirective,
  SheepListItemIconDirective,
  SheepListItemTitleDirective,
  SheepListItemLineDirective,
  SheepListItemMetaDirective,
] as const;
