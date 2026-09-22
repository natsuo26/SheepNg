/**
 * The value sets behind `sheep-chip`'s appearance inputs.
 *
 * Each list is the single source of truth for its axis: the matching type is
 * derived from the tuple, so adding a value widens the type automatically and
 * the two cannot drift apart. The lists are exported as values, not just
 * types, so callers can enumerate an axis at runtime — a demo grid or a docs
 * table renders from the same tuple the component validates against.
 */

/**
 * Visual weight.
 *
 * `outline` is the default, in step with the rest of the library: an accent
 * line on a transparent ground. `soft` is the quieter form, for a chip that
 * labels rather than asks — a read-only tag in a table cell, say. Neither
 * describes the selected state: a selected chip fills, whichever variant it
 * started from, because "on" has to be legible across a row of them at a
 * glance.
 */
export const SHEEP_CHIP_VARIANTS = ['outline', 'soft'] as const;

export type SheepChipVariant = (typeof SHEEP_CHIP_VARIANTS)[number];

/** Semantic colour, resolved from the theme's tone stops. */
export const SHEEP_CHIP_TONES = [
  'primary',
  'neutral',
  'success',
  'warning',
  'danger',
] as const;

export type SheepChipTone = (typeof SHEEP_CHIP_TONES)[number];

/** Control size. Shared with every other control in the library. */
export const SHEEP_CHIP_SIZES = ['sm', 'md', 'lg'] as const;

export type SheepChipSize = (typeof SHEEP_CHIP_SIZES)[number];
