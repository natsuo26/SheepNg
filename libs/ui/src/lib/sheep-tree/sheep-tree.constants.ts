/**
 * The value sets and shapes behind `sheep-tree`.
 *
 * Each list is the single source of truth for its axis: the matching type is
 * derived from the tuple, so adding a value widens the type automatically and
 * the two cannot drift apart. The lists are exported as values, not just
 * types, so callers can enumerate an axis at runtime — a demo grid or a docs
 * table renders from the same tuple the component validates against.
 */

/**
 * Row density. Shared with the rest of the library size axis, so a list, a
 * tree and a button read as the same scale of thing — and the row heights
 * below are the list heights, because a tree row and a list row are the same
 * row with an indent in front of it.
 */
export const SHEEP_TREE_SIZES = ['sm', 'md', 'lg'] as const;

export type SheepTreeSize = (typeof SHEEP_TREE_SIZES)[number];

/**
 * Rendered height, in pixels, of a row at each density.
 *
 * This is the number `cdk-virtual-scroll-viewport` needs for `itemSize`, and
 * the reason it can be a single exact number is the whole design: every row is
 * one line at a fixed height whatever its depth, because depth is padding
 * rather than structure.
 *
 * Mirrors the `$sizes` map in sheep-tree.component.scss — change one, change
 * both.
 */
export const SHEEP_TREE_ROW_HEIGHT: Readonly<Record<SheepTreeSize, number>> = {
  sm: 28,
  md: 36,
  lg: 44,
};

/**
 * One node of the caller data.
 *
 * The tree takes data rather than projected markup, which is the one place it
 * departs from `sheep-list`. It has to: a tree is only fast if it can decide
 * what is visible and render that as a flat run, and it cannot do that with
 * content it has never seen. `children` is the nesting, and the only nesting —
 * there is no second, parallel notion of a parent.
 *
 * `id` must be unique across the whole tree. It is the track key, the
 * expansion key and the selection key, so a duplicate would make two nodes the
 * same node in all three.
 */
export interface SheepTreeNode {
  /** Unique across the tree. Identifies the node for tracking and selection. */
  id: string;

  /** The text on the row. */
  label: string;

  /**
   * The nodes underneath. A node with an empty or absent `children` is a leaf
   * and draws no twisty.
   */
  children?: readonly SheepTreeNode[];

  /** Greys the row and refuses selection. Expansion is still allowed. */
  disabled?: boolean;
}

/**
 * One rendered row: a node, flattened, with the facts the template needs.
 *
 * This is what the component computes and loops over. It is a plain object
 * rather than a component instance, and that is the point — see the note on
 * `SheepTreeComponent` about why the tree flattens rather than recurses.
 */
export interface SheepTreeRow {
  /** The caller node this row was flattened from. */
  node: SheepTreeNode;

  /** Depth from the root, zero-based. Rendered as padding, not as structure. */
  level: number;

  /** Whether the node has children to show. */
  expandable: boolean;

  /** Whether those children are currently showing. */
  expanded: boolean;
}
