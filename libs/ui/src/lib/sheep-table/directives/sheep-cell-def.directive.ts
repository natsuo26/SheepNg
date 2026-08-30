import { Directive, input } from '@angular/core';
import { CdkCellDef } from '@angular/cdk/table';

/**
 * What a cell template is handed for the row it is rendering.
 *
 * The same set `@for` offers, and populated the same way — every field is
 * always there, unlike CDK's own context where all of them are optional.
 *
 * One caveat worth knowing: `index` counts within the rows the table currently
 * has in play, which is the page while it is paginating and the whole set once
 * it virtualises. It is a render position, not a stable row number. For "the
 * 4,213th employee", put the number in the data.
 */
export interface SheepTableCellContext<T> {
  readonly $implicit: T;
  readonly index: number;
  readonly count: number;
  readonly first: boolean;
  readonly last: boolean;
  readonly even: boolean;
  readonly odd: boolean;
}

/**
 * The template for one row's cell in this column.
 *
 * Structural, and handed the row:
 *
 * ```html
 * <sheep-cell *sheepCellDef="let row">{{ row.name }}</sheep-cell>
 * ```
 *
 * `row` is typed `any` unless the table's data is named through `of`, which is
 * read for nothing but its type — and which is worth the eight characters,
 * because it is what turns a misspelled field into a compile error:
 *
 * ```html
 * <sheep-cell *sheepCellDef="let row; of: employees()">{{ row.salary }}</sheep-cell>
 * ```
 *
 * The rest of `SheepTableCellContext` is available the usual way:
 *
 * ```html
 * <sheep-cell *sheepCellDef="let row; let i = index">{{ i + 1 }}</sheep-cell>
 * ```
 *
 * The template is instantiated once per rendered row, and only for rendered
 * rows — a paginated table builds one page of them, a virtualised one builds
 * roughly a screenful however long the data is.
 */
@Directive({
  selector: '[sheepCellDef]',
  providers: [{ provide: CdkCellDef, useExisting: SheepCellDefDirective }],
})
export class SheepCellDefDirective<
  // The fallback when `of` is not given. `unknown` would be stricter and would
  // also make `{{ row.name }}` a compile error on every call site that has not
  // opted in, which is a worse trade than the one CDK makes here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T = any,
> extends CdkCellDef {
  /**
   * The table's data, named only so `let row` is typed. Never read.
   *
   * A type parameter has to be inferred from somewhere, and a structural
   * directive has no other input to infer it from. Omit it and `row` is `any`,
   * which is what CDK gives and what a quick call site wants.
   */
  readonly of = input<readonly T[] | undefined>(undefined, {
    alias: 'sheepCellDefOf',
  });

  /**
   * Types `let row` against the table's data. Read by the compiler, not run.
   */
  static ngTemplateContextGuard<T>(
    _directive: SheepCellDefDirective<T>,
    context: unknown,
  ): context is SheepTableCellContext<T> {
    return context != null;
  }
}
