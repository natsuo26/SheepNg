import { Directive, inject } from '@angular/core';
import {
  SheepTextFieldFeatures,
  type SheepFieldError,
  type SheepTextFieldAttrs,
  type SheepTextFieldFeature,
  type SheepTextFieldState,
} from '../sheep-text-field.feature';

/**
 * Angular's own address pattern, so a field validated here and a field
 * validated by signal forms' `email()` agree on what an address is. Divergent
 * definitions of "valid email" between the control and the form is the whole
 * failure mode this borrows its way out of.
 */
const EMAIL =
  /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const EMAIL_ERROR: readonly SheepFieldError[] = [{ kind: 'email' }];

/**
 * Turns the field into an email field: the type, the keyboard, and the check.
 *
 * ```html
 * <sheep-text-field sheepEmail autocomplete="email">
 *   <span sheepTextFieldLabel>Work email</span>
 * </sheep-text-field>
 * ```
 *
 * Beyond `type="email"` it turns off the four things a phone keyboard does to
 * an address — capitalise it, autocorrect it, spellcheck it, and hide the `@`
 * behind a shift — which is most of why hand-rolled email fields are painful
 * on mobile.
 *
 * An empty value is not an error here; that is `required`'s question, and
 * answering it twice would show two messages for one blank field.
 *
 * **Who owns validity.** This raises an error the *field* renders. A signal
 * form cannot see it, so a form-bound field would show the message while the
 * form still considered itself valid. On a form-bound field, put `email()` in
 * the schema instead and drop this directive's validation half — reach for it
 * on a field with no form behind it, or one in a template-driven form. The
 * same applies to `sheepValidate`.
 */
@Directive({
  selector: 'sheep-text-field[sheepEmail]',
})
export class SheepTextFieldEmailDirective implements SheepTextFieldFeature {
  readonly attrs = (): SheepTextFieldAttrs => ({
    type: 'email',
    inputmode: 'email',
    autocapitalize: 'none',
    autocorrect: 'off',
    spellcheck: false,
  });

  readonly validate = ({
    value,
  }: SheepTextFieldState): readonly SheepFieldError[] | null =>
    value === '' || EMAIL.test(value) ? null : EMAIL_ERROR;

  constructor() {
    inject(SheepTextFieldFeatures).add(this);
  }
}
