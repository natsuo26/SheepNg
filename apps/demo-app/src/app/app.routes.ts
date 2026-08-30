import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'button' },
  {
    path: 'button',
    loadComponent: () => import('@sheep-ng/demo').then((m) => m.ButtonDemo),
  },
  {
    path: 'text-field',
    loadComponent: () => import('@sheep-ng/demo').then((m) => m.TextFieldDemo),
  },
  {
    path: 'list',
    loadComponent: () => import('@sheep-ng/demo').then((m) => m.ListDemo),
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
