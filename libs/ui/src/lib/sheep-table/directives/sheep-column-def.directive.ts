import { Directive, Input, booleanAttribute, input, numberAttribute } from '@angular/core';
import { CdkColumnDef } from '@angular/cdk/table';
import type {
  SheepTableAlign,
  SheepTableSortValue,
} from '../sheep-table.constants';

/**
 * One column, declared once.
 *
 * A column is a name, a header template and a cell template, wrapped in an
 * `ng-container` that renders nothing of its own:
 *
 * ```html
 * <ng-container sheepColumnDef="name" sortable filterable>
 *   <sheep-header-cell *sheepHeaderCellDef>Name</sheep-header-cell>
 *   <sheep-cell *sheepCellDef="let row">{{ row.name }}</sheep-cell>
 * </ng-container>
 * ```
 *
 * Everything about the column is stated here rather than repeated on the two
 * cells: whether it sorts, whether it filters, how wide it is, which edge its
 * content sits against. The cells read it back, so a right-aligned column
 * cannot end up with a left-aligned header, and a sortable column cannot
 * forget to render its control.
 *
 * The name is also the default accessor. A column called `salary` reads
 * `row.salary` to sort and to filter, and a column whose value is not a
 * property of that name — a nested field, a figure derived from two others —
 * says so with `sortAccessor` / `filterAccessor` instead of the table growing
 * a notion of paths.
 *
 * Extends CDK's `cdkColumnDef`, so `sticky` and `stickyEnd` work here exactly
 * as they do there.
 */
@Directive({
  selector: '[sheepColumnDef]',
  providers: [{ provide: CdkColumnDef, useExisting: SheepColumnDefDirective }],
})
export class SheepColumnDefDirective<T = unknown> extends CdkColumnDef {
  /**
   * The column's name: its key in `columns`, and its default accessor.
   *
   * Re-declared rather than inherited because the base names it `cdkColumnDef`
   * and a decorator is the only way to alias an accessor input — the one place
   * in this component where a signal input cannot be used.
   */
  @Input('sheepColumnDef')
  override get name(): string {
    return this._name;
  }
  override set name(value: string) {
    this._setNameInput(value);
  }

  /**
   * Human name for the column, used in the sort and filter accessible names.
   *
   * Defaults to the column's `name`, which is right when the name is a word
   * and wrong when it is `unitPrice`.
   */
  readonly label = input<string | null>(null);

  /** Gives the header a sort control and puts the column in the sort cycle. */
  readonly sortable = input(false, { transform: booleanAttribute });

  /** Gives the header a filter box that narrows the table to matching rows. */
  readonly filterable = input(false, { transform: booleanAttribute });

  /** Which edge the column's content sits against. Use `end` for figures. */
  readonly align = input<SheepTableAlign>('start');

  /**
   * A fixed width — any CSS length. The column stops flexing entirely.
   *
   * Worth setting on a column whose content is a known size (a status chip, a
   * date, a row of actions) so the columns that carry text get the rest.
   */
  readonly width = input<string | null>(null);

  /** Share of the leftover width, against the other flexible columns. */
  readonly grow = input(1, { transform: numberAttribute });

  /**
   * The value this column sorts by.
   *
   * Return something the default comparator understands — a number, a string,
   * a date, a boolean — and it is ordered the obvious way. Reach for
   * `sortComparator` only when the ordering itself is custom.
   */
  readonly sortAccessor = input<((row: T) => SheepTableSortValue) | null>(null);

  /**
   * The column's ordering, in full. Wins over `sortAccessor`.
   *
   * Written ascending: the table negates it for a descending sort, so a
   * comparator that flips on direction itself will fight the header.
   */
  readonly sortComparator = input<((a: T, b: T) => number) | null>(null);

  /**
   * The text this column's filter matches against.
   *
   * Return everything that should be searchable in one string — a full name
   * assembled from two fields, a status plus its label — and the default
   * case-insensitive substring match does the rest.
   */
  readonly filterAccessor = input<((row: T) => string) | null>(null);

  /**
   * The column's matching, in full. Wins over `filterAccessor`.
   *
   * The term arrives exactly as typed, untrimmed and uncased: a predicate that
   * wants a number, a range or a prefix is the one that knows how to read it.
   */
  readonly filterPredicate = input<((row: T, term: string) => boolean) | null>(
    null,
  );

  /** Adds `sheep-column-<name>` beside CDK's own, for call-site styling. */
  protected override _updateColumnCssClassName(): void {
    super._updateColumnCssClassName();
    this._columnCssClassName.push(`sheep-column-${this.cssClassFriendlyName}`);
  }
}
