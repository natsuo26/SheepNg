import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
  signal,
} from '@angular/core';
import {
  SHEEP_TOOLTIP_MARGIN,
  SHEEP_TOOLTIP_OFFSET,
  type SheepTooltipPlacement,
} from './sheep-tooltip.constants';

let nextId = 0;

/** The side a tooltip falls back to when the side it asked for has no room. */
const OPPOSITE: Readonly<Record<SheepTooltipPlacement, SheepTooltipPlacement>> =
  {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
  };

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), Math.max(min, max));

/**
 * The surface a tooltip is drawn on. One per application, not one per anchor.
 *
 * Not something a caller writes. `sheepTooltip` is the public face of this
 * component; `SheepTooltipService` creates the single instance and hands it
 * from one anchor to the next. That is what keeps the count at one no matter
 * how many anchors a page has — and a virtualised list has as many anchors as
 * it has rows.
 *
 * It is a native `popover`, so it lives in the top layer: a scroll box's
 * `overflow`, a transformed ancestor and a stacking context are all things it
 * is simply not inside, which is the whole reason a tooltip on a row of
 * `cdk-virtual-scroll-viewport` is not clipped at the edge of the viewport.
 * No z-index is chosen anywhere in this file.
 *
 * Everything shown is a signal, so the visible tooltip is a rendering of the
 * current state rather than a copy taken when it opened: when an anchor's text
 * changes under it — a recycled row, a value that ticks — the words on screen
 * change with it, and the box is measured and placed again around them.
 */
@Component({
  selector: 'sheep-tooltip',
  imports: [],
  templateUrl: './sheep-tooltip.component.html',
  styleUrl: './sheep-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sheep-tooltip',
    role: 'tooltip',
    popover: 'manual',
    '[attr.id]': 'id',
  },
})
export class SheepTooltipComponent {
  /** The words. Rendered from the signal, so a change reaches the screen. */
  readonly text = signal('');

  /** The side asked for. `place()` may settle on the opposite one. */
  readonly placement = signal<SheepTooltipPlacement>('top');

  /** The element being described. Read fresh on every measurement. */
  readonly anchor = signal<HTMLElement | null>(null);

  /**
   * The id the anchor points its `aria-describedby` at.
   *
   * Stable for the life of the instance. Since there is one instance, there is
   * one id, and only ever one element claiming to be described by it — the
   * anchor the tooltip is currently open on.
   */
  readonly id = `sheep-tooltip-${++nextId}`;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /**
   * Whether the popover is showing.
   *
   * Tracked here rather than read back off the element with `:popover-open`,
   * so the render effect below has something to depend on and so the component
   * behaves the same in a test environment without the popover API.
   */
  private readonly open = signal(false);

  constructor() {
    // Measuring is a DOM read, so it waits for the DOM to hold what the
    // signals say. Depending on text and placement is what makes a tooltip
    // re-place itself when its words change size under it.
    afterRenderEffect(() => {
      this.text();
      this.placement();
      this.anchor();

      if (this.open()) this.place();
    });
  }

  /** Puts the tooltip in the top layer. Placement follows on the next render. */
  show(): void {
    if (this.open()) return;

    this.host.nativeElement.showPopover?.();
    this.open.set(true);
  }

  hide(): void {
    if (!this.open()) return;

    this.open.set(false);
    this.host.nativeElement.hidePopover?.();
  }

  /**
   * Measures the anchor again and moves the tooltip onto it.
   *
   * Called on every scroll and resize while open. The anchor's box is the only
   * input that matters and it is read fresh each time, so a tooltip stays on
   * its row while a virtual viewport scrolls under it rather than being left
   * behind at the coordinates it opened at.
   */
  place(): void {
    const anchor = this.anchor();
    const host = this.host.nativeElement;
    if (!anchor || !this.open()) return;

    const box = anchor.getBoundingClientRect();
    const width = host.offsetWidth;
    const height = host.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = SHEEP_TOOLTIP_OFFSET;
    const edge = SHEEP_TOOLTIP_MARGIN;

    // Flip only when the requested side has no room and the opposite one does.
    // A tooltip with room on neither side stays where it was asked to go and
    // is clamped below, which keeps it on a predictable side of its anchor.
    const room: Readonly<Record<SheepTooltipPlacement, boolean>> = {
      top: box.top - height - gap >= edge,
      bottom: box.bottom + height + gap <= vh - edge,
      left: box.left - width - gap >= edge,
      right: box.right + width + gap <= vw - edge,
    };

    let side = this.placement();
    if (!room[side] && room[OPPOSITE[side]]) side = OPPOSITE[side];

    const vertical = side === 'top' || side === 'bottom';
    const wanted = vertical
      ? { x: box.left + (box.width - width) / 2, y: side === 'top' ? box.top - height - gap : box.bottom + gap }
      : { x: side === 'left' ? box.left - width - gap : box.right + gap, y: box.top + (box.height - height) / 2 };

    const left = clamp(wanted.x, edge, vw - width - edge);
    const top = clamp(wanted.y, edge, vh - height - edge);

    host.style.left = `${Math.round(left)}px`;
    host.style.top = `${Math.round(top)}px`;

    // Written straight to the element, and the only thing that writes it: the
    // resolved side is the outcome of a measurement taken after render, and
    // routing it back through a signal would ask for another render to paint
    // the result of this one. The stylesheet reads it to aim the entry, which
    // is what tells the eye which side the tooltip came from.
    host.dataset['side'] = side;
  }
}
