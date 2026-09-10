import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  SHEEP_BADGE_EMPHASIS,
  SHEEP_BADGE_SIZES,
  SHEEP_BADGE_TONES,
  SHEEP_LIST,
  SheepBadgeComponent,
  type SheepBadgeEmphasis,
  type SheepBadgeSize,
  type SheepBadgeTone,
} from '@sheep-ng/ui';

/** A colour that came out of a database, not out of the design system. */
interface Label {
  readonly name: string;
  readonly color: string;
}

/** A row that carries a status badge, to show badges at their real size. */
interface Build {
  readonly id: number;
  readonly branch: string;
  readonly status: string;
  readonly tone: SheepBadgeTone;
  readonly emphasis: SheepBadgeEmphasis;
}

/**
 * Showcase for `sheep-badge`.
 *
 * The page is semantic HTML dressed by the demo page kit — see
 * `libs/demo/src/styles/_demo-kit.scss`. That layout vocabulary is
 * documentation chrome and stays inside this library: `@sheep-ng/ui` ships
 * components and a theme, never a way to lay out a page.
 */
@Component({
  selector: 'sheep-demo-badge',
  imports: [SheepBadgeComponent, SHEEP_LIST],
  templateUrl: './badge-demo.html',
  styleUrl: './badge-demo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeDemo {
  protected readonly tones: readonly SheepBadgeTone[] = SHEEP_BADGE_TONES;
  protected readonly emphases: readonly SheepBadgeEmphasis[] =
    SHEEP_BADGE_EMPHASIS;
  protected readonly sizes: readonly SheepBadgeSize[] = SHEEP_BADGE_SIZES;

  /**
   * Colours the spec has never seen.
   *
   * The point of the section they appear in: these are the sort of values a
   * label picker writes into a database, and the component has to make a
   * coherent pair of weights out of each one without being told anything else.
   */
  protected readonly labels: readonly Label[] = [
    { name: 'design', color: '#c2418f' },
    { name: 'infra', color: '#2f7f9e' },
    { name: 'good first issue', color: '#3f8f4f' },
    { name: 'flaky', color: '#b06a1f' },
    { name: 'rfc', color: '#6a5acd' },
  ];

  protected readonly builds: readonly Build[] = [
    {
      id: 1,
      branch: 'main',
      status: 'Passing',
      tone: 'success',
      emphasis: 'normal',
    },
    {
      id: 2,
      branch: 'feat/chips',
      status: 'Running',
      tone: 'primary',
      emphasis: 'normal',
    },
    {
      id: 3,
      branch: 'fix/theme-flash',
      status: '3 failed',
      tone: 'danger',
      emphasis: 'high',
    },
    {
      id: 4,
      branch: 'chore/deps',
      status: 'Queued',
      tone: 'neutral',
      emphasis: 'normal',
    },
  ];

  /** Section order and copy, so the template stays structural. */
  protected readonly sections: readonly {
    id: string;
    heading: string;
    note: string;
  }[] = [
    {
      id: 'anatomy',
      heading: 'Anatomy',
      note: 'A badge shows; it does not do. There is nothing to click, nothing to focus and no event to listen to — if it needs to be operable, it is a chip. A label, an icon, or both, and the shape follows from which of those it has.',
    },
    {
      id: 'tones',
      heading: 'Tones and emphasis',
      note: 'Five tones, each in two weights. normal tints the hue and writes on it in the same hue; high fills with it. Both come out of one colour rather than being picked separately, which is what lets a colour the spec has never seen behave like one it ships.',
    },
    {
      id: 'sizes',
      heading: 'Sizes',
      note: 'A badge is not a pointer target, so it does not sit on the control heights. It rides its own smaller scale: the largest badge is still shorter than the shortest button.',
    },
    {
      id: 'icon',
      heading: 'Icon, label, or both',
      note: 'With no icon the slot collapses and takes its gap with it. With no label the badge is the icon, in a circle at the badge height rather than a pill with a gap in it — which is why the label is an input and not a slot: the shape has to be decided from something knowable, and projected DOM would mean measuring it and laying out again afterwards. An icon on its own has no text to fall back on, so give it an ariaLabel.',
    },
    {
      id: 'custom',
      heading: 'Colours the spec has never seen',
      note: 'The one place in this library where a component takes a colour from the call site. Badges paint data, and data brings its own colours — a label a user picked, a per-tenant brand, a category from a database. There is no variant to add to the spec for a colour that does not exist until runtime. Three custom properties, colour only: no padding, radius, font or border hook. A hue you hand over is still resolved against the current theme, but a text colour you pin is pinned in both — so pin the two together, as the overridden pair below does, or leave the text to be derived.',
    },
    {
      id: 'context',
      heading: 'At working size',
      note: 'Badges in a list, which is where they actually live. The restraint in the default weights is the point: a column of these should read as data, not as a row of warning lights.',
    },
    {
      id: 'api',
      heading: 'API',
      note: 'Everything but colour comes from the theme. To change the shape of a badge, change the theme.',
    },
  ];

  /** The markup behind each specimen, keyed by section. */
  protected readonly snippets: Record<string, string> = {
    anatomy: `<sheep-badge tone="success" label="Passing" />
<sheep-badge tone="danger" emphasis="high" label="7 failed" />
<sheep-badge tone="warning" ariaLabel="Needs review">
  <svg sheepBadgeIcon>...</svg>
</sheep-badge>`,

    tones: `<sheep-badge tone="warning" label="Degraded" />
<sheep-badge tone="warning" emphasis="high" label="Degraded" />`,

    sizes: `<sheep-badge size="sm" label="Beta" />
<sheep-badge size="md" label="Beta" />
<sheep-badge size="lg" label="Beta" />`,

    icon: `<!-- Both. -->
<sheep-badge tone="success" label="Passing">
  <svg sheepBadgeIcon>...</svg>
</sheep-badge>

<!-- Label only: no gap, no space held for an icon. -->
<sheep-badge tone="success" label="Passing" />

<!-- Icon only: a circle, and it needs a name. -->
<sheep-badge tone="success" ariaLabel="Passing">
  <svg sheepBadgeIcon>...</svg>
</sheep-badge>`,

    custom: `<!-- From TypeScript, per badge. -->
<sheep-badge [color]="label.color" [label]="label.name" />
<sheep-badge [color]="label.color" emphasis="high" [label]="label.name" />

<!-- Font and icon colour, overridden. -->
<sheep-badge
  color="#1f2933"
  textColor="#ffd400"
  iconColor="#ff7a45"
  label="Custom"
>
  <svg sheepBadgeIcon>...</svg>
</sheep-badge>

/* Or from CSS, when the colour belongs to a context
   rather than to one badge. */
.tenant-acme sheep-badge {
  --sheep-badge-color: #0f6fff;
}`,

    context: `<sheep-list divided>
  @for (build of builds; track build.id) {
    <sheep-list-item>
      <div sheepListItemTitle>{{ build.branch }}</div>
      <sheep-badge
        sheepListItemMeta
        [tone]="build.tone"
        [emphasis]="build.emphasis"
        [label]="build.status"
      />
    </sheep-list-item>
  }
</sheep-list>`,

    api: `import { SheepBadgeComponent } from '@sheep-ng/ui';

@Component({ imports: [SheepBadgeComponent], ... })`,
  };

  /** The public API, rendered from one source so it cannot drift from the code. */
  protected readonly api: readonly {
    name: string;
    default: string;
    type: string;
  }[] = [
    {
      name: 'tone',
      default: "'neutral'",
      type: "'primary' | 'neutral' | 'success' | 'warning' | 'danger'",
    },
    { name: 'emphasis', default: "'normal'", type: "'normal' | 'high'" },
    { name: 'size', default: "'md'", type: "'sm' | 'md' | 'lg'" },
    {
      name: 'label',
      default: 'null',
      type: 'string | number — empty makes it an icon badge',
    },
    { name: 'color', default: 'null', type: 'any CSS colour; both weights derive from it' },
    { name: 'textColor', default: 'null', type: 'any CSS colour' },
    { name: 'iconColor', default: 'null', type: 'any CSS colour; follows the text' },
    {
      name: 'ariaLabel',
      default: 'null',
      type: 'string — required for an icon-only badge',
    },
    { name: '[sheepBadgeIcon]', default: '—', type: 'the icon slot' },
    {
      name: '--sheep-badge-color',
      default: 'the tone',
      type: 'CSS — the hue, settable from a stylesheet',
    },
    {
      name: '--sheep-badge-text',
      default: 'derived',
      type: 'CSS — the label colour',
    },
    {
      name: '--sheep-badge-icon',
      default: 'the text colour',
      type: 'CSS — the icon colour',
    },
  ];
}
