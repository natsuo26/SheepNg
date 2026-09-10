/**
 * The value sets behind `sheep-badge`'s appearance inputs.
 *
 * Each list is the single source of truth for its axis: the matching type is
 * derived from the tuple, so adding a value widens the type automatically and
 * the two cannot drift apart. The lists are exported as values, not just
 * types, so callers can enumerate an axis at runtime — a demo grid or a docs
 * table renders from the same tuple the component validates against.
 */

/** Semantic colour, resolved from the theme's tone stops. */
export const SHEEP_BADGE_TONES = [
  'primary',
  'neutral',
  'success',
  'warning',
  'danger',
] as const;

export type SheepBadgeTone = (typeof SHEEP_BADGE_TONES)[number];

/**
 * How loudly the badge carries its colour.
 *
 * `normal` is a tint of the hue with the hue's own text on it — the one to
 * reach for when a view is full of badges, because a table column of them
 * should read as data rather than as a warning light. `high` fills with the
 * hue itself, and is worth spending on the one row in fifty that needs to be
 * seen before anything else.
 *
 * Both are derived from a single colour, which is what lets a caller supply
 * one of their own and get the same pair out of it.
 */
export const SHEEP_BADGE_EMPHASIS = ['normal', 'high'] as const;

export type SheepBadgeEmphasis = (typeof SHEEP_BADGE_EMPHASIS)[number];

/**
 * Badge size.
 *
 * The same three names as the control sizes, but not the same metrics: a badge
 * is a mark on something, not a thing to aim at, so it rides its own smaller
 * `--sheep-badge-*` scale. An `lg` badge is still shorter than an `sm` button.
 */
export const SHEEP_BADGE_SIZES = ['sm', 'md', 'lg'] as const;

export type SheepBadgeSize = (typeof SHEEP_BADGE_SIZES)[number];
