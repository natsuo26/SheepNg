/**
 * The value sets and metrics behind `sheepTooltip`.
 *
 * Each list is the single source of truth for its axis: the matching type is
 * derived from the tuple, so adding a value widens the type automatically and
 * the two cannot drift apart. The lists are exported as values, not just
 * types, so callers can enumerate an axis at runtime — a demo grid or a docs
 * table renders from the same tuple the directive validates against.
 */

/**
 * Which side of its anchor a tooltip prefers.
 *
 * A preference, not a promise: a tooltip that would open off the edge of the
 * window opens on the opposite side instead, and is then held clear of both
 * edges. The side it settles on is the side its entry animation comes from,
 * so the tooltip never disagrees with itself about what it is attached to.
 */
export const SHEEP_TOOLTIP_PLACEMENTS = [
  'top',
  'right',
  'bottom',
  'left',
] as const;

export type SheepTooltipPlacement = (typeof SHEEP_TOOLTIP_PLACEMENTS)[number];

/**
 * How long a pointer has to rest before a tooltip opens, in milliseconds.
 *
 * Long enough that crossing a toolbar does not set off every button in it,
 * short enough to feel like an answer rather than a wait. Not an input: a
 * tooltip that opens on its own schedule is a tooltip the rest of the app
 * cannot be consistent with.
 */
export const SHEEP_TOOLTIP_SHOW_DELAY = 250;

/**
 * How long a tooltip stays after the pointer leaves, in milliseconds.
 *
 * Short, and there only to cover the gap when a pointer crosses from one
 * anchor to its neighbour: within this window the next tooltip opens at once
 * rather than serving out a second opening delay.
 */
export const SHEEP_TOOLTIP_HIDE_DELAY = 80;

/** The gap between an anchor and the tooltip attached to it, in pixels. */
export const SHEEP_TOOLTIP_OFFSET = 8;

/** The closest a tooltip comes to the edge of the window, in pixels. */
export const SHEEP_TOOLTIP_MARGIN = 8;
