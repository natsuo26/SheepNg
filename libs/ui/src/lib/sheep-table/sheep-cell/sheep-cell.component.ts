import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { CdkCell } from '@angular/cdk/table';
import { SheepColumnDefDirective } from '../directives/sheep-column-def.directive';

/**
 * One row's cell in one column.
 *
 * ```html
 * <sheep-cell *sheepCellDef="let row">{{ row.name }}</sheep-cell>
 * ```
 *
 * A slot and nothing else: whatever is inside it is the caller's — text, a
 * badge, a button, a link. The cell contributes the column's width, alignment
 * and density, all of which it reads off the `sheepColumnDef` it sits in rather
 * than taking as inputs, so the header above it cannot disagree.
 *
 * Content is kept to one line and clipped. A row is a fixed height — that is
 * what lets the table virtualise past a thousand rows — and text that wrapped
 * would run out of it.
 */
@Component({
  selector: 'sheep-cell',
  imports: [],
  template: '<ng-content />',
  styleUrl: './sheep-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sheep-table__cell',
    role: 'cell',
    '[class]': 'classes()',
    '[style.flex]': 'flex()',
    '[style.min-width]': 'minWidth()',
  },
})
export class SheepCellComponent extends CdkCell {
  private readonly columnDef = inject(SheepColumnDefDirective);

  protected readonly classes = computed(
    () => `sheep-table__cell--${this.columnDef.align()}`,
  );

  /**
   * The column's share of the row.
   *
   * A named width takes the column out of the flex entirely; otherwise `grow`
   * splits what is left. `0%` as the basis rather than `auto` so that a long
   * value in one cell cannot widen its column past the others.
   */
  protected readonly flex = computed(() => {
    const width = this.columnDef.width();
    return width ? `0 0 ${width}` : `${this.columnDef.grow()} 1 0%`;
  });

  /** A named width is the whole answer; the density's floor is for the rest. */
  protected readonly minWidth = computed(() => this.columnDef.width());
}
