import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  SHEEP_CHIP,
  SHEEP_CHIP_SIZES,
  SHEEP_CHIP_TONES,
  SHEEP_CHIP_VARIANTS,
  SheepButtonComponent,
  type SheepChipSize,
  type SheepChipTone,
  type SheepChipVariant,
} from '@sheep-ng/ui';

const ALL_TAGS = ['design', 'frontend', 'a11y', 'urgent'] as const;

/**
 * Showcase for `sheep-chip`.
 *
 * The page is semantic HTML dressed by the demo page kit — see
 * `libs/demo/src/styles/_demo-kit.scss`. That layout vocabulary is
 * documentation chrome and stays inside this library: `@sheep-ng/ui` ships
 * components and a theme, never a way to lay out a page.
 */
@Component({
  selector: 'sheep-demo-chip',
  imports: [SHEEP_CHIP, SheepButtonComponent],
  templateUrl: './chip-demo.html',
  styleUrl: './chip-demo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipDemo {
  protected readonly variants: readonly SheepChipVariant[] = SHEEP_CHIP_VARIANTS;
  protected readonly tones: readonly SheepChipTone[] = SHEEP_CHIP_TONES;
  protected readonly sizes: readonly SheepChipSize[] = SHEEP_CHIP_SIZES;

  // --- a working filter -----------------------------------------------------

  protected readonly statuses = ['Open', 'In review', 'Blocked', 'Done'];

  protected readonly active = signal<ReadonlySet<string>>(new Set(['Open']));

  protected readonly summary = computed(() => {
    const on = this.statuses.filter((status) => this.active().has(status));

    return on.length === 0 ? 'Showing everything' : `Showing ${on.join(', ')}`;
  });

  protected isOn(status: string): boolean {
    return this.active().has(status);
  }

  protected toggle(status: string): void {
    this.active.update((current) => {
      const next = new Set(current);

      if (!next.delete(status)) next.add(status);

      return next;
    });
  }

  // --- input chips ----------------------------------------------------------

  protected readonly tags = signal<readonly string[]>(ALL_TAGS);

  protected drop(tag: string): void {
    this.tags.update((current) => current.filter((one) => one !== tag));
  }

  protected restore(): void {
    this.tags.set(ALL_TAGS);
  }

  /** Section order and copy, so the template stays structural. */
  protected readonly sections: readonly {
    id: string;
    heading: string;
    note: string;
  }[] = [
    {
      id: 'anatomy',
      heading: 'Anatomy',
      note: 'What a chip is comes from the element it is written on, not from a mode input. A filter is a button, a link chip is an anchor, a chip you can take out is a plain host holding its own remove button, and a chip that is only there to be read is a plain host with nothing in it. The keyboard, the focus and the announcement are the platform’s in every case.',
    },
    {
      id: 'filter',
      heading: 'Filter chips',
      note: 'A row of toggles. Each is a button with aria-pressed, grouped and named by a sheep-chip-set so a screen reader knows what the five of them have in common. Selected chips take a leading check as well as a tint, so “on” survives being read without colour.',
    },
    {
      id: 'selection',
      heading: 'Selection is three-state',
      note: 'selected is null until you bind it. That is not the same as false: an action chip has no selection state, and announcing it as an unpressed toggle would be a lie about what pressing it does. Bind it and the chip starts claiming one — aria-pressed on a button, aria-current on a link.',
    },
    {
      id: 'variants',
      heading: 'Variants and tones',
      note: 'outline is the default, in step with the rest of the library. soft is the quieter form, for a chip that labels rather than asks. Selected fills over either one.',
    },
    {
      id: 'sizes',
      heading: 'Sizes',
      note: 'The same three control sizes as everything else, so a chip, a button and a text field line up on a row. Only the radius differs: a chip is a pill.',
    },
    {
      id: 'input',
      heading: 'Input chips',
      note: 'A value the user put in and can take back out. The remove control is a separate button, never one nested inside another — and it names itself from the chip’s own label, so four of them announce as four different things rather than four identical “Remove”s.',
    },
    {
      id: 'disabled',
      heading: 'Disabled',
      note: 'On a button chip, the native attribute: it is the real thing and it takes the chip out of the tab order. The input is for the plain host, where there is no native attribute to reach for and where it also disables the remove button.',
    },
    {
      id: 'api',
      heading: 'API',
      note: 'Nothing here is styleable from the call site. To change how chips look, change the theme.',
    },
  ];

  /** The markup behind each specimen, keyed by section. */
  protected readonly snippets: Record<string, string> = {
    anatomy: `<button sheep-chip [selected]="on()" (click)="toggle()">Archived</button>
<button sheep-chip (click)="add()">Add label</button>
<a sheep-chip routerLink="/tags/design">Design</a>
<sheep-chip removable (removed)="drop()">design</sheep-chip>
<sheep-chip variant="soft" tone="success">Passing</sheep-chip>`,

    filter: `<sheep-chip-set ariaLabel="Status">
  @for (status of statuses; track status) {
    <button
      sheep-chip
      [selected]="isOn(status)"
      (click)="toggle(status)"
    >
      {{ status }}
    </button>
  }
</sheep-chip-set>`,

    selection: `<!-- No selection state: nothing is announced. -->
<button sheep-chip (click)="add()">Add label</button>

<!-- Bound: announced as a toggle, pressed or not. -->
<button sheep-chip [selected]="false">Open</button>
<button sheep-chip [selected]="true">Done</button>`,

    variants: `<sheep-chip variant="outline" tone="primary">Outline</sheep-chip>
<sheep-chip variant="soft" tone="success">Soft</sheep-chip>`,

    sizes: `<sheep-chip size="sm">Small</sheep-chip>
<sheep-chip size="md">Medium</sheep-chip>
<sheep-chip size="lg">Large</sheep-chip>`,

    input: `<sheep-chip removable (removed)="drop(tag)">{{ tag }}</sheep-chip>

/* The remove button is named "Remove" plus the chip's
   own label. Pass [removeLabel] when the label alone
   does not read as an object. */`,

    disabled: `<button sheep-chip disabled>Native, and out of the tab order</button>
<sheep-chip removable disabled>Input, and its remove button with it</sheep-chip>`,

    api: `import { SHEEP_CHIP } from '@sheep-ng/ui';

@Component({ imports: [SHEEP_CHIP], ... })`,
  };

  /** The public API, rendered from one source so it cannot drift from the code. */
  protected readonly api: readonly {
    name: string;
    default: string;
    type: string;
  }[] = [
    { name: 'variant', default: "'outline'", type: "'outline' | 'soft'" },
    {
      name: 'tone',
      default: "'primary'",
      type: "'primary' | 'neutral' | 'success' | 'warning' | 'danger'",
    },
    { name: 'size', default: "'md'", type: "'sm' | 'md' | 'lg'" },
    {
      name: 'selected',
      default: 'null',
      type: 'boolean | null — null means no selection state at all',
    },
    {
      name: 'removable',
      default: 'false',
      type: 'boolean attribute — plain <sheep-chip> hosts only',
    },
    {
      name: 'removeLabel',
      default: 'null',
      type: 'string — defaults to "Remove" plus the chip’s label',
    },
    {
      name: 'disabled',
      default: 'false',
      type: 'boolean attribute — prefer the native one on a button host',
    },
    { name: '(removed)', default: '—', type: 'void — the chip does not remove itself' },
    {
      name: 'sheep-chip-set',
      default: '—',
      type: '[ariaLabel] — role="group" around chips that belong together',
    },
    {
      name: 'slots',
      default: '—',
      type: '[sheepChipStart], [sheepChipEnd], default content is the label',
    },
  ];
}
