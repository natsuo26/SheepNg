import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SheepButtonComponent } from './sheep-button.component';

describe('SheepButtonComponent', () => {
  let fixture: ComponentFixture<SheepButtonComponent>;
  let component: SheepButtonComponent;

  const nativeButton = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('button');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SheepButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SheepButtonComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders a native button that does not submit by default', () => {
    expect(nativeButton()).toBeTruthy();
    expect(nativeButton().getAttribute('type')).toBe('button');
  });

  it('defaults to the outline variant — the library signature', () => {
    const classes = nativeButton().classList;

    expect(classes).toContain('sheep-button');
    expect(classes).toContain('sheep-button--outline');
    expect(classes).toContain('sheep-button--primary');
    expect(classes).toContain('sheep-button--md');
    expect(classes).toContain('sheep-button--rounded');
  });

  it('reflects variant, tone, size and shape onto the modifier classes', async () => {
    fixture.componentRef.setInput('variant', 'solid');
    fixture.componentRef.setInput('tone', 'danger');
    fixture.componentRef.setInput('size', 'lg');
    fixture.componentRef.setInput('shape', 'square');
    await fixture.whenStable();

    const classes = nativeButton().classList;

    expect(classes).toContain('sheep-button--solid');
    expect(classes).toContain('sheep-button--danger');
    expect(classes).toContain('sheep-button--lg');
    expect(classes).toContain('sheep-button--square');
    expect(classes).not.toContain('sheep-button--outline');
  });

  it('exposes no per-instance style hooks', () => {
    // The spec is deliberate: appearance is not a call-site concern. If this
    // ever fails, someone has reintroduced an override property.
    const style = nativeButton().getAttribute('style');

    expect(style).toBeNull();
  });

  it('disables the native button', async () => {
    expect(nativeButton().disabled).toBe(false);

    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();

    expect(nativeButton().disabled).toBe(true);
  });

  it('marks a loading button busy and blocks interaction', async () => {
    fixture.componentRef.setInput('loading', true);
    await fixture.whenStable();

    expect(nativeButton().disabled).toBe(true);
    expect(nativeButton().getAttribute('aria-busy')).toBe('true');
    expect(nativeButton().classList).toContain('sheep-button--loading');
  });

  it('omits aria-busy when idle', () => {
    expect(nativeButton().hasAttribute('aria-busy')).toBe(false);
  });

  it('forwards the accessible name', async () => {
    fixture.componentRef.setInput('ariaLabel', 'Delete project');
    await fixture.whenStable();

    expect(nativeButton().getAttribute('aria-label')).toBe('Delete project');
  });

  it('focuses the native button', () => {
    component.focus();

    expect(document.activeElement).toBe(nativeButton());
  });
});

@Component({
  imports: [SheepButtonComponent],
  template: `
    <sheep-button [disabled]="disabled()" (click)="clicks = clicks + 1">
      <span sheepButtonStart data-testid="start">*</span>
      Save changes
      <span sheepButtonEnd data-testid="end">*</span>
    </sheep-button>
  `,
})
class HostComponent {
  readonly disabled = signal(false);
  clicks = 0;
}

describe('SheepButtonComponent (projection and events)', () => {
  let fixture: ComponentFixture<HostComponent>;

  const nativeButton = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('button');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
  });

  it('projects the label and both icon slots', () => {
    const button = nativeButton();

    expect(
      button.querySelector('.sheep-button__label')?.textContent?.trim(),
    ).toBe('Save changes');
    expect(
      button.querySelector('.sheep-button__slot--start [data-testid="start"]'),
    ).toBeTruthy();
    expect(
      button.querySelector('.sheep-button__slot--end [data-testid="end"]'),
    ).toBeTruthy();
  });

  it('bubbles clicks to the host element', async () => {
    nativeButton().click();
    await fixture.whenStable();

    expect(fixture.componentInstance.clicks).toBe(1);
  });

  it('does not emit clicks while disabled', async () => {
    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();

    expect(nativeButton().disabled).toBe(true);

    nativeButton().click();
    await fixture.whenStable();

    expect(fixture.componentInstance.clicks).toBe(0);
  });
});
