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
  SheepInputSize,
  SheepInputType,
  SheepInputVariant,
} from './sheep-input.constants';
import {
  SheepInputFeatures,
  type SheepFieldError,
  type SheepInputAction,
  type SheepInputAttrs,
  type SheepInputState,
} from './sheep-input.feature';
import { SHEEP_INPUT_MESSAGES } from './sheep-input.messages';

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
 * <sheep-input [(value)]="name">
 *   <span sheepInputLabel>Display name</span>
 *   <span sheepInputHint>Shown on your profile.</span>
 * </sheep-input>
 * ```
 *
 * It implements signal forms' `FormValueControl<string>`, so `[formField]`
 * binds it end to end — value, errors, disabled, readonly, touched, and the
 * `required` / `minLength` / `maxLength` / `pattern` constraints, which reach
 * the native input as real attributes:
 *
 * ```html
 * <sheep-input [formField]="f.email"><span sheepInputLabel>Email</span></sheep-input>
 * ```
 *
 * Everything past a value and a label is a directive on the host element —
 * `sheepPassword`, `sheepEmail`, `sheepNumber`, `sheepCounter`, `sheepValidate` — so a plain
 * field carries none of their weight. See `SheepInputFeature`.
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
  selector: 'sheep-input',
  imports: [],
  templateUrl: './sheep-input.component.html',
  styleUrl: './sheep-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SheepInputFeatures],
  host: {
    class: 'sheep-input',
    '[class]': 'classes()',
  },
})
export class SheepInputComponent implements FormValueControl<string> {
  // --- appearance ----------------------------------------------------------

  /** Visual weight. Defaults to `underline`. */
  readonly variant = input<SheepInputVariant>('underline');

  /** Control size. Defaults to `md`. */
  readonly size = input<SheepInputSize>('md');

  /**
   * Native input type. Defaults to `text`.
   *
   * A feature directive that owns a type — `sheepPassword`, `sheepEmail`,
   * `sheepNumber` —
   * sets it itself and overrides this.
   */
  readonly type = input<SheepInputType>('text');

  // --- content -------------------------------------------------------------

  /** Placeholder text. Not a label: it disappears the moment typing starts. */
  readonly placeholder = input<string | null>(null);

  /** Native `autocomplete` token. Worth setting on every real form field. */
  readonly autocomplete = input<string | null>(null);

  /** Accessible name. Required when no `sheepInputLabel` is projected. */
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
  private readonly features = inject(SheepInputFeatures).all;
  private readonly messages = inject(SHEEP_INPUT_MESSAGES);

  private readonly inputRef =
    viewChild.required<ElementRef<HTMLInputElement>>('input');

  /**
   * Ids for the label / hint / error wiring.
   *
   * Generated rather than required from the caller: the association between
   * the three is the component's job, not the call site's.
   */
  private readonly uid = `sheep-input-${++nextId}`;
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
  private readonly state = computed<SheepInputState>(() => ({
    value: this.value(),
    maxLength: this.maxLength(),
    inert: this.isInert(),
  }));

  /** Feature attributes merged over the component's own `type`. */
  private readonly attrs = computed<SheepInputAttrs>(() => {
    const state = this.state();
    return this.features()
      .map((feature) => feature.attrs?.(state))
      .reduce<SheepInputAttrs>(
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
  protected readonly actions = computed<readonly SheepInputAction[]>(() => {
    const state = this.state();
    return this.features()
      .map((feature) => feature.action?.(state))
      .filter((action): action is SheepInputAction => !!action);
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
      `sheep-input--${this.variant()} sheep-input--${this.size()}` +
      (this.isFloating() ? ' sheep-input--floated' : '') +
      (this.showErrors() ? ' sheep-input--errored' : '') +
      (this.disabled() ? ' sheep-input--disabled' : '') +
      (this.readonly() ? ' sheep-input--readonly' : ''),
  );

  // --- events --------------------------------------------------------------

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }

  /**
   * Puts an insertion to every feature that filters, before the browser
   * applies it.
   *
   * The value the insertion would leave is worked out here — the selection
   * replaced by the inserted text — so a feature answers about a whole value
   * and never has to reason about carets. An insertion with no `data` (some
   * drag-and-drop paths) is let through; `validate` still sees the result.
   */
  protected onBeforeInput(event: Event): void {
    const { inputType, data } = event as InputEvent;
    if (!inputType?.startsWith('insert') || data == null) return;

    const filters = this.features().filter((feature) => feature.accept);
    if (filters.length === 0) return;

    const input = event.target as HTMLInputElement;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const next = input.value.slice(0, start) + data + input.value.slice(end);
    const state = this.state();

    if (filters.some((feature) => !feature.accept?.(next, state))) {
      event.preventDefault();
    }
  }

  /** Arrow Up / Arrow Down, offered to the features that step. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    if (this.isInert()) return;

    const direction = event.key === 'ArrowUp' ? 1 : -1;
    const state = this.state();

    for (const feature of this.features()) {
      const next = feature.stepValue?.(direction, state);
      if (next != null) {
        event.preventDefault();
        this.value.set(next);
        return;
      }
    }
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
