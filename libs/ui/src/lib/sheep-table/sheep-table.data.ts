import type { SheepTableSortValue } from './sheep-table.constants';

/**
 * The table's default answers to "what is this cell's value?" and "how do two
 * of them order?".
 *
 * Every one of these is overridable per column — `sortAccessor`,
 * `sortComparator`, `filterAccessor`, `filterPredicate` on
 * `sheepColumnDef`. They are the behaviour a column gets by naming nothing,
 * and they are exported so an accessor can build on one rather than
 * reimplementing it:
 *
 * ```ts
 * [sortAccessor]="(row) => row.owner.lastName"
 * [filterAccessor]="(row) => `${row.owner.first} ${row.owner.last}`"
 * ```
 *
 * Nothing here reaches into a component. They are functions of a row and a
 * column name, which is what makes them testable and what makes a custom
 * accessor a drop-in replacement rather than a subclass.
 */

/**
 * The value under `column` on `row`.
 *
 * A plain property read, keyed by the column's own name. It is why a column
 * named after its property needs no accessor at all, and why one that is not —
 * a nested field, a derived figure — needs one.
 */
export function sheepTableValue(row: unknown, column: string): unknown {
  return row == null
    ? undefined
    : (row as Record<string, unknown>)[column];
}

/**
 * A cell value as the text a filter matches against.
 *
 * `null` and `undefined` become the empty string rather than the words
 * "null" and "undefined", which would otherwise be matchable — typing `n` and
 * getting back every empty cell is a bug, not a feature.
 */
export function sheepTableText(value: unknown): string {
  if (value == null) {
    return '';
  }
  return value instanceof Date ? value.toISOString() : String(value);
}

/**
 * Whether `text` contains `term`, the way a column filter means it.
 *
 * Case-insensitive, whitespace-trimmed, substring rather than prefix. Deliberately
 * not a fuzzy match: a filter box that quietly matches things the user did not
 * type is impossible to reason about when the count comes back wrong.
 */
export function sheepTableMatches(text: string, term: string): boolean {
  const needle = term.trim().toLowerCase();
  return needle === '' || text.toLowerCase().includes(needle);
}

/**
 * The default ordering of two cell values, ascending.
 *
 * Numbers order numerically, dates by their instant, booleans false before
 * true, and everything else by `localeCompare` with `numeric` on — so
 * `Asset 2` sorts before `Asset 10` rather than after it, which is the whole
 * reason a table is being sorted in the first place.
 *
 * Empty cells sort last ascending, which means first descending. Pinning them
 * to one end regardless of direction would make the comparator a function of
 * the sort rather than of the two values, and the caller who wants that has
 * `sortComparator`.
 */
export function compareSheepTableValues(
  a: SheepTableSortValue,
  b: SheepTableSortValue,
): number {
  const aEmpty = a == null || a === '';
  const bEmpty = b == null || b === '';
  if (aEmpty || bEmpty) {
    return aEmpty && bEmpty ? 0 : aEmpty ? 1 : -1;
  }

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return Number(a) - Number(b);
  }

  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}
