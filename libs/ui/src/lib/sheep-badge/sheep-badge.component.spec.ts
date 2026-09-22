import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SheepBadgeComponent } from './sheep-badge.component';

describe('SheepBadgeComponent', () => {
  let fixture: ComponentFixture<SheepBadgeComponent>;
  let component: SheepBadgeComponent;
  let warn: ReturnType<typeof vi.spyOn>;

  const host = (): HTMLElement => fixture.nativeElement;
  const label = (): HTMLElement | null =>
    host().querySelector('.sheep-badge__label');

  beforeEach(async () => {
    // The unlabelled default is the dev-mode warning's own case; the checks
    // for it live in their own suite below.
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [SheepBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SheepBadgeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('label', 'Passing');
    await fixture.whenStable();
  });

  afterEach(() => warn.mockRestore());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults to a neutral tint at md', () => {
    const classes = host().classList;

    expect(classes).toContain('sheep-badge');
    expect(classes).toContain('sheep-badge--neutral');
    expect(classes).toContain('sheep-badge--normal');
    expect(classes).toContain('sheep-badge--md');
    expect(classes).not.toContain('sheep-badge--icon-only');
  });

  it('renders the label', () => {
    expect(label()?.textContent?.trim()).toBe('Passing');
  });

  it('reflects tone, emphasis and size onto the modifier classes', async () => {
    fixture.componentRef.setInput('tone', 'danger');
    fixture.componentRef.setInput('emphasis', 'high');
    fixture.componentRef.setInput('size', 'sm');
    await fixture.whenStable();

    const classes = host().classList;

    expect(classes).toContain('sheep-badge--danger');
    expect(classes).toContain('sheep-badge--high');
    expect(classes).toContain('sheep-badge--sm');
    expect(classes).not.toContain('sheep-badge--normal');
  });

  it('takes a number as a label', async () => {
    fixture.componentRef.setInput('label', 7);
    await fixture.whenStable();

    expect(label()?.textContent?.trim()).toBe('7');
    expect(host().classList).not.toContain('sheep-badge--icon-only');
  });

  it('becomes an icon badge when the label is empty', async () => {
    fixture.componentRef.setInput('label', '   ');
    fixture.componentRef.setInput('ariaLabel', 'Needs review');
    await fixture.whenStable();

    expect(label()).toBeNull();
    expect(host().classList).toContain('sheep-badge--icon-only');
  });

  it('is an image with a name when it is an icon on its own', async () => {
    fixture.componentRef.setInput('label', null);
    fixture.componentRef.setInput('ariaLabel', 'Needs review');
    await fixture.whenStable();

    // aria-label on a bare span is unreliable; role="img" is what makes the
    // name land.
    expect(host().getAttribute('role')).toBe('img');
    expect(host().getAttribute('aria-label')).toBe('Needs review');
  });

  it('carries no role while the label speaks for it', () => {
    expect(host().hasAttribute('role')).toBe(false);
    expect(host().hasAttribute('aria-label')).toBe(false);
  });

  it('sets no colour properties until it is given a colour', () => {
    expect(host().getAttribute('style')).toBeNull();
  });

  it('writes the colour inputs out as the public custom properties', async () => {
    fixture.componentRef.setInput('color', '#0f6fff');
    fixture.componentRef.setInput('textColor', 'white');
    fixture.componentRef.setInput('iconColor', '#ffd400');
    await fixture.whenStable();

    // Deliberately the same three properties a stylesheet would set — one
    // mechanism, two doors into it.
    const style = host().style;

    expect(style.getPropertyValue('--sheep-badge-color')).toBe('#0f6fff');
    expect(style.getPropertyValue('--sheep-badge-text')).toBe('white');
    expect(style.getPropertyValue('--sheep-badge-icon')).toBe('#ffd400');
  });

  it('takes a colour back off when the input is cleared', async () => {
    fixture.componentRef.setInput('color', '#0f6fff');
    await fixture.whenStable();

    fixture.componentRef.setInput('color', null);
    await fixture.whenStable();

    expect(host().style.getPropertyValue('--sheep-badge-color')).toBe('');
  });

  it('exposes nothing but colour', async () => {
    fixture.componentRef.setInput('color', 'rebeccapurple');
    await fixture.whenStable();

    // Shape stays the spec's: no padding, radius, font or border hook. If this
    // ever fails, the one deliberate exception has started spreading.
    const declared = Array.from(host().style);

    expect(declared).toEqual(['--sheep-badge-color']);
  });
});

@Component({
  imports: [SheepBadgeComponent],
  template: `
    <sheep-badge [label]="label()" ariaLabel="Build status">
      <svg sheepBadgeIcon data-testid="icon" viewBox="0 0 16 16"></svg>
    </sheep-badge>
  `,
})
class IconBadgeHost {
  readonly label = signal<string | null>('Passing');
}

describe('SheepBadgeComponent with an icon', () => {
  let fixture: ComponentFixture<IconBadgeHost>;

  const host = (): HTMLElement =>
    fixture.nativeElement.querySelector('sheep-badge');
  const slot = (): HTMLElement =>
    fixture.nativeElement.querySelector('.sheep-badge__icon');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconBadgeHost],
    }).compileComponents();

    fixture = TestBed.createComponent(IconBadgeHost);
    await fixture.whenStable();
  });

  it('projects the icon, and hides it from the name computation', () => {
    expect(slot().querySelector('[data-testid="icon"]')).toBeTruthy();
    expect(slot().getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps the icon and drops the pill when the label goes away', async () => {
    expect(host().classList).not.toContain('sheep-badge--icon-only');

    fixture.componentInstance.label.set(null);
    await fixture.whenStable();

    expect(host().classList).toContain('sheep-badge--icon-only');
    expect(slot().querySelector('[data-testid="icon"]')).toBeTruthy();
  });
});

describe('SheepBadgeComponent naming check', () => {
  let fixture: ComponentFixture<SheepBadgeComponent>;
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [SheepBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SheepBadgeComponent);
  });

  afterEach(() => warn.mockRestore());

  it('warns about a badge that announces as nothing at all', async () => {
    await fixture.whenStable();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('no [label] and no [ariaLabel]'),
      expect.anything(),
    );
  });

  it('stays quiet once there is a label', async () => {
    fixture.componentRef.setInput('label', 'Passing');
    await fixture.whenStable();

    expect(warn).not.toHaveBeenCalled();
  });

  it('stays quiet for an icon badge with a name', async () => {
    fixture.componentRef.setInput('ariaLabel', 'Needs review');
    await fixture.whenStable();

    expect(warn).not.toHaveBeenCalled();
  });
});
