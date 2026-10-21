import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { SheepNavBarComponent } from '../sheep-nav-bar.component';

/**
 * Three-state current-ness.
 *
 * `null` — the default — is not "inactive": it is "this item does not decide",
 * which is the truth for an item the router's `routerLinkActive` is marking.
 * Leaving the attribute alone is what lets the router own it.
 */
function activeAttribute(
  value: boolean | string | null | undefined,
): boolean | null {
  return value === null || value === undefined ? null : booleanAttribute(value);
}

/**
 * One destination in a `sheep-nav-bar`.
 *
 * Written on a real `<a>` or `<button>` rather than wrapping one, the same
 * choice `sheep-chip` makes: the link is focusable, opens in a new tab on a
 * middle click and announces itself as a link without this library
 * reimplementing any of it.
 *
 * ```html
 * <!-- With the router: routerLinkActive writes aria-current, the item paints it. -->
 * <a sheep-nav-bar-item routerLink="/inbox" routerLinkActive ariaCurrentWhenActive="page">
 *   <svg sheepNavBarItemStart ...></svg>
 *   Inbox
 *   <sheep-badge sheepNavBarItemEnd size="sm" label="4" />
 * </a>
 *
 * <!-- Without it: say which one is current yourself. -->
 * <button sheep-nav-bar-item [active]="view() === 'board'" (click)="view.set('board')">
 *   Board
 * </button>
 * ```
 *
 * Current-ness is `aria-current` and nothing else — `page` on a link, `true`
 * on a button. Use either `routerLinkActive` or `[active]` on an item, never
 * both: they write the same attribute.
 *
 * Its size is the bar's, read from the bar it is written into, so one bar
 * cannot mix item sizes.
 *
 * Deliberately NOT themeable per instance. Every colour and metric comes from
 * the `--sheep-*` theme layer.
 */
@Component({
  // Attribute-only on purpose: a destination is a link or a button, and an
  // element form would be neither — unfocusable and announced as nothing.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'a[sheep-nav-bar-item], button[sheep-nav-bar-item]',
  imports: [],
  templateUrl: './sheep-nav-bar-item.component.html',
  styleUrl: './sheep-nav-bar-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sheep-nav-bar-item',
    '[class]': 'classes()',
    '[attr.aria-current]': 'ariaCurrent()',
    '[attr.aria-disabled]': "disabled() && !isButton ? 'true' : null",
    '[attr.tabindex]': "disabled() && !isButton ? '-1' : null",
    '[attr.disabled]': "disabled() && isButton ? '' : null",
  },
})
export class SheepNavBarItemComponent {
  /**
   * Whether this is the current destination, or `null` to leave that to the
   * router.
   *
   * Bound, it writes `aria-current`. Left alone, nothing is written, so
   * `routerLinkActive` with `ariaCurrentWhenActive="page"` is free to.
   */
  readonly active = input<boolean | null, boolean | string | null | undefined>(
    null,
    { transform: activeAttribute },
  );

  /**
   * Greys the item out and takes it out of reach — a destination that exists
   * but is not open yet.
   *
   * On a button it is the native `disabled`. A link has no native equivalent,
   * so it is `aria-disabled`, out of the tab order and deaf to the pointer.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * The bar this item was written into, for its size.
   *
   * Optional so that an item rendered outside a bar degrades to a medium one
   * rather than throwing.
   */
  private readonly bar = inject(SheepNavBarComponent, { optional: true });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The host tag cannot change after creation, so this resolves once. */
  protected readonly isButton = this.host.nativeElement.tagName === 'BUTTON';

  /** A link is the page you are on; a button is the view you are in. */
  protected readonly ariaCurrent = computed(() => {
    if (!this.active()) return null;
    return this.isButton ? 'true' : 'page';
  });

  protected readonly classes = computed(
    () =>
      `sheep-nav-bar-item--${this.bar?.size() ?? 'md'}` +
      (this.disabled() ? ' sheep-nav-bar-item--disabled' : ''),
  );
}
