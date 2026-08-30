import {
  ApplicationRef,
  EnvironmentInjector,
  Injectable,
  type ComponentRef,
  createComponent,
  inject,
  signal,
} from '@angular/core';
import { SheepTooltipComponent } from './sheep-tooltip.component';
import type { SheepTooltipPlacement } from './sheep-tooltip.constants';

/** What a tooltip is currently showing, and for whom. */
interface SheepTooltipRequest {
  readonly anchor: HTMLElement;
  readonly text: string;
  readonly placement: SheepTooltipPlacement;
}

/**
 * Owns the one tooltip surface, and which anchor currently has it.
 *
 * Not something a caller uses. `sheepTooltip` talks to this; the reason it is
 * a service rather than a component each directive creates is the count. A
 * virtualised list has a `sheepTooltip` on every rendered row and a thousand
 * more waiting to be recycled into, and only ever one tooltip is on screen.
 * One surface, created on first use and moved from anchor to anchor, is what
 * that costs.
 *
 * Every method takes the directive asking as its first argument, and every one
 * of them ignores a caller that does not currently hold the tooltip. That is
 * what makes the awkward orderings safe without any of the callers having to
 * think about them: a row scrolls away and its directive is destroyed after
 * the pointer has already opened the next row's tooltip, and its `hide` is a
 * no-op rather than a tooltip that vanishes from under the pointer.
 */
@Injectable({ providedIn: 'root' })
export class SheepTooltipService {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);

  private ref: ComponentRef<SheepTooltipComponent> | null = null;

  /**
   * The directive the visible tooltip belongs to, or null when hidden.
   *
   * A signal, and the single source of the answer: an anchor does not track
   * separately whether it is the one showing, it reads it from here. That is
   * what stops two anchors both believing they own the tooltip when a pointer
   * moves from one straight onto the next — the second `show` is the first
   * one's loss of it, in the same write.
   */
  private readonly owner = signal<unknown>(null);

  /**
   * The id of the visible tooltip, for the owner's `aria-describedby`.
   *
   * Null until the surface exists, which is the first time anything is shown:
   * an app that never hovers anything never creates the element.
   */
  get tooltipId(): string | null {
    return this.ref?.instance.id ?? null;
  }

  /** Whether `owner` is the directive the visible tooltip belongs to. */
  isOwner(owner: unknown): boolean {
    const current = this.owner();

    return current !== null && current === owner;
  }

  /**
   * Shows `request` on behalf of `owner`, taking the tooltip off whoever had
   * it. Idempotent: showing the same thing again only re-measures.
   */
  show(owner: unknown, request: SheepTooltipRequest): void {
    const tooltip = this.surface();

    this.owner.set(owner);
    tooltip.text.set(request.text);
    tooltip.placement.set(request.placement);
    tooltip.anchor.set(request.anchor);
    tooltip.show();

    this.watch();
  }

  /**
   * Re-states what the owner is showing. Ignored from anyone else.
   *
   * This is the path a changing input takes: the directive's text moved while
   * the tooltip was open, so the surface is told, and it re-renders and
   * re-measures around the new words rather than keeping the ones it opened
   * with.
   */
  update(owner: unknown, request: Omit<SheepTooltipRequest, 'anchor'>): void {
    if (!this.isOwner(owner) || !this.ref) return;

    this.ref.instance.text.set(request.text);
    this.ref.instance.placement.set(request.placement);
  }

  /** Hides the tooltip, if `owner` is the one holding it. */
  hide(owner: unknown): void {
    if (!this.isOwner(owner) || !this.ref) return;

    this.owner.set(null);
    this.ref.instance.hide();
    this.ref.instance.anchor.set(null);
    this.unwatch();
  }

  /**
   * Creates the surface on first use and keeps it.
   *
   * Attached to `document.body` rather than beside its anchor: an anchor in a
   * virtual viewport is removed from the DOM the moment it scrolls out of the
   * rendered range, and a tooltip parented to it would go with it mid-hover.
   */
  private surface(): SheepTooltipComponent {
    if (this.ref) return this.ref.instance;

    this.ref = createComponent(SheepTooltipComponent, {
      environmentInjector: this.injector,
    });
    document.body.appendChild(this.ref.location.nativeElement);
    this.appRef.attachView(this.ref.hostView);

    return this.ref.instance;
  }

  /**
   * Follows the anchor while anything moves it.
   *
   * Capture, so it hears a `cdk-virtual-scroll-viewport` scrolling rather than
   * only the window: a row slides under the pointer and the tooltip slides
   * with it. The tooltip is dropped once its anchor is gone from the document
   * — which is exactly what a viewport does to a row it recycles — or once the
   * anchor has been scrolled out of sight, since a tooltip pointing at
   * something no longer on screen is pointing at nothing.
   */
  private readonly follow = (): void => {
    const anchor = this.ref?.instance.anchor();

    if (!anchor?.isConnected || !isAnchorVisible(anchor)) {
      this.hide(this.owner());
      return;
    }

    this.ref?.instance.place();
  };

  private watch(): void {
    window.addEventListener('scroll', this.follow, true);
    window.addEventListener('resize', this.follow);
  }

  private unwatch(): void {
    window.removeEventListener('scroll', this.follow, true);
    window.removeEventListener('resize', this.follow);
  }
}

/**
 * Whether an anchor is still somewhere a tooltip could point at.
 *
 * A rendered row is not necessarily a visible one: a virtual viewport keeps a
 * buffer of rows past both edges, so `isConnected` alone would leave a tooltip
 * open on a row that has already scrolled under the edge of its scroll box.
 * Walking the scrollable ancestors and intersecting their boxes catches that,
 * and catches the same row inside a plain `overflow: auto` panel.
 */
function isAnchorVisible(anchor: HTMLElement): boolean {
  const box = anchor.getBoundingClientRect();
  if (box.width === 0 && box.height === 0) return false;

  let clip = new DOMRect(0, 0, window.innerWidth, window.innerHeight);

  for (
    let node = anchor.parentElement;
    node && node !== document.body;
    node = node.parentElement
  ) {
    const scrolls =
      node.scrollHeight > node.clientHeight ||
      node.scrollWidth > node.clientWidth;
    if (!scrolls) continue;

    clip = intersect(clip, node.getBoundingClientRect());
  }

  return (
    box.bottom > clip.top &&
    box.top < clip.bottom &&
    box.right > clip.left &&
    box.left < clip.right
  );
}

function intersect(a: DOMRect, b: DOMRect): DOMRect {
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);

  return new DOMRect(
    left,
    top,
    Math.max(0, Math.min(a.right, b.right) - left),
    Math.max(0, Math.min(a.bottom, b.bottom) - top),
  );
}
