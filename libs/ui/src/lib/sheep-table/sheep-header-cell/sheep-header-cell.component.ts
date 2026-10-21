import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CdkHeaderCell } from '@angular/cdk/table';
import { SheepButtonComponent } from '../../sheep-button/sheep-button.component';
import { SheepInputComponent } from '../../sheep-input/sheep-input.component';
import { SheepInputLabelDirective } from '../../sheep-input/directives/sheep-input-label.directive';
import { SheepColumnDefDirective } from '../directives/sheep-column-def.directive';
import { SheepTableComponent } from '../sheep-table.component';
import { SHEEP_TABLE_MESSAGES } from '../sheep-table.messages';

/** Distinguishes one header's filter panel from the next one's. */
let nextId = 0;

/** The `toggle` event's shape, which TypeScript's DOM lib does not yet carry. */
interface PopoverToggleEvent extends Event {
  readonly newState: 'open' | 'closed';
}

/** Gap, in pixels, between the filter button and the panel it opens. */
const PANEL_OFFSET = 4;

/** Closest the panel is allowed to get to the edge of the window. */
const PANEL_MARGIN = 8;

/** The parts of a header cell that are the filter's, not the sort's. */
const FILTER_PARTS =
  '.sheep-table__filter-toggle, .sheep-table__filter-panel';

/**
 * The header cell for one column.
 *
 * ```html
 * <sheep-header-cell *sheepHeaderCellDef>Name</sheep-header-cell>
 * ```
 *
 * The caller writes the label; the cell decides what else belongs there. A
 * column declared `sortable` gets a sort control, a column declared
 * `filterable` gets a filter button, and a column declared neither gets a plain
 * label — none of which is repeated at the call site, because the column
 * definition already said it once.
 *
 * The sort control is a real `<button>`, so Enter and Space and focus come from
 * the platform, but the handler sits on the cell: the press bubbles, and
 * pointing at any part of a sortable header sorts it. Direction cycles
 * ascending, descending, off — the third press gives the data's own order back,
 * which is otherwise unreachable once a column has been touched.
 *
 * The filter opens in a panel rather than sitting in the header. A row of boxes
 * under the labels doubles the height of every table that has one filterable
 * column, and pays that on every screen whether or not anything is being
 * filtered. The panel is a native `popover`, so it lives in the top layer —
 * neither the table's scroll box nor its rounded frame can clip it, no z-index
 * needs choosing, and Escape and a click elsewhere dismiss it without this
 * component implementing either. It is placed under its button on open, and
 * closes on scroll rather than sliding away from what it belongs to.
 *
 * `aria-sort` is on the cell itself, where the grid pattern expects it.
 */
@Component({
  selector: 'sheep-header-cell',
  imports: [
    SheepInputComponent,
    SheepInputLabelDirective,
    SheepButtonComponent,
  ],
  templateUrl: './sheep-header-cell.component.html',
  styleUrl: './sheep-header-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sheep-table__hcell',
    '[class]': 'classes()',
    '[style.flex]': 'flex()',
    '[style.min-width]': 'minWidth()',
    '[attr.aria-sort]': 'ariaSort()',
    '(click)': 'onPress($event)',
  },
})
export class SheepHeaderCellComponent extends CdkHeaderCell {
  private readonly columnDef = inject(SheepColumnDefDirective);
  private readonly table = inject(SheepTableComponent);

  protected readonly messages = inject(SHEEP_TABLE_MESSAGES);

  protected readonly sortable = this.columnDef.sortable;
  protected readonly filterable = this.columnDef.filterable;

  /** Ties the button to its panel. Generated: the pairing is not the caller's. */
  protected readonly panelId = `sheep-table-filter-${++nextId}`;

  private readonly triggerRef =
    viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly field = viewChild(SheepInputComponent);

  protected readonly isOpen = signal(false);

  /** How this column is sorted right now, or `null` when it is not. */
  protected readonly direction = computed(() =>
    this.table.sort()?.column === this.columnDef.name
      ? (this.table.sort()?.direction ?? null)
      : null,
  );

  /** This column's filter term, as typed. */
  protected readonly term = computed(
    () => this.table.filters()[this.columnDef.name] ?? '',
  );

  /** True while this column is actually narrowing the table. */
  protected readonly active = computed(() => this.term().trim() !== '');

  /** The column's human name — its `label`, or its own name as a fallback. */
  private readonly title = computed(
    () => this.columnDef.label() ?? this.columnDef.name,
  );

  protected readonly classes = computed(() => {
    const direction = this.direction();
    return (
      `sheep-table__cell--${this.columnDef.align()}` +
      (this.sortable() ? ' sheep-table__hcell--sortable' : '') +
      (direction
        ? ` sheep-table__hcell--sorted sheep-table__hcell--${direction}`
        : '')
    );
  });

  /** Mirrors `sheep-cell`'s sizing, so the two halves of a column line up. */
  protected readonly flex = computed(() => {
    const width = this.columnDef.width();
    return width ? `0 0 ${width}` : `${this.columnDef.grow()} 1 0%`;
  });

  /** A named width is the whole answer; the density's floor is for the rest. */
  protected readonly minWidth = computed(() => this.columnDef.width());

  protected readonly ariaSort = computed(() => {
    if (!this.sortable()) {
      return null;
    }
    const direction = this.direction();
    return direction === 'asc'
      ? 'ascending'
      : direction === 'desc'
        ? 'descending'
        : 'none';
  });

  /** Names what the next press does, not what the current state is. */
  protected readonly sortLabel = computed(() => {
    const direction = this.direction();
    const next =
      direction === null ? 'asc' : direction === 'asc' ? 'desc' : 'none';
    return this.messages.sortColumn(this.title(), next);
  });

  protected readonly filterLabel = computed(() =>
    this.messages.filterColumn(this.title()),
  );

  /**
   * The density the panel's field is drawn at.
   *
   * Taken from the table rather than fixed, so the filter of a compact table is
   * a compact control. The two size axes are the library's one scale, which is
   * the point of there being only one.
   */
  protected readonly fieldSize = computed(() => this.table.size());

  /**
   * Closes the panel when anything scrolls.
   *
   * Capturing, because the scroll that matters is the table's own and it does
   * not reach `window` by bubbling. A panel anchored to a button that has since
   * moved is worse than one that is simply gone.
   */
  private readonly closeOnScroll = (): void => this.close();

  constructor() {
    super();
    inject(DestroyRef).onDestroy(() => this.stopWatchingScroll());
  }

  /**
   * Sorts, unless the press was aimed at the filter.
   *
   * The whole cell is the sort target, and the filter button and its panel are
   * both inside it — the panel only *looks* detached, it is still a descendant
   * in the DOM. Reading the origin here beats stopping the press in two places:
   * one rule, in the one method that decides whether a press sorts.
   */
  protected onPress(event: Event): void {
    const from = event.target as Element | null;
    if (!this.sortable() || from?.closest(FILTER_PARTS)) {
      return;
    }
    this.table.toggleSort(this.columnDef.name);
  }

  protected setTerm(term: string): void {
    this.table.setFilter(this.columnDef.name, term);
  }

  protected clear(): void {
    this.table.setFilter(this.columnDef.name, '');
    this.field()?.focus();
  }

  /**
   * Places the panel under its button, and takes the focus with it.
   *
   * The top layer means the panel is positioned against the window rather than
   * against anything it is nested in, so the coordinates are read fresh on
   * every open. It hangs from the button's trailing edge — a filter on the last
   * column would otherwise open off the side of the screen — and is held clear
   * of both window edges.
   */
  protected onToggle(event: Event): void {
    const open = (event as PopoverToggleEvent).newState === 'open';
    this.isOpen.set(open);

    if (!open) {
      this.stopWatchingScroll();
      return;
    }

    const panel = this.panelRef()?.nativeElement;
    const trigger = this.triggerRef()?.nativeElement;
    if (!panel || !trigger) {
      return;
    }

    const anchor = trigger.getBoundingClientRect();
    const width = panel.offsetWidth;
    const left = Math.min(
      Math.max(PANEL_MARGIN, anchor.right - width),
      window.innerWidth - width - PANEL_MARGIN,
    );

    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(anchor.bottom + PANEL_OFFSET)}px`;

    // The popover takes focus itself; move it on to the field, which is the
    // only thing in the panel anyone opened it to reach.
    this.field()?.focus();
    window.addEventListener('scroll', this.closeOnScroll, true);
  }

  private close(): void {
    this.panelRef()?.nativeElement.hidePopover?.();
  }

  private stopWatchingScroll(): void {
    window.removeEventListener('scroll', this.closeOnScroll, true);
  }
}
