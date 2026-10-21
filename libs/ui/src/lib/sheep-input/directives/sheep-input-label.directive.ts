import { Directive } from '@angular/core';

/**
 * The field's label. One per field.
 *
 * A marker and nothing more: the caller owns the element and its content, and
 * the field projects it into a real `<label for>` that it wires to the input.
 * A field with no label needs `ariaLabel` instead — a placeholder is not a
 * label, it is gone the moment the user types.
 */
@Directive({
  selector: '[sheepInputLabel]',
})
export class SheepInputLabelDirective {}
