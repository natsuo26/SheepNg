import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { SheepDialogFooterAlign } from '../sheep-dialog.constants';

/**
 * The bottom row of a dialog: the actions it offers.
 *
 * The buttons are the caller's, and so is what they do — the footer lays them
 * out and nothing else. It has no notion of a confirm or a cancel, so a button
 * that closes the dialog says so itself:
 *
 * ```html
 * <sheep-dialog-footer>
 *   <sheep-button (click)="open.set(false)">Cancel</sheep-button>
 *   <sheep-button variant="solid" (click)="save()">Save</sheep-button>
 * </sheep-dialog-footer>
 * ```
 *
 * Actions read left to right in rising commitment, so the one the dialog is
 * for goes last. Use `align="between"` to push a destructive or secondary
 * action away from the pair the eye lands on.
 */
@Component({
  selector: 'sheep-dialog-footer',
  imports: [],
  templateUrl: './sheep-dialog-footer.component.html',
  styleUrl: './sheep-dialog-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sheep-dialog__footer',
    '[class]': 'classes()',
  },
})
export class SheepDialogFooterComponent {
  /** Where the buttons sit on the row. Defaults to `end`. */
  readonly align = input<SheepDialogFooterAlign>('end');

  protected readonly classes = computed(
    () => `sheep-dialog__footer--${this.align()}`,
  );
}
