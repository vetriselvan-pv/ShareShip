import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginScreenComponent } from './pages/login-screen/login-screen.component';
import { CalendarGiftsComponent } from './pages/calendar-gifts/calendar-gifts.component';
import { GiftsRegistryComponent } from './pages/gifts-registry/gifts-registry.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { ExpensesComponent } from './pages/expenses/expenses.component';
import { WorkspaceNotesComponent } from './pages/workspace-notes/workspace-notes.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    title: 'Shareship Dashboard — Shared Space'
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    title: 'Shareship Dashboard — Shared Space'
  },
  {
    path: 'calendar',
    component: CalendarGiftsComponent,
    title: 'Shareship — Shared Calendar'
  },
  {
    path: 'gifts',
    component: GiftsRegistryComponent,
    title: 'Shareship — Gifts & Registry'
  },
  {
    path: 'registry',
    component: GiftsRegistryComponent,
    title: 'Shareship — Gifts & Registry'
  },
  {
    path: 'expenses',
    component: ExpensesComponent,
    title: 'Shareship — Our Shared Purse & Expenses'
  },
  {
    path: 'notes',
    component: WorkspaceNotesComponent,
    title: 'Shareship — Shared Workspace & Notes'
  },
  {
    path: 'workspace',
    component: WorkspaceNotesComponent,
    title: 'Shareship — Shared Workspace & Notes'
  },
  {
    path: 'notifications',
    component: NotificationsComponent,
    title: 'Shareship — Notifications & Connections'
  },
  {
    path: 'alerts',
    component: NotificationsComponent,
    title: 'Shareship — Notifications & Connections'
  },
  {
    path: 'login',
    component: LoginScreenComponent,
    title: 'Shareship — Welcome to Shared Space'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
