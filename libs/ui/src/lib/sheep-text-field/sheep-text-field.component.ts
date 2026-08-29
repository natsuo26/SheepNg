import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';
import type {
  SheepTextFieldSize,
  SheepTextFieldType,
  SheepTextFieldVariant,
} from './sheep-text-field.constants';
import {
  SheepTextFieldFeatures,
  type SheepFieldError,
  type SheepTextFieldAction,
  type SheepTextFieldAttrs,
  type SheepTextFieldState,
} from './sheep-text-field.feature';
import { SHEEP_TEXT_FIELD_MESSAGES } from './sheep-text-field.messages';

/** Distinguishes one field's generated ids from the next one's. */
let nextId = 0;

/**
 * A single-line text input.
 *
 * Renders a real `<input>`, so typing, selection, autofill, IME composition
 * and the password manager are the platform's rather than a reimplementation.
 * The component owns the label, the hint, the error line and the box around
 * them, and wires the `id` / `aria-describedby` / `aria-invalid` between them:
 *
 * ```html
 * <sheep-text-field [(value)]="name">
 *   <span sheepTextFieldLabel>Display name</span>
 *   <span sheepTextFieldHint>Shown on your profile.</span>
 * </sheep-text-field>
 * ```
 *
 * It implements signal forms' `FormValueControl<string>`, so `[formField]`
 * binds it end to end — value, errors, disabled, readonly, touched, and the
 * `required` / `minLength` / `maxLength` / `pattern` constraints, which reach
 * the native input as real attributes:
 *
 * ```html
 * <sheep-text-field [formField]="f.email"><span sheepTextFieldLabel>Email</span></sheep-text-field>
 * ```
 *
 * Everything past a value and a label is a directive on the host element —
 * `sheepPassword`, `sheepEmail`, `sheepCounter`, `sheepValidate` — so a plain
 * field carries none of their weight. See `SheepTextFieldFeature`.
 *
 * The field is a rule, not a box: one hairline under the value, with empty
 * space doing the framing. Its label floats — resting inside the box in place
 * of a placeholder, lifting to the row above on focus or once there is a
 * value, without the box moving.
 *
 * Deliberately NOT themeable per instance. Every colour and metric comes from
 * the `--sheep-*` theme layer, and the two appearance inputs pick between
 * spec'd looks rather than opening one up.
 */
@Component({
  selector: 'sheep-text-field',
  imports: [],
  templateUrl: './sheep-text-field.component.html',
  styleUrl: './sheep-text-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SheepTextFieldFeatures],
  host: {
    class: 'sheep-text-field',
    '[class]': 'classes()',
  },
})
export class SheepTextFieldComponent implements FormValueControl<string> {
  // --- appearance ----------------------------------------------------------

  /** Visual weight. Defaults to `underline`. */
  readonly variant = input<SheepTextFieldVariant>('underline');

  /** Control size. Defaults to `md`. */
  readonly size = input<SheepTextFieldSize>('md');

  /**
   * Native input type. Defaults to `text`.
   *
   * A feature directive that owns a type — `sheepPassword`, `sheepEmail` —
   * sets it itself and overrides this.
   */
  readonly type = input<SheepTextFieldType>('text');

  // --- content -------------------------------------------------------------

  /** Placeholder text. Not a label: it disappears the moment typing starts. */
  readonly placeholder = input<string | null>(null);

  /** Native `autocomplete` token. Worth setting on every real form field. */
  readonly autocomplete = input<string | null>(null);

  /** Accessible name. Required when no `sheepTextFieldLabel` is projected. */
  readonly ariaLabel = input<string | null>(null);

  // --- the signal-forms control contract -----------------------------------

  /**
   * The value. Two-way on its own, and bound by `[formField]` when a form owns
   * the field.
   */
  readonly value = model('');

  /**
   * Errors to render under the field.
   *
   * Filled automatically from the bound field's own errors under
   * `[formField]`. Set it directly to surface errors a form never saw — the
   * ones a server sent back — and set `touched` alongside it, since that is
   * what decides whether an error is shown yet.
   */
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);

  /** Blocks editing and focus, and dims the field. Bare attribute allowed. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Blocks editing but keeps the value selectable and focusable. */
  readonly readonly = input(false, { transform: booleanAttribute });

  /** Marks the field invalid without supplying an error to render. */
  readonly invalid = input(false, { transform: booleanAttribute });

  /** Shows a spinner while an async validator is in flight. */
  readonly pending = input(false, { transform: booleanAttribute });

  /**
   * Whether the user is done with the field — the gate on showing errors.
   *
   * Bound by signal forms, which also sets it on every field at `submit()`.
   * The field raises its own on blur too, so it behaves the same standalone.
   */
  readonly touched = input(false, { transform: booleanAttribute });

  /**
   * Native `name`, for autofill and for a plain HTML submission.
   *
   * Empty means no attribute at all rather than `name=""`, which browsers
   * treat as a real, nameless field.
   */
  readonly name = input('');

  /** Marks the field required, natively and with an asterisk on the label. */
  readonly required = input(false, { transform: booleanAttribute });

  /** Native `minlength`. */
  readonly minLength = input(undefined, {
    transform: (value: unknown) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });

  /** Native `maxlength`, and the denominator `sheepCounter` counts against. */
  readonly maxLength = input(undefined, {
    transform: (value: unknown) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });

  /** Native `pattern`. Signal forms passes every pattern rule on the field. */
  readonly pattern = input<readonly RegExp[]>([]);

  /**
   * Emitted when focus leaves the field.
   *
   * Signal forms listens to this to mark the bound field touched, which is
   * what blur-scoped rules such as `debounce('blur')` are keyed on.
   */
  readonly touch = output<void>();

  // --- internals -----------------------------------------------------------

  /** The features declared on this element, in the order they were written. */
  private readonly features = inject(SheepTextFieldFeatures).all;
  private readonly messages = inject(SHEEP_TEXT_FIELD_MESSAGES);

  private readonly inputRef =
    viewChild.required<ElementRef<HTMLInputElement>>('input');

  /**
   * Ids for the label / hint / error wiring.
   *
   * Generated rather than required from the caller: the association between
   * the three is the component's job, not the call site's.
   */
  private readonly uid = `sheep-text-field-${++nextId}`;
  protected readonly inputId = `${this.uid}-input`;
  protected readonly hintId = `${this.uid}-hint`;
  protected readonly errorId = `${this.uid}-error`;

  /** Blur seen by this field, so a standalone field gates errors too. */
  private readonly blurred = signal(false);

  /** Focus, tracked here rather than left to `:focus-within` — see below. */
  private readonly focused = signal(false);

  /** True once errors are worth showing — from either side of `touched`. */
  protected readonly isTouched = computed(
    () => this.touched() || this.blurred(),
  );

  /** Not editable, for either reason. Features are told, so they can dim. */
  protected readonly isInert = computed(() => this.disabled() || this.readonly());

  /**
   * Whether the label sits up in its row rather than standing in for a
   * placeholder inside the box.
   *
   * Resolved here rather than in CSS. `:focus-within` and `:has()` could each
   * answer part of it, but spreading the condition across four selectors of
   * different specificity means the colour rules that key off the same states
   * — accent on focus, danger on error — have to win a specificity fight to
   * be seen. One class settles it, and the state is testable.
   *
   * A placeholder forces the float: the two would otherwise print on top of
   * each other, and the placeholder is the one the caller asked for.
   */
  protected readonly isFloating = computed(
    () => this.focused() || this.value() !== '' || !!this.placeholder(),
  );

  /** What every feature hook is handed. */
  private readonly state = computed<SheepTextFieldState>(() => ({
    value: this.value(),
    maxLength: this.maxLength(),
    inert: this.isInert(),
  }));

  /** Feature attributes merged over the component's own `type`. */
  private readonly attrs = computed<SheepTextFieldAttrs>(() => {
    const state = this.state();
    return this.features()
      .map((feature) => feature.attrs?.(state))
      .reduce<SheepTextFieldAttrs>(
        (merged, attrs) => (attrs ? { ...merged, ...attrs } : merged),
        {},
      );
  });

  protected readonly resolvedType = computed(
    () => this.attrs().type ?? this.type(),
  );

  protected readonly inputMode = computed(() => this.attrs().inputmode ?? null);
  protected readonly autoCapitalize = computed(
    () => this.attrs().autocapitalize ?? null,
  );
  protected readonly autoCorrect = computed(
    () => this.attrs().autocorrect ?? null,
  );
  protected readonly spellcheck = computed(() => {
    const value = this.attrs().spellcheck;
    return value === undefined ? null : String(value);
  });

  /**
   * Every error the field knows about: the ones handed to it, then the ones
   * its validator directives raise.
   */
  protected readonly allErrors = computed<readonly SheepFieldError[]>(() => {
    const state = this.state();
    const contributed = this.features().flatMap(
      (feature) => feature.validate?.(state) ?? [],
    );
    return [...this.errors(), ...contributed];
  });

  /**
   * The lines rendered under the field.
   *
   * An error with no `message` and no entry in the message table drops out
   * rather than rendering its `kind`: `minLength` is not a sentence, and a
   * field that reddens with nothing to say is a bug worth noticing.
   */
  protected readonly messagesToShow = computed(() =>
    this.allErrors()
      .map((error) => error.message ?? this.messages.errors[error.kind])
      .filter((message): message is string => !!message),
  );

  protected readonly isInvalid = computed(
    () => this.invalid() || this.allErrors().length > 0,
  );

  /** Errors are only shown once the user has left the field, or a form said so. */
  protected readonly showErrors = computed(
    () => this.isInvalid() && this.isTouched(),
  );

  /** Trailing buttons contributed by features, in registration order. */
  protected readonly actions = computed<readonly SheepTextFieldAction[]>(() => {
    const state = this.state();
    return this.features()
      .map((feature) => feature.action?.(state))
      .filter((action): action is SheepTextFieldAction => !!action);
  });

  /** Trailing footer text — the character counter, normally. */
  protected readonly status = computed(() => {
    const state = this.state();
    return (
      this.features()
        .map((feature) => feature.status?.(state))
        .find((text) => !!text) ?? null
    );
  });

  /** Only ever one pattern reaches the DOM; the rest are the form's business. */
  protected readonly nativePattern = computed(
    () => this.pattern()[0]?.source ?? null,
  );

  protected readonly describedBy = computed(() =>
    this.showErrors() ? this.errorId : this.hintId,
  );

  protected readonly classes = computed(
    () =>
      `sheep-text-field--${this.variant()} sheep-text-field--${this.size()}` +
      (this.isFloating() ? ' sheep-text-field--floated' : '') +
      (this.showErrors() ? ' sheep-text-field--errored' : '') +
      (this.disabled() ? ' sheep-text-field--disabled' : '') +
      (this.readonly() ? ' sheep-text-field--readonly' : ''),
  );

  // --- events --------------------------------------------------------------

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }

  protected onFocus(): void {
    this.focused.set(true);
  }

  protected onBlur(): void {
    this.focused.set(false);
    this.blurred.set(true);
    this.touch.emit();
  }

  // --- the rest of the control contract ------------------------------------

  /** Moves focus to the underlying native input. */
  focus(options?: FocusOptions): void {
    this.inputRef().nativeElement.focus(options);
  }

  /**
   * Returns the field to its pristine state.
   *
   * Clears only what this component owns — the blur it has seen, and so the
   * errors it was showing. The value belongs to whoever bound it.
   */
  reset(): void {
    this.blurred.set(false);
  }

}
