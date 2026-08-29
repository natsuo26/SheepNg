import { Directive } from '@angular/core';

/**
 * Guidance under the field — a format, a rule, a reassurance.
 *
 * Rendered in the footer and referenced by the input's `aria-describedby`, so
 * it is announced with the field rather than stranded beside it. An error
 * replaces it while one is showing.
 */
@Directive({
  selector: '[sheepTextFieldHint]',
})
export class SheepTextFieldHintDirective {}
