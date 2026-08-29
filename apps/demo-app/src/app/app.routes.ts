import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'button' },
  {
    path: 'button',
    loadComponent: () => import('@sheep-ng/demo').then((m) => m.ButtonDemo),
  },
  {
    path: 'list',
    loadComponent: () => import('@sheep-ng/demo').then((m) => m.ListDemo),
  },
];
