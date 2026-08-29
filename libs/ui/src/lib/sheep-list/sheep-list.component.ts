import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import type { SheepListSize } from './sheep-list.constants';

/**
 * A vertical run of rows.
 *
 * The list is a container and a density, nothing more. It owns no data, no
 * item template and no selection model — rows are composed at the call site
 * out of `sheep-list-item` and the projection directives:
 *
 * ```html
 * <sheep-list divided>
 *   <div sheepListSubheader>Folders</div>
 *   @for (folder of folders; track folder.id) {
 *     <sheep-list-item>
 *       <svg sheepListItemIcon>...</svg>
 *       <div sheepListItemTitle>{{ folder.name }}</div>
 *       <div sheepListItemLine>{{ folder.updated }}</div>
 *     </sheep-list-item>
 *   }
 * </sheep-list>
 * ```
 *
 * Density is set here, once, and reaches every row through inherited custom
 * properties — a row cannot disagree with the list it sits in.
 *
 * Drops straight into a `cdk-virtual-scroll-viewport` — CDK's viewport,
 * unwrapped, because projected content keeps its declaration-site injector and
 * a wrapper of ours would put `*cdkVirtualFor` out of reach of it. Use
 * `SHEEP_LIST_ROW_HEIGHT` for the viewport's `itemSize`.
 *
 * Deliberately NOT themeable per instance, and deliberately unframed: no
 * surface, no border, no radius. The caller decides what the list sits in.
 */
@Component({
  selector: 'sheep-list',
  imports: [],
  templateUrl: './sheep-list.component.html',
  styleUrl: './sheep-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sheep-list',
    role: 'list',
    '[class]': 'classes()',
  },
})
export class SheepListComponent {
  /** Row density. Defaults to `md`. */
  readonly size = input<SheepListSize>('md');

  /** Draws a hairline between adjacent rows. Supports the bare-attribute form. */
  readonly divided = input(false, { transform: booleanAttribute });

  private readonly viewport = inject(CdkVirtualScrollViewport, {
    optional: true,
  });

  /**
   * True while the rendered window starts past the first row.
   *
   * `divided` hangs the hairline off each row's top edge and suppresses it on
   * the first one, which is right until a viewport recycles rows: then the
   * first *rendered* row is mid-run, and suppressing its line punches a gap
   * that slides with the scroll. Watching the rendered range — one
   * subscription for the whole list, not one per row — lets the first row keep
   * its line exactly when the run really does continue above it.
   */
  private readonly renderedPastStart = signal(false);

  protected readonly classes = computed(
    () =>
      `sheep-list--${this.size()}` +
      (this.divided() ? ' sheep-list--divided' : '') +
      (this.renderedPastStart() ? ' sheep-list--continued' : ''),
  );

  constructor() {
    this.viewport?.renderedRangeStream
      .pipe(takeUntilDestroyed())
      .subscribe((range) => this.renderedPastStart.set(range.start > 0));
  }
}
