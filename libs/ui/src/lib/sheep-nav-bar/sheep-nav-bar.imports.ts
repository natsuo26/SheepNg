import { SheepNavBarComponent } from './sheep-nav-bar.component';
import { SheepNavBarItemComponent } from './sheep-nav-bar-item/sheep-nav-bar-item.component';

/**
 * The nav bar and its item, ready to drop into a component's imports.
 *
 * ```ts
 * @Component({ imports: [SHEEP_NAV_BAR, RouterLink, RouterLinkActive], ... })
 * ```
 *
 * Both are standalone and can be imported one at a time, but they are only
 * useful together. The router is not part of the set: the bar works with it
 * and without it, and does not make `@angular/router` a dependency.
 */
export const SHEEP_NAV_BAR = [
  SheepNavBarComponent,
  SheepNavBarItemComponent,
] as const;
