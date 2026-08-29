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
  SheepDialogCloseReason,
  SheepDialogSize,
} from './sheep-dialog.constants';

let nextId = 0;

/**
 * A modal popup.
 *
 * The dialog owns being open, being modal and being dismissed. It owns nothing
 * about what is inside it: the three parts are slots, and the caller fills
 * them with their own content and their own buttons.
 *
 * ```html
 * <sheep-dialog [(open)]="confirming">
 *   <sheep-dialog-header>Delete project</sheep-dialog-header>
 *   <sheep-dialog-body>This cannot be undone.</sheep-dialog-body>
 *   <sheep-dialog-footer>
 *     <sheep-button (click)="confirming.set(false)">Cancel</sheep-button>
 *     <sheep-button tone="danger" variant="solid" (click)="remove()">
 *       Delete
 *     </sheep-button>
 *   </sheep-dialog-footer>
 * </sheep-dialog>
 * ```
 *
 * The parts are ordered by the component, not by the markup: the header is
 * always the first row and the footer always the last, so a dialog cannot be
 * assembled upside down. The body is the only part that scrolls — the panel
 * stops growing at the viewport and the header and footer stay put.
 *
 * Underneath is a native `<dialog>` opened with `showModal()`, so the focus
 * trap, the backdrop, the top-layer stacking and Escape are the platform's,
 * not a reimplementation of them. It follows that an ancestor's `overflow` or
 * `transform` cannot clip the panel, and that no z-index needs choosing.
 *
 * `open` is the state, and it is two-way: nothing else opens or closes the
 * dialog behind the caller's back. A dismissal — Escape, a click on the
 * backdrop, the header's close button — writes `false` back and says why
 * through `closed`.
 *
 * A modal needs an accessible name. A `sheep-dialog-header` supplies one; a
 * dialog without a header wants `ariaLabel`.
 *
 * Deliberately NOT themeable per instance. Every colour and metric comes from
 * the `--sheep-*` theme layer, so two dialogs in one app cannot drift apart.
 */
@Component({
  selector: 'sheep-dialog',
  imports: [],
  templateUrl: './sheep-dialog.component.html',
  styleUrl: './sheep-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sheep-dialog',
    '[class]': 'classes()',
  },
})
export class SheepDialogComponent {
  /** Whether the dialog is showing. Two-way: `[(open)]="editing"`. */
  readonly open = model(false);

  /** Panel width and interior density. Defaults to `md`. */
  readonly size = input<SheepDialogSize>('md');

  /**
   * Whether Escape and a backdrop click close the dialog, and whether the
   * header offers a close button. Turn it off for a decision the user has to
   * answer rather than walk away from.
   */
  readonly dismissible = input(true, { transform: booleanAttribute });

  /** Accessible name. Use it when there is no `sheep-dialog-header`. */
  readonly ariaLabel = input<string | null>(null);

  /** Emits once the dialog has closed, with what closed it. */
  readonly closed = output<SheepDialogCloseReason>();

  private readonly surfaceRef =
    viewChild.required<ElementRef<HTMLDialogElement>>('surface');

  /**
   * The id the header puts on itself, and the dialog's `aria-labelledby`.
   *
   * Owned here rather than handed up from the header so that neither side has
   * to write to the other during change detection: the header reads it off the
   * dialog it is projected into. `ariaLabel`, when given, wins — a dialog is
   * named once.
   */
  readonly titleId = `sheep-dialog-${++nextId}-title`;

  /**
   * What the current close is being attributed to.
   *
   * The native `close` event says nothing about its cause and is the one place
   * every path converges, so each path records its reason on the way in and
   * `closed` reads it there. Plain, not a signal: it is a note between two
   * synchronous steps, never rendered.
   */
  private reason: SheepDialogCloseReason = 'close';

  /**
   * Whether the press that may become a click started on the backdrop.
   *
   * A drag that begins inside the panel and ends outside it fires `click` on
   * the surface, which would otherwise read as a backdrop dismissal. Requiring
   * both ends of the press to land on the backdrop means selecting text past
   * the panel's edge no longer throws the dialog away.
   */
  private pressedBackdrop = false;

  protected readonly classes = computed(() => `sheep-dialog--${this.size()}`);

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

  /** Opens the dialog. Equivalent to setting `open` to `true`. */
  show(): void {
    this.open.set(true);
  }

  /** Closes the dialog. This is what a footer button calls. */
  close(reason: SheepDialogCloseReason = 'close'): void {
    this.reason = reason;
    this.open.set(false);
  }

  /** Escape. Refused outright when the dialog is not dismissible. */
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
   * closes on its own — a form's `method="dialog"`, or the top layer being torn
   * down — so `open` and `closed` stay true to the element either way.
   */
  protected onSurfaceClose(): void {
    this.open.set(false);
    this.closed.emit(this.reason);
    this.reason = 'close';
  }
}
