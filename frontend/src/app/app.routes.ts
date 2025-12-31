import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    },
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    },
    {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    },
    {
        path: 'campaigns',
        loadComponent: () => import('./features/campaigns/campaign-list/campaign-list.component').then(m => m.CampaignListComponent),
    },
    {
        path: 'campaigns/:id',
        loadComponent: () => import('./features/campaigns/campaign-detail/campaign-detail.component').then(m => m.CampaignDetailComponent),
    },
    {
        path: 'student',
        canActivate: [authGuard, roleGuard],
        data: { role: 'student' },
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./features/student/dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent),
            },
            {
                path: 'submit/:campaignId',
                loadComponent: () => import('./features/student/habit-submit/habit-submit.component').then(m => m.HabitSubmitComponent),
            },
        ],
    },
    {
        path: 'admin',
        canActivate: [authGuard, roleGuard],
        data: { role: 'admin' },
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
            },
            {
                path: 'campaigns/create',
                loadComponent: () => import('./features/admin/campaign-create/campaign-create.component').then(m => m.CampaignCreateComponent),
            },
            {
                path: 'campaigns/:id/edit',
                loadComponent: () => import('./features/admin/campaign-create/campaign-create.component').then(m => m.CampaignCreateComponent),
            },
        ],
    },
    {
        path: 'sponsor',
        canActivate: [authGuard, roleGuard],
        data: { role: 'sponsor' },
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./features/sponsor/dashboard/sponsor-dashboard.component').then(m => m.SponsorDashboardComponent),
            },
        ],
    },
    {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    },
    {
        path: 'settings',
        canActivate: [authGuard],
        loadComponent: () => import('./features/profile/settings.component').then(m => m.SettingsComponent),
    },
    {
        path: '**',
        redirectTo: '',
    },
];
