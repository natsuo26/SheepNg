import {
  DestroyRef,
  Directive,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import {
  SHEEP_TOOLTIP_HIDE_DELAY,
  SHEEP_TOOLTIP_SHOW_DELAY,
  type SheepTooltipPlacement,
} from './sheep-tooltip.constants';
import { SheepTooltipService } from './sheep-tooltip.service';

/**
 * A short label explaining the element it is put on.
 *
 * ```html
 * <sheep-button [sheepTooltip]="'Archive ' + folder.name">
 *   Archive
 * </sheep-button>
 * ```
 *
 * Put it on anything — a button, an icon, a truncated cell. The directive adds
 * no element and no wrapper, so nothing about the layout changes by describing
 * something. Opens on hover and on focus, closes on leave, blur and Escape.
 *
 * ### It is a description, not a name
 *
 * The tooltip becomes the anchor's `aria-describedby`, which is the right role
 * for a note *about* a control that already says what it is. An icon-only
 * button has no name for a tooltip to elaborate on, so give it an `aria-label`
 * as well — a tooltip is not a substitute, because it is not there when the
 * pointer is not.
 *
 * ### The text is live
 *
 * `sheepTooltip` is read as a signal, not copied when the tooltip opens. Bind
 * a value that changes and the open tooltip changes with it, re-measuring
 * around the new words. Setting it to an empty string closes it: there is no
 * separate "and now hide it" to keep in step with the text.
 *
 * ### Virtual scroll
 *
 * Works on a row of a `cdk-virtual-scroll-viewport` with nothing extra asked
 * of the caller. The surface is a native `popover` in the top layer, so the
 * viewport's own `overflow` cannot clip it, and it tracks its anchor's box
 * while anything scrolls rather than staying at the coordinates it opened at.
 *
 * A viewport does not destroy the row that scrolls away — it recycles the view
 * and pours the next row's data through it — so the anchor under a resting
 * pointer stays put and changes what it holds. Because the text is live, the
 * tooltip changes with it and goes on describing whatever is actually under
 * the pointer. The destroy path covers the other case, where the view really
 * is torn down; either way nothing is left pointing at a row that has gone.
 *
 * Deliberately NOT themeable per instance. Every colour and metric comes from
 * the `--sheep-*` theme layer.
 */
@Directive({
  selector: '[sheepTooltip]',
  host: {
    '(mouseenter)': 'open()',
    '(mouseleave)': 'close()',
    '(focusin)': 'open(true)',
    '(focusout)': 'close(true)',
    '(keydown.escape)': 'close(true)',
  },
})
export class SheepTooltipDirective {
  /** The words. Empty or null shows nothing, and closes anything showing. */
  readonly sheepTooltip = input<string | null>('');

  /** Which side to prefer. Flips when that side has no room. */
  readonly sheepTooltipPlacement = input<SheepTooltipPlacement>('top');

  /**
   * Turns the tooltip off without taking the binding off the element.
   *
   * For a label that is only worth showing sometimes — the full text of a cell
   * that is currently truncated, say. Supports the bare-attribute form.
   */
  readonly sheepTooltipDisabled = input(false, { transform: booleanAttribute });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly tooltips = inject(SheepTooltipService);

  /**
   * Whether this anchor is the one currently showing a tooltip.
   *
   * Derived from the service rather than kept here. A pointer moving from one
   * anchor straight onto the next hands the tooltip over in a single write, so
   * there is no moment when both anchors think they have it and no way for a
   * stale flag to leave two elements pointing `aria-describedby` at one
   * tooltip.
   */
  private readonly showing = computed(() => this.tooltips.isOwner(this));

  /**
   * The pending open or close.
   *
   * One handle for both: an anchor is either on its way to opening or on its
   * way to closing, never both, so a new intent replaces the old one rather
   * than racing it.
   */
  private timer: ReturnType<typeof setTimeout> | null = null;

  /** The trimmed text, or null when there is nothing worth showing. */
  private readonly label = computed(() => {
    const text = this.sheepTooltip()?.trim();

    return !text || this.sheepTooltipDisabled() ? null : text;
  });

  /**
   * The element that actually carries the anchor's role and its focus.
   *
   * `sheepTooltip` goes on whatever the author is pointing at, and in this
   * library that is usually a component — `<sheep-button>` wraps the real
   * `<button>`. The wrapper has no role to describe and can never match
   * `:focus-visible`, so both of those questions are asked of the control
   * inside it. A plain element with no control in it answers for itself.
   */
  private target(): HTMLElement {
    const host = this.host.nativeElement;

    return host.matches(FOCUSABLE)
      ? host
      : (host.querySelector<HTMLElement>(FOCUSABLE) ?? host);
  }

  constructor() {
    // The live half of the contract. While this anchor holds the tooltip, its
    // text and side are pushed on every change — and text that empties out, or
    // a directive that is disabled mid-hover, closes rather than showing a
    // stale label. Reads `showing` untracked: it is the condition for acting,
    // not something to act on.
    effect(() => {
      const label = this.label();
      const placement = this.sheepTooltipPlacement();

      if (!untracked(this.showing)) return;

      if (label === null) this.hide();
      else this.tooltips.update(this, { text: label, placement });
    });

    // `aria-describedby` has to land on the control rather than on the element
    // the directive happens to sit on, which is a descendant this cannot bind
    // to. Written after render, so the control exists to be written to.
    afterRenderEffect(() => {
      const id = this.showing() ? this.tooltips.tooltipId : null;
      const target = this.target();

      if (id) target.setAttribute('aria-describedby', id);
      else target.removeAttribute('aria-describedby');
    });

    // Any anchor torn down while its tooltip is up — a viewport trimming its
    // rendered range rather than recycling into it, an *ngIf, a route change.
    // Without this the surface would be left pointing at an element that is no
    // longer in the document.
    inject(DestroyRef).onDestroy(() => {
      this.disarm();
      this.hide();
    });
  }

  /**
   * Asks for the tooltip after the opening delay.
   *
   * Focus skips the delay: it is a deliberate arrival at one control, not a
   * pointer passing over a row of them, and a keyboard user should not be made
   * to wait out a pause meant for a mouse. Focus that came from a click is
   * ignored, since the pointer has already handled that case.
   */
  protected open(fromFocus = false): void {
    if (this.label() === null) return;
    if (fromFocus && !isFocusVisible(this.target())) return;

    this.arm(() => this.show(), fromFocus ? 0 : SHEEP_TOOLTIP_SHOW_DELAY);
  }

  /** Closes after the grace period, or at once when leaving by keyboard. */
  protected close(immediate = false): void {
    this.arm(() => this.hide(), immediate ? 0 : SHEEP_TOOLTIP_HIDE_DELAY);
  }

  private show(): void {
    const text = this.label();
    if (text === null) return;

    this.tooltips.show(this, {
      anchor: this.host.nativeElement,
      text,
      placement: this.sheepTooltipPlacement(),
    });
  }

  private hide(): void {
    this.tooltips.hide(this);
  }

  private arm(action: () => void, delay: number): void {
    this.disarm();

    if (delay === 0) {
      action();
      return;
    }

    this.timer = setTimeout(() => {
      this.timer = null;
      action();
    }, delay);
  }

  private disarm(): void {
    if (this.timer === null) return;

    clearTimeout(this.timer);
    this.timer = null;
  }
}

/** What counts as the control inside an anchor, in document order. */
const FOCUSABLE =
  'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Whether `element` is focused in a way worth showing a tooltip for.
 *
 * `:focus-visible` is the browser's own answer to "did this focus come from
 * the keyboard", which is the distinction wanted here: a click has already
 * shown the tooltip through hover. Guarded because a DOM implementation
 * without the selector throws on it rather than returning false, and a test
 * environment is not a reason for a directive to stop working.
 */
function isFocusVisible(element: HTMLElement): boolean {
  try {
    return element.matches(':focus-visible');
  } catch {
    return false;
  }
}
