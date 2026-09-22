import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The middle of a side sheet, and the only part of it that scrolls.
 *
 * ```html
 * <sheep-side-sheet-body>
 *   <p>Narrow the results without leaving the table.</p>
 * </sheep-side-sheet-body>
 * ```
 *
 * A slot and a rhythm, nothing more: the caller content goes in untouched, and
 * the body supplies the reading measure, the padding and the scroll, so that
 * the header and the footer stay in place however long the content runs. The
 * panel is always the full height of the viewport, so unlike a dialog the body
 * has a scroll to give from the moment there is more than fits.
 */
@Component({
  selector: 'sheep-side-sheet-body',
  imports: [],
  templateUrl: './sheep-side-sheet-body.component.html',
  styleUrl: './sheep-side-sheet-body.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sheep-side-sheet__body' },
})
export class SheepSideSheetBodyComponent {}
