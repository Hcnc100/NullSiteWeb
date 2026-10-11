import type { Route } from '@angular/router';
import { navigatorSections } from 'src/utils/Constants';
import { adminGuard, unsavedChangesGuard } from './admin/auth/admin.guard';
import { inject } from '@angular/core';
import { I18nService } from './i18n/i18n.service';
import { environment } from '../environments/environment';
import { provideHttpClient } from '@angular/common/http';


const baseRoutes: Route[] = [
    {
        path: 'admin/login',
        loadComponent: () => import('./admin/login/admin-login.component').then(m => m.AdminLoginComponent),
    },
    {
        path: 'admin',
        canActivate: [adminGuard],
        canActivateChild: [adminGuard],
        loadComponent: () => import('./admin/layout/admin-shell.component').then(m => m.AdminShellComponent),
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'profile' },
            { path: 'blog', canDeactivate: [unsavedChangesGuard],
              loadComponent: () => import('./admin/blog/admin-blog.component').then(m => m.AdminBlogComponent) },
            { path: 'legal', canDeactivate: [unsavedChangesGuard],
              loadComponent: () => import('./admin/legal/admin-legal.component').then(m => m.AdminLegalComponent) },
            ...(['projects', 'skills'] as const).map(kind => ({
                path: kind, data: { kind }, canDeactivate: [unsavedChangesGuard],
                loadComponent: () => import('./admin/content/admin-content.component').then(m => m.AdminContentComponent),
            })),
            { path: 'resume', canDeactivate: [unsavedChangesGuard],
              loadComponent: () => import('./admin/resume/admin-resume.component').then(m => m.AdminResumeComponent) },
            {
                path: 'profile',
                canDeactivate: [unsavedChangesGuard],
                loadComponent: () => import('./admin/profile/admin-profile.component')
                    .then(m => m.AdminProfileComponent),
            },
        ],
    },
    {
        path: '',
        redirectTo: `/${navigatorSections.homeId}`,
        pathMatch: 'full'
    },
    {
        path: navigatorSections.homeId,
        loadComponent: () =>
            import('./profile/profile/profile.component').then(m => m.ProfileComponent)
    },
    {
        path: navigatorSections.skillsId,
        loadComponent: () =>
            import('./skills/skills/skills.component').then(m => m.SkillsComponent)
    },
    {
        path: navigatorSections.projectId,
        loadComponent: () =>
            import('./projects/projects/projects.component').then(m => m.ProjectsComponent)
    },
    {
        path: navigatorSections.certificateId,
        loadComponent: () =>
            import('./certificate/certificate/certificate.component').then(m => m.CertificateComponent)
    },
    {
        path: navigatorSections.contactId,
        loadComponent: () =>
            import('./contact/contact/contact.component').then(m => m.ContactComponent)
    },
    {
        path: 'blog',
        loadComponent: () => import('./blog/blog.component').then(m => m.BlogComponent),
    },
    {
        path: 'blog/:slug',
        loadComponent: () => import('./blog/blog.component').then(m => m.BlogComponent),
    },
    {
        path: 'terms-and-conditions/:projectID',
        loadComponent: () =>
            import('./terms/terms/terms.component').then(m => m.TermsComponent)
    },
    {
        path: "demos/conciliacion",
        loadComponent: () =>
            import('./demos/conciliacion/components/comparator/comparator.component').then(m => m.ComparatorComponent)
    },
    {
        path: '**',
        redirectTo: `/${navigatorSections.homeId}`,
        pathMatch: 'full'
    }
];

const publicPages = baseRoutes.filter(route => route.path !== '' && route.path !== '**'
  && route.path !== 'admin' && route.path !== 'admin/login');

export const appRoutes: Route[] = [
    ...(!environment.production ? [{ path: 'editor-lab', providers: [provideHttpClient()], loadComponent: () => import('./admin/editor-lab/editor-lab.component').then(m => m.EditorLabComponent) }] : []),
    ...baseRoutes.filter(route => route.path === 'admin' || route.path === 'admin/login'),
    ...(['es', 'en'] as const).map(locale => ({
        path: locale,
        canActivate: [(): boolean => { inject(I18nService).setLocale(locale); return true; }],
        children: [{ path: '', pathMatch: 'full' as const, redirectTo: 'home' }, ...publicPages],
    })),
    ...publicPages.map(route => ({
        path: route.path,
        redirectTo: ({ params }: { params: Record<string, string> }): string => inject(I18nService)
            .publicUrl(route.path === 'terms-and-conditions/:projectID'
                ? `terms-and-conditions/${encodeURIComponent(params['projectID'])}`
                : route.path === 'blog/:slug' ? `blog/${encodeURIComponent(params['slug'])}` : route.path ?? 'home'),
    })),
    { path: '', pathMatch: 'full', redirectTo: (): string => inject(I18nService).publicUrl('home') },
    { path: '**', redirectTo: (): string => inject(I18nService).publicUrl('home') },
];
