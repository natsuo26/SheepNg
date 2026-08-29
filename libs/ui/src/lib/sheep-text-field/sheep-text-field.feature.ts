import { Injectable, signal } from '@angular/core';
import type { SheepTextFieldType } from './sheep-text-field.constants';

/**
 * The seam every extra piece of text-field behaviour arrives through.
 *
 * The field itself is a value, a box and a label. Everything beyond that —
 * masking a password, validating an address, counting characters — is a
 * directive on the host element that contributes through this contract:
 *
 * ```html
 * <sheep-text-field sheepPassword sheepCounter [sheepValidate]="notReserved">
 * ```
 *
 * Each hook is a plain function of the field's current state, not a signal the
 * feature has to keep in sync. The field calls them inside its own `computed`s,
 * so a signal the feature reads on the way through — its own `revealed` flag,
 * an input, a store — is tracked exactly as if the field had read it directly.
 * A feature therefore never pushes: it answers.
 */
export interface SheepTextFieldFeature {
  /**
   * Native attributes to put on the `<input>`.
   *
   * Merged in registration order over the field's own `type`, so the last
   * feature to name a key wins. Set only what the feature is actually about:
   * `sheepEmail` sets the type and the keyboard hints, and nothing else.
   */
  readonly attrs?: (ctx: SheepTextFieldState) => SheepTextFieldAttrs;

  /**
   * Errors for the current value, or `null` when there is nothing to say.
   *
   * Runs on every value change. It is display-only: see the note on
   * `SheepTextFieldValidateDirective` about who owns validity when a signal
   * form is bound to the field.
   */
  readonly validate?: (
    ctx: SheepTextFieldState,
  ) => readonly SheepFieldError[] | null;

  /** A button rendered at the trailing edge, inside the box. */
  readonly action?: (ctx: SheepTextFieldState) => SheepTextFieldAction | null;

  /** Text rendered at the trailing end of the footer row, beside the hint. */
  readonly status?: (ctx: SheepTextFieldState) => string | null;
}

/** The field state a feature is handed on every call. */
export interface SheepTextFieldState {
  /** The current value, as the user has typed it. */
  readonly value: string;
  /** The field's `maxLength`, whether set directly or bound by a form. */
  readonly maxLength: number | undefined;
  /** True while the field cannot be edited, for either reason. */
  readonly inert: boolean;
}

/**
 * Native `<input>` attributes a feature may set.
 *
 * Deliberately not `Partial<HTMLInputElement>`: a feature adjusts how the
 * platform should treat the text being typed, and nothing else. Value,
 * validity and disabled state stay the field's.
 */
export interface SheepTextFieldAttrs {
  readonly type?: SheepTextFieldType;
  readonly inputmode?: string;
  readonly autocapitalize?: string;
  readonly autocorrect?: string;
  readonly spellcheck?: boolean;
}

/**
 * A button a feature renders inside the box, after the value.
 *
 * The icon is given as raw `d` geometry on a 24×24 grid rather than a name, so
 * the library needs no icon registry and a feature is free to draw whatever it
 * means. The field paints it in `currentColor` at the control's icon size.
 */
export interface SheepTextFieldAction {
  /** Accessible name. The button has no text. */
  readonly label: string;
  /** `d` attributes, stroked on a 24×24 viewBox. */
  readonly icon: readonly string[];
  /** Toggle state, mapped to `aria-pressed`. Omit for a plain action. */
  readonly pressed?: boolean;
  /** Invoked on click. Focus returns to the input afterwards. */
  readonly run: () => void;
}

/**
 * An error the field can render.
 *
 * Structurally the same shape signal forms' `ValidationError` carries, so the
 * errors a bound form hands over and the ones a directive raises here are one
 * list by the time they reach the message resolver.
 */
export interface SheepFieldError {
  /** Identifies the kind of error — the key messages are looked up under. */
  readonly kind: string;
  /** Human-readable text. Wins over the message table when present. */
  readonly message?: string;
}

/**
 * The registry a field keeps of the features declared on it.
 *
 * Provided by `SheepTextFieldComponent`, so a feature directive depends on
 * this and never on the component: the field reads the registry, the
 * directives write to it, and neither imports the other. Features are declared
 * on the host element, so they live and die with the field and there is
 * nothing to unregister.
 */
@Injectable()
export class SheepTextFieldFeatures {
  private readonly registered = signal<readonly SheepTextFieldFeature[]>([]);

  /** Registration order, which is also the order attributes merge in. */
  readonly all = this.registered.asReadonly();

  /** Called by a feature directive from its constructor. */
  add(feature: SheepTextFieldFeature): void {
    this.registered.update((features) => [...features, feature]);
  }
}
