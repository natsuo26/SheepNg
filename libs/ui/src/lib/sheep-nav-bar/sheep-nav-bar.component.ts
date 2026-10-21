import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type { SheepNavBarSize } from './sheep-nav-bar.constants';

/**
 * A horizontal bar of top-level destinations, with room either side for the
 * things that sit beside them — a brand at the start, a search field or a
 * theme switcher at the end.
 *
 * ```html
 * <sheep-nav-bar ariaLabel="Main">
 *   <a sheepNavBarStart routerLink="/">Acme</a>
 *
 *   <a sheep-nav-bar-item routerLink="/inbox" routerLinkActive ariaCurrentWhenActive="page">
 *     Inbox
 *   </a>
 *   <a sheep-nav-bar-item routerLink="/reports" routerLinkActive ariaCurrentWhenActive="page">
 *     Reports
 *   </a>
 *
 *   <sheep-theme-switcher sheepNavBarEnd />
 * </sheep-nav-bar>
 * ```
 *
 * Only the items are navigation. They are wrapped in a real `<nav>` landmark,
 * and the start and end slots sit outside it, so a screen reader listing the
 * page's landmarks finds the destinations and nothing else — not the logo, not
 * the theme switcher.
 *
 * Which item is current is `aria-current`, and nothing else. The router's own
 * `routerLinkActive` writes it when given `ariaCurrentWhenActive="page"`, and
 * the item paints from the attribute, so what is announced as current and what
 * is drawn as current cannot disagree. Outside the router, `[active]` on the
 * item sets the same attribute.
 *
 * When there are more items than width, the items scroll sideways rather than
 * wrapping onto a second row or collapsing behind a menu: the bar keeps its
 * height and every destination stays one tap away. Each way of getting there
 * is covered — a swipe on touch, Tab on a keyboard (the row follows focus),
 * and a step button at the edge that has more past it for a mouse. The
 * current item is always scrolled into view, so the bar never hides where the
 * user is. The start and end slots never scroll.
 *
 * A vertical wheel is deliberately left to the page. A bar is usually pinned
 * at the top, under the pointer as often as not, and a bar that took the
 * wheel would stop the page scrolling whenever it did. Shift+wheel and a
 * trackpad's sideways swipe still scroll the row natively.
 *
 * The bar owns no position. Pinning it to the top of the window is the page's
 * call — `position: sticky` on the host, from the page's own stylesheet.
 *
 * Deliberately NOT themeable per instance. Every colour and metric comes from
 * the `--sheep-*` theme layer, so two nav bars in one app cannot drift apart.
 */
@Component({
  selector: 'sheep-nav-bar',
  imports: [],
  templateUrl: './sheep-nav-bar.component.html',
  styleUrl: './sheep-nav-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sheep-nav-bar',
    '[class]': 'classes()',
  },
})
export class SheepNavBarComponent {
  /** Control size of every item in the bar. Defaults to `md`. */
  readonly size = input<SheepNavBarSize>('md');

  /**
   * Accessible name of the `<nav>` landmark.
   *
   * Optional on a page with one navigation region. Name each one once there
   * are two — "Main", "Account" — or a screen reader lists them as
   * indistinguishable "navigation"s.
   */
  readonly ariaLabel = input<string | null>(null);

  private readonly navRef = viewChild.required<ElementRef<HTMLElement>>('nav');
  private readonly itemsRef =
    viewChild.required<ElementRef<HTMLElement>>('items');

  /** Items are scrolled out of view past the start edge. */
  protected readonly moreStart = signal(false);

  /** Items are scrolled out of view past the end edge. */
  protected readonly moreEnd = signal(false);

  protected readonly classes = computed(
    () =>
      `sheep-nav-bar--${this.size()}` +
      (this.moreStart() ? ' sheep-nav-bar--more-start' : '') +
      (this.moreEnd() ? ' sheep-nav-bar--more-end' : ''),
  );

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Browser-only, and once the row exists: everything here is measurement
    // and listening on rendered elements.
    afterNextRender(() => {
      const nav = this.navRef().nativeElement;
      const cleanup: (() => void)[] = [];

      const onScroll = () => this.measure();
      nav.addEventListener('scroll', onScroll, { passive: true });
      cleanup.push(() => nav.removeEventListener('scroll', onScroll));

      // The row overflows or stops overflowing when the bar is resized and
      // when items come or go, so both boxes are watched.
      if (typeof ResizeObserver !== 'undefined') {
        const resize = new ResizeObserver(() => this.measure());
        resize.observe(nav);
        resize.observe(this.itemsRef().nativeElement);
        cleanup.push(() => resize.disconnect());
      }

      // Whatever writes aria-current — the router, a navigation, [active] —
      // the newly current item is brought into view, so the bar never hides
      // where the user is.
      if (typeof MutationObserver !== 'undefined') {
        const current = new MutationObserver(() => this.revealCurrent());
        current.observe(nav, {
          subtree: true,
          attributes: true,
          attributeFilter: ['aria-current'],
        });
        cleanup.push(() => current.disconnect());
      }

      this.measure();
      this.revealCurrent();

      destroyRef.onDestroy(() => cleanup.forEach((undo) => undo()));
    });
  }

  /**
   * Pages the row one viewport's worth, less a little, so the item that was
   * cut at the edge is the first one fully shown after the step.
   */
  protected step(direction: -1 | 1): void {
    const nav = this.navRef().nativeElement;
    const rtl = getComputedStyle(nav).direction === 'rtl';

    nav.scrollBy({
      left: direction * (rtl ? -1 : 1) * nav.clientWidth * 0.8,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }

  /** Reads which edges have items past them. */
  private measure(): void {
    const nav = this.navRef().nativeElement;
    const overflow = nav.scrollWidth - nav.clientWidth;
    // Absolute, because an RTL row scrolls into negative scrollLeft. A pixel
    // of slack, because a fractional width never quite reaches the end.
    const offset = Math.abs(nav.scrollLeft);

    this.moreStart.set(overflow > 1 && offset > 1);
    this.moreEnd.set(overflow > 1 && offset < overflow - 1);
  }

  /** Scrolls the current item clear of the edge fades, if it is not already. */
  private revealCurrent(): void {
    const nav = this.navRef().nativeElement;
    if (nav.scrollWidth <= nav.clientWidth) return;

    const item = nav.querySelector<HTMLElement>(
      "[aria-current]:not([aria-current='false'])",
    );
    if (!item) return;

    const bounds = nav.getBoundingClientRect();
    const rect = item.getBoundingClientRect();

    if (rect.left < bounds.left + EDGE_CLEARANCE) {
      nav.scrollBy({ left: rect.left - bounds.left - EDGE_CLEARANCE });
    } else if (rect.right > bounds.right - EDGE_CLEARANCE) {
      nav.scrollBy({ left: rect.right - bounds.right + EDGE_CLEARANCE });
    }
  }
}

/**
 * How far from an edge an item has to be to count as in view: the width of
 * the fade, which the step button sits inside. Matches `$edge` in the SCSS.
 */
const EDGE_CLEARANCE = 48;

function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
