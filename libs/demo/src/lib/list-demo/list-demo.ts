import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import {
  SHEEP_LIST,
  SHEEP_LIST_ROW_HEIGHT,
  type SheepListSize,
} from '@sheep-ng/ui';

interface Entry {
  readonly id: string;
  readonly name: string;
  readonly updated: string;
  readonly size: string;
}

/**
 * Showcase for `sheep-list`.
 *
 * The page is semantic HTML dressed by the demo page kit — see
 * `libs/demo/src/styles/_demo-kit.scss`. That layout vocabulary is
 * documentation chrome and stays inside this library: `@sheep-ng/ui` ships
 * components and a theme, never a way to lay out a page.
 */
@Component({
  selector: 'sheep-demo-list',
  imports: [SHEEP_LIST, ScrollingModule, DecimalPipe],
  templateUrl: './list-demo.html',
  styleUrl: './list-demo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListDemo {
  protected readonly sizes: readonly SheepListSize[] = ['sm', 'md', 'lg'];

  protected readonly folders: readonly Entry[] = [
    { id: 'f1', name: 'Photos', updated: 'Jan 12, 2026', size: '12 items' },
    { id: 'f2', name: 'Recipes', updated: 'Feb 03, 2026', size: '4 items' },
    { id: 'f3', name: 'Work', updated: 'Feb 21, 2026', size: '38 items' },
  ];

  protected readonly notes: readonly Entry[] = [
    {
      id: 'n1',
      name: 'Vacation itinerary',
      updated: 'Mar 02, 2026',
      size: '8 KB',
    },
    {
      id: 'n2',
      name: 'Kitchen remodel',
      updated: 'Mar 08, 2026',
      size: '21 KB',
    },
  ];

  /** Section order and copy, so the template stays structural. */
  protected readonly sections: readonly {
    id: string;
    heading: string;
    note: string;
  }[] = [
    {
      id: 'anatomy',
      heading: 'Anatomy',
      note: 'A row is three slots: a leading icon, a text column, trailing meta. The caller owns every element in them.',
    },
    {
      id: 'lines',
      heading: 'Lines',
      note: 'One title, then as many lines as the row needs. Height follows content — there is no `lines` input to keep in sync.',
    },
    {
      id: 'sizes',
      heading: 'Sizes',
      note: 'Density is set once on the list and inherited by every row, so a row cannot disagree with the list it sits in.',
    },
    {
      id: 'sections',
      heading: 'Subheaders and dividers',
      note: 'divided draws the hairline between rows. A subheader or an explicit rule breaks the run into sections.',
    },
    {
      id: 'interactive',
      heading: 'Clickable rows',
      note: 'A clickable row is a real anchor or button — the same selector matches all three forms, so keyboard and focus come from the platform.',
    },
    {
      id: 'virtual',
      heading: 'Virtual scroll',
      note: 'Rows drop straight into a cdk-virtual-scroll-viewport — no wrapper of ours in between, and no virtual variant of the row.',
    },
    {
      id: 'coupled',
      heading: 'Tightly coupled',
      note: 'The markup for the list beside it. No style hooks pass through.',
    },
    {
      id: 'api',
      heading: 'API',
      note: 'Two inputs on the list, one on the row, six projection markers. Nothing else is styleable from the call site.',
    },
  ];

  /**
   * The markup behind each specimen, keyed by section.
   *
   * Every example on the page is a few lines of HTML and nothing else, so the
   * page shows those lines rather than describing them. A section with its own
   * coupled code block is absent here — it already has one.
   */
  protected readonly snippets: Record<string, string> = {
    anatomy: `<sheep-list divided>
  <sheep-list-item>
    <svg sheepListItemIcon viewBox="0 0 24 24">...</svg>
    <div sheepListItemTitle>Photos</div>
    <div sheepListItemLine>Updated Jan 12, 2026</div>
    <span sheepListItemMeta>12 items</span>
  </sheep-list-item>
</sheep-list>`,

    lines: `<sheep-list-item>
  <div sheepListItemTitle>Vacation itinerary</div>
</sheep-list-item>

<sheep-list-item>
  <div sheepListItemTitle>Vacation itinerary</div>
  <div sheepListItemLine>Edited Mar 02, 2026</div>
  <div sheepListItemLine>8 KB</div>
</sheep-list-item>`,

    sizes: `<sheep-list size="sm">...</sheep-list>
<sheep-list>...</sheep-list>
<sheep-list size="lg">...</sheep-list>

/* Density is set once, on the list. A row cannot
   disagree with the list it sits in. */`,

    sections: `<sheep-list divided>
  <div sheepListSubheader>Folders</div>
  <sheep-list-item>...</sheep-list-item>

  <hr sheepListDivider />

  <div sheepListSubheader>Notes</div>
  <sheep-list-item>...</sheep-list-item>
</sheep-list>`,

    interactive: `<a sheep-list-item routerLink="/inbox" [selected]="current() === 'inbox'">
  <div sheepListItemTitle>Inbox</div>
</a>

<button sheep-list-item type="button" (click)="pick(note.id)">
  <div sheepListItemTitle>{{ note.name }}</div>
</button>

<button sheep-list-item type="button" disabled>...</button>`,

    api: `import { SHEEP_LIST, SHEEP_LIST_ROW_HEIGHT } from '@sheep-ng/ui';

@Component({ imports: [SHEEP_LIST], ... })`,
  };

  /** The public API, rendered from one source so it cannot drift from the code. */
  protected readonly api: readonly {
    name: string;
    default: string;
    type: string;
  }[] = [
    { name: 'sheep-list size', default: "'md'", type: "'sm' | 'md' | 'lg'" },
    { name: 'sheep-list divided', default: 'false', type: 'boolean attribute' },
    {
      name: 'sheep-list-item selected',
      default: 'false',
      type: 'boolean attribute',
    },
    { name: 'sheepListSubheader', default: '—', type: 'section label' },
    { name: 'sheepListDivider', default: '—', type: 'decorative rule' },
    { name: 'sheepListItemIcon', default: '—', type: 'leading icon' },
    { name: 'sheepListItemTitle', default: '—', type: 'primary text' },
    {
      name: 'sheepListItemLine',
      default: '—',
      type: 'secondary text, repeatable',
    },
    { name: 'sheepListItemMeta', default: '—', type: 'trailing content' },
    {
      name: 'SHEEP_LIST_ROW_HEIGHT',
      default: '28 | 36 | 44',
      type: 'itemSize for a single-line row, per size',
    },
  ];

  /** Rendered verbatim next to the list it describes. */
  protected readonly snippet = `<sheep-list divided>
  <div sheepListSubheader>Folders</div>
  @for (folder of folders; track folder.id) {
    <sheep-list-item>
      <svg sheepListItemIcon>...</svg>
      <div sheepListItemTitle>{{ folder.name }}</div>
      <div sheepListItemLine>{{ folder.updated }}</div>
    </sheep-list-item>
  }
</sheep-list>

/* There is no itemTemplate, no dataSource and no
   trailing config object. A row is markup. */`;

  /**
   * The `itemSize` the viewport needs, taken from the library rather than typed
   * in — the row height is a spec value, not a number this page gets to guess.
   */
  protected readonly virtualRowHeight = SHEEP_LIST_ROW_HEIGHT.md;

  /** Enough rows that rendering them all would be the wrong idea. */
  protected readonly manyRows: readonly Entry[] = Array.from(
    { length: 10_000 },
    (_, i) => ({
      id: `v${i}`,
      name: `Asset ${(i + 1).toString().padStart(5, '0')}`,
      updated: 'Mar 12, 2026',
      size: `${((i % 97) + 3) * 7} KB`,
    }),
  );

  protected readonly virtualSnippet = `<cdk-virtual-scroll-viewport [itemSize]="36">
  <sheep-list divided>
    <sheep-list-item *cdkVirtualFor="let row of rows; let i = index"
                     [attr.aria-posinset]="i + 1"
                     [attr.aria-setsize]="rows.length">
      <div sheepListItemTitle>{{ row.name }}</div>
    </sheep-list-item>
  </sheep-list>
</cdk-virtual-scroll-viewport>

/* The viewport is CDK's, unwrapped. Nothing about the
   row changes because it is being recycled. */`;

  protected trackById(_index: number, row: Entry): string {
    return row.id;
  }

  protected readonly current = signal('f3');
  protected readonly picked = signal<string | null>(null);

  protected pick(id: string): void {
    this.picked.set(id);
  }
}
