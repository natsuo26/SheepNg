import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  numberAttribute,
} from '@angular/core';
import { SHEEP_TABLE_PAGE_SIZE_OPTIONS } from '../sheep-table.constants';
import { SHEEP_TABLE_MESSAGES } from '../sheep-table.messages';

/**
 * The page controls under a table: a size, a read-out, four steps.
 *
 * `sheep-table` renders one for itself whenever it is paginating, so a table
 * needs nothing here. It is public because pagination is not only a table's
 * problem — a grid of cards or a list of results pages the same way — and
 * because the alternative is every page reinventing the same four buttons.
 *
 * ```html
 * <sheep-table-paginator
 *   [length]="results().length"
 *   [(pageIndex)]="page"
 *   [(pageSize)]="size"
 * />
 * ```
 *
 * It owns no data and does no slicing: it reports where the user wants to be
 * and the caller slices. `pageIndex` is clamped to the range `length` and
 * `pageSize` imply, so a filter that shrinks the results cannot strand it on a
 * page that no longer exists.
 *
 * Changing the page size keeps the first visible row visible — landing back on
 * page one after switching from 10 rows to 25 loses the reader's place for no
 * reason.
 *
 * Deliberately NOT themeable per instance. Inside a `sheep-table` it inherits
 * that table's density; elsewhere it sits at the library's `md` scale.
 */
@Component({
  selector: 'sheep-table-paginator',
  imports: [],
  templateUrl: './sheep-table-paginator.component.html',
  styleUrl: './sheep-table-paginator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sheep-paginator' },
})
export class SheepTablePaginatorComponent {
  /** How many rows there are to page through. */
  readonly length = input(0, { transform: numberAttribute });

  /** The current page, counted from zero. Two-way. */
  readonly pageIndex = model(0);

  /** Rows per page. Two-way, and driven by the select when there is one. */
  readonly pageSize = model(25);

  /**
   * The sizes offered.
   *
   * One option — or none — hides the select rather than rendering a control
   * with nothing to choose.
   */
  readonly pageSizeOptions = input<readonly number[]>(
    SHEEP_TABLE_PAGE_SIZE_OPTIONS,
  );

  protected readonly messages = inject(SHEEP_TABLE_MESSAGES);

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.length() / Math.max(1, this.pageSize()))),
  );

  /**
   * The page actually being shown.
   *
   * Clamped rather than written back: the caller owns `pageIndex`, and a
   * component that corrected it during change detection would be writing to
   * its own input behind the caller's back.
   */
  protected readonly page = computed(() =>
    Math.min(Math.max(0, this.pageIndex()), this.pageCount() - 1),
  );

  protected readonly isFirst = computed(() => this.page() === 0);
  protected readonly isLast = computed(
    () => this.page() >= this.pageCount() - 1,
  );

  protected readonly range = computed(() => {
    const length = this.length();
    const from = this.page() * this.pageSize();
    return this.messages.range(
      from + 1,
      Math.min(from + this.pageSize(), length),
      length,
    );
  });

  protected goTo(index: number): void {
    this.pageIndex.set(Math.min(Math.max(0, index), this.pageCount() - 1));
  }

  /** Keeps the first row of the current page in view across the size change. */
  protected onPageSize(event: Event): void {
    const size = Number((event.target as HTMLSelectElement).value);
    const firstRow = this.page() * this.pageSize();
    this.pageSize.set(size);
    this.pageIndex.set(Math.floor(firstRow / size));
  }
}
