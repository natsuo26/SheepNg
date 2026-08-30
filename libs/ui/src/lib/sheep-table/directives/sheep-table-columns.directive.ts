import { Directive, inject, input, type OnChanges } from '@angular/core';
import { CdkTable, type CdkColumnDef } from '@angular/cdk/table';

/**
 * Hands the caller's column definitions to the CDK table that renders them.
 *
 * Internal. `cdkTable` finds column definitions by content query, and the ones
 * a `sheep-table` is given are content of *it*, not of the grid inside it — so
 * they are registered through CDK's documented side door for exactly this
 * case, `addColumnDef` / `removeColumnDef`.
 *
 * Registration is a binding rather than an effect on purpose. A view's inputs
 * are all set before any child's `ngAfterContentChecked` runs, and
 * `ngAfterContentChecked` is where `cdkTable` renders — so by the time the grid
 * looks for the column named in its row definition, the definition is there.
 * An effect would land after that first render, on a table that had already
 * thrown for the unknown column.
 *
 * That is also why the grid may be destroyed and rebuilt when the table
 * switches between paging and virtual scrolling: a fresh grid gets the same
 * definitions on its first pass.
 */
@Directive({ selector: 'cdk-table[sheepTableColumns]' })
export class SheepTableColumnsDirective implements OnChanges {
  /** The definitions to render, in the order they were declared. */
  readonly columns = input.required<readonly CdkColumnDef[]>({
    alias: 'sheepTableColumns',
  });

  private readonly table = inject(CdkTable);

  /** What is currently registered, so a change can take the old set back out. */
  private registered: readonly CdkColumnDef[] = [];

  ngOnChanges(): void {
    for (const columnDef of this.registered) {
      this.table.removeColumnDef(columnDef);
    }
    this.registered = this.columns();
    for (const columnDef of this.registered) {
      this.table.addColumnDef(columnDef);
    }
  }
}
