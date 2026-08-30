import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import {
  SHEEP_LIST,
  SHEEP_LIST_ROW_HEIGHT,
  SHEEP_TOOLTIP_PLACEMENTS,
  SheepButtonComponent,
  SheepTooltipDirective,
  type SheepTooltipPlacement,
} from '@sheep-ng/ui';

interface Row {
  readonly id: number;
  readonly name: string;
  readonly owner: string;
  readonly size: string;
}

const OWNERS = ['Ada', 'Grace', 'Alan', 'Edsger', 'Barbara', 'Ken'];

/**
 * Showcase for `sheepTooltip`.
 *
 * The page is semantic HTML dressed by the demo page kit — see
 * `libs/demo/src/styles/_demo-kit.scss`. That layout vocabulary is
 * documentation chrome and stays inside this library: `@sheep-ng/ui` ships
 * components and a theme, never a way to lay out a page.
 */
@Component({
  selector: 'sheep-demo-tooltip',
  imports: [
    SheepTooltipDirective,
    SheepButtonComponent,
    SHEEP_LIST,
    ScrollingModule,
    DecimalPipe,
  ],
  templateUrl: './tooltip-demo.html',
  styleUrl: './tooltip-demo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipDemo {
  protected readonly placements: readonly SheepTooltipPlacement[] =
    SHEEP_TOOLTIP_PLACEMENTS;

  protected readonly rowHeight = SHEEP_LIST_ROW_HEIGHT.md;

  protected readonly disabled = signal(true);

  /**
   * A value that moves on its own.
   *
   * The point of the section it drives: hover it, keep hovering, and the words
   * in the tooltip change under the pointer. Nothing re-opens it — the text is
   * a signal the tooltip renders, not a string it copied on the way up.
   */
  protected readonly ticks = signal(0);

  /** How many times the virtual rows have been re-labelled. */
  protected readonly generation = signal(1);

  protected readonly rows = signal<readonly Row[]>(buildRows(1));

  constructor() {
    const handle = setInterval(() => this.ticks.update((n) => n + 1), 1000);

    inject(DestroyRef).onDestroy(() => clearInterval(handle));
  }

  /**
   * Re-labels every row without changing how many there are.
   *
   * The interesting case for a virtualised list: the DOM the viewport has
   * already built stays, and different data is poured through it. A tooltip
   * open over one of those rows has to follow the data rather than the
   * element it was opened on.
   */
  protected relabel(): void {
    this.generation.update((n) => n + 1);
    this.rows.set(buildRows(this.generation()));
  }

  protected trackById = (_: number, row: Row) => row.id;

  /** Section order and copy, so the template stays structural. */
  protected readonly sections: readonly {
    id: string;
    heading: string;
    note: string;
  }[] = [
    {
      id: 'anatomy',
      heading: 'Anatomy',
      note: 'An attribute on the element being described. No wrapper, no extra element, nothing about the layout changed by explaining something.',
    },
    {
      id: 'placement',
      heading: 'Placement',
      note: 'A preference, not a promise. A tooltip with no room on the side it asked for opens on the opposite one instead, and is then held clear of both window edges. The entry animation comes from the side it settled on, which is how it reads as attached to its anchor without an arrow.',
    },
    {
      id: 'live',
      heading: 'Changing data',
      note: 'The text is read as a signal, not copied when the tooltip opens. Hover this and keep hovering — the words change under the pointer, and the box is measured again around them.',
    },
    {
      id: 'virtual',
      heading: 'Virtual scroll',
      note: 'A tooltip on a row of a cdk-virtual-scroll-viewport, with nothing extra asked of the caller. It is not clipped by the scroll box, and it tracks its row while the viewport scrolls. A viewport recycles rows rather than destroying them, so a row that changes under a resting pointer changes the tooltip with it.',
    },
    {
      id: 'disabled',
      heading: 'Disabled',
      note: 'Turns the tooltip off without taking the binding off the element — for a label that is only worth showing sometimes.',
    },
    {
      id: 'naming',
      heading: 'It describes, it does not name',
      note: 'The tooltip becomes the anchor’s aria-describedby. An icon-only button has no name for it to elaborate on, so give it an aria-label too: a tooltip is not there when the pointer is not.',
    },
    {
      id: 'api',
      heading: 'API',
      note: 'Three inputs. Nothing else is styleable or configurable from the call site.',
    },
  ];

  /** The markup behind each specimen, keyed by section. */
  protected readonly snippets: Record<string, string> = {
    anatomy: `<sheep-button sheepTooltip="Move to the archive">
  Archive
</sheep-button>`,

    placement: `<sheep-button sheepTooltip="Above" sheepTooltipPlacement="top">top</sheep-button>
<sheep-button sheepTooltip="Beside" sheepTooltipPlacement="right">right</sheep-button>

/* The one below asks for left against the window's
   edge, and opens on the right instead. */`,

    live: `<sheep-button [sheepTooltip]="'Synced ' + ticks() + 's ago'">
  Sync status
</sheep-button>

/* ticks() moves on its own. The open tooltip moves
   with it - there is nothing to re-open. */`,

    virtual: `<cdk-virtual-scroll-viewport [itemSize]="36">
  <sheep-list divided>
    <sheep-list-item
      *cdkVirtualFor="let row of rows(); trackBy: trackById"
      [sheepTooltip]="row.name + ' - ' + row.owner + ', ' + row.size"
      sheepTooltipPlacement="right"
    >
      <div sheepListItemTitle>{{ row.name }}</div>
    </sheep-list-item>
  </sheep-list>
</cdk-virtual-scroll-viewport>`,

    disabled: `<span
  [sheepTooltip]="cell.full"
  [sheepTooltipDisabled]="!truncated()"
>{{ cell.short }}</span>`,

    naming: `<sheep-button aria-label="Delete project" sheepTooltip="Delete project">
  <svg>...</svg>
</sheep-button>`,

    api: `import { SheepTooltipDirective } from '@sheep-ng/ui';

@Component({ imports: [SheepTooltipDirective], ... })`,
  };

  /** The public API, rendered from one source so it cannot drift from the code. */
  protected readonly api: readonly {
    name: string;
    default: string;
    type: string;
  }[] = [
    {
      name: 'sheepTooltip',
      default: "''",
      type: 'string | null — live; empty closes it',
    },
    {
      name: 'sheepTooltipPlacement',
      default: "'top'",
      type: "'top' | 'right' | 'bottom' | 'left'",
    },
    {
      name: 'sheepTooltipDisabled',
      default: 'false',
      type: 'boolean attribute',
    },
    {
      name: 'opens on',
      default: '—',
      type: 'hover after 250ms, focus-visible at once',
    },
    {
      name: 'closes on',
      default: '—',
      type: 'leave, blur, Escape, anchor destroyed',
    },
    {
      name: 'aria-describedby',
      default: '—',
      type: 'set on the anchor while showing',
    },
  ];
}

/** Rows whose labels depend on `generation`, so re-labelling is visible. */
function buildRows(generation: number): readonly Row[] {
  return Array.from({ length: 2000 }, (_, i) => ({
    id: i,
    name: `Asset ${String(i + 1).padStart(4, '0')} · rev ${generation}`,
    owner: OWNERS[(i + generation) % OWNERS.length],
    size: `${((i * 37 + generation * 11) % 900) + 12} KB`,
  }));
}
