import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  input,
  viewChild,
} from '@angular/core';
import type {
  SheepButtonShape,
  SheepButtonSize,
  SheepButtonTone,
  SheepButtonType,
  SheepButtonVariant,
} from './sheep-button.constants';

/**
 * A styled button.
 *
 * Renders a native `<button>`, so keyboard, form submission and screen-reader
 * behaviour come for free. Content projects into three slots:
 *
 * ```html
 * <sheep-button tone="danger" variant="solid">
 *   <svg sheepButtonStart>...</svg>
 *   Delete project
 * </sheep-button>
 * ```
 *
 * `shape="square"` is the icon-only form: a 1:1 box at the control height,
 * which is the whole of what an icon button is. There is no separate
 * `sheep-icon-button`, and deliberately so — a second component would have to
 * re-expose these same variants, tones and sizes, and the two would drift.
 * An icon-only button carries no text, so it needs `ariaLabel` to have a name
 * at all; a dev-mode check below says so out loud when it is missing.
 *
 * Deliberately NOT themeable per instance. Every colour and metric comes from
 * the `--sheep-*` theme layer, so two buttons in one app cannot drift apart.
 * To change how buttons look, change the theme.
 */
@Component({
  selector: 'sheep-button',
  imports: [],
  templateUrl: './sheep-button.component.html',
  styleUrl: './sheep-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SheepButtonComponent {
  /** Visual weight. Defaults to `outline`. */
  readonly variant = input<SheepButtonVariant>('outline');

  /** Semantic colour. Defaults to `primary`. */
  readonly tone = input<SheepButtonTone>('primary');

  /** Control size. Defaults to `md`. */
  readonly size = input<SheepButtonSize>('md');

  /** Corner treatment. Use `square` for icon-only buttons. */
  readonly shape = input<SheepButtonShape>('rounded');

  /** Native button type. Defaults to `button` so it never submits by accident. */
  readonly type = input<SheepButtonType>('button');

  /** Disables the button. Supports the bare-attribute form. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Shows a spinner and blocks interaction while an action is in flight. */
  readonly loading = input(false, { transform: booleanAttribute });

  /** Accessible name. Required when the button renders an icon with no text. */
  readonly ariaLabel = input<string | null>(null);

  private readonly buttonRef =
    viewChild.required<ElementRef<HTMLButtonElement>>('button');

  /** Blocked while loading so an in-flight action cannot fire twice. */
  protected readonly isDisabled = computed(
    () => this.disabled() || this.loading(),
  );

  protected readonly classes = computed(
    () =>
      `sheep-button--${this.variant()} sheep-button--${this.tone()} ` +
      `sheep-button--${this.size()} sheep-button--${this.shape()}`,
  );

  constructor() {
    // Development only, and compiled out of production builds: `ngDevMode` is
    // a global the Angular compiler folds to false when optimising, so the
    // whole block — closure, message and all — is dropped rather than shipped
    // and skipped.
    //
    // An icon-only button has no text for a screen reader to fall back on, so
    // without `ariaLabel` it is announced as nothing but "button". That is
    // invisible on screen and silent in tests, which is exactly the kind of
    // mistake worth spending a warning on. Checked against the rendered
    // element rather than the inputs, because the label would come from
    // projected content this component never sees.
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      afterRenderEffect(() => {
        if (this.shape() !== 'square' || this.ariaLabel()) return;

        const button = this.buttonRef().nativeElement;
        const named =
          !!button.textContent?.trim() || button.hasAttribute('aria-labelledby');

        if (!named) {
          console.warn(
            'sheep-button: shape="square" with no accessible name. An ' +
              'icon-only button announces as just "button" — give it ' +
              '[ariaLabel]. See:',
            button,
          );
        }
      });
    }
  }

  /** Moves focus to the underlying native button. */
  focus(options?: FocusOptions): void {
    this.buttonRef().nativeElement.focus(options);
  }
}
