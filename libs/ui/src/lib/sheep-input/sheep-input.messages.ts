import { InjectionToken, type Provider } from '@angular/core';

/**
 * Every string `sheep-input` can put on screen without being handed it.
 *
 * There are only two sources of such text — the message under an errored field
 * and the accessible name of the password toggle — and they live together so
 * that localising the component is one provider, not a hunt.
 */
export interface SheepInputMessages {
  /**
   * Error text by `kind`.
   *
   * An error that carries its own `message` uses it and never reaches this
   * table; signal forms' validators take a `message` option for exactly that,
   * and it is the right place for anything value-specific. The table is the
   * fallback for the bare errors — `required()`, `email()` — where one sentence
   * serves every field in the app.
   *
   * A `kind` with no entry renders nothing rather than leaking the kind: a
   * field that goes red with no explanation is a bug worth seeing in review,
   * and `minLength` in the UI is worse than silence.
   */
  readonly errors: Readonly<Record<string, string>>;

  /** Accessible name of the password toggle while the value is masked. */
  readonly showPassword: string;

  /** Accessible name of the password toggle while the value is visible. */
  readonly hidePassword: string;
}

/** The shipped English strings. */
export const SHEEP_INPUT_DEFAULT_MESSAGES: SheepInputMessages = {
  errors: {
    required: 'This field is required.',
    email: 'Enter a valid email address.',
    minLength: 'This is too short.',
    maxLength: 'This is too long.',
    number: 'Enter a number.',
    min: 'This is below the allowed minimum.',
    max: 'This is above the allowed maximum.',
    step: 'This is not one of the allowed values.',
    pattern: 'This is not in the expected format.',
    parse: "This value can't be read.",
  },
  showPassword: 'Show password',
  hidePassword: 'Hide password',
};

/**
 * The message table every `sheep-input` in the injector resolves against.
 *
 * Root-provided with the English defaults, so the component works with no
 * setup. Override with `provideSheepInputMessages` — at the app's
 * providers to localise, or on a route or a component to reword one form.
 */
export const SHEEP_INPUT_MESSAGES =
  new InjectionToken<SheepInputMessages>('SHEEP_INPUT_MESSAGES', {
    providedIn: 'root',
    factory: () => SHEEP_INPUT_DEFAULT_MESSAGES,
  });

/**
 * Overrides some of the field's text, keeping the rest.
 *
 * ```ts
 * providers: [
 *   provideSheepInputMessages({
 *     errors: { required: 'Bitte ausfüllen.' },
 *     showPassword: 'Passwort anzeigen',
 *   }),
 * ]
 * ```
 *
 * `errors` merges key by key rather than replacing the table, so overriding one
 * kind does not silently drop the others.
 */
export function provideSheepInputMessages(
  overrides: Partial<SheepInputMessages>,
): Provider {
  return {
    provide: SHEEP_INPUT_MESSAGES,
    useValue: {
      ...SHEEP_INPUT_DEFAULT_MESSAGES,
      ...overrides,
      errors: {
        ...SHEEP_INPUT_DEFAULT_MESSAGES.errors,
        ...overrides.errors,
      },
    } satisfies SheepInputMessages,
  };
}
