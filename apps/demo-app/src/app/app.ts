import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SheepThemeSwitcherComponent } from '@sheep-ng/ui';

/**
 * The app shell: brand, component nav, theme switcher. Layout only — every
 * demo lives in `@sheep-ng/demo`.
 */
@Component({
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    SheepThemeSwitcherComponent,
  ],
  selector: 'sheep-app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  /** The library roadmap, in nav order. `ready` gates the route link. */
  protected readonly components = [
    { path: 'button', label: 'Button', ready: true },
    { path: 'text-field', label: 'Text field', ready: true },
    { path: 'number-field', label: 'Number field', ready: false },
    { path: 'chips', label: 'Chips', ready: true },
    { path: 'badges', label: 'Badges', ready: true },
    { path: 'nav-bar', label: 'Nav bar', ready: false },
    { path: 'side-sheet', label: 'Side sheet', ready: false },
    { path: 'list', label: 'List', ready: true },
    { path: 'tree', label: 'Tree', ready: false },
    { path: 'table', label: 'Table', ready: true },
    { path: 'dialog', label: 'Dialog', ready: true },
    { path: 'tooltip', label: 'Tooltip', ready: true },
  ];
}
