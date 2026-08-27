import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  SheepButtonComponent,
  type SheepButtonSize,
  type SheepButtonTone,
  type SheepButtonVariant,
} from '@sheep-ng/ui';

/**
 * Showcase for every axis of `sheep-button`.
 *
 * The demo owns no theme state — the app shell's `sheep-theme-switcher` moves
 * `data-sheep-theme` on the document, and everything here follows.
 */
@Component({
  selector: 'sheep-demo-button',
  imports: [SheepButtonComponent],
  templateUrl: './button-demo.html',
  styleUrl: './button-demo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonDemo {
  protected readonly variants: readonly SheepButtonVariant[] = [
    'outline',
    'solid',
    'soft',
    'ghost',
    'link',
  ];

  protected readonly tones: readonly SheepButtonTone[] = [
    'primary',
    'neutral',
    'success',
    'warning',
    'danger',
  ];

  protected readonly sizes: readonly SheepButtonSize[] = ['sm', 'md', 'lg'];

  /** The public API, rendered from one source so it cannot drift from the code. */
  protected readonly api: readonly {
    name: string;
    default: string;
    type: string;
  }[] = [
    {
      name: 'variant',
      default: "'outline'",
      type: "'outline' | 'solid' | 'soft' | 'ghost' | 'link'",
    },
    {
      name: 'tone',
      default: "'primary'",
      type: "'primary' | 'neutral' | 'success' | 'warning' | 'danger'",
    },
    { name: 'size', default: "'md'", type: "'sm' | 'md' | 'lg'" },
    { name: 'shape', default: "'rounded'", type: "'rounded' | 'square'" },
    { name: 'disabled', default: 'false', type: 'boolean attribute' },
    { name: 'loading', default: 'false', type: 'boolean attribute' },
    { name: 'ariaLabel', default: 'null', type: 'string | null' },
  ];

  protected readonly saving = signal(false);
  protected readonly clicks = signal(0);

  protected save(): void {
    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    setTimeout(() => this.saving.set(false), 1500);
  }

  protected count(): void {
    this.clicks.update((n) => n + 1);
  }
}
