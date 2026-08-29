/**
 * The value set behind `sheep-list`'s density input.
 *
 * Exported as a value, not just a type, so callers can enumerate the axis at
 * runtime — a demo grid or a docs table renders from the same tuple the
 * component validates against.
 */

/**
 * Row density. Shared with the rest of the library's size axis, so a list, a
 * button and a text field read as the same scale of thing.
 */
export const SHEEP_LIST_SIZES = ['sm', 'md', 'lg'] as const;

export type SheepListSize = (typeof SHEEP_LIST_SIZES)[number];

/**
 * Rendered height, in pixels, of a single-line row at each density.
 *
 * This is the number `cdk-virtual-scroll-viewport` needs for `itemSize`. It is
 * exact rather than approximate: a one-line row's content (padding plus one
 * title line) is always shorter than the density's `min-height`, so the
 * min-height governs — and the row is `border-box`, so turning `divided` on
 * does not add to it.
 *
 * Multi-line rows are content-sized on purpose and are NOT covered here. A
 * virtual list of two- or three-line rows has to measure one row and pass that
 * height, or give its rows a fixed height of its own.
 *
 * Mirrors the `$sizes` map in sheep-list.component.scss — change one, change
 * both.
 */
export const SHEEP_LIST_ROW_HEIGHT: Readonly<Record<SheepListSize, number>> = {
  sm: 28,
  md: 36,
  lg: 44,
};
