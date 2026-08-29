import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The middle of a dialog, and the only part of it that scrolls.
 *
 * ```html
 * <sheep-dialog-body>
 *   <p>Everything in this folder will be removed.</p>
 * </sheep-dialog-body>
 * ```
 *
 * A slot and a rhythm, nothing more: the caller's content goes in untouched,
 * and the body supplies the reading measure, the padding and — once the panel
 * has grown as tall as the viewport allows — the scroll, so that the header
 * and the footer stay in place however long the content runs.
 */
@Component({
  selector: 'sheep-dialog-body',
  imports: [],
  templateUrl: './sheep-dialog-body.component.html',
  styleUrl: './sheep-dialog-body.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sheep-dialog__body' },
})
export class SheepDialogBodyComponent {}
