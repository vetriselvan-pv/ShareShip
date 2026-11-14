import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginScreenComponent } from './pages/login-screen/login-screen.component';
import { CalendarGiftsComponent } from './pages/calendar-gifts/calendar-gifts.component';
import { GiftsRegistryComponent } from './pages/gifts-registry/gifts-registry.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { ExpensesComponent } from './pages/expenses/expenses.component';
import { WorkspaceNotesComponent } from './pages/workspace-notes/workspace-notes.component';
import { authGuard, guestGuard } from './guards';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    title: 'Shareship Dashboard — Shared Space',
    canActivate: [authGuard],
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    title: 'Shareship Dashboard — Shared Space',
    canActivate: [authGuard],
  },
  {
    path: 'calendar',
    component: CalendarGiftsComponent,
    title: 'Shareship — Shared Calendar',
    canActivate: [authGuard],
  },
  {
    path: 'gifts',
    component: GiftsRegistryComponent,
    title: 'Shareship — Gifts & Registry',
    canActivate: [authGuard],
  },
  {
    path: 'registry',
    component: GiftsRegistryComponent,
    title: 'Shareship — Gifts & Registry',
    canActivate: [authGuard],
  },
  {
    path: 'expenses',
    component: ExpensesComponent,
    title: 'Shareship — Our Shared Purse & Expenses',
    canActivate: [authGuard],
  },
  {
    path: 'notes',
    component: WorkspaceNotesComponent,
    title: 'Shareship — Shared Workspace & Notes',
    canActivate: [authGuard],
  },
  {
    path: 'workspace',
    component: WorkspaceNotesComponent,
    title: 'Shareship — Shared Workspace & Notes',
    canActivate: [authGuard],
  },
  {
    path: 'notifications',
    component: NotificationsComponent,
    title: 'Shareship — Notifications & Connections',
    canActivate: [authGuard],
  },
  {
    path: 'alerts',
    component: NotificationsComponent,
    title: 'Shareship — Notifications & Connections',
    canActivate: [authGuard],
  },
  {
    path: 'login',
    component: LoginScreenComponent,
    title: 'Shareship — Welcome to Shared Space',
    canActivate: [guestGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
