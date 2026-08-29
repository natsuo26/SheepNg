import { SheepTextFieldComponent } from './sheep-text-field.component';
import { SheepTextFieldCounterDirective } from './directives/sheep-text-field-counter.directive';
import { SheepTextFieldEmailDirective } from './directives/sheep-text-field-email.directive';
import { SheepTextFieldHintDirective } from './directives/sheep-text-field-hint.directive';
import { SheepTextFieldLabelDirective } from './directives/sheep-text-field-label.directive';
import { SheepTextFieldPasswordDirective } from './directives/sheep-text-field-password.directive';
import { SheepTextFieldPrefixDirective } from './directives/sheep-text-field-prefix.directive';
import { SheepTextFieldSuffixDirective } from './directives/sheep-text-field-suffix.directive';
import { SheepTextFieldValidateDirective } from './directives/sheep-text-field-validate.directive';

/**
 * The field and every directive that extends it, ready to drop into a
 * component's `imports`.
 *
 * ```ts
 * @Component({ imports: [SHEEP_TEXT_FIELD], ... })
 * ```
 *
 * Two kinds of directive live in here. Four are projection markers — label,
 * hint, prefix, suffix — that say which slot an element of the caller's fills.
 * Four are behaviour: `sheepPassword`, `sheepEmail`, `sheepCounter` and
 * `sheepValidate` register themselves with the field they sit on and
 * contribute through `SheepTextFieldFeature`.
 *
 * Every piece is standalone and can be imported one at a time, but they are
 * only useful together — `sheepPassword` with no `sheep-text-field` under it
 * matches nothing. Importing the set is the normal case, and it costs nothing
 * a caller does not use: a directive that is never written is never
 * instantiated.
 */
export const SHEEP_TEXT_FIELD = [
  SheepTextFieldComponent,
  SheepTextFieldLabelDirective,
  SheepTextFieldHintDirective,
  SheepTextFieldPrefixDirective,
  SheepTextFieldSuffixDirective,
  SheepTextFieldPasswordDirective,
  SheepTextFieldEmailDirective,
  SheepTextFieldCounterDirective,
  SheepTextFieldValidateDirective,
] as const;
