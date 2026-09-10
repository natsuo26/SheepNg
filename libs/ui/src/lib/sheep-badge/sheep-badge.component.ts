import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import type {
  SheepBadgeEmphasis,
  SheepBadgeSize,
  SheepBadgeTone,
} from './sheep-badge.constants';

/** Sets a custom property, or takes it back off when the input is cleared. */
function setVar(style: CSSStyleDeclaration, name: string, value: unknown): void {
  const resolved = value == null || value === '' ? null : String(value);

  if (resolved === null) {
    style.removeProperty(name);
  } else {
    style.setProperty(name, resolved);
  }
}

/**
 * A small mark that carries a status, a count or a label.
 *
 * A badge shows; it does not do. There is nothing to click, nothing to focus
 * and no event to listen to — if it needs to be operable it is a
 * `sheep-chip`, not a badge.
 *
 * ```html
 * <sheep-badge tone="success" label="Passing" />
 * <sheep-badge tone="danger" emphasis="high" label="7 failed" />
 * <sheep-badge tone="warning" ariaLabel="Needs review">
 *   <svg sheepBadgeIcon>...</svg>
 * </sheep-badge>
 * ```
 *
 * Five tones, each in two weights — `normal`, a tint, and `high`, a fill. Both
 * are derived from one colour rather than picked separately, which is the
 * whole reason a caller can hand it a colour of its own and get a coherent
 * pair back.
 *
 * The label is an input, not a projected slot, and that is deliberate: what
 * the badge *is* depends on whether it has one. With a label it is a pill;
 * with an icon and no label it is a circle sized to the icon; with both it is
 * a pill with a leading icon. That decision has to be made from something
 * knowable, and projected DOM is not — it would mean measuring the rendered
 * content and re-laying the badge out afterwards.
 *
 * The icon is a slot, because it is the caller's markup:
 * `<svg sheepBadgeIcon>` or `<img sheepBadgeIcon>`. Leave it out and nothing
 * takes up the space.
 *
 * ## The one component in the library with a style API
 *
 * Everything else here consumes only what the theme emits, and publishes no
 * per-instance override hooks — see the note in CLAUDE.md. A badge is the
 * exception, on purpose and within a boundary: badges routinely paint data the
 * design system has never seen. A label colour a user picked, a per-tenant
 * brand, a category colour that came out of a database. There is no variant to
 * add to the spec for a colour that does not exist until runtime.
 *
 * So three custom properties are public API:
 *
 * | Property | What it sets |
 * | --- | --- |
 * | `--sheep-badge-color` | The hue. Both weights are derived from it. |
 * | `--sheep-badge-text` | The label colour, overriding what the hue implies. |
 * | `--sheep-badge-icon` | The icon colour. Defaults to the label colour. |
 *
 * The `color`, `textColor` and `iconColor` inputs are the same three knobs
 * from TypeScript — they write those properties onto the host and nothing
 * else. Set them from a stylesheet instead when the colour belongs to a
 * context rather than to one badge:
 *
 * ```css
 * .tenant-acme sheep-badge { --sheep-badge-color: #0f6fff; }
 * ```
 *
 * Note what is *not* here: no padding, no radius, no font, no border hooks.
 * Colour is the part that has to come from the data. Shape is still the
 * spec's, so two badges in one app cannot drift apart.
 */
@Component({
  selector: 'sheep-badge',
  imports: [],
  templateUrl: './sheep-badge.component.html',
  styleUrl: './sheep-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sheep-badge',
    '[class]': 'classes()',
    '[attr.role]': "ariaLabel() ? 'img' : null",
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class SheepBadgeComponent {
  /** Semantic colour. Defaults to `neutral` — a badge is not a warning light. */
  readonly tone = input<SheepBadgeTone>('neutral');

  /** `normal` tints, `high` fills. Defaults to `normal`. */
  readonly emphasis = input<SheepBadgeEmphasis>('normal');

  /** Badge size, on the `--sheep-badge-*` scale. Defaults to `md`. */
  readonly size = input<SheepBadgeSize>('md');

  /**
   * The text.
   *
   * Left empty, the badge is the icon and nothing else: a circle at the badge
   * height rather than a pill with a gap in it.
   */
  readonly label = input<string | number | null>(null);

  /**
   * The hue, as any CSS colour, replacing whatever `tone` would have supplied.
   *
   * Both weights are derived from it, so `emphasis` keeps working: `normal`
   * tints it, `high` fills with it, and the text colour is resolved against
   * the current theme either way. For a colour that belongs to a context
   * rather than to one badge, set `--sheep-badge-color` in CSS instead.
   */
  readonly color = input<string | null>(null);

  /** The label colour, overriding what the hue implies. */
  readonly textColor = input<string | null>(null);

  /** The icon colour. Follows the label colour when left alone. */
  readonly iconColor = input<string | null>(null);

  /**
   * Accessible name.
   *
   * A badge with a label already reads as its label. Set this when the badge
   * is an icon on its own, or when the label is a shorthand — `label="7"`
   * with `ariaLabel="7 failed checks"`.
   */
  readonly ariaLabel = input<string | null>(null);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly hasLabel = computed(() => {
    const label = this.label();
    return label !== null && label !== undefined && String(label).trim() !== '';
  });

  protected readonly classes = computed(
    () =>
      `sheep-badge--${this.tone()} sheep-badge--${this.emphasis()} ` +
      `sheep-badge--${this.size()}` +
      (this.hasLabel() ? '' : ' sheep-badge--icon-only'),
  );

  constructor() {
    // The three colour inputs are a way into the same custom properties a
    // stylesheet would set, so they are written as custom properties rather
    // than resolved into a class or an inline `background`. One mechanism,
    // two doors: a value set here and a value set in CSS behave identically,
    // and neither can reach anything but colour.
    effect(() => {
      const style = this.host.nativeElement.style;

      setVar(style, '--sheep-badge-color', this.color());
      setVar(style, '--sheep-badge-text', this.textColor());
      setVar(style, '--sheep-badge-icon', this.iconColor());
    });

    // Development only, and compiled out of production builds — see the note
    // on the same check in sheep-button.
    //
    // A badge with no label is an icon, and an icon says nothing to a screen
    // reader. That is invisible on screen and silent in tests, which is
    // exactly the kind of mistake worth spending a warning on.
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      effect(() => {
        if (this.hasLabel() || this.ariaLabel()) return;

        console.warn(
          'sheep-badge: no [label] and no [ariaLabel]. An icon-only badge ' +
            'has no text to fall back on, so it announces as nothing at ' +
            'all — give it [ariaLabel]. See:',
          this.host.nativeElement,
        );
      });
    }
  }
}
