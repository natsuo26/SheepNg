import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormField,
  disabled,
  email,
  form,
  minLength,
  required,
} from '@angular/forms/signals';
import { SHEEP_INPUT } from './sheep-input.imports';
import { SheepInputComponent } from './sheep-input.component';
import { provideSheepInputMessages } from './sheep-input.messages';
import type { SheepFieldValidator } from './directives/sheep-input-validate.directive';

/** Every query a test needs, against whichever host is mounted. */
const input = (fixture: ComponentFixture<unknown>): HTMLInputElement =>
  fixture.nativeElement.querySelector('input');

const label = (fixture: ComponentFixture<unknown>): HTMLLabelElement =>
  fixture.nativeElement.querySelector('label');

const errorText = (fixture: ComponentFixture<unknown>): string | null =>
  fixture.nativeElement
    .querySelector('.sheep-input__error')
    ?.textContent.trim() ?? null;

const action = (fixture: ComponentFixture<unknown>): HTMLButtonElement =>
  fixture.nativeElement.querySelector('.sheep-input__action');

const status = (fixture: ComponentFixture<unknown>): string | null =>
  fixture.nativeElement
    .querySelector('.sheep-input__status')
    ?.textContent.trim() ?? null;

const type = async (
  fixture: ComponentFixture<unknown>,
  value: string,
): Promise<void> => {
  const el = input(fixture);
  el.value = value;
  el.dispatchEvent(new Event('input'));
  await fixture.whenStable();
};

const blur = async (fixture: ComponentFixture<unknown>): Promise<void> => {
  input(fixture).dispatchEvent(new Event('blur'));
  await fixture.whenStable();
};

describe('SheepInputComponent', () => {
  describe('on its own', () => {
    let fixture: ComponentFixture<SheepInputComponent>;
    let component: SheepInputComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SheepInputComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(SheepInputComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('renders a native text input', () => {
      expect(input(fixture)).toBeTruthy();
      expect(input(fixture).getAttribute('type')).toBe('text');
    });

    it('defaults to the underline variant at md', () => {
      const classes: DOMTokenList = fixture.nativeElement.classList;

      expect(classes).toContain('sheep-input');
      expect(classes).toContain('sheep-input--underline');
      expect(classes).toContain('sheep-input--md');
    });

    it('points the label at the input it labels', () => {
      expect(label(fixture).getAttribute('for')).toBe(input(fixture).id);
      expect(input(fixture).id).toBeTruthy();
    });

    it('gives each field its own ids', async () => {
      const other = TestBed.createComponent(SheepInputComponent);
      await other.whenStable();

      expect(input(other).id).not.toBe(input(fixture).id);
    });

    it('rests the label inside the box until there is a reason to lift it', async () => {
      // The label is the placeholder until the field is in use, and its home
      // is the row above the box. Nothing about the box moves either way.
      expect(fixture.nativeElement.classList).not.toContain(
        'sheep-input--floated',
      );

      input(fixture).dispatchEvent(new Event('focus'));
      await fixture.whenStable();
      expect(fixture.nativeElement.classList).toContain(
        'sheep-input--floated',
      );

      await blur(fixture);
      expect(fixture.nativeElement.classList).not.toContain(
        'sheep-input--floated',
      );
    });

    it('keeps the label lifted once the field has a value', async () => {
      await type(fixture, 'ewe');
      await blur(fixture);

      expect(fixture.nativeElement.classList).toContain(
        'sheep-input--floated',
      );
    });

    it('lifts the label for good when there is a placeholder under it', async () => {
      fixture.componentRef.setInput('placeholder', 'you@example.com');
      await fixture.whenStable();

      // Otherwise the two would print on top of each other, and the
      // placeholder is the one the caller asked for.
      expect(fixture.nativeElement.classList).toContain(
        'sheep-input--floated',
      );
    });

    it('exposes no per-instance style hooks', () => {
      // The spec is deliberate: appearance is not a call-site concern. If this
      // ever fails, someone has reintroduced an override property.
      expect(fixture.nativeElement.getAttribute('style')).toBeNull();
      expect(input(fixture).getAttribute('style')).toBeNull();
    });

    it('writes typing back through the value model', async () => {
      await type(fixture, 'ewe');

      expect(component.value()).toBe('ewe');
    });

    it('pushes a value set from outside into the input', async () => {
      fixture.componentRef.setInput('value', 'ram');
      await fixture.whenStable();

      expect(input(fixture).value).toBe('ram');
    });

    it('disables the native input', async () => {
      expect(input(fixture).disabled).toBe(false);

      fixture.componentRef.setInput('disabled', true);
      await fixture.whenStable();

      expect(input(fixture).disabled).toBe(true);
      expect(fixture.nativeElement.classList).toContain(
        'sheep-input--disabled',
      );
    });

    it('keeps a readonly field focusable', async () => {
      fixture.componentRef.setInput('readonly', true);
      await fixture.whenStable();

      expect(input(fixture).readOnly).toBe(true);
      expect(input(fixture).disabled).toBe(false);
    });

    it('forwards the native constraints to the input', async () => {
      fixture.componentRef.setInput('required', true);
      fixture.componentRef.setInput('minLength', 3);
      fixture.componentRef.setInput('maxLength', 12);
      fixture.componentRef.setInput('pattern', [/^[a-z]+$/]);
      await fixture.whenStable();

      expect(input(fixture).required).toBe(true);
      expect(input(fixture).getAttribute('minlength')).toBe('3');
      expect(input(fixture).getAttribute('maxlength')).toBe('12');
      expect(input(fixture).getAttribute('pattern')).toBe('^[a-z]+$');
    });

    it('emits touch on blur', async () => {
      let touched = 0;
      component.touch.subscribe(() => touched++);

      await blur(fixture);

      expect(touched).toBe(1);
    });

    it('holds errors back until the field has been left', async () => {
      fixture.componentRef.setInput('errors', [{ kind: 'required' }]);
      await fixture.whenStable();

      expect(errorText(fixture)).toBeNull();
      expect(input(fixture).getAttribute('aria-invalid')).toBeNull();

      await blur(fixture);

      expect(errorText(fixture)).toBe('This field is required.');
      expect(input(fixture).getAttribute('aria-invalid')).toBe('true');
    });

    it('shows errors immediately when the caller says the field is touched', async () => {
      fixture.componentRef.setInput('errors', [
        { kind: 'server', message: 'That name is taken.' },
      ]);
      fixture.componentRef.setInput('touched', true);
      await fixture.whenStable();

      expect(errorText(fixture)).toBe('That name is taken.');
    });

    it("prefers an error's own message over the message table", async () => {
      fixture.componentRef.setInput('errors', [
        { kind: 'required', message: 'We need your name.' },
      ]);
      fixture.componentRef.setInput('touched', true);
      await fixture.whenStable();

      expect(errorText(fixture)).toBe('We need your name.');
    });

    it('renders nothing for an error kind with no message rather than the kind', async () => {
      fixture.componentRef.setInput('errors', [{ kind: 'mystery' }]);
      fixture.componentRef.setInput('touched', true);
      await fixture.whenStable();

      expect(errorText(fixture)).toBe('');
      expect(fixture.nativeElement.textContent).not.toContain('mystery');
    });

    it('points aria-describedby at the error while one is showing', async () => {
      const hintId = input(fixture).getAttribute('aria-describedby');
      expect(hintId).toBeTruthy();

      fixture.componentRef.setInput('errors', [{ kind: 'required' }]);
      fixture.componentRef.setInput('touched', true);
      await fixture.whenStable();

      const errorId = input(fixture).getAttribute('aria-describedby');
      expect(errorId).not.toBe(hintId);
      expect(
        fixture.nativeElement.querySelector('.sheep-input__error').id,
      ).toBe(errorId);
    });

    it('forgets the blur it has seen when reset', async () => {
      fixture.componentRef.setInput('errors', [{ kind: 'required' }]);
      await blur(fixture);
      expect(errorText(fixture)).not.toBeNull();

      component.reset();
      await fixture.whenStable();

      expect(errorText(fixture)).toBeNull();
    });

    it('forwards focus to the native input', () => {
      component.focus();

      expect(document.activeElement).toBe(input(fixture));
    });
  });

  describe('feature directives', () => {
    // A behaviour directive matches on the bare attribute, so each feature
    // gets its own host rather than one host toggling attributes it cannot.

    @Component({
      imports: [SHEEP_INPUT],
      template: `<sheep-input sheepPassword ariaLabel="Password" />`,
    })
    class PasswordHost {}

    @Component({
      imports: [SHEEP_INPUT],
      template: `
        <sheep-input sheepCounter [maxLength]="max()" ariaLabel="Bio" />
      `,
    })
    class CounterHost {
      readonly max = signal<number | undefined>(undefined);
    }

    @Component({
      imports: [SHEEP_INPUT],
      template: `<sheep-input sheepEmail ariaLabel="Email" />`,
    })
    class EmailHost {}

    it('sheepPassword masks the value and offers a reveal toggle', async () => {
      await TestBed.configureTestingModule({
        imports: [PasswordHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(PasswordHost);
      await fixture.whenStable();

      expect(input(fixture).getAttribute('type')).toBe('password');
      expect(action(fixture).getAttribute('aria-pressed')).toBe('false');
      expect(action(fixture).getAttribute('aria-label')).toBe('Show password');

      action(fixture).click();
      await fixture.whenStable();

      expect(input(fixture).getAttribute('type')).toBe('text');
      expect(action(fixture).getAttribute('aria-pressed')).toBe('true');
      expect(action(fixture).getAttribute('aria-label')).toBe('Hide password');
    });

    it('sheepCounter counts, against the limit when there is one', async () => {
      await TestBed.configureTestingModule({
        imports: [CounterHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(CounterHost);
      await fixture.whenStable();

      await type(fixture, 'abcd');
      expect(status(fixture)).toBe('4');

      fixture.componentInstance.max.set(10);
      await fixture.whenStable();

      expect(status(fixture)).toBe('4/10');
    });

    it('sheepEmail sets the type and the keyboard hints', async () => {
      await TestBed.configureTestingModule({
        imports: [EmailHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(EmailHost);
      await fixture.whenStable();

      expect(input(fixture).getAttribute('type')).toBe('email');
      expect(input(fixture).getAttribute('inputmode')).toBe('email');
      expect(input(fixture).getAttribute('autocapitalize')).toBe('none');
      expect(input(fixture).getAttribute('spellcheck')).toBe('false');
    });

    it('sheepEmail rejects a bad address but not an empty one', async () => {
      await TestBed.configureTestingModule({
        imports: [EmailHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(EmailHost);
      await fixture.whenStable();

      await blur(fixture);
      expect(errorText(fixture)).toBeNull();

      await type(fixture, 'not-an-address');
      expect(errorText(fixture)).toBe('Enter a valid email address.');

      await type(fixture, 'shepherd@sheep.ng');
      expect(errorText(fixture)).toBeNull();
    });
  });

  describe('sheepValidate', () => {
    @Component({
      imports: [SHEEP_INPUT],
      template: `<sheep-input [sheepValidate]="rule()" />`,
    })
    class Host {
      readonly rule = signal<SheepFieldValidator>(() => null);
    }

    let fixture: ComponentFixture<Host>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
      fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
    });

    it('takes a returned string as the message', async () => {
      fixture.componentInstance.rule.set((value) =>
        value.includes(' ') ? 'No spaces, please.' : null,
      );
      await blur(fixture);
      await type(fixture, 'two words');

      expect(errorText(fixture)).toBe('No spaces, please.');
    });

    it('resolves a returned kind through the message table', async () => {
      fixture.componentInstance.rule.set(() => ({ kind: 'required' }));
      await blur(fixture);

      expect(errorText(fixture)).toBe('This field is required.');
    });
  });

  describe('localisation', () => {
    it('takes overridden messages from the injector, keeping the rest', async () => {
      await TestBed.configureTestingModule({
        imports: [SheepInputComponent],
        providers: [
          provideSheepInputMessages({
            errors: { required: 'Bitte ausfüllen.' },
          }),
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(SheepInputComponent);
      fixture.componentRef.setInput('touched', true);
      fixture.componentRef.setInput('errors', [
        { kind: 'required' },
        { kind: 'email' },
      ]);
      await fixture.whenStable();

      expect(errorText(fixture)).toContain('Bitte ausfüllen.');
      expect(errorText(fixture)).toContain('Enter a valid email address.');
    });
  });

  describe('bound to a signal form', () => {
    @Component({
      imports: [SHEEP_INPUT, FormField],
      template: `
        <sheep-input [formField]="f.email">
          <span sheepInputLabel>Email</span>
        </sheep-input>
      `,
    })
    class Host {
      readonly model = signal({ email: '' });
      readonly f = form(this.model, (path) => {
        required(path.email, { message: 'An email is required.' });
        email(path.email);
        minLength(path.email, 6);
        // Nothing at the call site says `disabled`: the schema does, and the
        // control has to follow.
        disabled(path.email, ({ value }) => value().startsWith('locked'));
      });
    }

    let fixture: ComponentFixture<Host>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
      fixture = TestBed.createComponent(Host);
      await fixture.whenStable();
    });

    it('binds the schema constraints onto the native input', () => {
      expect(input(fixture).required).toBe(true);
      expect(input(fixture).getAttribute('minlength')).toBe('6');
    });

    it('carries typing into the form model', async () => {
      await type(fixture, 'shepherd@sheep.ng');

      expect(fixture.componentInstance.model().email).toBe(
        'shepherd@sheep.ng',
      );
    });

    it("renders the form's errors, once the field has been left", async () => {
      expect(errorText(fixture)).toBeNull();

      await blur(fixture);

      expect(errorText(fixture)).toContain('An email is required.');
    });

    it('clears the error when the value satisfies the schema', async () => {
      await blur(fixture);
      await type(fixture, 'shepherd@sheep.ng');

      expect(errorText(fixture)).toBeNull();
      expect(fixture.componentInstance.f.email().valid()).toBe(true);
    });

    it('takes disabled state from the schema, with no input at the call site', async () => {
      expect(input(fixture).disabled).toBe(false);

      fixture.componentInstance.model.set({ email: 'locked@sheep.ng' });
      await fixture.whenStable();

      expect(input(fixture).disabled).toBe(true);
    });
  });
});

describe('sheepNumber', () => {
  @Component({
    imports: [SHEEP_INPUT],
    template: `
      <sheep-input
        sheepNumber
        ariaLabel="Amount"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [(value)]="value"
      />
    `,
  })
  class Host {
    readonly min = signal<number | undefined>(0);
    readonly max = signal<number | undefined>(10);
    readonly step = signal<number | undefined>(undefined);
    readonly value = signal('');
  }

  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  /**
   * Dispatches the `beforeinput` the browser would send for typing `data` at
   * the end of the current value, and reports whether it was let through.
   */
  const offer = (data: string): boolean => {
    const el = input(fixture);
    el.setSelectionRange(el.value.length, el.value.length);
    const event = new InputEvent('beforeinput', {
      data,
      inputType: 'insertText',
      cancelable: true,
    });
    el.dispatchEvent(event);
    return !event.defaultPrevented;
  };

  const press = async (key: string): Promise<void> => {
    input(fixture).dispatchEvent(
      new KeyboardEvent('keydown', { key, cancelable: true }),
    );
    await fixture.whenStable();
  };

  it('stays a text input, so the wheel and the browser parser stay out of it', () => {
    expect(input(fixture).getAttribute('type')).toBe('text');
  });

  it('asks for the number pad that fits the range and step', async () => {
    expect(input(fixture).getAttribute('inputmode')).toBe('decimal');

    host.step.set(1);
    await fixture.whenStable();
    expect(input(fixture).getAttribute('inputmode')).toBe('numeric');

    // Neither phone pad has a minus key, so a field that takes negatives
    // keeps the full keyboard.
    host.min.set(-5);
    await fixture.whenStable();
    expect(input(fixture).hasAttribute('inputmode')).toBe(false);
  });

  it('refuses keystrokes that could not become a number', async () => {
    expect(offer('a')).toBe(false);
    expect(offer('e')).toBe(false);
    expect(offer('-')).toBe(false); // min is 0
    expect(offer('4')).toBe(true);

    await type(fixture, '4.');
    expect(offer('.')).toBe(false); // a second point
    expect(offer('5')).toBe(true);
  });

  it('lets a minus through when min allows it, and a point only when step does', async () => {
    host.min.set(undefined);
    host.step.set(1);
    await fixture.whenStable();

    expect(offer('-')).toBe(true);
    expect(offer('.')).toBe(false);
  });

  it('flags a value outside the range or off the step grid once touched', async () => {
    await type(fixture, '11');
    await blur(fixture);
    expect(errorText(fixture)).toBe('This is above the allowed maximum.');

    host.step.set(0.5);
    await type(fixture, '2.25');
    expect(errorText(fixture)).toBe('This is not one of the allowed values.');

    await type(fixture, '2.5');
    expect(errorText(fixture)).toBeNull();
  });

  it('does not treat an empty field as an error', async () => {
    await blur(fixture);
    expect(errorText(fixture)).toBeNull();
  });

  it('flags pasted text that is not a number', async () => {
    // A value set without a beforeinput — a paste with no data, a form reset —
    // still goes through the check.
    await type(fixture, '1-2');
    await blur(fixture);
    expect(errorText(fixture)).toBe('Enter a number.');
  });

  it('steps with the arrow keys, held inside min and max', async () => {
    host.step.set(0.1);
    await fixture.whenStable();

    await press('ArrowUp');
    expect(host.value()).toBe('0');

    await press('ArrowUp');
    await press('ArrowUp');
    await press('ArrowUp');
    // Printed clean, not 0.30000000000000004.
    expect(host.value()).toBe('0.3');

    await press('ArrowDown');
    await press('ArrowDown');
    await press('ArrowDown');
    await press('ArrowDown');
    expect(host.value()).toBe('0');

    host.value.set('9.95');
    await fixture.whenStable();
    await press('ArrowUp');
    expect(host.value()).toBe('10');
  });

  it('leaves the arrows alone on a field that is not a number', async () => {
    @Component({
      imports: [SHEEP_INPUT],
      template: `<sheep-input ariaLabel="Name" [(value)]="value" />`,
    })
    class Plain {
      readonly value = signal('7');
    }

    const plain = TestBed.createComponent(Plain);
    await plain.whenStable();
    const event = new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true });
    input(plain).dispatchEvent(event);
    await plain.whenStable();

    expect(event.defaultPrevented).toBe(false);
    expect(plain.componentInstance.value()).toBe('7');
  });
});
