import { Directive, inject, signal } from '@angular/core';
import {
  SheepInputFeatures,
  type SheepInputAction,
  type SheepInputAttrs,
  type SheepInputFeature,
} from '../sheep-input.feature';
import { SHEEP_INPUT_MESSAGES } from '../sheep-input.messages';

/** An open eye, then an eye with a stroke through it. 24×24, stroked. */
const EYE = [
  'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z',
  'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
];
const EYE_OFF = [
  'M10.6 6.2A8.6 8.6 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-2.7 3.4',
  'M6.4 8A17 17 0 0 0 2.5 12S6 18 12 18a8.7 8.7 0 0 0 3.5-.7',
  'M10 10a2.8 2.8 0 0 0 4 4',
  'M3 3l18 18',
];

/**
 * Turns the field into a password field with a reveal toggle.
 *
 * ```html
 * <sheep-input sheepPassword autocomplete="current-password">
 *   <span sheepInputLabel>Password</span>
 * </sheep-input>
 * ```
 *
 * It sets the type itself, so there is no `type="password"` to keep in sync
 * beside it — masking and the affordance to unmask are one decision, and this
 * directive is where it is made. While revealed the input really is `type
 * ="text"`: nothing else unmasks a password field, and a fake mask would
 * defeat selection, autofill and the password manager.
 *
 * The toggle is a real focusable button so a keyboard user can reach it, but
 * it takes no focus on a mouse click, so the caret stays where it was
 * mid-word. Its accessible name comes from `SHEEP_INPUT_MESSAGES`.
 *
 * Leave `autocomplete` to the call site: only it knows whether this is the
 * password being entered (`current-password`) or chosen (`new-password`), and
 * getting that wrong is what makes a manager fill the wrong box.
 */
@Directive({
  selector: 'sheep-input[sheepPassword]',
})
export class SheepInputPasswordDirective implements SheepInputFeature {
  private readonly messages = inject(SHEEP_INPUT_MESSAGES);

  /** Whether the value is currently legible. Resets nowhere else. */
  private readonly revealed = signal(false);

  readonly attrs = (): SheepInputAttrs =>
    this.revealed()
      ? { type: 'text', autocapitalize: 'none', autocorrect: 'off', spellcheck: false }
      : { type: 'password' };

  readonly action = (): SheepInputAction => ({
    label: this.revealed()
      ? this.messages.hidePassword
      : this.messages.showPassword,
    icon: this.revealed() ? EYE_OFF : EYE,
    pressed: this.revealed(),
    run: () => this.revealed.update((on) => !on),
  });

  constructor() {
    inject(SheepInputFeatures).add(this);
  }
}
