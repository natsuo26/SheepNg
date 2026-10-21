import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'button' },
  {
    path: 'button',
    loadComponent: () => import('@sheep-ng/demo').then((m) => m.ButtonDemo),
  },
  {
    path: 'input',
    loadComponent: () => import('@sheep-ng/demo').then((m) => m.InputDemo),
  },
  {
    path: 'chips',
    loadComponent: () => import('@sheep-ng/demo').then((m) => m.ChipDemo),
  },
  {
    path: 'badges',
    loadComponent: () => import('@sheep-ng/demo').then((m) => m.BadgeDemo),
  },
  {
    path: 'nav-bar',
    loadComponent: () => import('@sheep-ng/demo').then((m) => m.NavBarDemo),
  },
  {
    path: 'side-sheet',
    loadComponent: () => import('@sheep-ng/demo').then((m) => m.SideSheetDemo),
  },
  {
    path: 'list',
    loadComponent: () => import('@sheep-ng/demo').then((m) => m.ListDemo),
  },
  {
    path: 'tree',
    loadComponent: () => import('@sheep-ng/demo').then((m) => m.TreeDemo),
  },
  {
    path: 'table',
    loadComponent: () => import('@sheep-ng/demo').then((m) => m.TableDemo),
  },
  {
    path: 'dialog',
    loadComponent: () => import('@sheep-ng/demo').then((m) => m.DialogDemo),
  },
  {
    path: 'tooltip',
    loadComponent: () => import('@sheep-ng/demo').then((m) => m.TooltipDemo),
  },
];
