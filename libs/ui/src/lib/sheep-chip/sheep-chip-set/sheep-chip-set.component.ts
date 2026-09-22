import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
  input,
} from '@angular/core';

/**
 * A named group of chips.
 *
 * This is semantics, not layout. Five filter chips in a row are five separate
 * toggle buttons as far as a screen reader is concerned, announced one after
 * another with nothing to say what they have in common; wrapping them makes
 * them "Status, group" and each chip a member of it. The wrapping, gap and
 * alignment come with it because a group that does not hold its chips together
 * on screen is not the same group visually — but that is the extent of it. The
 * library ships no general layout primitives, and this is not one.
 *
 * ```html
 * <sheep-chip-set ariaLabel="Status">
 *   @for (status of statuses; track status) {
 *     <button sheep-chip [selected]="isOn(status)" (click)="toggle(status)">
 *       {{ status }}
 *     </button>
 *   }
 * </sheep-chip-set>
 * ```
 *
 * Every chip stays in the tab order. A row of toggle buttons is not a
 * composite widget — there is no single value being chosen and no reason to
 * take arrow keys away from the browser — so there is deliberately no roving
 * tabindex here.
 */
@Component({
  selector: 'sheep-chip-set',
  imports: [],
  templateUrl: './sheep-chip-set.component.html',
  styleUrl: './sheep-chip-set.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sheep-chip-set',
    role: 'group',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class SheepChipSetComponent {
  /**
   * What the chips in it have in common — "Status", "Labels", "Filters".
   *
   * A group with no name is a group a screen reader has no reason to mention.
   * Give it this, or point `aria-labelledby` at a heading that already says it.
   */
  readonly ariaLabel = input<string | null>(null);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // Development only, and compiled out of production builds — see the note
    // on the same check in sheep-button.
    //
    // Checked against the rendered element rather than the input, because the
    // name may equally arrive as an `aria-labelledby` this component never
    // sees.
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      afterRenderEffect(() => {
        if (this.ariaLabel()) return;

        const element = this.host.nativeElement;

        if (!element.hasAttribute('aria-labelledby')) {
          console.warn(
            'sheep-chip-set: no accessible name. An unnamed group is a group ' +
              'a screen reader has no reason to announce, which is the whole ' +
              'point of the element — give it [ariaLabel] or an ' +
              'aria-labelledby. See:',
            element,
          );
        }
      });
    }
  }
}
