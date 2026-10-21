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
  SHEEP_INPUT,
  SHEEP_INPUT_SIZES,
  SHEEP_INPUT_VARIANTS,
  type SheepFieldValidator,
  type SheepInputSize,
  type SheepInputVariant,
} from '@sheep-ng/ui';

/** Names the sign-up demo refuses, so the custom rule has something to say. */
const TAKEN = new Set(['admin', 'root', 'sheep']);

/**
 * Showcase for `sheep-input`.
 *
 * The page is semantic HTML dressed by the demo page kit — see
 * `libs/demo/src/styles/_demo-kit.scss`. That layout vocabulary is
 * documentation chrome and stays inside this library: `@sheep-ng/ui` ships
 * components and a theme, never a way to lay out a page.
 */
@Component({
  selector: 'sheep-demo-input',
  imports: [SHEEP_INPUT, SheepButtonComponent, FormField],
  templateUrl: './input-demo.html',
  styleUrl: './input-demo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputDemo {
  protected readonly sizes: readonly SheepInputSize[] =
    SHEEP_INPUT_SIZES;
  protected readonly variants: readonly SheepInputVariant[] =
    SHEEP_INPUT_VARIANTS;

  /** Section order and copy, so the template stays structural. */
  protected readonly sections: readonly {
    id: string;
    heading: string;
    note: string;
  }[] = [
    {
      id: 'anatomy',
      heading: 'Anatomy',
      note: 'A label, a rule and a footer. The field owns all three and the id, aria-describedby and aria-invalid between them — the call site never wires an input to its own label.',
    },
    {
      id: 'float',
      heading: 'The label floats',
      note: 'At rest the label stands in for a placeholder, inside the field. On focus, or once there is a value, it lifts to its row above. Only the label moves — the row keeps its height, so nothing below it shifts.  A leading prefix waits in the space the resting label occupies, and fades in as it lifts.',
    },
    {
      id: 'sizes',
      heading: 'Sizes',
      note: 'The same three sizes every control in the library takes. An underline field is shorter than a button of the same size on purpose: its height follows the type it holds, not the size of a thing you press. soft, which has a ground to fill, keeps the button height.',
    },
    {
      id: 'variants',
      heading: 'Variants',
      note: 'underline is the default: one hairline under the value, with empty space doing the framing. soft adds a sunk ground under the same rule, for a form dense enough that the rows need telling apart.',
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
      id: 'numbers',
      heading: 'Numbers',
      note: 'sheepNumber, not type="number". The keyboard is a number pad, keystrokes that could not become a number are refused, the arrow keys step, and min, max and step are checked. The mouse wheel is left to the page, and a typo is never silently read back as an empty field.',
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
  protected readonly emptyField = signal('');
  protected readonly filledField = signal('Cotswold');
  protected readonly readonlyValue = signal('flock-2f9c1a');
  protected readonly pendingValue = signal('shepherd');

  // --- directives -----------------------------------------------------------

  protected readonly password = signal('');
  protected readonly emailValue = signal('');
  protected readonly quantity = signal('1');
  protected readonly price = signal('');
  protected readonly offset = signal('0');
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

  protected readonly signUp = signal({
    email: '',
    password: '',
    workspace: '',
  });

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

  /**
   * The markup behind each specimen, keyed by section.
   *
   * Every example on the page is a few lines of HTML and nothing else, so the
   * page shows those lines rather than describing them. A section with its own
   * coupled code block is absent here — it already has one.
   */
  protected readonly snippets: Record<string, string> = {
    sizes: `<sheep-input size="sm">
  <span sheepInputLabel>Breed</span>
</sheep-input>

<sheep-input size="lg">
  <span sheepInputLabel>Breed</span>
</sheep-input>`,

    variants: `<sheep-input>
  <span sheepInputLabel>Pasture</span>
</sheep-input>

<sheep-input variant="soft">
  <span sheepInputLabel>Pasture</span>
</sheep-input>`,

    states: `<sheep-input disabled value="Locked by your admin">...</sheep-input>
<sheep-input readonly [(value)]="flockId">...</sheep-input>
<sheep-input pending [(value)]="username">...</sheep-input>

<sheep-input required touched [errors]="[{ kind: 'required' }]">
  <span sheepInputLabel>Farm name</span>
</sheep-input>`,

    affixes: `<sheep-input type="url" [(value)]="workspace">
  <span sheepInputLabel>Workspace</span>
  <span sheepInputPrefix>https://</span>
  <span sheepInputSuffix>.sheep.ng</span>
</sheep-input>

<sheep-input type="search" placeholder="Search the flock">
  <span sheepInputLabel>Search</span>
  <svg sheepInputPrefix viewBox="0 0 24 24">...</svg>
</sheep-input>`,

    api: `import { SHEEP_INPUT } from '@sheep-ng/ui';

@Component({ imports: [SHEEP_INPUT], ... })`,
  };

  /** The public API, rendered from one source so it cannot drift from the code. */
  protected readonly api: readonly {
    name: string;
    default: string;
    type: string;
  }[] = [
    { name: 'variant', default: "'underline'", type: "'underline' | 'soft'" },
    { name: 'size', default: "'md'", type: "'sm' | 'md' | 'lg'" },
    {
      name: 'type',
      default: "'text'",
      type: "'text' | 'password' | 'email' | 'search' | 'tel' | 'url'",
    },
    { name: 'value', default: "''", type: 'model<string> — two-way' },
    { name: 'placeholder', default: 'null', type: 'string | null' },
    { name: 'autocomplete', default: 'null', type: 'string | null' },
    {
      name: 'ariaLabel',
      default: 'null',
      type: 'string | null — when unlabelled',
    },
    { name: 'disabled', default: 'false', type: 'boolean attribute' },
    { name: 'readonly', default: 'false', type: 'boolean attribute' },
    { name: 'required', default: 'false', type: 'boolean attribute' },
    { name: 'pending', default: 'false', type: 'boolean attribute' },
    {
      name: 'touched',
      default: 'false',
      type: 'boolean attribute — gates errors',
    },
    { name: 'invalid', default: 'false', type: 'boolean attribute' },
    {
      name: 'errors',
      default: '[]',
      type: 'ValidationError[] — bound by [formField]',
    },
    { name: 'name', default: "''", type: 'string' },
    { name: 'minLength / maxLength', default: 'undefined', type: 'number' },
    { name: 'pattern', default: '[]', type: 'RegExp[]' },
    { name: '(touch)', default: '—', type: 'output<void> — emitted on blur' },
    { name: 'sheepInputLabel', default: '—', type: 'the label' },
    {
      name: 'sheepInputHint',
      default: '—',
      type: 'guidance under the field',
    },
    {
      name: 'sheepInputPrefix',
      default: '—',
      type: 'content before the value',
    },
    {
      name: 'sheepInputSuffix',
      default: '—',
      type: 'content after the value',
    },
    { name: 'sheepPassword', default: '—', type: 'mask plus a reveal toggle' },
    { name: 'sheepEmail', default: '—', type: 'email type, hints and check' },
    {
      name: 'sheepNumber min / max / step',
      default: '— / — / any',
      type: 'number pad, filter, arrow keys and check; value stays a string',
    },
    { name: 'sheepCounter', default: '—', type: 'a count in the footer' },
    {
      name: 'sheepValidate',
      default: '—',
      type: '(value: string) => string | null',
    },
    {
      name: 'SHEEP_INPUT_MESSAGES',
      default: 'English',
      type: 'error text and toggle labels',
    },
  ];

  protected readonly floatSnippet = `/* Nothing to turn on. A field given a
   placeholder keeps its label lifted for good —
   the two would otherwise print on top of each
   other, and the placeholder is the one that
   was asked for.

   A leading prefix keeps its width but fades
   out while the label rests over it, so the
   value never shifts sideways under the
   caret. */`;

  protected readonly anatomySnippet = `<sheep-input [(value)]="name" required>
  <span sheepInputLabel>Display name</span>
  <span sheepInputHint>Shown on your profile.</span>
</sheep-input>

/* No [id], no [for], no aria-describedby.
   The field wires its own parts together. */`;

  protected readonly directivesSnippet = `<sheep-input sheepPassword autocomplete="new-password">
  <span sheepInputLabel>Password</span>
</sheep-input>

<sheep-input sheepEmail autocomplete="email">
  <span sheepInputLabel>Email</span>
</sheep-input>

<sheep-input sheepCounter [maxLength]="120">
  <span sheepInputLabel>Bio</span>
</sheep-input>

/* Each directive sets the type it owns, so there is
   no type="password" beside sheepPassword to drift. */`;

  protected readonly numbersSnippet = `<sheep-input sheepNumber min="1" max="99" step="1" [(value)]="quantity">
  <span sheepInputLabel>Quantity</span>
</sheep-input>

<sheep-input sheepNumber min="0" step="0.01" [(value)]="price">
  <span sheepInputLabel>Price</span>
  <span sheepInputPrefix>$</span>
</sheep-input>

<sheep-input sheepNumber min="-12" max="14" [(value)]="offset">
  <span sheepInputLabel>UTC offset</span>
</sheep-input>

/* The value is a string, as typed - "" is nothing
   entered, not zero. Convert where it is used:
   Number(quantity()). */`;

  protected readonly validationSnippet = `protected readonly notTaken: SheepFieldValidator = (value) =>
  TAKEN.has(value.toLowerCase()) ? \`“\${value}” is already taken.\` : null;`;

  protected readonly validationTemplate = `<sheep-input [sheepValidate]="notTaken">
  <span sheepInputLabel>Handle</span>
</sheep-input>`;

  protected readonly formsSnippet = `readonly model = signal({ email: '', password: '' });

readonly f = form(this.model, (path) => {
  required(path.email, { message: 'We need an address to reach you.' });
  email(path.email);
  required(path.password);
  minLength(path.password, 10);
});`;

  protected readonly formsTemplate = `<form (submit)="onSubmit($event)">
  <sheep-input [formField]="f.email">
    <span sheepInputLabel>Email</span>
  </sheep-input>

  <sheep-input [formField]="f.password" sheepPassword>
    <span sheepInputLabel>Password</span>
  </sheep-input>

  <sheep-button type="submit">Create account</sheep-button>
</form>

/* required and minlength reach the input as real
   attributes; errors, touched and disabled come
   back the other way. */`;

  protected readonly messagesSnippet = `providers: [
  provideSheepInputMessages({
    errors: { required: 'Bitte ausfüllen.' },
    showPassword: 'Passwort anzeigen',
    hidePassword: 'Passwort verbergen',
  }),
]

/* An error carrying its own message never reaches
   the table — that is what a validator's { message }
   option is for. */`;
}
