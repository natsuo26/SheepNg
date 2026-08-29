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
import { SHEEP_TEXT_FIELD } from './sheep-text-field.imports';
import { SheepTextFieldComponent } from './sheep-text-field.component';
import { provideSheepTextFieldMessages } from './sheep-text-field.messages';
import type { SheepFieldValidator } from './directives/sheep-text-field-validate.directive';

/** Every query a test needs, against whichever host is mounted. */
const input = (fixture: ComponentFixture<unknown>): HTMLInputElement =>
  fixture.nativeElement.querySelector('input');

const label = (fixture: ComponentFixture<unknown>): HTMLLabelElement =>
  fixture.nativeElement.querySelector('label');

const errorText = (fixture: ComponentFixture<unknown>): string | null =>
  fixture.nativeElement
    .querySelector('.sheep-text-field__error')
    ?.textContent.trim() ?? null;

const action = (fixture: ComponentFixture<unknown>): HTMLButtonElement =>
  fixture.nativeElement.querySelector('.sheep-text-field__action');

const status = (fixture: ComponentFixture<unknown>): string | null =>
  fixture.nativeElement
    .querySelector('.sheep-text-field__status')
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

describe('SheepTextFieldComponent', () => {
  describe('on its own', () => {
    let fixture: ComponentFixture<SheepTextFieldComponent>;
    let component: SheepTextFieldComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SheepTextFieldComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(SheepTextFieldComponent);
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

    it('defaults to the outline variant at md — the library signature', () => {
      const classes: DOMTokenList = fixture.nativeElement.classList;

      expect(classes).toContain('sheep-text-field');
      expect(classes).toContain('sheep-text-field--outline');
      expect(classes).toContain('sheep-text-field--md');
    });

    it('points the label at the input it labels', () => {
      expect(label(fixture).getAttribute('for')).toBe(input(fixture).id);
      expect(input(fixture).id).toBeTruthy();
    });

    it('gives each field its own ids', async () => {
      const other = TestBed.createComponent(SheepTextFieldComponent);
      await other.whenStable();

      expect(input(other).id).not.toBe(input(fixture).id);
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
        'sheep-text-field--disabled',
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
        fixture.nativeElement.querySelector('.sheep-text-field__error').id,
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
      imports: [SHEEP_TEXT_FIELD],
      template: `<sheep-text-field sheepPassword ariaLabel="Password" />`,
    })
    class PasswordHost {}

    @Component({
      imports: [SHEEP_TEXT_FIELD],
      template: `
        <sheep-text-field sheepCounter [maxLength]="max()" ariaLabel="Bio" />
      `,
    })
    class CounterHost {
      readonly max = signal<number | undefined>(undefined);
    }

    @Component({
      imports: [SHEEP_TEXT_FIELD],
      template: `<sheep-text-field sheepEmail ariaLabel="Email" />`,
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
      imports: [SHEEP_TEXT_FIELD],
      template: `<sheep-text-field [sheepValidate]="rule()" />`,
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
        imports: [SheepTextFieldComponent],
        providers: [
          provideSheepTextFieldMessages({
            errors: { required: 'Bitte ausfüllen.' },
          }),
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(SheepTextFieldComponent);
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
      imports: [SHEEP_TEXT_FIELD, FormField],
      template: `
        <sheep-text-field [formField]="f.email">
          <span sheepTextFieldLabel>Email</span>
        </sheep-text-field>
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
