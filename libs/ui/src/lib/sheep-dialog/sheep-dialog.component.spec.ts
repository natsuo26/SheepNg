import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SHEEP_DIALOG } from './sheep-dialog.imports';
import type { SheepDialogCloseReason } from './sheep-dialog.constants';

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
  imports: [SHEEP_DIALOG],
  template: `
    <sheep-dialog
      [(open)]="open"
      [dismissible]="dismissible()"
      (closed)="reason.set($event)"
    >
      <sheep-dialog-header>Delete project</sheep-dialog-header>
      <sheep-dialog-body>This cannot be undone.</sheep-dialog-body>
      <sheep-dialog-footer>
        <button type="button">Cancel</button>
      </sheep-dialog-footer>
    </sheep-dialog>
  `,
})
class Host {
  readonly open = signal(false);
  readonly dismissible = signal(true);
  readonly reason = signal<SheepDialogCloseReason | null>(null);
}

describe('SheepDialogComponent', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const surface = (): HTMLDialogElement =>
    fixture.nativeElement.querySelector('dialog');

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

  it('names itself by the header', async () => {
    host.open.set(true);
    await settle();

    const labelledBy = surface().getAttribute('aria-labelledby');
    const header = fixture.nativeElement.querySelector('sheep-dialog-header');

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
      fixture.nativeElement.querySelector('.sheep-dialog__close'),
    ).toBeTruthy();

    host.dismissible.set(false);
    await settle();

    expect(fixture.nativeElement.querySelector('.sheep-dialog__close')).toBe(
      null,
    );
  });

  it('closes on the header close button', async () => {
    host.open.set(true);
    await settle();

    fixture.nativeElement.querySelector('.sheep-dialog__close button').click();
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

    const panel = fixture.nativeElement.querySelector('.sheep-dialog__panel');
    panel.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    surface().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle();

    expect(host.open()).toBe(true);
  });
});
