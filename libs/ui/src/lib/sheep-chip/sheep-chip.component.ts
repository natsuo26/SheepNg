import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import type {
  SheepChipSize,
  SheepChipTone,
  SheepChipVariant,
} from './sheep-chip.constants';

let nextId = 0;

/** Host tags that are interactive in their own right. */
const INTERACTIVE_HOSTS = new Set(['A', 'BUTTON']);

/**
 * Three-state selection.
 *
 * `null` — the default — is not "unselected": it is "this chip has no
 * selection state at all", which is the truth for an action chip and for a
 * chip that is only there to be read. Only a chip the caller has actually
 * bound a selection to announces one.
 */
function selectionAttribute(
  value: boolean | string | null | undefined,
): boolean | null {
  return value === null || value === undefined ? null : booleanAttribute(value);
}

/**
 * A compact, labelled control: a filter, an option, an entered value, or a tag
 * that is only there to be read.
 *
 * Which of those a chip *is* comes from the element it is written on, not from
 * a mode input — the same choice `sheep-list-item` makes, and for the same
 * reason: a real button is keyboard-operable, focusable and announced without
 * this library reimplementing any of it.
 *
 * ```html
 * <!-- Filter chip: a toggle. `selected` makes it one. -->
 * <button sheep-chip [selected]="showArchived()" (click)="toggleArchived()">
 *   Archived
 * </button>
 *
 * <!-- Action chip: a button with no selection state. -->
 * <button sheep-chip (click)="addLabel()">Add label</button>
 *
 * <!-- Link chip. -->
 * <a sheep-chip routerLink="/tags/design" [selected]="isCurrent()">Design</a>
 *
 * <!-- Input chip: a value the user entered and can take back out. -->
 * <sheep-chip removable removeLabel="Remove design" (removed)="drop('design')">
 *   design
 * </sheep-chip>
 *
 * <!-- Read-only tag. -->
 * <sheep-chip variant="soft" tone="success">Passing</sheep-chip>
 * ```
 *
 * `selected` is deliberately three-state. Left alone it is `null` and the chip
 * claims no selection; bound, it becomes `aria-pressed` on a button host and
 * `aria-current` on a link. So an action chip is never announced as an
 * unpressed toggle, which is what a plain boolean default would have made it.
 *
 * `removable` renders a second, separate button for the dismiss control. It is
 * only valid on the plain `<sheep-chip>` host, because a button inside a
 * button is invalid HTML and unreachable for most assistive technology — a
 * dev-mode check below says so out loud. The remove button names itself from
 * the chip's own label, so a set of them does not announce as six identical
 * "Remove"s.
 *
 * Chips that belong together belong in a `sheep-chip-set`, which is what makes
 * a row of toggles announce as one group.
 *
 * Deliberately NOT themeable per instance. Every colour and metric comes from
 * the `--sheep-*` theme layer, so two chips in one app cannot drift apart. To
 * change how chips look, change the theme.
 */
@Component({
  selector: 'sheep-chip, button[sheep-chip], a[sheep-chip]',
  imports: [],
  templateUrl: './sheep-chip.component.html',
  styleUrl: './sheep-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sheep-chip',
    '[class]': 'classes()',
    '[attr.aria-pressed]': 'ariaPressed()',
    '[attr.aria-current]': 'ariaCurrent()',
    '[attr.aria-disabled]': "disabled() ? 'true' : null",
  },
})
export class SheepChipComponent {
  /** Visual weight. Defaults to `outline`. */
  readonly variant = input<SheepChipVariant>('outline');

  /** Semantic colour. Defaults to `primary`. */
  readonly tone = input<SheepChipTone>('primary');

  /** Control size. Defaults to `md`. */
  readonly size = input<SheepChipSize>('md');

  /**
   * Selection state, or `null` for a chip that has none.
   *
   * Bind it and the chip becomes a toggle: `aria-pressed` on a button host,
   * `aria-current` on a link. Leave it alone and nothing is announced.
   */
  readonly selected = input<
    boolean | null,
    boolean | string | null | undefined
  >(null, { transform: selectionAttribute });

  /**
   * Renders the trailing remove button.
   *
   * Plain `<sheep-chip>` hosts only — see the dev-mode check in the
   * constructor.
   */
  readonly removable = input(false, { transform: booleanAttribute });

  /**
   * Accessible name for the remove button.
   *
   * Left null it names itself "Remove" plus the chip's own label, which is
   * what keeps a row of removable chips distinguishable. Set it when the label
   * alone does not read as an object — "Remove filter: last 7 days".
   */
  readonly removeLabel = input<string | null>(null);

  /**
   * Greys the chip out and blocks pointer interaction.
   *
   * On a `button[sheep-chip]` prefer the native `disabled` attribute — it is
   * the real thing, it takes the chip out of the tab order, and it is styled
   * identically here. This input is for the plain `<sheep-chip>` host, where
   * there is no native attribute to reach for and where it also disables the
   * remove button.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** The remove button was pressed. The chip does not remove itself. */
  readonly removed = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The host tag cannot change after creation, so this resolves once. */
  private readonly hostTag = this.host.nativeElement.tagName;

  private readonly uid = `sheep-chip-${++nextId}`;
  protected readonly labelId = `${this.uid}-label`;
  protected readonly removeTextId = `${this.uid}-remove`;

  /** "Remove", then the chip's own label — "Remove, design". */
  protected readonly removeLabelledBy = `${this.removeTextId} ${this.labelId}`;

  /** A pressed state belongs to a button, and only to a bound one. */
  protected readonly ariaPressed = computed(() => {
    if (this.hostTag !== 'BUTTON' || this.selected() === null) return null;
    return this.selected() ? 'true' : 'false';
  });

  /** A link is not pressed; it is where you are. */
  protected readonly ariaCurrent = computed(() =>
    this.hostTag === 'A' && this.selected() ? 'true' : null,
  );

  protected readonly classes = computed(
    () =>
      `sheep-chip--${this.variant()} sheep-chip--${this.tone()} ` +
      `sheep-chip--${this.size()}` +
      (this.selected() ? ' sheep-chip--selected' : '') +
      (this.removable() ? ' sheep-chip--removable' : '') +
      (this.disabled() ? ' sheep-chip--disabled' : ''),
  );

  constructor() {
    // Development only, and compiled out of production builds: `ngDevMode` is
    // a global the Angular compiler folds to false when optimising, so the
    // whole block — closure, message and all — is dropped rather than shipped
    // and skipped.
    //
    // Both checks are for mistakes that look entirely fine on screen and fail
    // only for someone on a keyboard or a screen reader — exactly the kind
    // that survives a review. In an effect rather than inline, because a
    // template binding has not reached the inputs yet while this constructor
    // runs.
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      const interactive = INTERACTIVE_HOSTS.has(this.hostTag);

      effect(() => {
        if (this.removable() && interactive) {
          console.warn(
            `sheep-chip: [removable] on a <${this.hostTag.toLowerCase()} ` +
              'sheep-chip>. A button nested in a button or a link is invalid ' +
              'HTML and unreachable for most assistive technology. Put ' +
              '[removable] on a plain <sheep-chip> instead. See:',
            this.host.nativeElement,
          );
        }

        if (this.selected() !== null && !interactive) {
          console.warn(
            'sheep-chip: [selected] on a plain <sheep-chip>, which nothing ' +
              'can operate. A chip that can be selected is a control — write ' +
              'it as <button sheep-chip [selected]="..."> so it is focusable ' +
              'and announces its state. See:',
            this.host.nativeElement,
          );
        }
      });
    }
  }

  /** Moves focus to the chip, when the chip is something that can take it. */
  focus(options?: FocusOptions): void {
    this.host.nativeElement.focus(options);
  }

  /**
   * The dismiss control was pressed.
   *
   * The event is stopped here: a removable chip often sits inside something
   * clickable of its own, and "take this one out" is not "open this one".
   */
  protected onRemove(event: Event): void {
    event.stopPropagation();
    this.removed.emit();
  }
}
