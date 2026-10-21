/**
 * The value sets behind `sheep-nav-bar`'s appearance inputs.
 *
 * Each list is the single source of truth for its axis: the matching type is
 * derived from the tuple, so adding a value widens the type automatically and
 * the two cannot drift apart. The lists are exported as values, not just
 * types, so callers can enumerate an axis at runtime — a demo grid or a docs
 * table renders from the same tuple the component validates against.
 */

/**
 * Control size of the items in the bar.
 *
 * Set once, on the bar: every item reads it from there, so one bar cannot mix
 * a large item in with small ones. Shared with every other control in the
 * library, so a button or a text field in the bar's end slot lines up with
 * the links beside it.
 */
export const SHEEP_NAV_BAR_SIZES = ['sm', 'md', 'lg'] as const;

export type SheepNavBarSize = (typeof SHEEP_NAV_BAR_SIZES)[number];
