import { SheepInputComponent } from './sheep-input.component';
import { SheepInputCounterDirective } from './directives/sheep-input-counter.directive';
import { SheepInputEmailDirective } from './directives/sheep-input-email.directive';
import { SheepInputNumberDirective } from './directives/sheep-input-number.directive';
import { SheepInputHintDirective } from './directives/sheep-input-hint.directive';
import { SheepInputLabelDirective } from './directives/sheep-input-label.directive';
import { SheepInputPasswordDirective } from './directives/sheep-input-password.directive';
import { SheepInputPrefixDirective } from './directives/sheep-input-prefix.directive';
import { SheepInputSuffixDirective } from './directives/sheep-input-suffix.directive';
import { SheepInputValidateDirective } from './directives/sheep-input-validate.directive';

/**
 * The field and every directive that extends it, ready to drop into a
 * component's `imports`.
 *
 * ```ts
 * @Component({ imports: [SHEEP_INPUT], ... })
 * ```
 *
 * Two kinds of directive live in here. Four are projection markers — label,
 * hint, prefix, suffix — that say which slot an element of the caller's fills.
 * Five are behaviour: `sheepPassword`, `sheepEmail`, `sheepNumber`, `sheepCounter` and
 * `sheepValidate` register themselves with the field they sit on and
 * contribute through `SheepInputFeature`.
 *
 * Every piece is standalone and can be imported one at a time, but they are
 * only useful together — `sheepPassword` with no `sheep-input` under it
 * matches nothing. Importing the set is the normal case, and it costs nothing
 * a caller does not use: a directive that is never written is never
 * instantiated.
 */
export const SHEEP_INPUT = [
  SheepInputComponent,
  SheepInputLabelDirective,
  SheepInputHintDirective,
  SheepInputPrefixDirective,
  SheepInputSuffixDirective,
  SheepInputPasswordDirective,
  SheepInputEmailDirective,
  SheepInputNumberDirective,
  SheepInputCounterDirective,
  SheepInputValidateDirective,
] as const;
