import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  FormField,
  email,
  form,
  minLength,
  pattern,
  required,
  submit,
} from '@angular/forms/signals';
import {
  SheepButtonComponent,
  SHEEP_TEXT_FIELD,
  SHEEP_TEXT_FIELD_SIZES,
  SHEEP_TEXT_FIELD_VARIANTS,
  type SheepFieldValidator,
  type SheepTextFieldSize,
  type SheepTextFieldVariant,
} from '@sheep-ng/ui';

/** Names the sign-up demo refuses, so the custom rule has something to say. */
const TAKEN = new Set(['admin', 'root', 'sheep']);

/**
 * Showcase for `sheep-text-field`.
 *
 * The page is semantic HTML dressed by the demo page kit — see
 * `libs/demo/src/styles/_demo-kit.scss`. That layout vocabulary is
 * documentation chrome and stays inside this library: `@sheep-ng/ui` ships
 * components and a theme, never a way to lay out a page.
 */
@Component({
  selector: 'sheep-demo-text-field',
  imports: [SHEEP_TEXT_FIELD, SheepButtonComponent, FormField],
  templateUrl: './text-field-demo.html',
  styleUrl: './text-field-demo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextFieldDemo {
  protected readonly sizes: readonly SheepTextFieldSize[] =
    SHEEP_TEXT_FIELD_SIZES;
  protected readonly variants: readonly SheepTextFieldVariant[] =
    SHEEP_TEXT_FIELD_VARIANTS;

  /** Section order and copy, so the template stays structural. */
  protected readonly sections: readonly {
    id: string;
    heading: string;
    note: string;
  }[] = [
    {
      id: 'anatomy',
      heading: 'Anatomy',
      note: 'A label, a box and a footer. The field owns all three and the id, aria-describedby and aria-invalid between them — the call site never wires an input to its own label.',
    },
    {
      id: 'sizes',
      heading: 'Sizes',
      note: 'The same three control metrics a button sits on, so a field and a button line up on one row without either being nudged.',
    },
    {
      id: 'variants',
      heading: 'Variants',
      note: 'outline is the default and the library signature. soft sinks the field into a filled well, for a dense form where a page of outlines would read as a grid of boxes.',
    },
    {
      id: 'states',
      heading: 'States',
      note: 'disabled blocks focus outright; readonly keeps the value selectable and copyable. pending is for an async rule still in flight.',
    },
    {
      id: 'affixes',
      heading: 'Prefixes and suffixes',
      note: 'Content inside the box, either side of the value. It sits outside the input, so it is never in the value and never in the tab order.',
    },
    {
      id: 'directives',
      heading: 'Behaviour is a directive',
      note: 'The field is a value and a box. Masking, address validation and counting arrive as directives on the host element, so a plain field carries none of their weight.',
    },
    {
      id: 'validation',
      heading: 'Rules of your own',
      note: 'sheepValidate takes a function of the value. Return a string to say what is wrong, or nothing at all.',
    },
    {
      id: 'forms',
      heading: 'Signal forms',
      note: 'The field implements FormValueControl<string>, so [formField] binds it end to end: value, errors, required, minlength, disabled, touched. Nothing else appears at the call site.',
    },
    {
      id: 'messages',
      heading: 'Messages',
      note: 'Error text resolves from the error itself, then from an injectable table. Localising the component is one provider.',
    },
    {
      id: 'api',
      heading: 'API',
      note: 'Two appearance inputs, the control contract, and eight directives. Nothing here is a style hook.',
    },
  ];

  // --- anatomy / states -----------------------------------------------------

  protected readonly displayName = signal('Bo Peep');
  protected readonly readonlyValue = signal('flock-2f9c1a');
  protected readonly pendingValue = signal('shepherd');

  // --- directives -----------------------------------------------------------

  protected readonly password = signal('');
  protected readonly emailValue = signal('');
  protected readonly bio = signal('Keeps sheep.');

  // --- custom validation ----------------------------------------------------

  protected readonly handle = signal('admin');

  /**
   * A rule written where it is used. The empty case is left to `required`, so
   * a blank field says one thing rather than two.
   */
  protected readonly notTaken: SheepFieldValidator = (value) =>
    TAKEN.has(value.trim().toLowerCase())
      ? `“${value.trim()}” is already taken.`
      : null;

  // --- signal forms ---------------------------------------------------------

  protected readonly signUp = signal({ email: '', password: '', workspace: '' });

  /**
   * The whole form. Every rule lives here — the template below carries three
   * `[formField]` bindings and nothing else, because validity is the form's
   * business and not the control's.
   */
  protected readonly signUpForm = form(this.signUp, (path) => {
    required(path.email, { message: 'We need an address to reach you.' });
    email(path.email);

    required(path.password);
    minLength(path.password, 10, {
      message: 'Use at least 10 characters.',
    });

    required(path.workspace);
    pattern(path.workspace, /^[a-z0-9-]+$/, {
      message: 'Lowercase letters, numbers and hyphens only.',
    });
  });

  protected readonly submitted = signal<string | null>(null);

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.submitted.set(null);
    await submit(this.signUpForm, async () => {
      this.submitted.set(JSON.stringify(this.signUp(), null, 2));
      return undefined;
    });
  }

  // --- reference ------------------------------------------------------------

  /** The public API, rendered from one source so it cannot drift from the code. */
  protected readonly api: readonly {
    name: string;
    default: string;
    type: string;
  }[] = [
    { name: 'variant', default: "'outline'", type: "'outline' | 'soft'" },
    { name: 'size', default: "'md'", type: "'sm' | 'md' | 'lg'" },
    {
      name: 'type',
      default: "'text'",
      type: "'text' | 'password' | 'email' | 'search' | 'tel' | 'url'",
    },
    { name: 'value', default: "''", type: 'model<string> — two-way' },
    { name: 'placeholder', default: 'null', type: 'string | null' },
    { name: 'autocomplete', default: 'null', type: 'string | null' },
    { name: 'ariaLabel', default: 'null', type: 'string | null — when unlabelled' },
    { name: 'disabled', default: 'false', type: 'boolean attribute' },
    { name: 'readonly', default: 'false', type: 'boolean attribute' },
    { name: 'required', default: 'false', type: 'boolean attribute' },
    { name: 'pending', default: 'false', type: 'boolean attribute' },
    { name: 'touched', default: 'false', type: 'boolean attribute — gates errors' },
    { name: 'invalid', default: 'false', type: 'boolean attribute' },
    { name: 'errors', default: '[]', type: 'ValidationError[] — bound by [formField]' },
    { name: 'name', default: "''", type: 'string' },
    { name: 'minLength / maxLength', default: 'undefined', type: 'number' },
    { name: 'pattern', default: '[]', type: 'RegExp[]' },
    { name: '(touch)', default: '—', type: 'output<void> — emitted on blur' },
    { name: 'sheepTextFieldLabel', default: '—', type: 'the label' },
    { name: 'sheepTextFieldHint', default: '—', type: 'guidance under the field' },
    { name: 'sheepTextFieldPrefix', default: '—', type: 'content before the value' },
    { name: 'sheepTextFieldSuffix', default: '—', type: 'content after the value' },
    { name: 'sheepPassword', default: '—', type: 'mask plus a reveal toggle' },
    { name: 'sheepEmail', default: '—', type: 'email type, hints and check' },
    { name: 'sheepCounter', default: '—', type: 'a count in the footer' },
    { name: 'sheepValidate', default: '—', type: '(value: string) => string | null' },
    {
      name: 'SHEEP_TEXT_FIELD_MESSAGES',
      default: 'English',
      type: 'error text and toggle labels',
    },
  ];

  protected readonly anatomySnippet = `<sheep-text-field [(value)]="name" required>
  <span sheepTextFieldLabel>Display name</span>
  <span sheepTextFieldHint>Shown on your profile.</span>
</sheep-text-field>

/* No [id], no [for], no aria-describedby.
   The field wires its own parts together. */`;

  protected readonly directivesSnippet = `<sheep-text-field sheepPassword autocomplete="new-password">
  <span sheepTextFieldLabel>Password</span>
</sheep-text-field>

<sheep-text-field sheepEmail autocomplete="email">
  <span sheepTextFieldLabel>Email</span>
</sheep-text-field>

<sheep-text-field sheepCounter [maxLength]="120">
  <span sheepTextFieldLabel>Bio</span>
</sheep-text-field>

/* Each directive sets the type it owns, so there is
   no type="password" beside sheepPassword to drift. */`;

  protected readonly validationSnippet = `protected readonly notTaken: SheepFieldValidator = (value) =>
  TAKEN.has(value.toLowerCase()) ? \`“\${value}” is already taken.\` : null;`;

  protected readonly validationTemplate = `<sheep-text-field [sheepValidate]="notTaken">
  <span sheepTextFieldLabel>Handle</span>
</sheep-text-field>`;

  protected readonly formsSnippet = `readonly model = signal({ email: '', password: '' });

readonly f = form(this.model, (path) => {
  required(path.email, { message: 'We need an address to reach you.' });
  email(path.email);
  required(path.password);
  minLength(path.password, 10);
});`;

  protected readonly formsTemplate = `<form (submit)="onSubmit($event)">
  <sheep-text-field [formField]="f.email">
    <span sheepTextFieldLabel>Email</span>
  </sheep-text-field>

  <sheep-text-field [formField]="f.password" sheepPassword>
    <span sheepTextFieldLabel>Password</span>
  </sheep-text-field>

  <sheep-button type="submit">Create account</sheep-button>
</form>

/* required and minlength reach the input as real
   attributes; errors, touched and disabled come
   back the other way. */`;

  protected readonly messagesSnippet = `providers: [
  provideSheepTextFieldMessages({
    errors: { required: 'Bitte ausfüllen.' },
    showPassword: 'Passwort anzeigen',
    hidePassword: 'Passwort verbergen',
  }),
]

/* An error carrying its own message never reaches
   the table — that is what a validator's { message }
   option is for. */`;
}
