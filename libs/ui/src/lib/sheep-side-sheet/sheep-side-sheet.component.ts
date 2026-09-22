import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import type {
  SheepSideSheetCloseReason,
  SheepSideSheetSide,
  SheepSideSheetSize,
} from './sheep-side-sheet.constants';

let nextId = 0;

/**
 * A modal panel anchored to the left or right edge of the viewport.
 *
 * The sheet owns being open, being modal and being dismissed. It owns nothing
 * about what is inside it: the three parts are slots, and the caller fills
 * them with their own content and their own buttons.
 *
 * ```html
 * <sheep-side-sheet [(open)]="filtering" side="right">
 *   <sheep-side-sheet-header>Filters</sheep-side-sheet-header>
 *   <sheep-side-sheet-body>
 *     <sheep-chip-set>...</sheep-chip-set>
 *   </sheep-side-sheet-body>
 *   <sheep-side-sheet-footer align="between">
 *     <sheep-button variant="ghost" (click)="reset()">Reset</sheep-button>
 *     <sheep-button variant="solid" (click)="apply()">Apply</sheep-button>
 *   </sheep-side-sheet-footer>
 * </sheep-side-sheet>
 * ```
 *
 * It is `sheep-dialog` moved to an edge, and deliberately so: same parts, same
 * state, same dismissal, same three close reasons. What differs is the
 * geometry and what that geometry is for. A dialog interrupts to ask one
 * question and wants an answer before the page continues; a sheet comes in
 * beside the page to hold a secondary surface — filters, a detail record, a
 * form — that the user works in and then puts away. Reach for a dialog when
 * the page must stop, and for a sheet when it merely steps aside.
 *
 * The parts are ordered by the component, not by the markup: the header is
 * always the first row and the footer always the last, so a sheet cannot be
 * assembled upside down. The body is the only part that scrolls — the panel is
 * always the full height of the viewport, and the header and footer stay put.
 *
 * Underneath is a native `<dialog>` opened with `showModal()`, so the focus
 * trap, the backdrop, the top-layer stacking and Escape are the platform's,
 * not a reimplementation of them. It follows that an ancestor overflow or
 * transform cannot clip the panel, and that no z-index needs choosing.
 *
 * `open` is the state, and it is two-way: nothing else opens or closes the
 * sheet behind the caller's back. A dismissal — Escape, a click on the
 * backdrop, the header's close button — writes `false` back and says why
 * through `closed`.
 *
 * A modal needs an accessible name. A `sheep-side-sheet-header` supplies one;
 * a sheet without a header wants `ariaLabel`.
 *
 * Deliberately NOT themeable per instance. Every colour and metric comes from
 * the `--sheep-*` theme layer, so two sheets in one app cannot drift apart.
 */
@Component({
  selector: 'sheep-side-sheet',
  imports: [],
  templateUrl: './sheep-side-sheet.component.html',
  styleUrl: './sheep-side-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sheep-side-sheet',
    '[class]': 'classes()',
  },
})
export class SheepSideSheetComponent {
  /** Whether the sheet is showing. Two-way: `[(open)]="filtering"`. */
  readonly open = model(false);

  /** Which edge the panel is anchored to. Defaults to `right`. */
  readonly side = input<SheepSideSheetSide>('right');

  /** Panel width and interior density. Defaults to `md`. */
  readonly size = input<SheepSideSheetSize>('md');

  /**
   * Whether Escape and a backdrop click close the sheet, and whether the
   * header offers a close button. Turn it off for a step the user has to
   * finish rather than walk away from.
   */
  readonly dismissible = input(true, { transform: booleanAttribute });

  /** Accessible name. Use it when there is no `sheep-side-sheet-header`. */
  readonly ariaLabel = input<string | null>(null);

  /** Emits once the sheet has closed, with what closed it. */
  readonly closed = output<SheepSideSheetCloseReason>();

  private readonly surfaceRef =
    viewChild.required<ElementRef<HTMLDialogElement>>('surface');

  /**
   * The id the header puts on itself, and the sheet's `aria-labelledby`.
   *
   * Owned here rather than handed up from the header so that neither side has
   * to write to the other during change detection: the header reads it off the
   * sheet it is projected into. `ariaLabel`, when given, wins — a sheet is
   * named once.
   */
  readonly titleId = `sheep-side-sheet-${++nextId}-title`;

  /**
   * What the current close is being attributed to.
   *
   * The native `close` event says nothing about its cause and is the one place
   * every path converges, so each path records its reason on the way in and
   * `closed` reads it there. Plain, not a signal: it is a note between two
   * synchronous steps, never rendered.
   */
  private reason: SheepSideSheetCloseReason = 'close';

  /**
   * Whether the press that may become a click started on the backdrop.
   *
   * A drag that begins inside the panel and ends outside it fires `click` on
   * the surface, which would otherwise read as a backdrop dismissal. Requiring
   * both ends of the press to land on the backdrop means selecting text past
   * the panel edge no longer throws the sheet away.
   */
  private pressedBackdrop = false;

  protected readonly classes = computed(
    () => `sheep-side-sheet--${this.size()} sheep-side-sheet--${this.side()}`,
  );

  constructor() {
    // Browser-only, and after the view exists: `showModal()` is a DOM call on
    // an element that has to be rendered before it can be made modal.
    afterRenderEffect(() => {
      const surface = this.surfaceRef().nativeElement;

      if (this.open()) {
        if (!surface.open) surface.showModal();
      } else if (surface.open) {
        surface.close();
      }
    });
  }

  /** Opens the sheet. Equivalent to setting `open` to `true`. */
  show(): void {
    this.open.set(true);
  }

  /** Closes the sheet. This is what a footer button calls. */
  close(reason: SheepSideSheetCloseReason = 'close'): void {
    this.reason = reason;
    this.open.set(false);
  }

  /** Escape. Refused outright when the sheet is not dismissible. */
  protected onCancel(event: Event): void {
    event.preventDefault();

    if (this.dismissible()) this.close('escape');
  }

  protected onSurfacePress(event: MouseEvent): void {
    this.pressedBackdrop = event.target === this.surfaceRef().nativeElement;
  }

  /** A click that both started and ended on the backdrop, never on the panel. */
  protected onSurfaceClick(event: MouseEvent): void {
    const onBackdrop =
      this.pressedBackdrop && event.target === this.surfaceRef().nativeElement;
    this.pressedBackdrop = false;

    if (onBackdrop && this.dismissible()) this.close('backdrop');
  }

  /**
   * The single exit. Reached by our own `close()`, and by anything the browser
   * closes on its own — a form with `method="dialog"`, or the top layer being
   * torn down — so `open` and `closed` stay true to the element either way.
   */
  protected onSurfaceClose(): void {
    this.open.set(false);
    this.closed.emit(this.reason);
    this.reason = 'close';
  }
}
