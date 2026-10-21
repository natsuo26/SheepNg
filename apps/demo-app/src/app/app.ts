import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SHEEP_NAV_BAR, SheepThemeSwitcherComponent } from '@sheep-ng/ui';

/**
 * The app shell: brand, component nav, theme switcher. Layout only — every
 * demo lives in `@sheep-ng/demo`.
 */
@Component({
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    SHEEP_NAV_BAR,
    SheepThemeSwitcherComponent,
  ],
  selector: 'sheep-app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  /** The component pages, in nav order. */
  protected readonly components = [
    { path: 'button', label: 'Button' },
    { path: 'input', label: 'Input' },
    { path: 'chips', label: 'Chips' },
    { path: 'badges', label: 'Badges' },
    { path: 'nav-bar', label: 'Nav bar' },
    { path: 'side-sheet', label: 'Side sheet' },
    { path: 'list', label: 'List' },
    { path: 'tree', label: 'Tree' },
    { path: 'table', label: 'Table' },
    { path: 'dialog', label: 'Dialog' },
    { path: 'tooltip', label: 'Tooltip' },
  ];
}
