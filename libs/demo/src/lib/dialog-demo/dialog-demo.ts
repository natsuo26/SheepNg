import {
  ChangeDetectionStrategy,
  Component,
  signal,
  type WritableSignal,
} from '@angular/core';
import {
  SHEEP_DIALOG,
  SheepButtonComponent,
  type SheepDialogCloseReason,
  type SheepDialogFooterAlign,
  type SheepDialogSize,
} from '@sheep-ng/ui';

/**
 * Showcase for `sheep-dialog`.
 *
 * Every dialog on the page owns a boolean of its own and binds it with
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
  selector: 'sheep-demo-dialog',
  imports: [SHEEP_DIALOG, SheepButtonComponent],
  templateUrl: './dialog-demo.html',
  styleUrl: './dialog-demo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogDemo {
  protected readonly sizes: readonly SheepDialogSize[] = ['sm', 'md', 'lg'];

  protected readonly aligns: readonly SheepDialogFooterAlign[] = [
    'end',
    'start',
    'between',
  ];

  protected readonly anatomy = signal(false);
  protected readonly scrolling = signal(false);
  protected readonly coupled = signal(false);
  protected readonly dismissible = signal(false);
  protected readonly locked = signal(false);

  /** One flag per specimen, so each trigger opens exactly its own dialog. */
  protected readonly sizeOpen: Record<
    SheepDialogSize,
    WritableSignal<boolean>
  > = { sm: signal(false), md: signal(false), lg: signal(false) };

  protected readonly alignOpen: Record<
    SheepDialogFooterAlign,
    WritableSignal<boolean>
  > = { end: signal(false), start: signal(false), between: signal(false) };

  /** What last closed the dismissal specimen — the `closed` output, echoed. */
  protected readonly lastReason = signal<SheepDialogCloseReason | null>(null);

  protected readonly paragraphs = Array.from(
    { length: 8 },
    (_, i) =>
      `Clause ${i + 1}. The panel stops growing once it reaches the viewport, ` +
      `and from there the body is the only part that moves — the header keeps ` +
      `the title in view and the footer keeps the actions reachable.`,
  );

  protected readonly snippet = `<sheep-dialog [(open)]="editing">
  <sheep-dialog-header>Rename folder</sheep-dialog-header>

  <sheep-dialog-body>
    <sheep-input [(value)]="name" />
  </sheep-dialog-body>

  <sheep-dialog-footer>
    <sheep-button (click)="editing.set(false)">Cancel</sheep-button>
    <sheep-button variant="solid" (click)="save()">Save</sheep-button>
  </sheep-dialog-footer>
</sheep-dialog>`;

  /** Section order and copy, so the template stays structural. */
  protected readonly sections: readonly {
    id: string;
    heading: string;
    note: string;
  }[] = [
    {
      id: 'anatomy',
      heading: 'Anatomy',
      note: 'Three parts: a header that names the dialog, a body that scrolls, a footer of the caller’s own buttons. The component orders them, so a dialog cannot be assembled upside down.',
    },
    {
      id: 'sizes',
      heading: 'Sizes',
      note: 'Size is how much room the content needs, not how important it is. The panel never exceeds the viewport in either axis, whatever the size says.',
    },
    {
      id: 'dismissal',
      heading: 'Dismissal',
      note: 'Escape, a click on the backdrop and the header’s close button are one setting. Turn dismissible off for a decision that has to be answered rather than walked away from.',
    },
    {
      id: 'footer',
      heading: 'Footer alignment',
      note: 'Actions read left to right in rising commitment. Use between to push a destructive action away from the pair the eye lands on.',
    },
    {
      id: 'scroll',
      heading: 'Long content',
      note: 'The body is the only part that gives. The header and footer stay put, and the panel keeps its corners.',
    },
    {
      id: 'coupled',
      heading: 'Tightly coupled',
      note: 'The markup for the dialog beside it. No style hooks pass through.',
    },
    {
      id: 'api',
      heading: 'API',
      note: 'Four inputs and one output on the dialog, one input on the footer. Nothing else is styleable from the call site.',
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
    anatomy: `<sheep-dialog [(open)]="renaming">
  <sheep-dialog-header>...</sheep-dialog-header>
  <sheep-dialog-body>...</sheep-dialog-body>
  <sheep-dialog-footer>...</sheep-dialog-footer>
</sheep-dialog>

/* open is the state. Bind it two-way - a dismissal
   writes false back to your own signal. */`,

    sizes: `<sheep-dialog size="sm" [(open)]="confirming">...</sheep-dialog>
<sheep-dialog [(open)]="renaming">...</sheep-dialog>
<sheep-dialog size="lg" [(open)]="reading">...</sheep-dialog>`,

    dismissal: `<sheep-dialog [(open)]="editing" (closed)="track($event)">
  ...
</sheep-dialog>

<sheep-dialog dismissible="false" [(open)]="confirming">
  <sheep-dialog-footer>
    <sheep-button (click)="confirming.set(false)">Keep editing</sheep-button>
    <sheep-button tone="danger" variant="solid" (click)="discard()">
      Discard
    </sheep-button>
  </sheep-dialog-footer>
</sheep-dialog>`,

    footer: `<sheep-dialog-footer align="between">
  <sheep-button tone="danger" variant="ghost" (click)="remove()">
    Delete
  </sheep-button>
  <sheep-button variant="solid" (click)="open.set(false)">Done</sheep-button>
</sheep-dialog-footer>`,

    scroll: `<sheep-dialog size="lg" [(open)]="reading">
  <sheep-dialog-header>Terms of service</sheep-dialog-header>

  <sheep-dialog-body>
    @for (clause of clauses; track $index) {
      <p>{{ clause }}</p>
    }
  </sheep-dialog-body>

  <sheep-dialog-footer align="between">...</sheep-dialog-footer>
</sheep-dialog>`,

    api: `import { SHEEP_DIALOG } from '@sheep-ng/ui';

@Component({ imports: [SHEEP_DIALOG], ... })`,
  };

  /** The public API, rendered from one source so it cannot drift from the code. */
  protected readonly api: readonly {
    name: string;
    default: string;
    type: string;
  }[] = [
    { name: 'sheep-dialog open', default: 'false', type: 'two-way boolean' },
    { name: 'sheep-dialog size', default: "'md'", type: "'sm' | 'md' | 'lg'" },
    {
      name: 'sheep-dialog dismissible',
      default: 'true',
      type: 'boolean attribute',
    },
    {
      name: 'sheep-dialog ariaLabel',
      default: 'null',
      type: 'string — when there is no header',
    },
    {
      name: 'sheep-dialog (closed)',
      default: '—',
      type: "'close' | 'escape' | 'backdrop'",
    },
    {
      name: 'sheep-dialog show() / close()',
      default: '—',
      type: 'the same state, called instead of bound',
    },
    {
      name: 'sheep-dialog-footer align',
      default: "'end'",
      type: "'end' | 'start' | 'between'",
    },
    { name: 'sheep-dialog-header', default: '—', type: 'title, and the name' },
    { name: 'sheep-dialog-body', default: '—', type: 'the scrolling slot' },
  ];
}
