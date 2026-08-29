import { Directive, inject } from '@angular/core';
import {
  SheepTextFieldFeatures,
  type SheepTextFieldFeature,
  type SheepTextFieldState,
} from '../sheep-text-field.feature';

/**
 * Shows how much has been typed, at the trailing end of the footer.
 *
 * ```html
 * <sheep-text-field sheepCounter [maxLength]="80">
 * ```
 *
 * With a `maxLength` it reads `12/80`, and with none it just counts. The limit
 * is whatever the field has — set directly, or bound from a schema's
 * `maxLength()` rule by `[formField]`, so a counter on a form-bound field
 * needs no second copy of the number.
 *
 * `aria-hidden`, because a screen reader already announces the input's
 * `maxlength` and a count that changes on every keystroke is not something
 * anyone wants read aloud.
 */
@Directive({
  selector: 'sheep-text-field[sheepCounter]',
})
export class SheepTextFieldCounterDirective implements SheepTextFieldFeature {
  readonly status = ({ value, maxLength }: SheepTextFieldState): string =>
    maxLength === undefined
      ? `${value.length}`
      : `${value.length}/${maxLength}`;

  constructor() {
    inject(SheepTextFieldFeatures).add(this);
  }
}
