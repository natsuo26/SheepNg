/**
 * The value sets behind `sheep-dialog`'s appearance inputs.
 *
 * Each list is the single source of truth for its axis: the matching type is
 * derived from the tuple, so adding a value widens the type automatically and
 * the two cannot drift apart. The lists are exported as values, not just
 * types, so callers can enumerate an axis at runtime — a demo grid or a docs
 * table renders from the same tuple the component validates against.
 */

/**
 * Panel width and interior density.
 *
 * A dialog is sized by its content, not by its importance: `sm` is a
 * confirmation, `md` a short form, `lg` a page of detail. The panel never
 * exceeds the viewport in either axis, whatever the size says.
 */
export const SHEEP_DIALOG_SIZES = ['sm', 'md', 'lg'] as const;

export type SheepDialogSize = (typeof SHEEP_DIALOG_SIZES)[number];

/**
 * How a dialog came to be closed.
 *
 * `close` covers every deliberate close — the header's close button and the
 * `close()` method, which is what a footer button calls. `escape` and
 * `backdrop` are the two dismissals, and only happen while `dismissible`.
 */
export const SHEEP_DIALOG_CLOSE_REASONS = [
  'close',
  'escape',
  'backdrop',
] as const;

export type SheepDialogCloseReason =
  (typeof SHEEP_DIALOG_CLOSE_REASONS)[number];

/** Where the footer's buttons sit on the row. */
export const SHEEP_DIALOG_FOOTER_ALIGNS = ['end', 'start', 'between'] as const;

export type SheepDialogFooterAlign =
  (typeof SHEEP_DIALOG_FOOTER_ALIGNS)[number];
