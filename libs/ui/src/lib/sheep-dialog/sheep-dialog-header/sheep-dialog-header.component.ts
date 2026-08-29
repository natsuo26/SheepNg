import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { SheepButtonComponent } from '../../sheep-button/sheep-button.component';
import { SheepDialogComponent } from '../sheep-dialog.component';

/**
 * The top row of a dialog: what it is called, and the way out of it.
 *
 * ```html
 * <sheep-dialog-header>Rename folder</sheep-dialog-header>
 * ```
 *
 * The content is the title, and it names the dialog: the header carries the id
 * the dialog points its `aria-labelledby` at, so a screen reader announces the
 * dialog by the words on screen rather than by a second copy of them written
 * into an attribute.
 *
 * The close button is the header's, not the caller's — it is the dismissal the
 * dialog already offers through Escape and the backdrop, made visible. It
 * appears exactly when the dialog is `dismissible`, so the three ways out
 * cannot disagree. Buttons that *do* something belong in the footer.
 */
@Component({
  selector: 'sheep-dialog-header',
  imports: [SheepButtonComponent],
  templateUrl: './sheep-dialog-header.component.html',
  styleUrl: './sheep-dialog-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sheep-dialog__header',
    '[attr.id]': 'titleId',
  },
})
export class SheepDialogHeaderComponent {
  /**
   * The dialog this header was written into.
   *
   * A header is content of the dialog, so it is declared in the caller's
   * template and its element injector resolves up through `<sheep-dialog>`.
   * Optional so that a header rendered by mistake outside one degrades to a
   * plain title rather than throwing.
   */
  private readonly dialog = inject(SheepDialogComponent, { optional: true });

  protected readonly titleId = this.dialog?.titleId ?? null;

  /** Mirrors the dialog's own input, so the two ways out cannot disagree. */
  protected readonly dismissible = computed(
    () => this.dialog?.dismissible() ?? false,
  );

  protected close(): void {
    this.dialog?.close('close');
  }
}
