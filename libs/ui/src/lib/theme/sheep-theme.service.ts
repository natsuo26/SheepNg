import { DOCUMENT, inject, Injectable, effect, signal } from '@angular/core';

/** The themes the library ships. */
export type SheepTheme = 'light' | 'dark';

/** `system` defers to `prefers-color-scheme`. */
export type SheepThemePreference = SheepTheme | 'system';

const STORAGE_KEY = 'sheep-ng:theme';

/**
 * Owns the document's `data-sheep-theme` attribute.
 *
 * The attribute — not this service — is the source of truth for paint, so the
 * first frame is correct on the server and before hydration. The service only
 * moves it, remembers the choice, and exposes it as a signal.
 */
@Injectable({ providedIn: 'root' })
export class SheepThemeService {
  private readonly document = inject(DOCUMENT);

  /** What the user asked for, including `system`. */
  readonly preference = signal<SheepThemePreference>(this.read());

  /** What is actually painted right now. */
  readonly resolved = signal<SheepTheme>(this.resolve(this.read()));

  constructor() {
    const media = this.document.defaultView?.matchMedia?.(
      '(prefers-color-scheme: dark)',
    );

    media?.addEventListener('change', () => {
      if (this.preference() === 'system') {
        this.apply(this.preference());
      }
    });

    effect(() => this.apply(this.preference()));
  }

  set(preference: SheepThemePreference): void {
    this.preference.set(preference);
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      /* storage unavailable (private mode, SSR) — the signal still works */
    }
  }

  /** Light -> dark -> light. Leaves `system` behind on first use. */
  toggle(): void {
    this.set(this.resolved() === 'dark' ? 'light' : 'dark');
  }

  private apply(preference: SheepThemePreference): void {
    const root = this.document.documentElement;
    const theme = this.resolve(preference);

    if (preference === 'system') {
      root.removeAttribute('data-sheep-theme');
    } else {
      root.setAttribute('data-sheep-theme', preference);
    }

    this.resolved.set(theme);
  }

  private resolve(preference: SheepThemePreference): SheepTheme {
    if (preference !== 'system') {
      return preference;
    }
    return this.document.defaultView?.matchMedia?.(
      '(prefers-color-scheme: dark)',
    ).matches
      ? 'dark'
      : 'light';
  }

  private read(): SheepThemePreference {
    try {
      const stored =
        this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch {
      /* ignore */
    }
    return 'system';
  }
}
