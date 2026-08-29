import { Directive } from '@angular/core';

/**
 * A section label above a run of rows. Put it on any block element.
 *
 * Like every marker in this folder it is a class and nothing more: no inputs,
 * no template, no logic. The caller owns the element and its content; the
 * directive only says which slot that element belongs to, and gives our
 * stylesheet a handle to dress it with.
 */
@Directive({
  selector: '[sheepListSubheader]',
  host: { class: 'sheep-list__subheader' },
})
export class SheepListSubheaderDirective {}
