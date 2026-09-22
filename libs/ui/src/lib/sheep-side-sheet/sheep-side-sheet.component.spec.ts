import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SHEEP_SIDE_SHEET } from './sheep-side-sheet.imports';
import type {
  SheepSideSheetCloseReason,
  SheepSideSheetSide,
} from './sheep-side-sheet.constants';

/**
 * jsdom ships `HTMLDialogElement` with the `open` attribute but none of its
 * methods, so the element the component drives has to be given them here.
 * The two rules the component actually depends on: opening reflects `open`,
 * and closing fires `close` — the single exit every path converges on.
 */
function installDialogMethods(): void {
  const proto = HTMLDialogElement.prototype as HTMLDialogElement;

  if (typeof proto.showModal !== 'function') {
    proto.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
  }

  if (typeof proto.close !== 'function') {
    proto.close = function (this: HTMLDialogElement) {
      if (!this.open) return;
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  }
}

@Component({
  imports: [SHEEP_SIDE_SHEET],
  template: `
    <sheep-side-sheet
      [(open)]="open"
      [side]="side()"
      [dismissible]="dismissible()"
      (closed)="reason.set($event)"
    >
      <sheep-side-sheet-header>Filters</sheep-side-sheet-header>
      <sheep-side-sheet-body>Narrow the results.</sheep-side-sheet-body>
      <sheep-side-sheet-footer>
        <button type="button">Apply</button>
      </sheep-side-sheet-footer>
    </sheep-side-sheet>
  `,
})
class Host {
  readonly open = signal(false);
  readonly side = signal<SheepSideSheetSide>('right');
  readonly dismissible = signal(true);
  readonly reason = signal<SheepSideSheetCloseReason | null>(null);
}

describe('SheepSideSheetComponent', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const surface = (): HTMLDialogElement =>
    fixture.nativeElement.querySelector('dialog');

  const sheet = (): HTMLElement =>
    fixture.nativeElement.querySelector('sheep-side-sheet');

  /**
   * Lets the render effect that drives `showModal()` / `close()` run, then
   * drains the task queue: `<dialog>` fires its `close` event in a task of its
   * own, so `closed` lands a turn after the element has shut.
   */
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    installDialogMethods();

    await TestBed.configureTestingModule({
      imports: [Host],
    }).compileComponents();

    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await settle();
  });

  it('should create', () => {
    expect(host).toBeTruthy();
  });

  it('starts closed', () => {
    expect(surface().open).toBe(false);
  });

  it('opens the native dialog when open turns true', async () => {
    host.open.set(true);
    await settle();

    expect(surface().open).toBe(true);
  });

  it('closes the native dialog when open turns false', async () => {
    host.open.set(true);
    await settle();

    host.open.set(false);
    await settle();

    expect(surface().open).toBe(false);
  });

  it('anchors to the right by default', () => {
    expect(sheet().classList).toContain('sheep-side-sheet--right');
  });

  it('moves to the left edge when the side says so', async () => {
    host.side.set('left');
    await settle();

    expect(sheet().classList).toContain('sheep-side-sheet--left');
    expect(sheet().classList).not.toContain('sheep-side-sheet--right');
  });

  it('keeps the size class alongside the side class', () => {
    expect(sheet().classList).toContain('sheep-side-sheet--md');
    expect(sheet().classList).toContain('sheep-side-sheet--right');
  });

  it('names itself by the header', async () => {
    host.open.set(true);
    await settle();

    const labelledBy = surface().getAttribute('aria-labelledby');
    const header = fixture.nativeElement.querySelector(
      'sheep-side-sheet-header',
    );

    expect(labelledBy).toBeTruthy();
    expect(header.getAttribute('id')).toBe(labelledBy);
  });

  it('writes open back and reports the reason on Escape', async () => {
    host.open.set(true);
    await settle();

    surface().dispatchEvent(new Event('cancel', { cancelable: true }));
    await settle();

    expect(host.open()).toBe(false);
    expect(host.reason()).toBe('escape');
  });

  it('refuses Escape when not dismissible', async () => {
    host.dismissible.set(false);
    host.open.set(true);
    await settle();

    surface().dispatchEvent(new Event('cancel', { cancelable: true }));
    await settle();

    expect(host.open()).toBe(true);
    expect(host.reason()).toBe(null);
  });

  it('offers a close button only while dismissible', async () => {
    host.open.set(true);
    await settle();

    expect(
      fixture.nativeElement.querySelector('.sheep-side-sheet__close'),
    ).toBeTruthy();

    host.dismissible.set(false);
    await settle();

    expect(
      fixture.nativeElement.querySelector('.sheep-side-sheet__close'),
    ).toBe(null);
  });

  it('closes on the header close button', async () => {
    host.open.set(true);
    await settle();

    fixture.nativeElement
      .querySelector('.sheep-side-sheet__close button')
      .click();
    await settle();

    expect(host.open()).toBe(false);
    expect(host.reason()).toBe('close');
  });

  it('dismisses on a press that starts and ends on the backdrop', async () => {
    host.open.set(true);
    await settle();

    surface().dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    surface().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle();

    expect(host.open()).toBe(false);
    expect(host.reason()).toBe('backdrop');
  });

  it('keeps open when a drag from inside the panel ends on the backdrop', async () => {
    host.open.set(true);
    await settle();

    const panel = fixture.nativeElement.querySelector(
      '.sheep-side-sheet__panel',
    );
    panel.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    surface().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle();

    expect(host.open()).toBe(true);
  });

  it('orders the parts header, body, footer whatever the markup says', async () => {
    host.open.set(true);
    await settle();

    const panel = fixture.nativeElement.querySelector(
      '.sheep-side-sheet__panel',
    );
    const tags = Array.from(panel.children).map((el) =>
      (el as Element).tagName.toLowerCase(),
    );

    expect(tags).toEqual([
      'sheep-side-sheet-header',
      'sheep-side-sheet-body',
      'sheep-side-sheet-footer',
    ]);
  });
});
