import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SHEEP_TABLE } from './sheep-table.imports';
import type { SheepTableSort } from './sheep-table.constants';

interface Row {
  readonly id: string;
  readonly name: string;
  readonly team: string;
  readonly rank: number;
}

/** Four rows, deliberately out of every order the tests sort by. */
const ROWS: readonly Row[] = [
  { id: 'c', name: 'Cleo', team: 'Design', rank: 2 },
  { id: 'a', name: 'Ada', team: 'Platform', rank: 10 },
  { id: 'd', name: 'Dev', team: 'Design', rank: 1 },
  { id: 'b', name: 'Bram', team: 'Platform', rank: 9 },
];

@Component({
  imports: [SHEEP_TABLE],
  template: `
    <sheep-table
      [data]="rows()"
      [(sort)]="sort"
      [pageSize]="pageSize()"
      [virtualThreshold]="threshold()"
      [pageSizeOptions]="[2, 4]"
    >
      <ng-container sheepColumnDef="name" sortable filterable>
        <sheep-header-cell *sheepHeaderCellDef>Name</sheep-header-cell>
        <sheep-cell *sheepCellDef="let row; of: rows()">{{ row.name }}</sheep-cell>
      </ng-container>

      <ng-container
        sheepColumnDef="team"
        filterable
        [filterAccessor]="teamInitial"
      >
        <sheep-header-cell *sheepHeaderCellDef>Team</sheep-header-cell>
        <sheep-cell *sheepCellDef="let row; of: rows()">{{ row.team }}</sheep-cell>
      </ng-container>

      <ng-container sheepColumnDef="rank" sortable [sortAccessor]="byRank">
        <sheep-header-cell *sheepHeaderCellDef>Rank</sheep-header-cell>
        <sheep-cell *sheepCellDef="let row; of: rows()">{{ row.rank }}</sheep-cell>
      </ng-container>

      <div sheepTableEmpty>Nothing found.</div>
    </sheep-table>
  `,
})
class HostComponent {
  readonly rows = signal<readonly Row[]>(ROWS);
  readonly sort = signal<SheepTableSort | null>(null);
  readonly pageSize = signal(4);
  readonly threshold = signal(1000);

  /** Filters `team` on its first letter, not on the word it renders. */
  readonly teamInitial = (row: Row): string => row.team[0];

  /** Sorts `rank` inverted, to prove the accessor is what is consulted. */
  readonly byRank = (row: Row): number => -row.rank;
}

describe('SheepTableComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HTMLElement;
  let component: HostComponent;

  /** The `name` column's text, top to bottom, as rendered. */
  function names(): string[] {
    return Array.from(
      host.querySelectorAll('.sheep-table__row:not(.sheep-table__row--head)'),
      (row) => row.querySelector('sheep-cell')?.textContent?.trim() ?? '',
    );
  }

  function headerCell(index: number): HTMLElement {
    return host.querySelectorAll<HTMLElement>('sheep-header-cell')[index];
  }

  /** Header text only — a filterable cell also carries its filter panel. */
  function headerLabels(): (string | undefined)[] {
    return Array.from(
      host.querySelectorAll('.sheep-table__hcell-label'),
      (label) => label.textContent?.trim(),
    );
  }

  /** The one element matching `selector`, or a failure naming what was missing. */
  function only<E extends HTMLElement>(
    selector: string,
    within: ParentNode = host,
  ): E {
    const element = within.querySelector<E>(selector);
    if (!element) {
      throw new Error(`No ${selector} rendered.`);
    }
    return element;
  }

  /** Types `term` into one column's filter box, the way a user would. */
  async function filterBy(column: number, term: string): Promise<void> {
    // The panel's box is a `sheep-text-field`; its native input is the thing
    // a user types into, popover or not.
    const input = only<HTMLInputElement>(
      '.sheep-table__filter-panel input',
      headerCell(column),
    );
    input.value = term;
    input.dispatchEvent(new Event('input'));
    await settle();
  }

  async function step(label: string): Promise<void> {
    only(`.sheep-paginator__step[aria-label="${label}"]`).click();
    await settle();
  }

  async function settle(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    component = fixture.componentInstance;
    await settle();
    host = fixture.nativeElement;
  });

  it('renders a row per datum, in the data’s own order', () => {
    expect(names()).toEqual(['Cleo', 'Ada', 'Dev', 'Bram']);
  });

  it('renders one header cell per column definition, in declaration order', () => {
    expect(headerLabels()).toEqual(['Name', 'Team', 'Rank']);
  });

  it('sorts on a press, and cycles asc → desc → off', async () => {
    headerCell(0).click();
    await settle();
    expect(names()).toEqual(['Ada', 'Bram', 'Cleo', 'Dev']);
    expect(component.sort()).toEqual({ column: 'name', direction: 'asc' });

    headerCell(0).click();
    await settle();
    expect(names()).toEqual(['Dev', 'Cleo', 'Bram', 'Ada']);

    headerCell(0).click();
    await settle();
    expect(names()).toEqual(['Cleo', 'Ada', 'Dev', 'Bram']);
    expect(component.sort()).toBeNull();
  });

  it('sorts through the column’s own accessor', async () => {
    headerCell(2).click();
    await settle();

    // Ranks 2, 10, 1, 9 negated, ascending: 10, 9, 2, 1.
    expect(names()).toEqual(['Ada', 'Bram', 'Cleo', 'Dev']);
  });

  it('reports the sort on the host’s aria-sort', async () => {
    expect(headerCell(0).getAttribute('aria-sort')).toBe('none');

    headerCell(0).click();
    await settle();

    expect(headerCell(0).getAttribute('aria-sort')).toBe('ascending');
  });

  it('leaves a column that asked for neither without controls', () => {
    expect(headerCell(1).querySelector('.sheep-table__sort')).toBeNull();
    expect(headerCell(2).querySelector('.sheep-table__filter-panel')).toBeNull();
  });

  it('filters on the typed term', async () => {
    await filterBy(0, 'a');

    expect(names()).toEqual(['Ada', 'Bram']);
  });

  it('filters through the column’s own accessor', async () => {
    // 'P' matches Platform's initial. 'Platform' itself would match nothing,
    // which is the proof that the accessor and not the cell text is consulted.
    await filterBy(1, 'P');
    expect(names()).toEqual(['Ada', 'Bram']);

    await filterBy(1, 'Platform');
    expect(names()).toEqual([]);
  });

  it('narrows with every filter at once, and shows the empty state', async () => {
    await filterBy(0, 'Ada');
    expect(names()).toEqual(['Ada']);

    // Ada is on Platform, so the two terms have nothing in common.
    await filterBy(1, 'D');

    expect(names()).toEqual([]);
    const empty = only('.sheep-table__empty');
    expect(empty.hasAttribute('hidden')).toBe(false);
    expect(empty.textContent).toContain('Nothing found.');
  });

  it('drops every filter at once', async () => {
    await filterBy(0, 'Ada');
    expect(names()).toEqual(['Ada']);

    only('.sheep-table__clear').click();
    await settle();

    expect(names()).toEqual(['Cleo', 'Ada', 'Dev', 'Bram']);
  });

  it('renders only the current page', async () => {
    component.pageSize.set(2);
    await settle();

    expect(names()).toEqual(['Cleo', 'Ada']);

    await step('Next page');

    expect(names()).toEqual(['Dev', 'Bram']);
  });

  it('renders the last page when a filter shrinks the table under the cursor', async () => {
    component.pageSize.set(2);
    await settle();
    await step('Next page');
    expect(names()).toEqual(['Dev', 'Bram']);

    await filterBy(1, 'P');

    // Back to the first page rather than to a page that no longer exists.
    expect(names()).toEqual(['Ada', 'Bram']);
  });

  it('drops the paginator for a virtual viewport past the threshold', async () => {
    expect(host.querySelector('sheep-table-paginator')).toBeTruthy();
    expect(host.querySelector('cdk-virtual-scroll-viewport')).toBeNull();

    component.threshold.set(2);
    await settle();

    expect(host.querySelector('sheep-table-paginator')).toBeNull();
    expect(host.querySelector('cdk-virtual-scroll-viewport')).toBeTruthy();
  });

  it('keeps the columns when the grid is rebuilt for the viewport', async () => {
    component.threshold.set(2);
    await settle();

    expect(headerLabels()).toEqual(['Name', 'Team', 'Rank']);
  });

  it('hands the paginator back when a filter brings the table under the threshold', async () => {
    component.threshold.set(2);
    await settle();
    expect(host.querySelector('sheep-table-paginator')).toBeNull();

    await filterBy(0, 'Ada');

    expect(host.querySelector('sheep-table-paginator')).toBeTruthy();
  });
});
