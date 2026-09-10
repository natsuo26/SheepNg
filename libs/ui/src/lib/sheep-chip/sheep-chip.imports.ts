import { SheepChipComponent } from './sheep-chip.component';
import { SheepChipSetComponent } from './sheep-chip-set/sheep-chip-set.component';

/**
 * The chip and its group, ready to drop into a component's imports.
 *
 * Both are standalone and can be imported one by one; the set is the normal
 * case, because a chip on its own is rare and a group of them is the point:
 *
 * ```ts
 * @Component({ imports: [SHEEP_CHIP], ... })
 * ```
 */
export const SHEEP_CHIP = [SheepChipComponent, SheepChipSetComponent] as const;
