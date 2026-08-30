/**
 * The value sets and shared shapes behind `sheep-table`.
 *
 * Each list is the single source of truth for its axis: the matching type is
 * derived from the tuple, so adding a value widens the type automatically and
 * the two cannot drift apart. The lists are exported as values, not just
 * types, so callers can enumerate an axis at runtime — a demo grid or a docs
 * table renders from the same tuple the component validates against.
 */

/** Row density. Shared with the rest of the library's size axis. */
export const SHEEP_TABLE_SIZES = ['sm', 'md', 'lg'] as const;

export type SheepTableSize = (typeof SHEEP_TABLE_SIZES)[number];

/**
 * Rendered height, in pixels, of a data row at each density.
 *
 * This is the number `cdk-virtual-scroll-viewport` needs for `itemSize`, so it
 * is exact rather than approximate: a row is given this height outright and is
 * `border-box`, which means the hairline between rows does not add to it. The
 * table reads the value itself when it virtualises — it is exported because a
 * caller sizing a scroll region around the table needs the same number.
 *
 * Mirrors the `$sizes` map in sheep-table.component.scss — change one, change
 * both.
 */
export const SHEEP_TABLE_ROW_HEIGHT: Readonly<Record<SheepTableSize, number>> =
  {
    sm: 30,
    md: 36,
    lg: 44,
  };

/**
 * Where a column's content sits in its cell.
 *
 * Set once on the column definition and obeyed by the header cell and every
 * body cell in that column, so a numeric column cannot end up with a
 * left-aligned header over right-aligned figures.
 */
export const SHEEP_TABLE_ALIGNMENTS = ['start', 'center', 'end'] as const;

export type SheepTableAlign = (typeof SHEEP_TABLE_ALIGNMENTS)[number];

/** Which way a sorted column is ordered. */
export const SHEEP_TABLE_SORT_DIRECTIONS = ['asc', 'desc'] as const;

export type SheepTableSortDirection =
  (typeof SHEEP_TABLE_SORT_DIRECTIONS)[number];

/**
 * The table's sort, or `null` for the data's own order.
 *
 * One column at a time. Multi-column sort is a different feature with a
 * different interaction model, not an array in this slot.
 */
export interface SheepTableSort {
  /** The `sheepColumnDef` name of the sorted column. */
  readonly column: string;
  readonly direction: SheepTableSortDirection;
}

/**
 * The active column filters, keyed by column name.
 *
 * A missing key and an empty string mean the same thing — no filter — so
 * clearing an input never has to remember to delete the key.
 */
export type SheepTableFilters = Readonly<Record<string, string>>;

/** What a page change reports. */
export interface SheepTablePage {
  readonly pageIndex: number;
  readonly pageSize: number;
  /** Rows the pagination is over: after filtering, before slicing. */
  readonly length: number;
}

/**
 * The values a column's `sortAccessor` may return.
 *
 * Everything the default comparator knows how to order. Anything else needs a
 * `sortComparator`, which is the honest way to say "these do not compare like
 * numbers or words".
 */
export type SheepTableSortValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined;

/** Page sizes offered when the caller names none. */
export const SHEEP_TABLE_PAGE_SIZE_OPTIONS: readonly number[] = [
  10, 25, 50, 100,
];

/**
 * How many rows the table will paginate before it virtualises instead.
 *
 * Past this many rows a paginator is the wrong control: paging through
 * hundreds of pages is not navigation, and the DOM cost of the alternative —
 * rendering everything — is real. So the table switches to one continuous
 * scroll with only the visible window in the DOM, and the paginator goes away
 * rather than sitting there doing something useless.
 *
 * Measured against the *filtered* rows, so filtering a large table down hands
 * the paginator back.
 */
export const SHEEP_TABLE_VIRTUAL_THRESHOLD = 1000;

/** Height, in pixels, of the scroll region when the table virtualises. */
export const SHEEP_TABLE_VIRTUAL_HEIGHT = 420;
