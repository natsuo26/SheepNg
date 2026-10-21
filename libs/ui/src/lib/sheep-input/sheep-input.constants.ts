/**
 * The value sets behind `sheep-input`'s appearance inputs.
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
 * `underline` is the default: one hairline under the value and nothing else,
 * so a column of fields reads as a page of writing rather than a stack of
 * boxes. `soft` adds a sunk ground under the same rule, for a form dense
 * enough that the rows need telling apart.
 */
export const SHEEP_INPUT_VARIANTS = ['underline', 'soft'] as const;

export type SheepInputVariant = (typeof SHEEP_INPUT_VARIANTS)[number];

/** Control size. Shared with every other control in the library. */
export const SHEEP_INPUT_SIZES = ['sm', 'md', 'lg'] as const;

export type SheepInputSize = (typeof SHEEP_INPUT_SIZES)[number];

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
export const SHEEP_INPUT_TYPES = [
  'text',
  'password',
  'email',
  'search',
  'tel',
  'url',
] as const;

export type SheepInputType = (typeof SHEEP_INPUT_TYPES)[number];
