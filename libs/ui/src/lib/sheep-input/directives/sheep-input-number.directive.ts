import { Directive, inject, input, numberAttribute } from '@angular/core';
import {
  SheepInputFeatures,
  type SheepFieldError,
  type SheepInputAttrs,
  type SheepInputFeature,
  type SheepInputState,
} from '../sheep-input.feature';

/** A finished number: optional minus, digits, optional fraction. */
const NUMBER = /^-?(?:\d+(?:\.\d*)?|\.\d+)$/;

const NUMBER_ERROR: readonly SheepFieldError[] = [{ kind: 'number' }];
const MIN_ERROR: readonly SheepFieldError[] = [{ kind: 'min' }];
const MAX_ERROR: readonly SheepFieldError[] = [{ kind: 'max' }];
const STEP_ERROR: readonly SheepFieldError[] = [{ kind: 'step' }];

/** An optional numeric input: absent stays `undefined`, not `NaN`. */
function optionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = numberAttribute(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/** Digits after the point, so stepping 0.1 + 0.2 prints 0.3. */
function decimals(value: number): number {
  const text = String(value);
  if (text.includes('e-')) return Number(text.split('e-')[1]);
  return text.split('.')[1]?.length ?? 0;
}

/**
 * Turns the field into a number field: the keyboard, the filter, the arrows
 * and the check.
 *
 * ```html
 * <sheep-input sheepNumber min="0" max="120" [(value)]="age">
 *   <span sheepInputLabel>Age</span>
 * </sheep-input>
 *
 * <sheep-input sheepNumber min="0" step="0.01" [(value)]="price">
 *   <span sheepInputLabel>Price</span>
 *   <span sheepInputPrefix>$</span>
 * </sheep-input>
 * ```
 *
 * The `<input>` stays `type="text"`. Native `type="number"` is the thing this
 * is built to avoid: a mouse wheel over a focused field changes the value
 * while the user means to scroll the page, `e` and `+` are accepted, and
 * input the browser cannot parse reads back as an empty string, so a typo
 * looks like a blank field to the form.
 *
 * What it does instead:
 *
 * - **Keyboard.** A number pad on a phone — `numeric` for whole numbers,
 *   `decimal` when `step` allows a fraction. When `min` allows a negative, the
 *   full keyboard is kept, because the phone number pads have no minus key;
 *   set `min="0"` to get the pad.
 * - **Filter.** A keystroke or paste that could not become a number is
 *   refused: letters, a second point, a minus that is not first or that `min`
 *   rules out, a point when `step` is whole.
 * - **Arrows.** Arrow Up and Down add and take away `step` (1 by default),
 *   held within `min` and `max`.
 * - **Check.** `number`, `min`, `max` and `step` errors, shown once the field
 *   is touched, worded by the message table. An empty value is not an error;
 *   that is `required`'s question.
 *
 * The value stays a string, the same as every other field, so `"007"` and
 * `"1.50"` survive as typed. Convert at the edge — `Number(value)` where the
 * value is used — and keep in mind that `""` is "nothing entered", not zero.
 *
 * The point is always `.`. Fields that must accept a locale's decimal comma
 * are not covered.
 *
 * **Who owns validity.** As with `sheepEmail`: the errors raised here are
 * the field's, and a signal form cannot see them. On a form-bound field, put
 * `min()` / `max()` in the schema too.
 */
@Directive({
  selector: 'sheep-input[sheepNumber]',
})
export class SheepInputNumberDirective implements SheepInputFeature {
  /** Smallest allowed value. Also decides whether a minus can be typed. */
  readonly min = input(undefined, { transform: optionalNumber });

  /** Largest allowed value. */
  readonly max = input(undefined, { transform: optionalNumber });

  /**
   * The arrow keys' increment, and the grid a value must sit on, counted from
   * `min` (or from zero). Left unset, the arrows move by 1 and any number is
   * allowed, fractions included.
   */
  readonly step = input(undefined, {
    transform: (value: unknown) => {
      const step = optionalNumber(value);
      return step !== undefined && step > 0 ? step : undefined;
    },
  });

  /** A minus can be typed unless `min` rules negatives out. */
  private negativesAllowed(): boolean {
    const min = this.min();
    return min === undefined || min < 0;
  }

  /** A point can be typed unless `step` is a whole number. */
  private fractionsAllowed(): boolean {
    const step = this.step();
    return step === undefined || !Number.isInteger(step);
  }

  readonly attrs = (): SheepInputAttrs => ({
    type: 'text',
    // No inputmode at all while a minus is reachable: both phone number pads
    // lack the key, and a field that cannot take its own valid values is
    // worse than a full keyboard.
    ...(this.negativesAllowed()
      ? {}
      : { inputmode: this.fractionsAllowed() ? 'decimal' : 'numeric' }),
    autocapitalize: 'none',
    autocorrect: 'off',
    spellcheck: false,
  });

  readonly accept = (next: string): boolean => {
    const minus = this.negativesAllowed() ? '-?' : '';
    const fraction = this.fractionsAllowed() ? '(?:\\.\\d*)?' : '';
    // Anything that could still become a number: "", "-", "1.", ".5".
    return new RegExp(`^${minus}\\d*${fraction}$`).test(next);
  };

  readonly validate = ({
    value,
  }: SheepInputState): readonly SheepFieldError[] | null => {
    if (value === '') return null;
    if (!NUMBER.test(value)) return NUMBER_ERROR;

    const number = Number(value);
    const min = this.min();
    const max = this.max();
    const step = this.step();

    if (min !== undefined && number < min) return MIN_ERROR;
    if (max !== undefined && number > max) return MAX_ERROR;

    if (step !== undefined) {
      const steps = (number - (min ?? 0)) / step;
      // Tolerance, because 0.3 / 0.1 is 2.9999999999999996.
      if (Math.abs(steps - Math.round(steps)) > 1e-9) return STEP_ERROR;
    }

    return null;
  };

  readonly stepValue = (
    direction: 1 | -1,
    { value }: SheepInputState,
  ): string | null => {
    if (value !== '' && !NUMBER.test(value)) return null;

    const min = this.min();
    const max = this.max();
    const step = this.step() ?? 1;

    // From empty, the first press lands on the nearest allowed value to zero.
    const next =
      value === '' ? Math.max(min ?? 0, Math.min(max ?? 0, 0)) : Number(value) + direction * step;

    let clamped = next;
    if (min !== undefined) clamped = Math.max(min, clamped);
    if (max !== undefined) clamped = Math.min(max, clamped);

    const places = Math.max(
      decimals(step),
      decimals(min ?? 0),
      value === '' ? 0 : decimals(Number(value)),
    );
    return String(Number(clamped.toFixed(places)));
  };

  constructor() {
    inject(SheepInputFeatures).add(this);
  }
}
