import { Directive, inject, input } from '@angular/core';
import {
  SheepInputFeatures,
  type SheepFieldError,
  type SheepInputFeature,
  type SheepInputState,
} from '../sheep-input.feature';

/**
 * A rule of the caller's own, run over the value on every keystroke.
 *
 * Return `null` when the value is fine, a string to say what is wrong, or
 * `SheepFieldError`s when the message belongs in the message table rather than
 * at the call site:
 *
 * ```ts
 * protected readonly notReserved = (value: string) =>
 *   RESERVED.has(value.toLowerCase()) ? 'That name is taken.' : null;
 * ```
 * ```html
 * <sheep-input [sheepValidate]="notReserved">
 * ```
 *
 * Whatever it returns is merged with the errors the field was handed, resolved
 * through the same message table, and gated behind the same `touched`, so a
 * hand-written rule and a schema rule look identical on screen.
 *
 * **Who owns validity.** The error is the *field's*, not a form's: a signal
 * form bound to this field will not see it and will still consider itself
 * valid. Use this on a field with no form behind it. On a form-bound field the
 * equivalent is `validate()` in the schema, which the form can actually act
 * on — see `SheepInputEmailDirective` for the same note.
 */
@Directive({
  selector: 'sheep-input[sheepValidate]',
})
export class SheepInputValidateDirective implements SheepInputFeature {
  /** The rule. Called with the raw value, including the empty string. */
  readonly validator = input.required<SheepFieldValidator>({
    alias: 'sheepValidate',
  });

  readonly validate = ({
    value,
  }: SheepInputState): readonly SheepFieldError[] | null => {
    const result = this.validator()(value);
    if (result === null || result === undefined) {
      return null;
    }
    if (typeof result === 'string') {
      return [{ kind: 'custom', message: result }];
    }
    return 'kind' in result ? [result] : result;
  };

  constructor() {
    inject(SheepInputFeatures).add(this);
  }
}

/**
 * A rule `sheepValidate` accepts.
 *
 * A string is the message, which is the case worth optimising for — a rule
 * written at one call site rarely needs a `kind` anyone will look up.
 */
export type SheepFieldValidator = (
  value: string,
) => string | SheepFieldError | readonly SheepFieldError[] | null | undefined;
