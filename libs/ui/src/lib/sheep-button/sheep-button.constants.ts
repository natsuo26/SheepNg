/**
 * The value sets behind `sheep-button`'s appearance inputs.
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
 * `outline` is the default and the library's signature: an accent line on a
 * transparent ground. `solid` is reserved for the one most important action in
 * a view — the spec does not flood large areas with a tone.
 */
export const SHEEP_BUTTON_VARIANTS = [
  'outline',
  'solid',
  'soft',
  'ghost',
  'link',
] as const;

export type SheepButtonVariant = (typeof SHEEP_BUTTON_VARIANTS)[number];

/** Semantic colour, resolved from the theme's tone stops. */
export const SHEEP_BUTTON_TONES = [
  'primary',
  'neutral',
  'success',
  'warning',
  'danger',
] as const;

export type SheepButtonTone = (typeof SHEEP_BUTTON_TONES)[number];

/** Control size. Shared with every other control in the library. */
export const SHEEP_BUTTON_SIZES = ['sm', 'md', 'lg'] as const;

export type SheepButtonSize = (typeof SHEEP_BUTTON_SIZES)[number];

/** Corner treatment. `square` is the icon-only 1:1 box. */
export const SHEEP_BUTTON_SHAPES = ['rounded', 'square'] as const;

export type SheepButtonShape = (typeof SHEEP_BUTTON_SHAPES)[number];

/** Native `type` of the underlying `<button>`. */
export const SHEEP_BUTTON_TYPES = ['button', 'submit', 'reset'] as const;

export type SheepButtonType = (typeof SHEEP_BUTTON_TYPES)[number];
