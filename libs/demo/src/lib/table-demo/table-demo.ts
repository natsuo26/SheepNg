import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  SHEEP_TABLE,
  SHEEP_TABLE_VIRTUAL_THRESHOLD,
  type SheepTableSize,
  type SheepTableSort,
} from '@sheep-ng/ui';

type Status = 'active' | 'onboarding' | 'leave';

interface Employee {
  readonly id: string;
  readonly first: string;
  readonly last: string;
  readonly email: string;
  readonly team: string;
  readonly role: string;
  readonly status: Status;
  readonly started: Date;
  readonly salary: number;
}

/** Status ordered by where someone is in their time here, not by spelling. */
const STATUS_RANK: Readonly<Record<Status, number>> = {
  onboarding: 0,
  active: 1,
  leave: 2,
};

const STATUS_LABEL: Readonly<Record<Status, string>> = {
  onboarding: 'Onboarding',
  active: 'Active',
  leave: 'On leave',
};

const FIRST = [
  'Ada', 'Bram', 'Cleo', 'Dev', 'Elin', 'Faris', 'Gita', 'Hugo', 'Ines', 'Jonas',
  'Kira', 'Liam', 'Maya', 'Nils', 'Ora', 'Pia', 'Quin', 'Rune', 'Sana', 'Tomas',
];

const LAST = [
  'Abbott', 'Bernard', 'Castillo', 'Duarte', 'Ellery', 'Fontaine', 'Grieve',
  'Halloran', 'Ivarsson', 'Jarosz', 'Kowal', 'Lindqvist', 'Moreau', 'Nakamura',
  'Osei', 'Pereira', 'Quaranta', 'Rasmussen', 'Silvestri', 'Thorne',
];

const TEAMS = ['Platform', 'Design', 'Growth', 'Data', 'Support', 'Security'];

const ROLES = [
  'Engineer', 'Senior engineer', 'Staff engineer', 'Designer', 'Researcher',
  'Analyst', 'Manager',
];

const STATUSES: readonly Status[] = ['active', 'active', 'active', 'onboarding', 'leave'];

/**
 * Deterministic, so the page looks the same on every reload.
 *
 * The two name lists are walked at coprime strides against a shifting offset so
 * the pairs do not repeat every twenty rows — a demo where four hundred people
 * share a name says nothing useful about sorting.
 */
function makeEmployees(count: number): readonly Employee[] {
  return Array.from({ length: count }, (_, i) => {
    const first = FIRST[(i * 7 + Math.floor(i / 20) * 3) % FIRST.length];
    const last = LAST[(i * 11 + Math.floor(i / 7)) % LAST.length];
    return {
      id: `e${i}`,
      first,
      last,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@sheep.example`,
      team: TEAMS[(i * 5) % TEAMS.length],
      role: ROLES[(i * 3) % ROLES.length],
      status: STATUSES[i % STATUSES.length],
      started: new Date(2018 + (i % 8), (i * 5) % 12, ((i * 13) % 27) + 1),
      salary: 62_000 + ((i * 3137) % 88_000),
    };
  });
}

/**
 * Showcase for `sheep-table`.
 *
 * One table carries every feature — sorting, custom accessors, column filters,
 * alignment, a frozen column, paging, and the switch to virtual scrolling —
 * because that is how a real table arrives: not one capability at a time, but
 * all of them at once on the same eight columns.
 *
 * The page is semantic HTML dressed by the demo page kit — see
 * `libs/demo/src/styles/_demo-kit.scss`. That layout vocabulary is
 * documentation chrome and stays inside this library: `@sheep-ng/ui` ships
 * components and a theme, never a way to lay out a page.
 */
@Component({
  selector: 'sheep-demo-table',
  imports: [SHEEP_TABLE, CurrencyPipe, DatePipe],
  templateUrl: './table-demo.html',
  styleUrl: './table-demo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableDemo {
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly threshold = SHEEP_TABLE_VIRTUAL_THRESHOLD;

  protected readonly sizes: readonly SheepTableSize[] = ['sm', 'md', 'lg'];
  protected readonly size = signal<SheepTableSize>('md');

  /** The lever behind the whole demo: cross the threshold and watch the table change. */
  protected readonly scale = signal<'small' | 'large'>('small');

  private readonly small = makeEmployees(120);
  private readonly large = makeEmployees(4_000);

  protected readonly employees = computed(() =>
    this.scale() === 'small' ? this.small : this.large,
  );

  /** Two-way, so the page can show what the table is doing with it. */
  protected readonly sort = signal<SheepTableSort | null>({
    column: 'name',
    direction: 'asc',
  });

  protected readonly sortLabel = computed(() => {
    const sort = this.sort();
    return sort ? `${sort.column} ${sort.direction}` : 'none';
  });

  // --- accessors, declared once and bound into the column definitions ------

  /** People sort by surname; the column renders both names. */
  protected readonly byLastName = (row: Employee): string =>
    `${row.last} ${row.first}`;

  /** One box that searches both halves of the identity column. */
  protected readonly nameAndEmail = (row: Employee): string =>
    `${row.first} ${row.last} ${row.email}`;

  /** Status is a sequence, not a word — ordering it alphabetically is nonsense. */
  protected readonly byStatusRank = (a: Employee, b: Employee): number =>
    STATUS_RANK[a.status] - STATUS_RANK[b.status];

  /** Status filters against the label people can see, not the stored token. */
  protected readonly statusText = (row: Employee): string =>
    STATUS_LABEL[row.status];

  /** `>150000` and `<80000` both work; anything else is a substring match. */
  protected readonly salaryFilter = (row: Employee, term: string): boolean => {
    const match = /^\s*([<>])\s*(\d+)\s*$/.exec(term);
    if (!match) {
      return String(row.salary).includes(term.trim());
    }
    const limit = Number(match[2]);
    return match[1] === '>' ? row.salary > limit : row.salary < limit;
  };

  protected readonly trackEmployee = (_index: number, row: Employee): string =>
    row.id;

  protected picked = signal<string | null>(null);

  protected pick(row: Employee): void {
    this.picked.set(`${row.first} ${row.last}`);
  }

  /** Section order and copy, so the template stays structural. */
  protected readonly sections: readonly {
    id: string;
    heading: string;
    note: string;
  }[] = [
    {
      id: 'anatomy',
      heading: 'Anatomy',
      note: 'A column is a name and two templates, wrapped in an ng-container that renders nothing. There is no row template to keep in sync and no data source object between the array and the screen.',
    },
    {
      id: 'sorting',
      heading: 'Sorting',
      note: 'A column says sortable and its header grows the control. The value it sorts by is the property it is named after, until an accessor says otherwise — or a comparator takes the decision entirely.',
    },
    {
      id: 'filtering',
      heading: 'Column filters',
      note: 'A column says filterable and its header grows a funnel, which opens a panel in the top layer — nothing the table sits in can clip it. Terms narrow each other, so adding one can never widen the result.',
    },
    {
      id: 'paging',
      heading: 'Paging',
      note: 'A paginator is there by default. Only the page is in the DOM — the rest of the array never becomes markup.',
    },
    {
      id: 'virtual',
      heading: 'Past a thousand rows',
      note: 'The paginator goes away and the table scrolls instead, with about a screenful in the DOM. Measured against the filtered rows, so narrowing the table hands the paginator back.',
    },
    {
      id: 'sizes',
      heading: 'Sizes',
      note: 'Density is set once on the table and inherited by every cell — including the ones written at the call site, which the table cannot reach any other way.',
    },
    {
      id: 'api',
      heading: 'API',
      note: 'Nine inputs on the table, eleven on a column, three definition directives. Nothing else is styleable from the call site.',
    },
  ];

  /** The markup behind each section, shown rather than described. */
  protected readonly snippets: Record<string, string> = {
    anatomy: `<sheep-table [data]="employees()">
  <ng-container sheepColumnDef="team" sortable filterable>
    <sheep-header-cell *sheepHeaderCellDef>Team</sheep-header-cell>
    <sheep-cell *sheepCellDef="let row">{{ row.team }}</sheep-cell>
  </ng-container>
</sheep-table>

/* No <tr>, no displayedColumns, no MatTableDataSource.
   Columns render in the order they were written. */`,

    sorting: `<!-- Sorts on row.team, because that is what it is called. -->
<ng-container sheepColumnDef="team" sortable>

<!-- Renders both names, sorts on the surname. -->
<ng-container sheepColumnDef="name" sortable
              [sortAccessor]="byLastName">

<!-- Status is a sequence. Alphabetical would be nonsense. -->
<ng-container sheepColumnDef="status" sortable
              [sortComparator]="byStatusRank">

byLastName = (row: Employee) => \`\${row.last} \${row.first}\`;
byStatusRank = (a, b) => RANK[a.status] - RANK[b.status];

/* Comparators are written ascending. The table negates
   for descending, so one never flips on direction. */`,

    filtering: `<!-- One box, searching both halves of the column. -->
<ng-container sheepColumnDef="name" filterable
              [filterAccessor]="nameAndEmail">

<!-- Matches the label people can see, not the token. -->
<ng-container sheepColumnDef="status" filterable
              [filterAccessor]="statusText">

<!-- Takes the whole decision: >150000 and <80000 work. -->
<ng-container sheepColumnDef="salary" filterable
              [filterPredicate]="salaryFilter">

nameAndEmail = (row) => \`\${row.first} \${row.last} \${row.email}\`;
salaryFilter = (row, term) => /* the term, exactly as typed */;`,

    paging: `<sheep-table [data]="employees()"
             [pageSizeOptions]="[10, 25, 50, 100]"
             [(pageSize)]="rowsPerPage"
             [(pageIndex)]="page">

/* Both are two-way. Sorting or filtering returns to the
   first page — the row under the cursor is not the row
   that will be there afterwards. */`,

    virtual: `<sheep-table [data]="rows()" [virtualThreshold]="1000"
             [viewportHeight]="440">

/* Under the threshold: a paginator, one page in the DOM.
   Over it: one continuous scroll, a screenful in the DOM,
   and no paginator — paging through 160 pages is not
   navigation.

   Set 0 to always scroll. Raise it for cheap rows. */`,

    sizes: `<sheep-table size="sm" [data]="rows()">
<sheep-table [data]="rows()">
<sheep-table size="lg" [data]="rows()">

/* A cell is written in the caller's template, so the
   table cannot reach it with a stylesheet. Density
   travels down as inherited custom properties instead —
   which is why a cell has no size input to disagree
   with the table it sits in. */`,

    api: `import { SHEEP_TABLE } from '@sheep-ng/ui';

@Component({ imports: [SHEEP_TABLE], ... })`,
  };

  /** The public API, rendered from one source so it cannot drift from the code. */
  protected readonly api: readonly {
    name: string;
    default: string;
    type: string;
  }[] = [
    { name: 'sheep-table data', default: '[]', type: 'readonly T[]' },
    { name: 'sheep-table columns', default: 'declaration order', type: 'readonly string[] | null' },
    { name: 'sheep-table size', default: "'md'", type: "'sm' | 'md' | 'lg'" },
    { name: 'sheep-table stickyHeader', default: 'true', type: 'boolean attribute' },
    { name: 'sheep-table viewportHeight', default: 'null', type: 'number | null (px) — pins the scroll region in both modes' },
    { name: 'sheep-table sort', default: 'null', type: 'two-way SheepTableSort | null' },
    { name: 'sheep-table filters', default: '{}', type: 'two-way Record<string, string>' },
    { name: 'sheep-table pageIndex', default: '0', type: 'two-way number' },
    { name: 'sheep-table pageSize', default: '25', type: 'two-way number' },
    { name: 'sheep-table pageSizeOptions', default: '[10, 25, 50, 100]', type: 'readonly number[]' },
    { name: 'sheep-table virtualThreshold', default: '1000', type: 'number' },
    { name: 'sheep-table trackBy', default: 'null', type: 'TrackByFunction<T> | null' },
    { name: 'sheepColumnDef', default: '—', type: 'the column name, and its default accessor' },
    { name: 'sheepColumnDef label', default: 'the name', type: 'string | null' },
    { name: 'sheepColumnDef sortable', default: 'false', type: 'boolean attribute' },
    { name: 'sheepColumnDef filterable', default: 'false', type: 'boolean attribute' },
    { name: 'sheepColumnDef align', default: "'start'", type: "'start' | 'center' | 'end'" },
    { name: 'sheepColumnDef width', default: 'null', type: 'any CSS length — fixed, and past the density floor' },
    { name: 'sheepColumnDef grow', default: '1', type: 'number — share of the leftover width' },
    { name: 'sheepColumnDef sticky', default: 'false', type: 'boolean attribute' },
    { name: 'sheepColumnDef sortAccessor', default: "row[name]", type: '(row: T) => SheepTableSortValue' },
    { name: 'sheepColumnDef sortComparator', default: 'null', type: '(a: T, b: T) => number' },
    { name: 'sheepColumnDef filterAccessor', default: "row[name]", type: '(row: T) => string' },
    { name: 'sheepColumnDef filterPredicate', default: 'null', type: '(row: T, term: string) => boolean' },
    { name: '*sheepHeaderCellDef', default: '—', type: 'the header template' },
    { name: '*sheepCellDef', default: '—', type: 'the cell template, given the row' },
    { name: 'sheepTableToolbar', default: '—', type: 'the strip above the table' },
    { name: 'sheepTableEmpty', default: '—', type: 'what replaces the rows when there are none' },
    { name: 'SHEEP_TABLE_ROW_HEIGHT', default: '30 | 36 | 44', type: 'row height in px, per size' },
    { name: 'SHEEP_TABLE_MESSAGES', default: 'English', type: 'every string the table writes itself' },
  ];
}
