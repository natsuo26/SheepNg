import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SheepChipComponent } from './sheep-chip.component';
import { SheepChipSetComponent } from './sheep-chip-set/sheep-chip-set.component';

describe('SheepChipComponent', () => {
  let fixture: ComponentFixture<SheepChipComponent>;
  let component: SheepChipComponent;

  const host = (): HTMLElement => fixture.nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SheepChipComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SheepChipComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults to an outline chip on the shared control scale', () => {
    const classes = host().classList;

    expect(classes).toContain('sheep-chip');
    expect(classes).toContain('sheep-chip--outline');
    expect(classes).toContain('sheep-chip--primary');
    expect(classes).toContain('sheep-chip--md');
  });

  it('reflects variant, tone and size onto the modifier classes', async () => {
    fixture.componentRef.setInput('variant', 'soft');
    fixture.componentRef.setInput('tone', 'success');
    fixture.componentRef.setInput('size', 'lg');
    await fixture.whenStable();

    const classes = host().classList;

    expect(classes).toContain('sheep-chip--soft');
    expect(classes).toContain('sheep-chip--success');
    expect(classes).toContain('sheep-chip--lg');
    expect(classes).not.toContain('sheep-chip--outline');
  });

  it('exposes no per-instance style hooks', () => {
    // The spec is deliberate: appearance is not a call-site concern. If this
    // ever fails, someone has reintroduced an override property.
    expect(host().getAttribute('style')).toBeNull();
  });

  it('claims no selection state until one is bound', () => {
    // The whole point of the three-state input: an action chip is not an
    // unpressed toggle, and must not be announced as one.
    expect(host().hasAttribute('aria-pressed')).toBe(false);
    expect(host().hasAttribute('aria-current')).toBe(false);
    expect(host().classList).not.toContain('sheep-chip--selected');
  });

  it('renders no remove button by default', () => {
    expect(host().querySelector('.sheep-chip__remove')).toBeNull();
  });
});

@Component({
  imports: [SheepChipComponent],
  template: `
    <button sheep-chip [selected]="selected()" (click)="clicks = clicks + 1">
      <span sheepChipStart data-testid="start">*</span>
      Archived
    </button>
  `,
})
class ButtonChipHost {
  readonly selected = signal<boolean | null>(false);
  clicks = 0;
}

describe('SheepChipComponent as a filter chip', () => {
  let fixture: ComponentFixture<ButtonChipHost>;

  const chip = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('button');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonChipHost],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonChipHost);
    await fixture.whenStable();
  });

  it('is a real button, with the chip painted onto it', () => {
    expect(chip().tagName).toBe('BUTTON');
    expect(chip().classList).toContain('sheep-chip');
  });

  it('announces its selection state as a pressed toggle', async () => {
    expect(chip().getAttribute('aria-pressed')).toBe('false');

    fixture.componentInstance.selected.set(true);
    await fixture.whenStable();

    expect(chip().getAttribute('aria-pressed')).toBe('true');
    expect(chip().classList).toContain('sheep-chip--selected');
  });

  it('shows a check when selected, so "on" survives without colour', async () => {
    expect(chip().querySelector('.sheep-chip__check')).toBeNull();

    fixture.componentInstance.selected.set(true);
    await fixture.whenStable();

    expect(chip().querySelector('.sheep-chip__check')).toBeTruthy();
  });

  it('projects the label and the leading slot', () => {
    expect(chip().querySelector('.sheep-chip__label')?.textContent?.trim()).toBe(
      'Archived',
    );
    expect(
      chip().querySelector('.sheep-chip__lead [data-testid="start"]'),
    ).toBeTruthy();
  });

  it('bubbles clicks to the host element', async () => {
    chip().click();
    await fixture.whenStable();

    expect(fixture.componentInstance.clicks).toBe(1);
  });

  it('does not emit clicks while natively disabled', async () => {
    chip().disabled = true;
    chip().click();
    await fixture.whenStable();

    expect(fixture.componentInstance.clicks).toBe(0);
  });
});

@Component({
  imports: [SheepChipComponent],
  template: `
    <a sheep-chip href="/tags/design" [selected]="selected()">Design</a>
  `,
})
class LinkChipHost {
  readonly selected = signal<boolean | null>(true);
}

describe('SheepChipComponent as a link chip', () => {
  let fixture: ComponentFixture<LinkChipHost>;

  const chip = (): HTMLAnchorElement =>
    fixture.nativeElement.querySelector('a');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkChipHost],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkChipHost);
    await fixture.whenStable();
  });

  it('is current rather than pressed — a link is where you are', async () => {
    expect(chip().getAttribute('aria-current')).toBe('true');
    expect(chip().hasAttribute('aria-pressed')).toBe(false);

    fixture.componentInstance.selected.set(false);
    await fixture.whenStable();

    expect(chip().hasAttribute('aria-current')).toBe(false);
  });
});

@Component({
  imports: [SheepChipComponent],
  template: `
    <sheep-chip
      removable
      [disabled]="disabled()"
      [removeLabel]="removeLabel()"
      (removed)="removed = removed + 1"
      >design</sheep-chip
    >
  `,
})
class RemovableChipHost {
  readonly disabled = signal(false);
  readonly removeLabel = signal<string | null>(null);
  removed = 0;
}

describe('SheepChipComponent as an input chip', () => {
  let fixture: ComponentFixture<RemovableChipHost>;

  const chip = (): HTMLElement =>
    fixture.nativeElement.querySelector('sheep-chip');
  const removeButton = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('.sheep-chip__remove');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemovableChipHost],
    }).compileComponents();

    fixture = TestBed.createComponent(RemovableChipHost);
    await fixture.whenStable();
  });

  it('renders the remove control as a real, separate button', () => {
    // Separate, not nested: a button inside a button is invalid HTML, which
    // is why `removable` is refused on the interactive host forms.
    expect(removeButton()).toBeTruthy();
    expect(removeButton().type).toBe('button');
    expect(removeButton().closest('button')).toBe(removeButton());
  });

  it('names the remove button from the chip it belongs to', () => {
    const labelledBy = removeButton().getAttribute('aria-labelledby')?.split(' ');
    const named = labelledBy?.map(
      (id) => fixture.nativeElement.querySelector(`#${id}`)?.textContent?.trim(),
    );

    // "Remove" then the chip's own label — so six removable chips do not
    // announce as six identical "Remove"s.
    expect(named).toEqual(['Remove', 'design']);
  });

  it('takes an explicit name instead when one is given', async () => {
    fixture.componentInstance.removeLabel.set('Remove filter: design');
    await fixture.whenStable();

    expect(removeButton().getAttribute('aria-label')).toBe(
      'Remove filter: design',
    );
    expect(removeButton().hasAttribute('aria-labelledby')).toBe(false);
  });

  it('reports the press without removing itself', async () => {
    removeButton().click();
    await fixture.whenStable();

    expect(fixture.componentInstance.removed).toBe(1);
    expect(chip()).toBeTruthy();
  });

  it('disables the remove button along with the chip', async () => {
    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();

    expect(removeButton().disabled).toBe(true);
    expect(chip().getAttribute('aria-disabled')).toBe('true');
    expect(chip().classList).toContain('sheep-chip--disabled');
  });
});

/**
 * The dev-mode checks.
 *
 * Both catch markup that looks perfectly fine on screen and fails only for
 * someone on a keyboard or a screen reader — the kind of mistake that survives
 * a review, which is what makes it worth a warning.
 */
@Component({
  imports: [SheepChipComponent],
  template: `
    @if (nested()) {
      <button sheep-chip removable>Nested</button>
    }
    @if (inertSelection()) {
      <sheep-chip [selected]="true">Inert</sheep-chip>
    }
    @if (fine()) {
      <button sheep-chip [selected]="false">Fine</button>
      <sheep-chip removable>Also fine</sheep-chip>
    }
  `,
})
class WarningHost {
  readonly nested = signal(false);
  readonly inertSelection = signal(false);
  readonly fine = signal(false);
}

describe('SheepChipComponent dev-mode checks', () => {
  let fixture: ComponentFixture<WarningHost>;
  let warn: ReturnType<typeof vi.spyOn>;

  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [WarningHost],
    }).compileComponents();

    fixture = TestBed.createComponent(WarningHost);
  });

  afterEach(() => warn.mockRestore());

  it('warns when a remove button would be nested inside a button', async () => {
    fixture.componentInstance.nested.set(true);
    await render();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('[removable] on a <button sheep-chip>'),
      expect.anything(),
    );
  });

  it('warns when a selectable chip is not something you can operate', async () => {
    fixture.componentInstance.inertSelection.set(true);
    await render();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('[selected] on a plain <sheep-chip>'),
      expect.anything(),
    );
  });

  it('says nothing about chips written correctly', async () => {
    fixture.componentInstance.fine.set(true);
    await render();

    expect(warn).not.toHaveBeenCalled();
  });
});

@Component({
  imports: [SheepChipComponent, SheepChipSetComponent],
  template: `
    <sheep-chip-set [ariaLabel]="label()">
      <button sheep-chip [selected]="true">Open</button>
      <button sheep-chip [selected]="false">Closed</button>
    </sheep-chip-set>
  `,
})
class ChipSetHost {
  readonly label = signal<string | null>('Status');
}

describe('SheepChipSetComponent', () => {
  let fixture: ComponentFixture<ChipSetHost>;
  let warn: ReturnType<typeof vi.spyOn>;

  const set = (): HTMLElement =>
    fixture.nativeElement.querySelector('sheep-chip-set');

  beforeEach(async () => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [ChipSetHost],
    }).compileComponents();

    fixture = TestBed.createComponent(ChipSetHost);
    await fixture.whenStable();
  });

  afterEach(() => warn.mockRestore());

  it('is a named group, which is the whole of what it adds', () => {
    expect(set().getAttribute('role')).toBe('group');
    expect(set().getAttribute('aria-label')).toBe('Status');
  });

  it('leaves every chip in the tab order', () => {
    // A row of toggle buttons is not a composite widget: no roving tabindex,
    // no arrow keys taken away from the browser.
    const chips = set().querySelectorAll('button.sheep-chip');

    expect(chips).toHaveLength(2);
    chips.forEach((chip) => expect(chip.hasAttribute('tabindex')).toBe(false));
  });

  it('warns about a group with no name', async () => {
    fixture.componentInstance.label.set(null);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('no accessible name'),
      expect.anything(),
    );
  });
});
