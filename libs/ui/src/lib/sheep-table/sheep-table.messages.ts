import { InjectionToken, type Provider } from '@angular/core';

/**
 * Every string `sheep-table` can put on screen without being handed it.
 *
 * A table is mostly the caller's words — headers, cells, an empty state — but
 * the chrome around them is ours: the page controls, the sort and filter
 * affordances, the row count. They live together so that localising the
 * component is one provider, not a hunt.
 *
 * The two counted strings are functions rather than templates with `{0}` in
 * them, so a translation is free to reorder, to pluralise, or to format the
 * numbers for its own locale.
 */
export interface SheepTableMessages {
  /** Accessible name of a column's filter box. Given the column's label. */
  readonly filterColumn: (column: string) => string;

  /** Accessible name of a sortable header. Given the column and what a press does next. */
  readonly sortColumn: (column: string, next: 'asc' | 'desc' | 'none') => string;

  /** Label of the control that drops one column's filter, inside its panel. */
  readonly clearFilter: string;

  /** Label of the control that drops every column filter at once. */
  readonly clearFilters: string;

  /** Shown in place of rows when there are none and the caller projected no empty state. */
  readonly empty: string;

  /** Label beside the page-size select. */
  readonly rowsPerPage: string;

  /** The paginator's range read-out, e.g. `26–50 of 240`. */
  readonly range: (from: number, to: number, length: number) => string;

  /** The read-out that replaces the range while the table is virtualised. */
  readonly virtualised: (length: number) => string;

  /** Accessible names of the four page buttons. */
  readonly firstPage: string;
  readonly previousPage: string;
  readonly nextPage: string;
  readonly lastPage: string;
}

/** The shipped English strings. */
export const SHEEP_TABLE_DEFAULT_MESSAGES: SheepTableMessages = {
  filterColumn: (column) => `Filter ${column}`,
  sortColumn: (column, next) =>
    next === 'none'
      ? `${column}, sorted. Activate to clear the sort.`
      : `Sort by ${column}, ${next === 'asc' ? 'ascending' : 'descending'}`,
  clearFilter: 'Clear',
  clearFilters: 'Clear filters',
  empty: 'Nothing to show.',
  rowsPerPage: 'Rows per page',
  range: (from, to, length) =>
    length === 0
      ? '0 of 0'
      : `${from.toLocaleString()}–${to.toLocaleString()} of ${length.toLocaleString()}`,
  virtualised: (length) => `${length.toLocaleString()} rows, scrolling`,
  firstPage: 'First page',
  previousPage: 'Previous page',
  nextPage: 'Next page',
  lastPage: 'Last page',
};

/**
 * The message table every `sheep-table` in the injector resolves against.
 *
 * Root-provided with the English defaults, so the component works with no
 * setup. Override with `provideSheepTableMessages` — at the app's providers to
 * localise, or on a route to reword one screen.
 */
export const SHEEP_TABLE_MESSAGES = new InjectionToken<SheepTableMessages>(
  'SHEEP_TABLE_MESSAGES',
  { providedIn: 'root', factory: () => SHEEP_TABLE_DEFAULT_MESSAGES },
);

/**
 * Overrides some of the table's text, keeping the rest.
 *
 * ```ts
 * providers: [
 *   provideSheepTableMessages({
 *     rowsPerPage: 'Zeilen pro Seite',
 *     clearFilters: 'Filter zurücksetzen',
 *   }),
 * ]
 * ```
 */
export function provideSheepTableMessages(
  overrides: Partial<SheepTableMessages>,
): Provider {
  return {
    provide: SHEEP_TABLE_MESSAGES,
    useValue: {
      ...SHEEP_TABLE_DEFAULT_MESSAGES,
      ...overrides,
    } satisfies SheepTableMessages,
  };
}
