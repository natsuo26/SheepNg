import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';

/** Host tags that carry their own role, which `listitem` must not overwrite. */
const INTERACTIVE_HOSTS = new Set(['A', 'BUTTON']);

/**
 * One row of a `sheep-list`.
 *
 * Composed, not configured. The row is three slots — a leading icon, a text
 * column, trailing meta — and the caller fills them with their own elements,
 * tagged with the projection directives:
 *
 * ```html
 * <sheep-list-item>
 *   <svg sheepListItemIcon>...</svg>
 *   <div sheepListItemTitle>Quarterly report</div>
 *   <div sheepListItemLine>Edited 2 days ago</div>
 *   <span sheepListItemMeta>3.2 MB</span>
 * </sheep-list-item>
 * ```
 *
 * A clickable row is a real clickable element, not a div wearing a handler.
 * The selector also matches `a[sheep-list-item]` and `button[sheep-list-item]`,
 * so the host itself becomes the anchor or the button and keyboard, focus and
 * navigation come from the platform:
 *
 * ```html
 * <a sheep-list-item routerLink="/inbox" [selected]="active()">...</a>
 * <button sheep-list-item (click)="pick(row)" disabled>...</button>
 * ```
 *
 * Rows work unchanged inside a `cdk-virtual-scroll-viewport`; see
 * `SHEEP_LIST_ROW_HEIGHT` for the `itemSize` to give it.
 *
 * Density comes from the parent list, and every colour and metric from the
 * `--sheep-*` theme layer. There is nothing styleable here per instance.
 */
@Component({
  selector: 'sheep-list-item, a[sheep-list-item], button[sheep-list-item]',
  imports: [],
  templateUrl: './sheep-list-item.component.html',
  styleUrl: './sheep-list-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sheep-list-item',
    '[attr.role]': 'role',
    '[class.sheep-list-item--selected]': 'selected()',
    '[attr.aria-current]': "selected() ? 'true' : null",
  },
})
export class SheepListItemComponent {
  /** Marks the row as the current one — a tinted ground and an accent title. */
  readonly selected = input(false, { transform: booleanAttribute });

  /**
   * `listitem`, except on the interactive host forms.
   *
   * On `<a>` and `<button>` the native role is the point — overwriting it with
   * `listitem` would strip the link or the button out of the accessibility
   * tree. Every other host gets the role, so a row created dynamically (where
   * the host element is a bare `div`) still announces as one. The tag cannot
   * change after creation, so this resolves once.
   */
  protected readonly role = INTERACTIVE_HOSTS.has(
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName,
  )
    ? null
    : 'listitem';
}
