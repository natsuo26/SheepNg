import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  provideRouter,
} from '@angular/router';
import { SHEEP_NAV_BAR } from './sheep-nav-bar.imports';
import type { SheepNavBarSize } from './sheep-nav-bar.constants';

@Component({
  imports: [SHEEP_NAV_BAR],
  template: `
    <sheep-nav-bar [size]="size()" ariaLabel="Main">
      <span sheepNavBarStart data-testid="brand">Acme</span>

      <a sheep-nav-bar-item href="/inbox" [active]="current() === 'inbox'">
        <svg sheepNavBarItemStart data-testid="icon" viewBox="0 0 16 16"></svg>
        Inbox
      </a>
      <a sheep-nav-bar-item href="/reports" [active]="current() === 'reports'">
        Reports
      </a>
      <a sheep-nav-bar-item href="/soon" [disabled]="true">Soon</a>
      <button sheep-nav-bar-item [active]="current() === 'board'">Board</button>
      <button sheep-nav-bar-item disabled>Locked</button>

      <button sheepNavBarEnd data-testid="end" type="button">Theme</button>
    </sheep-nav-bar>
  `,
})
class Host {
  readonly size = signal<SheepNavBarSize>('md');
  readonly current = signal<string | null>('inbox');
}

describe('SheepNavBarComponent', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const el = (): HTMLElement => fixture.nativeElement;
  const bar = (): HTMLElement =>
    el().querySelector('sheep-nav-bar') as HTMLElement;
  const nav = (): HTMLElement => el().querySelector('nav') as HTMLElement;
  const items = (): HTMLElement[] =>
    Array.from(el().querySelectorAll('.sheep-nav-bar-item'));
  const item = (label: string): HTMLElement =>
    items().find((node) => node.textContent?.trim() === label) as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();

    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('puts only the items inside the navigation landmark', () => {
    // The brand and the end controls sit beside the navigation, not in it —
    // a landmark list should lead to destinations and nothing else.
    expect(nav().getAttribute('aria-label')).toBe('Main');
    expect(nav().querySelectorAll('.sheep-nav-bar-item')).toHaveLength(5);
    expect(nav().contains(el().querySelector('[data-testid="brand"]'))).toBe(
      false,
    );
    expect(nav().contains(el().querySelector('[data-testid="end"]'))).toBe(
      false,
    );
  });

  it('projects the start, end and item slots', () => {
    expect(
      bar().querySelector('.sheep-nav-bar__start [data-testid="brand"]'),
    ).toBeTruthy();
    expect(
      bar().querySelector('.sheep-nav-bar__end [data-testid="end"]'),
    ).toBeTruthy();
    expect(
      item('Inbox').querySelector('.sheep-nav-bar-item__lead [data-testid="icon"]'),
    ).toBeTruthy();
  });

  it('marks the current link as the page and the current button as true', async () => {
    expect(item('Inbox').getAttribute('aria-current')).toBe('page');
    expect(item('Reports').hasAttribute('aria-current')).toBe(false);

    host.current.set('board');
    await fixture.whenStable();

    expect(item('Inbox').hasAttribute('aria-current')).toBe(false);
    expect(item('Board').getAttribute('aria-current')).toBe('true');
  });

  it('hands every item the bar size', async () => {
    expect(items().every((node) => node.classList.contains('sheep-nav-bar-item--md'))).toBe(true);

    host.size.set('lg');
    await fixture.whenStable();

    expect(items().every((node) => node.classList.contains('sheep-nav-bar-item--lg'))).toBe(true);
    expect(bar().classList).toContain('sheep-nav-bar--lg');
  });

  it('disables a link with aria-disabled and takes it out of the tab order', () => {
    const soon = item('Soon');

    expect(soon.getAttribute('aria-disabled')).toBe('true');
    expect(soon.getAttribute('tabindex')).toBe('-1');
    expect(soon.hasAttribute('disabled')).toBe(false);
    expect(soon.classList).toContain('sheep-nav-bar-item--disabled');
  });

  it('disables a button natively', () => {
    const locked = item('Locked') as HTMLButtonElement;

    expect(locked.disabled).toBe(true);
    expect(locked.hasAttribute('aria-disabled')).toBe(false);
    expect(locked.hasAttribute('tabindex')).toBe(false);
  });

  describe('when the items overflow', () => {
    /**
     * jsdom lays nothing out, so the scroller's geometry is given to it: a
     * 300px window onto 900px of items, scrolled to `left`.
     */
    const overflow = async (left: number) => {
      const scroller = nav();
      Object.defineProperty(scroller, 'clientWidth', { configurable: true, value: 300 });
      Object.defineProperty(scroller, 'scrollWidth', { configurable: true, value: 900 });
      scroller.scrollLeft = left;
      scroller.dispatchEvent(new Event('scroll'));
      await fixture.whenStable();
    };

    const step = (edge: 'start' | 'end') =>
      bar().querySelector<HTMLButtonElement>(`.sheep-nav-bar__step--${edge}`);

    it('shows nothing extra while the row fits', () => {
      expect(step('start')).toBeNull();
      expect(step('end')).toBeNull();
      expect(bar().classList).not.toContain('sheep-nav-bar--more-end');
    });

    it('offers a step only toward the edge that has more past it', async () => {
      await overflow(0);
      expect(step('start')).toBeNull();
      expect(step('end')).toBeTruthy();
      expect(bar().classList).toContain('sheep-nav-bar--more-end');

      await overflow(300);
      expect(step('start')).toBeTruthy();
      expect(step('end')).toBeTruthy();

      await overflow(600);
      expect(step('start')).toBeTruthy();
      expect(step('end')).toBeNull();
    });

    it('keeps the steps out of the tab order and the accessibility tree', async () => {
      await overflow(300);

      for (const button of [step('start'), step('end')]) {
        expect(button?.getAttribute('tabindex')).toBe('-1');
        expect(button?.getAttribute('aria-hidden')).toBe('true');
      }
    });

    it('pages the row toward the step that was pressed', async () => {
      await overflow(300);
      const scrollBy = vi.fn();
      nav().scrollBy = scrollBy as typeof HTMLElement.prototype.scrollBy;

      step('end')?.click();
      step('start')?.click();

      expect(scrollBy.mock.calls[0][0].left).toBeCloseTo(240);
      expect(scrollBy.mock.calls[1][0].left).toBeCloseTo(-240);
    });

    it('leaves the wheel to the page', async () => {
      await overflow(0);
      const wheel = new WheelEvent('wheel', { deltaY: 120, cancelable: true });

      nav().dispatchEvent(wheel);

      expect(wheel.defaultPrevented).toBe(false);
      expect(nav().scrollLeft).toBe(0);
    });
  });

  it('exposes no per-instance style hooks', () => {
    // The spec is deliberate: appearance is not a call-site concern. If this
    // ever fails, someone has reintroduced an override property.
    expect(bar().getAttribute('style')).toBeNull();
    expect(items().every((node) => node.getAttribute('style') === null)).toBe(true);
  });
});

@Component({ template: '' })
class Blank {}

@Component({
  imports: [SHEEP_NAV_BAR, RouterLink, RouterLinkActive],
  template: `
    <sheep-nav-bar>
      <a sheep-nav-bar-item routerLink="/inbox" routerLinkActive ariaCurrentWhenActive="page">
        Inbox
      </a>
      <a sheep-nav-bar-item routerLink="/reports" routerLinkActive ariaCurrentWhenActive="page">
        Reports
      </a>
    </sheep-nav-bar>
  `,
})
class RoutedHost {}

describe('SheepNavBarItemComponent with the router', () => {
  it('leaves aria-current to routerLinkActive when active is not bound', async () => {
    await TestBed.configureTestingModule({
      imports: [RoutedHost],
      providers: [
        provideRouter([
          { path: 'inbox', component: Blank },
          { path: 'reports', component: Blank },
        ]),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(RoutedHost);
    const router = TestBed.inject(Router);
    const link = (label: string): HTMLElement =>
      Array.from<HTMLElement>(
        fixture.nativeElement.querySelectorAll('.sheep-nav-bar-item'),
      ).find((node) => node.textContent?.trim() === label) as HTMLElement;

    // routerLinkActive writes the attribute in a microtask after navigation;
    // whenStable drains it, and a second pass proves the item's own binding
    // does not come along afterwards and wipe it.
    await router.navigateByUrl('/reports');
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(link('Reports').getAttribute('aria-current')).toBe('page');
    expect(link('Inbox').hasAttribute('aria-current')).toBe(false);

    await router.navigateByUrl('/inbox');
    await fixture.whenStable();

    expect(link('Inbox').getAttribute('aria-current')).toBe('page');
    expect(link('Reports').hasAttribute('aria-current')).toBe(false);
  });
});
