import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { SheepSideSheetFooterAlign } from '../sheep-side-sheet.constants';

/**
 * The bottom row of a side sheet: the actions it offers.
 *
 * The buttons are the caller, and so is what they do — the footer lays them
 * out and nothing else. It has no notion of a confirm or a cancel, so a button
 * that closes the sheet says so itself:
 *
 * ```html
 * <sheep-side-sheet-footer align="between">
 *   <sheep-button variant="ghost" (click)="reset()">Reset</sheep-button>
 *   <sheep-button variant="solid" (click)="apply()">Apply</sheep-button>
 * </sheep-side-sheet-footer>
 * ```
 *
 * Actions read left to right in rising commitment, so the one the sheet is for
 * goes last. Use `align="between"` to push a destructive or secondary action
 * away from the pair the eye lands on.
 *
 * The footer is optional in a way a dialog footer rarely is. A dialog is a
 * question and wants an answer, but plenty of sheets are somewhere to look
 * rather than somewhere to decide — a detail panel is finished with when it is
 * closed, and closing it is already offered three ways.
 */
@Component({
  selector: 'sheep-side-sheet-footer',
  imports: [],
  templateUrl: './sheep-side-sheet-footer.component.html',
  styleUrl: './sheep-side-sheet-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sheep-side-sheet__footer',
    '[class]': 'classes()',
  },
})
export class SheepSideSheetFooterComponent {
  /** Where the buttons sit on the row. Defaults to `end`. */
  readonly align = input<SheepSideSheetFooterAlign>('end');

  protected readonly classes = computed(
    () => `sheep-side-sheet__footer--${this.align()}`,
  );
}
