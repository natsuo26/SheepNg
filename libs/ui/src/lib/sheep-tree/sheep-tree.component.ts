import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  model,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import type {
  SheepTreeNode,
  SheepTreeRow,
  SheepTreeSize,
} from './sheep-tree.constants';

/** Keys the tree answers. Anything else falls through to the browser. */
const HANDLED_KEYS = new Set([
  'ArrowDown',
  'ArrowUp',
  'ArrowRight',
  'ArrowLeft',
  'Home',
  'End',
  'Enter',
  ' ',
]);

/**
 * A collapsible hierarchy.
 *
 * ```html
 * <sheep-tree
 *   [nodes]="folders"
 *   [(expanded)]="open"
 *   [(selected)]="current"
 * />
 * ```
 *
 * ## Why this does not nest
 *
 * The obvious way to build a tree is a component that renders itself once per
 * child. It is also the slow way, and the cost lands exactly where a tree is
 * supposed to be good: depth. Every level adds a component instance, an
 * embedded view and a change-detection node per node, stacked into a view
 * hierarchy as deep as the data, so work grows with depth as well as with
 * count and a change near the root walks everything under it.
 *
 * This tree does not nest. `rows` flattens the visible nodes into one array in
 * a single `computed()`, and the template is one flat `@for` over it. Depth
 * becomes `--_tree-level`, which the stylesheet turns into padding. A node
 * twelve levels down is one row, the same one DOM row as a node at the top,
 * and the view hierarchy is one level deep no matter what the data does.
 *
 * Three things follow from that, and they are the whole performance story:
 *
 * - **Collapsed subtrees cost nothing.** The flatten walks into a node only
 *   when it is expanded, so the work is proportional to what is on screen, not
 *   to what is in the data. A collapsed million-node branch is one row.
 * - **Expanding is a splice, not a subtree build.** The `computed()` reruns,
 *   `@for` tracks by node id, and Angular adds exactly the new rows. Nothing
 *   above or beside them is touched.
 * - **It virtualizes.** Every row is one line at a fixed height whatever its
 *   depth, so a flat run can be dropped in a `cdk-virtual-scroll-viewport`
 *   with `SHEEP_TREE_ROW_HEIGHT` as `itemSize` — which a nested tree cannot
 *   do at all, since its rows are not siblings.
 *
 * ## State
 *
 * The caller owns both pieces of state and both are two-way. `expanded` is a
 * set of node ids, so expansion survives the data being replaced and a caller
 * can open a path by writing the ids into it. `selected` is a single id, or
 * null. Nothing is stored on the nodes themselves, so the caller data stays
 * the caller data.
 *
 * Keyboard is the standard tree: up and down move, right expands or steps in,
 * left collapses or steps out, Home and End jump, Enter and Space select. One
 * row is in the tab order at a time.
 *
 * Deliberately NOT themeable per instance. Every colour and metric comes from
 * the `--sheep-*` theme layer, so two trees in one app cannot drift apart.
 */
@Component({
  selector: 'sheep-tree',
  imports: [],
  templateUrl: './sheep-tree.component.html',
  styleUrl: './sheep-tree.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sheep-tree',
    role: 'tree',
    '[class]': 'classes()',
    '[attr.aria-multiselectable]': 'false',
    '(keydown)': 'onKeydown($event)',
  },
})
export class SheepTreeComponent {
  /** The hierarchy to show. Nesting lives in each node `children`. */
  readonly nodes = input<readonly SheepTreeNode[]>([]);

  /** Row density. Defaults to `md`. */
  readonly size = input<SheepTreeSize>('md');

  /**
   * The ids of the expanded nodes. Two-way: `[(expanded)]="open"`.
   *
   * A set rather than a flag on the node, so that expansion is the caller
   * state and not a mutation of the caller data. Replace the set to change it
   * — the flatten reruns on identity, so mutating it in place shows nothing.
   */
  readonly expanded = model<ReadonlySet<string>>(new Set<string>());

  /** The id of the selected node, or null. Two-way: `[(selected)]="current"`. */
  readonly selected = model<string | null>(null);

  /** Emits the node when a row is selected, for callers who want the object. */
  readonly nodeSelected = output<SheepTreeNode>();

  /** Emits the node when it is expanded or collapsed. */
  readonly nodeToggled = output<SheepTreeNode>();

  private readonly rowRefs =
    viewChildren<ElementRef<HTMLElement>>('rowRef');

  /**
   * The row that holds the tab stop.
   *
   * A tree is one tab stop, not one per row, so focus moves inside it with the
   * arrow keys — the roving tabindex. Null until the caller tabs in, at which
   * point the first row takes it.
   */
  private readonly focusedId = signal<string | null>(null);

  /**
   * The visible nodes, flattened.
   *
   * The one piece of real work the component does, and it reruns only when the
   * data or the expansion changes. It walks into a node only when that node is
   * expanded, so a collapsed branch is skipped whole, however much is under it.
   */
  protected readonly rows = computed<readonly SheepTreeRow[]>(() => {
    const expanded = this.expanded();
    const out: SheepTreeRow[] = [];

    const walk = (nodes: readonly SheepTreeNode[], level: number): void => {
      for (const node of nodes) {
        const expandable = !!node.children?.length;
        const isExpanded = expandable && expanded.has(node.id);

        out.push({ node, level, expandable, expanded: isExpanded });

        if (isExpanded) walk(node.children as readonly SheepTreeNode[], level + 1);
      }
    };

    walk(this.nodes(), 0);
    return out;
  });

  /** Which row carries `tabindex="0"`: the focused one, else the first. */
  protected readonly tabStopId = computed(
    () => this.focusedId() ?? this.rows()[0]?.node.id ?? null,
  );

  protected readonly classes = computed(() => `sheep-tree--${this.size()}`);

  /** Opens or closes a node. Ignored on a leaf. */
  toggle(node: SheepTreeNode): void {
    if (!node.children?.length) return;

    // A new set every time: the flatten watches identity, and a set mutated in
    // place is the same set as far as a signal is concerned.
    const next = new Set(this.expanded());
    if (!next.delete(node.id)) next.add(node.id);

    this.expanded.set(next);
    this.nodeToggled.emit(node);
  }

  /** Selects a node. Refused on a disabled one. */
  select(node: SheepTreeNode): void {
    if (node.disabled) return;

    this.selected.set(node.id);
    this.nodeSelected.emit(node);
  }

  protected onRowClick(row: SheepTreeRow): void {
    this.focusedId.set(row.node.id);
    this.select(row.node);
  }

  /**
   * The twisty, which toggles without selecting.
   *
   * It is not a `<button>` on purpose: a treeitem must not contain its own tab
   * stop, or the tree stops being one stop with arrow keys inside it. The
   * keyboard reaches the same behaviour through ArrowRight and ArrowLeft on
   * the row, which is where the tree pattern puts it.
   */
  protected onTwistyClick(event: MouseEvent, row: SheepTreeRow): void {
    // The row underneath would otherwise select as well.
    event.stopPropagation();

    this.focusedId.set(row.node.id);
    this.toggle(row.node);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!HANDLED_KEYS.has(event.key)) return;

    const rows = this.rows();
    if (!rows.length) return;

    const current = this.tabStopId();
    const at = Math.max(
      0,
      rows.findIndex((row) => row.node.id === current),
    );
    const row = rows[at];

    switch (event.key) {
      case 'ArrowDown':
        this.focusRow(rows, at + 1);
        break;

      case 'ArrowUp':
        this.focusRow(rows, at - 1);
        break;

      // Open a closed branch, then step into it. On a leaf, nothing.
      case 'ArrowRight':
        if (row.expandable && !row.expanded) this.toggle(row.node);
        else if (row.expanded) this.focusRow(rows, at + 1);
        break;

      // Close an open branch, else step out to the parent.
      case 'ArrowLeft':
        if (row.expanded) this.toggle(row.node);
        else this.focusParent(rows, at);
        break;

      case 'Home':
        this.focusRow(rows, 0);
        break;

      case 'End':
        this.focusRow(rows, rows.length - 1);
        break;

      case 'Enter':
      case ' ':
        this.select(row.node);
        break;
    }

    // Every key above either moves focus or changes state, and each one has a
    // browser default — scrolling the page, mostly — that would fight it.
    event.preventDefault();
  }

  /** Moves the tab stop, and the real focus with it. Clamped, never wrapping. */
  private focusRow(rows: readonly SheepTreeRow[], index: number): void {
    if (index < 0 || index >= rows.length) return;

    this.focusedId.set(rows[index].node.id);

    // The rendered rows are in the same order as `rows`, so the index is the
    // index. Guarded because a virtual viewport renders only a window of them.
    this.rowRefs()[index]?.nativeElement.focus();
  }

  /**
   * The nearest row above that sits one level shallower.
   *
   * Flattening leaves no parent pointer, so the parent is found by scanning
   * back for the first row at `level - 1` — which is what it means to be the
   * parent in a flat run, and is a short walk in practice since it stops at
   * the first row shallower than this one.
   */
  private focusParent(rows: readonly SheepTreeRow[], at: number): void {
    const level = rows[at].level;
    if (level === 0) return;

    for (let i = at - 1; i >= 0; i--) {
      if (rows[i].level === level - 1) {
        this.focusRow(rows, i);
        return;
      }
    }
  }
}
