import { Directive, inject } from '@angular/core';
import {
  SheepInputFeatures,
  type SheepInputFeature,
  type SheepInputState,
} from '../sheep-input.feature';

/**
 * Shows how much has been typed, at the trailing end of the footer.
 *
 * ```html
 * <sheep-input sheepCounter [maxLength]="80">
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
  selector: 'sheep-input[sheepCounter]',
})
export class SheepInputCounterDirective implements SheepInputFeature {
  readonly status = ({ value, maxLength }: SheepInputState): string =>
    maxLength === undefined
      ? `${value.length}`
      : `${value.length}/${maxLength}`;

  constructor() {
    inject(SheepInputFeatures).add(this);
  }
}
