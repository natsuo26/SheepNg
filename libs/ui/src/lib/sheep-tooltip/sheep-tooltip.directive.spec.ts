import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SheepTooltipDirective } from './sheep-tooltip.directive';
import { SheepTooltipService } from './sheep-tooltip.service';
import { SHEEP_TOOLTIP_SHOW_DELAY } from './sheep-tooltip.constants';

/**
 * jsdom has no popover API, so `showPopover` / `hidePopover` are absent and the
 * directive's optional calls fall through. Everything asserted here is state
 * the component owns rather than top-layer behaviour the browser owns: which
 * anchor holds the tooltip, and what words it is currently rendering.
 */
@Component({
  imports: [SheepTooltipDirective],
  template: `
    @if (alive()) {
      <button #first type="button" [sheepTooltip]="label()">First</button>
    }
    <button #second type="button" sheepTooltip="Second label">Second</button>
  `,
})
class Host {
  readonly label = signal('First label');
  readonly alive = signal(true);
}

describe('SheepTooltipDirective', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let tooltips: SheepTooltipService;

  const buttons = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('button'));

  /** The one surface the service parents to the body, if it has made one. */
  const surface = (): HTMLElement | null =>
    document.querySelector('sheep-tooltip');

  const hover = (button: HTMLButtonElement) =>
    button.dispatchEvent(new MouseEvent('mouseenter'));

  const leave = (button: HTMLButtonElement) =>
    button.dispatchEvent(new MouseEvent('mouseleave'));

  /**
   * Waits out the real opening delay, then lets the render effects settle.
   *
   * Real timers rather than fake ones: every spec in this library shares one
   * environment, and swapping the global clock out from under it reaches the
   * suites that drive CDK's virtual scroll. A quarter of a second is cheap
   * enough not to be worth breaking them for.
   */
  const settle = async () => {
    await new Promise((resolve) =>
      setTimeout(resolve, SHEEP_TOOLTIP_SHOW_DELAY + 20),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();

    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    tooltips = TestBed.inject(SheepTooltipService);
    fixture.detectChanges();
  });

  afterEach(() => {
    surface()?.remove();
  });

  it('opens on hover, after the delay, with the anchor’s text', async () => {
    const [first] = buttons();

    hover(first);
    expect(surface()).toBeNull();

    await settle();
    expect(surface()?.textContent).toContain('First label');
  });

  it('describes only the anchor that currently holds it', async () => {
    const [first, second] = buttons();

    hover(first);
    await settle();
    expect(first.getAttribute('aria-describedby')).toBe(tooltips.tooltipId);

    // Straight onto the neighbour, without the first one's leave landing
    // first — the handover has to be the first anchor's loss of the tooltip.
    hover(second);
    await settle();

    expect(second.getAttribute('aria-describedby')).toBe(tooltips.tooltipId);
    expect(first.getAttribute('aria-describedby')).toBeNull();
  });

  it('re-renders the open tooltip when the bound text changes', async () => {
    const [first] = buttons();

    hover(first);
    await settle();

    host.label.set('Renamed while open');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(surface()?.textContent).toContain('Renamed while open');
  });

  it('closes when the text empties out', async () => {
    const [first] = buttons();

    hover(first);
    await settle();
    expect(tooltips.tooltipId).not.toBeNull();

    host.label.set('   ');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(surface()?.matches(':popover-open')).toBeFalsy();
    expect(first.getAttribute('aria-describedby')).toBeNull();
  });

  /**
   * The virtual-scroll case, reduced to what a viewport actually does: the
   * anchor is destroyed while its tooltip is up. Nothing may be left holding
   * a surface that points at an element no longer in the document.
   */
  it('releases the tooltip when its anchor is destroyed', async () => {
    const [first] = buttons();

    hover(first);
    await settle();

    host.alive.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(surface()?.matches(':popover-open')).toBeFalsy();
  });

  it('does not open once the pointer has left', async () => {
    const [first] = buttons();

    hover(first);
    leave(first);
    await settle();

    expect(surface()).toBeNull();
  });
});
