/**
 * The value sets shared by the layout primitives.
 *
 * Spacing is a closed set on purpose. A primitive takes a step from this
 * scale, never a raw length, so a page assembled from them inherits the
 * theme's rhythm instead of inventing its own.
 */

/** Steps of the theme's space scale, as accepted by `gap` and `padding`. */
export const SHEEP_SPACE_STEPS = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '6',
  '8',
  '12',
  '16',
] as const;

export type SheepSpace = (typeof SHEEP_SPACE_STEPS)[number];

/** Cross-axis alignment shared by `sheep-stack` and `sheep-row`. */
export const SHEEP_ALIGNMENTS = [
  'stretch',
  'start',
  'center',
  'end',
  'baseline',
] as const;

export type SheepAlign = (typeof SHEEP_ALIGNMENTS)[number];

/** Main-axis distribution for `sheep-row`. */
export const SHEEP_JUSTIFICATIONS = [
  'start',
  'center',
  'end',
  'between',
] as const;

export type SheepJustify = (typeof SHEEP_JUSTIFICATIONS)[number];

/** Text roles, mapped to the theme's text colours. */
export const SHEEP_TEXT_TONES = [
  'default',
  'muted',
  'faint',
  'accent',
] as const;

export type SheepTextTone = (typeof SHEEP_TEXT_TONES)[number];

/** Text sizes. `md` is the body default. */
export const SHEEP_TEXT_SIZES = ['xs', 'sm', 'md'] as const;

export type SheepTextSize = (typeof SHEEP_TEXT_SIZES)[number];

/** Heading levels. Drives both semantics and visual size. */
export const SHEEP_HEADING_LEVELS = [1, 2, 3, 4] as const;

export type SheepHeadingLevel = (typeof SHEEP_HEADING_LEVELS)[number];
