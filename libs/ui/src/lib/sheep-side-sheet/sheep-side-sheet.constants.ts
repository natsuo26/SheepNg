/**
 * The value sets behind `sheep-side-sheet`'s appearance inputs.
 *
 * Each list is the single source of truth for its axis: the matching type is
 * derived from the tuple, so adding a value widens the type automatically and
 * the two cannot drift apart. The lists are exported as values, not just
 * types, so callers can enumerate an axis at runtime — a demo grid or a docs
 * table renders from the same tuple the component validates against.
 */

/**
 * Which edge the panel is anchored to.
 *
 * Physical, not logical: a side sheet is a place on the screen, and a caller
 * reaching for one has a side of the window in mind. Navigation conventionally
 * arrives from the left, detail and filters from the right — hence the
 * default.
 */
export const SHEEP_SIDE_SHEET_SIDES = ['right', 'left'] as const;

export type SheepSideSheetSide = (typeof SHEEP_SIDE_SHEET_SIDES)[number];

/**
 * Panel width and interior density.
 *
 * A sheet is sized by its content: `sm` is a short list of filters, `md` a
 * form, `lg` a record with detail in it. Height is never a choice — a side
 * sheet is always the full height of the viewport — and the panel gives way to
 * the viewport width on a narrow screen, whatever the size says.
 */
export const SHEEP_SIDE_SHEET_SIZES = ['sm', 'md', 'lg'] as const;

export type SheepSideSheetSize = (typeof SHEEP_SIDE_SHEET_SIZES)[number];

/**
 * How a sheet came to be closed.
 *
 * `close` covers every deliberate close — the header's close button and the
 * `close()` method, which is what a footer button calls. `escape` and
 * `backdrop` are the two dismissals, and only happen while `dismissible`.
 */
export const SHEEP_SIDE_SHEET_CLOSE_REASONS = [
  'close',
  'escape',
  'backdrop',
] as const;

export type SheepSideSheetCloseReason =
  (typeof SHEEP_SIDE_SHEET_CLOSE_REASONS)[number];

/** Where the footer's buttons sit on the row. */
export const SHEEP_SIDE_SHEET_FOOTER_ALIGNS = [
  'end',
  'start',
  'between',
] as const;

export type SheepSideSheetFooterAlign =
  (typeof SHEEP_SIDE_SHEET_FOOTER_ALIGNS)[number];
