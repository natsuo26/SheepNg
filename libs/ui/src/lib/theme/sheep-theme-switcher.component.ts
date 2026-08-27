import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  SheepThemeService,
  type SheepThemePreference,
} from './sheep-theme.service';

/**
 * A three-way segmented control over the document theme.
 *
 * Ships in the library rather than the app: every consuming app gets the same
 * switcher, and it stays in step with the themes the theme layer actually
 * emits.
 */
@Component({
  selector: 'sheep-theme-switcher',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sheep-seg" role="group" aria-label="Theme">
      @for (option of options; track option.value) {
        <button
          type="button"
          class="sheep-seg__opt"
          [class.sheep-seg__opt--on]="theme.preference() === option.value"
          [attr.aria-pressed]="theme.preference() === option.value"
          (click)="theme.set(option.value)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
  styles: `
    .sheep-seg {
      display: inline-flex;
      gap: 2px;
      padding: 2px;
      border: 1px solid var(--sheep-color-line);
      border-radius: var(--sheep-radius-md);
      background: var(--sheep-color-surface-sunk);
    }

    .sheep-seg__opt {
      appearance: none;
      border: 0;
      border-radius: var(--sheep-radius-sm);
      background: transparent;
      padding: 0 var(--sheep-space-4);
      height: 24px;
      color: var(--sheep-color-text-muted);
      font: inherit;
      font-size: 12px;
      font-weight: var(--sheep-font-weight-label);
      letter-spacing: 0.01em;
      cursor: pointer;
      transition:
        background-color var(--sheep-motion-duration) var(--sheep-motion-ease),
        color var(--sheep-motion-duration) var(--sheep-motion-ease);
    }

    .sheep-seg__opt:hover {
      color: var(--sheep-color-text);
      background: color-mix(
        in srgb,
        var(--sheep-color-accent) 12%,
        transparent
      );
    }

    .sheep-seg__opt:focus-visible {
      outline: var(--sheep-focus-width) solid var(--sheep-color-accent);
      outline-offset: var(--sheep-focus-offset);
    }

    .sheep-seg__opt--on {
      background: var(--sheep-color-surface);
      color: var(--sheep-color-text);
      box-shadow: var(--sheep-shadow-sm);
    }
  `,
})
export class SheepThemeSwitcherComponent {
  protected readonly theme = inject(SheepThemeService);

  protected readonly options: readonly {
    value: SheepThemePreference;
    label: string;
  }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];
}
