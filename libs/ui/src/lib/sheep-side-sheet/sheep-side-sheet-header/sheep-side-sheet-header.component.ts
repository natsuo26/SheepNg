import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { SheepButtonComponent } from '../../sheep-button/sheep-button.component';
import { SheepSideSheetComponent } from '../sheep-side-sheet.component';

/**
 * The top row of a side sheet: what it is called, and the way out of it.
 *
 * ```html
 * <sheep-side-sheet-header>Filters</sheep-side-sheet-header>
 * ```
 *
 * The content is the title, and it names the sheet: the header carries the id
 * the sheet points its `aria-labelledby` at, so a screen reader announces the
 * sheet by the words on screen rather than by a second copy of them written
 * into an attribute.
 *
 * The close button is the header, not the caller — it is the dismissal the
 * sheet already offers through Escape and the backdrop, made visible. It
 * appears exactly when the sheet is `dismissible`, so the three ways out
 * cannot disagree. Buttons that *do* something belong in the footer.
 */
@Component({
  selector: 'sheep-side-sheet-header',
  imports: [SheepButtonComponent],
  templateUrl: './sheep-side-sheet-header.component.html',
  styleUrl: './sheep-side-sheet-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sheep-side-sheet__header',
    '[attr.id]': 'titleId',
  },
})
export class SheepSideSheetHeaderComponent {
  /**
   * The sheet this header was written into.
   *
   * A header is content of the sheet, so it is declared in the caller template
   * and its element injector resolves up through `<sheep-side-sheet>`.
   * Optional so that a header rendered by mistake outside one degrades to a
   * plain title rather than throwing.
   */
  private readonly sheet = inject(SheepSideSheetComponent, { optional: true });

  protected readonly titleId = this.sheet?.titleId ?? null;

  /** Mirrors the sheet own input, so the three ways out cannot disagree. */
  protected readonly dismissible = computed(
    () => this.sheet?.dismissible() ?? false,
  );

  protected close(): void {
    this.sheet?.close('close');
  }
}
