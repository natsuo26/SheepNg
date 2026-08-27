import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  input,
  viewChild,
} from '@angular/core';

/**
 * Visual weight.
 *
 * `outline` is the default and the library's signature: an accent line on a
 * transparent ground. `solid` is reserved for the one most important action in
 * a view — the spec does not flood large areas with a tone.
 */
export type SheepButtonVariant =
  | 'outline'
  | 'solid'
  | 'soft'
  | 'ghost'
  | 'link';

/** Semantic colour, resolved from the theme's tone stops. */
export type SheepButtonTone =
  | 'primary'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger';

/** Control size. Shared with every other control in the library. */
export type SheepButtonSize = 'sm' | 'md' | 'lg';

/** Corner treatment. `square` is the icon-only 1:1 box. */
export type SheepButtonShape = 'rounded' | 'square';

/** Native `type` of the underlying `<button>`. */
export type SheepButtonType = 'button' | 'submit' | 'reset';

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

  /** Moves focus to the underlying native button. */
  focus(options?: FocusOptions): void {
    this.buttonRef().nativeElement.focus(options);
  }
}
