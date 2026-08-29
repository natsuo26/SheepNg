import { Directive } from '@angular/core';

/**
 * A rule between two sections. Intended for `<hr sheepListDivider />`.
 *
 * Hidden from assistive tech: the subheader beside it already announces the
 * boundary, so the rule is decoration.
 */
@Directive({
  selector: '[sheepListDivider]',
  host: { class: 'sheep-list__divider', 'aria-hidden': 'true' },
})
export class SheepListDividerDirective {}
