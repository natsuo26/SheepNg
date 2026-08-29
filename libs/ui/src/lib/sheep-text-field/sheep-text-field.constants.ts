/**
 * The value sets behind `sheep-text-field`'s appearance inputs.
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
 * `outline` is the default and matches the library's signature: a line on a
 * transparent ground. `soft` sinks the field into a filled well, for dense
 * forms where a page of outlines would read as a grid of boxes.
 */
export const SHEEP_TEXT_FIELD_VARIANTS = ['outline', 'soft'] as const;

export type SheepTextFieldVariant = (typeof SHEEP_TEXT_FIELD_VARIANTS)[number];

/** Control size. Shared with every other control in the library. */
export const SHEEP_TEXT_FIELD_SIZES = ['sm', 'md', 'lg'] as const;

export type SheepTextFieldSize = (typeof SHEEP_TEXT_FIELD_SIZES)[number];

/**
 * Native `type` of the underlying `<input>`.
 *
 * Only the types that take a free-text value are here. `checkbox`, `radio`,
 * `range`, `file` and the date family are different controls with different
 * value shapes, not a `type` away from this one.
 *
 * `password` and `email` are reachable from here, but the directives
 * (`sheepPassword`, `sheepEmail`) are the fuller answer — they set the type
 * themselves and add the reveal toggle and the validation that make those two
 * types worth having.
 */
export const SHEEP_TEXT_FIELD_TYPES = [
  'text',
  'password',
  'email',
  'search',
  'tel',
  'url',
] as const;

export type SheepTextFieldType = (typeof SHEEP_TEXT_FIELD_TYPES)[number];
