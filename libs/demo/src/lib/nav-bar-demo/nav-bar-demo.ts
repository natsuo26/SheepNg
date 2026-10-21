import {
  ChangeDetectionStrategy,
  Component,
  signal,
  type WritableSignal,
} from '@angular/core';
import {
  SHEEP_NAV_BAR,
  SheepBadgeComponent,
  SheepButtonComponent,
  type SheepNavBarSize,
} from '@sheep-ng/ui';

/**
 * Showcase for `sheep-nav-bar`.
 *
 * The specimens use `<button sheep-nav-bar-item [active]>` rather than router
 * links, because this page lives under the demo app's own router and a link
 * would navigate away from it. The snippets show the router form, which is the
 * normal one — and the demo app's own top bar, above this page, is a
 * `sheep-nav-bar` driven by `routerLinkActive`.
 *
 * The page is semantic HTML dressed by the demo page kit — see
 * `libs/demo/src/styles/_demo-kit.scss`. That layout vocabulary is
 * documentation chrome and stays inside this library: `@sheep-ng/ui` ships
 * components and a theme, never a way to lay out a page.
 */
@Component({
  selector: 'sheep-demo-nav-bar',
  imports: [SHEEP_NAV_BAR, SheepBadgeComponent, SheepButtonComponent],
  templateUrl: './nav-bar-demo.html',
  styleUrl: './nav-bar-demo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavBarDemo {
  protected readonly sizes: readonly SheepNavBarSize[] = ['sm', 'md', 'lg'];

  /** The destinations every plain specimen shows. */
  protected readonly destinations = ['Overview', 'Projects', 'Reports', 'Team'];

  /** One current item per specimen, so clicking in one leaves the rest alone. */
  protected readonly anatomy = signal('Overview');
  protected readonly current = signal('Projects');
  protected readonly bySize: Record<SheepNavBarSize, WritableSignal<string>> = {
    sm: signal('Overview'),
    md: signal('Overview'),
    lg: signal('Overview'),
  };
  protected readonly slotted = signal('inbox');
  protected readonly pending = signal('Overview');
  protected readonly crowded = signal('Overview');

  protected readonly many = [
    'Overview',
    'Projects',
    'Reports',
    'Team',
    'Billing',
    'Integrations',
    'Audit log',
    'Usage',
    'Security',
    'Settings',
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
      note: 'A start slot, the items, an end slot. Only the items are inside the <nav> landmark — the brand and the controls beside it are not destinations, so a screen reader listing landmarks does not offer them as such.',
    },
    {
      id: 'current',
      heading: 'Current item',
      note: 'Current is aria-current and nothing else, and the item paints from the attribute — so what is drawn as current and what is announced as current cannot disagree. With the router, routerLinkActive writes it; without, [active] does.',
    },
    {
      id: 'sizes',
      heading: 'Sizes',
      note: 'Set once on the bar and read by every item, so one bar cannot mix sizes. The items sit on the shared control metrics: a button in the end slot lines up with the links beside it.',
    },
    {
      id: 'slots',
      heading: 'Icons and counts',
      note: 'A leading icon and a trailing slot for a count. The rule under the current item spans the label, not the icon, and survives being read without colour.',
    },
    {
      id: 'disabled',
      heading: 'Not yet open',
      note: 'A destination that exists but cannot be reached yet. On a link that is aria-disabled and out of the tab order, since a link has no native disabled; on a button it is the native attribute.',
    },
    {
      id: 'overflow',
      heading: 'More items than width',
      note: 'The items scroll sideways; they do not wrap onto a second row or fold behind a menu. The bar keeps its height, every destination stays one tap away, and the edge with more past it fades. The start and end slots never move.',
    },
    {
      id: 'api',
      heading: 'API',
      note: 'Two inputs on the bar and two on the item. Nothing else is styleable from the call site.',
    },
  ];

  /**
   * The markup behind each specimen, keyed by section — in the router form
   * the bar is normally used in.
   */
  protected readonly snippets: Record<string, string> = {
    anatomy: `<sheep-nav-bar ariaLabel="Main">
  <a sheepNavBarStart routerLink="/">Acme</a>

  <a sheep-nav-bar-item routerLink="/overview"
     routerLinkActive ariaCurrentWhenActive="page">Overview</a>
  <a sheep-nav-bar-item routerLink="/projects"
     routerLinkActive ariaCurrentWhenActive="page">Projects</a>

  <sheep-button sheepNavBarEnd variant="ghost">Sign out</sheep-button>
</sheep-nav-bar>`,

    current: `<!-- With the router: it writes aria-current, the item paints it. -->
<a sheep-nav-bar-item routerLink="/projects"
   routerLinkActive ariaCurrentWhenActive="page">Projects</a>

<!-- Without it: say which one is current yourself. -->
<button sheep-nav-bar-item [active]="view() === 'board'"
        (click)="view.set('board')">Board</button>

/* Use one or the other on an item, never both -
   they write the same attribute. */`,

    sizes: `<sheep-nav-bar size="sm">...</sheep-nav-bar>
<sheep-nav-bar>...</sheep-nav-bar>
<sheep-nav-bar size="lg">...</sheep-nav-bar>`,

    slots: `<a sheep-nav-bar-item routerLink="/inbox"
   routerLinkActive ariaCurrentWhenActive="page">
  <svg sheepNavBarItemStart ...></svg>
  Inbox
  <sheep-badge sheepNavBarItemEnd size="sm" tone="primary" label="12" />
</a>`,

    disabled: `<a sheep-nav-bar-item routerLink="/billing" disabled>Billing</a>`,

    overflow: `<!-- Nothing to configure: a row that does not fit scrolls. -->
<sheep-nav-bar>
  @for (page of pages; track page.path) {
    <a sheep-nav-bar-item [routerLink]="page.path"
       routerLinkActive ariaCurrentWhenActive="page">{{ page.label }}</a>
  }
</sheep-nav-bar>`,

    api: `import { RouterLink, RouterLinkActive } from '@angular/router';
import { SHEEP_NAV_BAR } from '@sheep-ng/ui';

@Component({ imports: [SHEEP_NAV_BAR, RouterLink, RouterLinkActive], ... })`,
  };

  /** The public API, rendered from one source so it cannot drift from the code. */
  protected readonly api: readonly {
    name: string;
    default: string;
    type: string;
  }[] = [
    {
      name: 'sheep-nav-bar size',
      default: "'md'",
      type: "'sm' | 'md' | 'lg' — every item's size",
    },
    {
      name: 'sheep-nav-bar ariaLabel',
      default: 'null',
      type: 'string — the <nav> landmark name',
    },
    {
      name: '[sheepNavBarStart] / [sheepNavBarEnd]',
      default: '—',
      type: 'slots beside the landmark, never scrolled',
    },
    {
      name: 'sheep-nav-bar-item active',
      default: 'null',
      type: 'boolean | null — null leaves it to routerLinkActive',
    },
    {
      name: 'sheep-nav-bar-item disabled',
      default: 'false',
      type: 'boolean attribute',
    },
    {
      name: '[sheepNavBarItemStart] / [sheepNavBarItemEnd]',
      default: '—',
      type: 'icon and count slots',
    },
  ];
}
