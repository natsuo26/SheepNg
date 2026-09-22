import {
  ChangeDetectionStrategy,
  Component,
  signal,
  type WritableSignal,
} from '@angular/core';
import {
  SHEEP_SIDE_SHEET,
  SheepButtonComponent,
  type SheepSideSheetCloseReason,
  type SheepSideSheetSide,
  type SheepSideSheetSize,
} from '@sheep-ng/ui';

/**
 * Showcase for `sheep-side-sheet`.
 *
 * Every sheet on the page owns a boolean of its own and binds it with
 * `[(open)]`. That is the shape the component is meant to be used in: the
 * caller holds the state, and a dismissal writes back to it rather than
 * leaving the two out of step.
 *
 * The page is semantic HTML dressed by the demo page kit — see
 * `libs/demo/src/styles/_demo-kit.scss`. That layout vocabulary is
 * documentation chrome and stays inside this library: `@sheep-ng/ui` ships
 * components and a theme, never a way to lay out a page.
 */
@Component({
  selector: 'sheep-demo-side-sheet',
  imports: [SHEEP_SIDE_SHEET, SheepButtonComponent],
  templateUrl: './side-sheet-demo.html',
  styleUrl: './side-sheet-demo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideSheetDemo {
  protected readonly sides: readonly SheepSideSheetSide[] = ['right', 'left'];

  protected readonly sizes: readonly SheepSideSheetSize[] = ['sm', 'md', 'lg'];

  protected readonly anatomy = signal(false);
  protected readonly scrolling = signal(false);
  protected readonly coupled = signal(false);
  protected readonly dismissible = signal(false);
  protected readonly locked = signal(false);
  protected readonly plain = signal(false);

  /** One flag per specimen, so each trigger opens exactly its own sheet. */
  protected readonly sideOpen: Record<
    SheepSideSheetSide,
    WritableSignal<boolean>
  > = { right: signal(false), left: signal(false) };

  protected readonly sizeOpen: Record<
    SheepSideSheetSize,
    WritableSignal<boolean>
  > = { sm: signal(false), md: signal(false), lg: signal(false) };

  /** What last closed the dismissal specimen — the `closed` output, echoed. */
  protected readonly lastReason = signal<SheepSideSheetCloseReason | null>(
    null,
  );

  protected readonly paragraphs = Array.from(
    { length: 10 },
    (_, i) =>
      `Note ${i + 1}. The panel is the full height of the viewport, so the ` +
      `body is the part that moves — the header keeps the title in view and ` +
      `the footer keeps the actions reachable.`,
  );

  protected readonly snippet = `<sheep-side-sheet [(open)]="filtering">
  <sheep-side-sheet-header>Filters</sheep-side-sheet-header>

  <sheep-side-sheet-body>
    <sheep-chip-set>...</sheep-chip-set>
  </sheep-side-sheet-body>

  <sheep-side-sheet-footer align="between">
    <sheep-button variant="ghost" (click)="reset()">Reset</sheep-button>
    <sheep-button variant="solid" (click)="apply()">Apply</sheep-button>
  </sheep-side-sheet-footer>
</sheep-side-sheet>`;

  /** Section order and copy, so the template stays structural. */
  protected readonly sections: readonly {
    id: string;
    heading: string;
    note: string;
  }[] = [
    {
      id: 'anatomy',
      heading: 'Anatomy',
      note: 'Three parts: a header that names the sheet, a body that scrolls, a footer of the caller’s own buttons. The component orders them, so a sheet cannot be assembled upside down.',
    },
    {
      id: 'sides',
      heading: 'Sides',
      note: 'Right by default. Navigation conventionally arrives from the left, detail and filters from the right — the panel slides in from whichever edge it is anchored to.',
    },
    {
      id: 'sizes',
      heading: 'Sizes',
      note: 'Width and interior density move together. Height is never a choice: a side sheet spans the viewport, and on a narrow screen the panel takes the whole width rather than leaving a strip of page that cannot be reached.',
    },
    {
      id: 'dismissal',
      heading: 'Dismissal',
      note: 'Escape, a click beside the panel and the header’s close button are one setting. Turn dismissible off for a step that has to be finished rather than walked away from.',
    },
    {
      id: 'optional',
      heading: 'Parts are optional',
      note: 'Plenty of sheets are somewhere to look rather than somewhere to decide. Leave the footer out and closing is still offered three ways.',
    },
    {
      id: 'scroll',
      heading: 'Long content',
      note: 'The body is the only part that gives. The header and footer stay put, and the rules above and below the body say which rows are fixed.',
    },
    {
      id: 'versus',
      heading: 'Sheet or dialog',
      note: 'The same parts, the same state, the same three close reasons — moved to an edge. Reach for a dialog when the page must stop, and for a sheet when it merely steps aside.',
    },
    {
      id: 'coupled',
      heading: 'Tightly coupled',
      note: 'The markup for the sheet beside it. No style hooks pass through.',
    },
    {
      id: 'api',
      heading: 'API',
      note: 'Five inputs and one output on the sheet, one input on the footer. Nothing else is styleable from the call site.',
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
    anatomy: `<sheep-side-sheet [(open)]="filtering">
  <sheep-side-sheet-header>...</sheep-side-sheet-header>
  <sheep-side-sheet-body>...</sheep-side-sheet-body>
  <sheep-side-sheet-footer>...</sheep-side-sheet-footer>
</sheep-side-sheet>

/* open is the state. Bind it two-way - a dismissal
   writes false back to your own signal. */`,

    sides: `<sheep-side-sheet [(open)]="detail">...</sheep-side-sheet>
<sheep-side-sheet side="left" [(open)]="nav">...</sheep-side-sheet>`,

    sizes: `<sheep-side-sheet size="sm" [(open)]="filtering">...</sheep-side-sheet>
<sheep-side-sheet [(open)]="editing">...</sheep-side-sheet>
<sheep-side-sheet size="lg" [(open)]="reading">...</sheep-side-sheet>`,

    dismissal: `<sheep-side-sheet [(open)]="editing" (closed)="track($event)">
  ...
</sheep-side-sheet>

<sheep-side-sheet dismissible="false" [(open)]="step">
  <sheep-side-sheet-footer align="between">
    <sheep-button (click)="back()">Back</sheep-button>
    <sheep-button variant="solid" (click)="next()">Continue</sheep-button>
  </sheep-side-sheet-footer>
</sheep-side-sheet>`,

    optional: `<sheep-side-sheet [(open)]="detail">
  <sheep-side-sheet-header>Invoice 2417</sheep-side-sheet-header>
  <sheep-side-sheet-body>...</sheep-side-sheet-body>
</sheep-side-sheet>`,

    scroll: `<sheep-side-sheet size="lg" [(open)]="reading">
  <sheep-side-sheet-header>Activity</sheep-side-sheet-header>

  <sheep-side-sheet-body>
    @for (note of notes; track $index) {
      <p>{{ note }}</p>
    }
  </sheep-side-sheet-body>

  <sheep-side-sheet-footer align="between">...</sheep-side-sheet-footer>
</sheep-side-sheet>`,

    api: `import { SHEEP_SIDE_SHEET } from '@sheep-ng/ui';

@Component({ imports: [SHEEP_SIDE_SHEET], ... })`,
  };

  /** The public API, rendered from one source so it cannot drift from the code. */
  protected readonly api: readonly {
    name: string;
    default: string;
    type: string;
  }[] = [
    {
      name: 'sheep-side-sheet open',
      default: 'false',
      type: 'two-way boolean',
    },
    {
      name: 'sheep-side-sheet side',
      default: "'right'",
      type: "'right' | 'left'",
    },
    {
      name: 'sheep-side-sheet size',
      default: "'md'",
      type: "'sm' | 'md' | 'lg'",
    },
    {
      name: 'sheep-side-sheet dismissible',
      default: 'true',
      type: 'boolean attribute',
    },
    {
      name: 'sheep-side-sheet ariaLabel',
      default: 'null',
      type: 'string — when there is no header',
    },
    {
      name: 'sheep-side-sheet (closed)',
      default: '—',
      type: "'close' | 'escape' | 'backdrop'",
    },
    {
      name: 'sheep-side-sheet show() / close()',
      default: '—',
      type: 'the same state, called instead of bound',
    },
    {
      name: 'sheep-side-sheet-footer align',
      default: "'end'",
      type: "'end' | 'start' | 'between'",
    },
    {
      name: 'sheep-side-sheet-header',
      default: '—',
      type: 'title, and the name',
    },
    {
      name: 'sheep-side-sheet-body',
      default: '—',
      type: 'the scrolling slot',
    },
  ];
}
