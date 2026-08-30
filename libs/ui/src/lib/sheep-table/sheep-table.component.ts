import {
  ChangeDetectionStrategy,
  Component,
  type TrackByFunction,
  booleanAttribute,
  computed,
  contentChild,
  contentChildren,
  inject,
  input,
  model,
  numberAttribute,
} from '@angular/core';
import { CdkTableModule } from '@angular/cdk/table';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SheepColumnDefDirective } from './directives/sheep-column-def.directive';
import { SheepTableColumnsDirective } from './directives/sheep-table-columns.directive';
import { SheepTableEmptyDirective } from './directives/sheep-table-empty.directive';
import { SheepTablePaginatorComponent } from './sheep-table-paginator/sheep-table-paginator.component';
import {
  SHEEP_TABLE_PAGE_SIZE_OPTIONS,
  SHEEP_TABLE_ROW_HEIGHT,
  SHEEP_TABLE_VIRTUAL_HEIGHT,
  SHEEP_TABLE_VIRTUAL_THRESHOLD,
  type SheepTableFilters,
  type SheepTableSize,
  type SheepTableSort,
  type SheepTableSortValue,
} from './sheep-table.constants';
import {
  compareSheepTableValues,
  sheepTableMatches,
  sheepTableText,
  sheepTableValue,
} from './sheep-table.data';
import { SHEEP_TABLE_MESSAGES } from './sheep-table.messages';

/**
 * A table.
 *
 * Composed, not configured. The table owns the data and everything done to it —
 * filtering, sorting, paging — and owns none of what is drawn: each column is
 * declared once, at the call site, as a name and two templates.
 *
 * ```html
 * <sheep-table [data]="employees()">
 *   <ng-container sheepColumnDef="name" sortable filterable>
 *     <sheep-header-cell *sheepHeaderCellDef>Name</sheep-header-cell>
 *     <sheep-cell *sheepCellDef="let row">{{ row.name }}</sheep-cell>
 *   </ng-container>
 *
 *   <ng-container sheepColumnDef="salary" sortable align="end" width="120px">
 *     <sheep-header-cell *sheepHeaderCellDef>Salary</sheep-header-cell>
 *     <sheep-cell *sheepCellDef="let row">{{ row.salary | currency }}</sheep-cell>
 *   </ng-container>
 * </sheep-table>
 * ```
 *
 * That is the whole table: no row template to keep in sync with a column list,
 * no `displayedColumns` array unless the columns are meant to change, and no
 * data source object between the array and the screen. Built on CDK's
 * `cdkTable`, so the row and cell recycling, the sticky positioning and the
 * virtual-scroll wiring are theirs rather than a second implementation.
 *
 * ### Paging, and when it stops
 *
 * A paginator sits under the table by default. Past `virtualThreshold` rows it
 * goes away and the table virtualises instead — one continuous scroll with
 * about a screenful in the DOM. Paging through four hundred pages is not
 * navigation, and rendering four hundred pages at once is not free; at that
 * size scrolling is the honest control.
 *
 * Either way the DOM holds a window, never the whole set: while paging, the
 * rows of one page; while virtualised, the rows on screen. The switch is
 * measured against the *filtered* rows, so narrowing a large table hands the
 * paginator back.
 *
 * ### Sorting and filtering
 *
 * A column declares `sortable` or `filterable` and its header grows the
 * control. Both default to reading the property the column is named after, and
 * both are overridable per column — `sortAccessor` and `filterAccessor` for the
 * value, `sortComparator` and `filterPredicate` for the whole decision. See
 * `sheepColumnDef`.
 *
 * A filter opens in a panel rather than sitting under the header: a row of
 * boxes doubles the height of every table that has one filterable column, and
 * charges that on every screen whether or not anything is being filtered.
 *
 * `sort` and `filters` are two-way: bind them to open on a sorted column, to
 * persist a view in the URL, or to drive the table from elsewhere on the page.
 *
 * ### Width
 *
 * Columns share the frame, flexing against each other, and a column can name a
 * `width` to opt out or a `grow` to take more of what is left. None of them
 * shrinks past a floor set by the density — below that the frame scrolls
 * sideways instead, which is what a `sticky` column is for.
 *
 * Deliberately NOT themeable per instance. Every colour and metric comes from
 * the `--sheep-*` theme layer; `size` picks between spec'd densities rather
 * than opening one up.
 */
@Component({
  selector: 'sheep-table',
  imports: [
    CdkTableModule,
    ScrollingModule,
    SheepTableColumnsDirective,
    SheepTablePaginatorComponent,
  ],
  templateUrl: './sheep-table.component.html',
  styleUrl: './sheep-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sheep-table',
    '[class]': 'classes()',
  },
})
export class SheepTableComponent<T = unknown> {
  // --- data ----------------------------------------------------------------

  /**
   * The rows, in their own order.
   *
   * A plain array. Filtering, sorting and slicing happen downstream of it and
   * never touch it, so the array a caller holds is the array they handed over.
   */
  readonly data = input<readonly T[]>([]);

  /**
   * Which columns are shown, and in what order.
   *
   * Defaults to every column defined, in the order they were written — which is
   * the answer whenever the set is fixed. Bind it to reorder columns, to hide
   * some behind a toggle, or to respond to a breakpoint.
   */
  readonly columns = input<readonly string[] | null>(null);

  /**
   * Identity of a row across renders, as `@for`'s `track` means it.
   *
   * Worth setting whenever the data is replaced with a new array of equal rows
   * — after a refetch, say — so the table updates the rows it has rather than
   * rebuilding all of them.
   */
  readonly trackBy = input<TrackByFunction<T> | null>(null);

  // --- appearance ----------------------------------------------------------

  /** Row density. Defaults to `md`. */
  readonly size = input<SheepTableSize>('md');

  /** Keeps the header row in view while the body scrolls. On by default. */
  readonly stickyHeader = input(true, { transform: booleanAttribute });

  /**
   * Height, in pixels, of the scroll region.
   *
   * `null` — the default — lets a paginated table grow to its page and pins a
   * virtualised one to `SHEEP_TABLE_VIRTUAL_HEIGHT`, since a virtual viewport
   * has to be a fixed box to know what fits in it. Set it to bound both.
   */
  readonly viewportHeight = input<number | null>(null);

  // --- state ---------------------------------------------------------------

  /**
   * The sorted column and direction, or `null` for the data's own order.
   *
   * Two-way. Set it to open on a sort; listen to it to keep one in the URL.
   */
  readonly sort = model<SheepTableSort | null>(null);

  /** The column filters, keyed by column name. Two-way. */
  readonly filters = model<SheepTableFilters>({});

  /** The current page, counted from zero. Two-way. */
  readonly pageIndex = model(0);

  /** Rows per page while the table is paginating. Two-way. */
  readonly pageSize = model(25);

  /** The page sizes the paginator offers. */
  readonly pageSizeOptions = input<readonly number[]>(
    SHEEP_TABLE_PAGE_SIZE_OPTIONS,
  );

  /**
   * How many rows the table will paginate before it virtualises instead.
   *
   * Raise it for rows that are cheap and a page that wants the paginator kept;
   * lower it — to `0` — for a table that should always scroll.
   */
  readonly virtualThreshold = input(SHEEP_TABLE_VIRTUAL_THRESHOLD, {
    transform: numberAttribute,
  });

  // --- internals -----------------------------------------------------------

  protected readonly messages = inject(SHEEP_TABLE_MESSAGES);

  /** The columns the caller declared, in declaration order. */
  protected readonly columnDefs = contentChildren(SheepColumnDefDirective);

  /** Whether the caller wrote an empty state, or wants the default one. */
  protected readonly emptySlot = contentChild(SheepTableEmptyDirective);

  private readonly defsByName = computed(
    () => new Map(this.columnDefs().map((def) => [def.name, def])),
  );

  protected readonly columnNames = computed(
    () => this.columns() ?? this.columnDefs().map((def) => def.name),
  );

  /** The filter terms that are actually narrowing anything. */
  private readonly activeFilters = computed(() =>
    Object.entries(this.filters()).filter(([, term]) => term.trim() !== ''),
  );

  protected readonly isFiltered = computed(
    () => this.activeFilters().length > 0,
  );

  /**
   * The rows that survive every column's filter.
   *
   * Every term has to match — filters narrow each other rather than competing,
   * which is the only reading under which adding one can never widen the
   * result.
   */
  protected readonly filtered = computed<readonly T[]>(() => {
    const active = this.activeFilters();
    if (active.length === 0) {
      return this.data();
    }

    const defs = this.defsByName();
    return this.data().filter((row) =>
      active.every(([name, term]) => {
        const def = defs.get(name);
        const predicate = def?.filterPredicate();
        if (predicate) {
          return predicate(row, term);
        }
        const accessor = def?.filterAccessor();
        const text = accessor
          ? accessor(row)
          : sheepTableText(sheepTableValue(row, name));
        return sheepTableMatches(text, term);
      }),
    );
  });

  /**
   * The filtered rows in the sorted column's order.
   *
   * Sorted on a copy: the input array is the caller's, and sorting in place
   * would reorder it under them.
   */
  protected readonly sorted = computed<readonly T[]>(() => {
    const sort = this.sort();
    const rows = this.filtered();
    if (!sort) {
      return rows;
    }

    const def = this.defsByName().get(sort.column);
    const sign = sort.direction === 'asc' ? 1 : -1;
    const comparator = def?.sortComparator();
    const accessor = def?.sortAccessor();
    const valueOf = (row: T): SheepTableSortValue =>
      accessor
        ? accessor(row)
        : (sheepTableValue(row, sort.column) as SheepTableSortValue);

    return [...rows].sort(
      comparator
        ? (a, b) => sign * comparator(a, b)
        : (a, b) => sign * compareSheepTableValues(valueOf(a), valueOf(b)),
    );
  });

  /** True once there are more rows than a paginator should be asked to cover. */
  protected readonly virtual = computed(
    () => this.sorted().length > this.virtualThreshold(),
  );

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.sorted().length / Math.max(1, this.pageSize()))),
  );

  /**
   * The page actually shown.
   *
   * Clamped here rather than written back to `pageIndex`, so a filter that
   * shrinks the table past the current page renders the last one instead of
   * rendering nothing — without the table writing to its own model during
   * change detection.
   */
  protected readonly page = computed(() =>
    Math.min(Math.max(0, this.pageIndex()), this.pageCount() - 1),
  );

  /**
   * The rows handed to the grid: one page, or all of them while virtualised.
   *
   * The virtualised branch passes the whole set deliberately — the viewport is
   * what decides which slice of it reaches the DOM, and it needs the length to
   * size the scrollbar.
   */
  protected readonly rendered = computed<readonly T[]>(() => {
    const rows = this.sorted();
    if (this.virtual()) {
      return rows;
    }
    const size = this.pageSize();
    const start = this.page() * size;
    return rows.slice(start, start + size);
  });

  protected readonly isEmpty = computed(() => this.rendered().length === 0);

  protected readonly rowHeight = computed(
    () => SHEEP_TABLE_ROW_HEIGHT[this.size()],
  );

  /**
   * The height the scroll region is pinned to, or `null` to let it size itself.
   *
   * An empty table drops the height whatever was asked for: a fixed box with
   * no rows in it is a stretch of nothing above the message explaining why.
   * Emptiness rules out virtualising, so this can never leave a viewport
   * unsized.
   */
  protected readonly scrollHeight = computed(() =>
    this.isEmpty()
      ? null
      : (this.viewportHeight() ??
        (this.virtual() ? SHEEP_TABLE_VIRTUAL_HEIGHT : null)),
  );

  protected readonly classes = computed(
    () =>
      `sheep-table--${this.size()}` +
      (this.virtual() ? ' sheep-table--virtual' : ''),
  );

  /** Falls back to identity, which is what `cdkTable` does with no `trackBy`. */
  protected readonly trackRow: TrackByFunction<T> = (index, row) => {
    const fn = this.trackBy();
    return fn ? fn(index, row) : row;
  };

  // --- the API the header cells drive --------------------------------------

  /**
   * Advances one column through ascending, descending, unsorted.
   *
   * Sorting a different column starts that column's cycle rather than carrying
   * the previous direction over: the third press on a column is what clears the
   * sort, and it should not be reachable by accident from a column that was
   * never pressed twice.
   *
   * Returns to the first page, since the row under the cursor is not the row
   * that will be there afterwards.
   */
  toggleSort(column: string): void {
    const current = this.sort();
    const next: SheepTableSort | null =
      current?.column !== column
        ? { column, direction: 'asc' }
        : current.direction === 'asc'
          ? { column, direction: 'desc' }
          : null;

    this.sort.set(next);
    this.pageIndex.set(0);
  }

  /** Sets one column's filter term. An empty term drops the key. */
  setFilter(column: string, term: string): void {
    const next = { ...this.filters() };
    if (term === '') {
      delete next[column];
    } else {
      next[column] = term;
    }

    this.filters.set(next);
    this.pageIndex.set(0);
  }

  /** Drops every column filter at once. */
  clearFilters(): void {
    this.filters.set({});
    this.pageIndex.set(0);
  }
}
