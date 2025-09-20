import { Route } from '@angular/router';
import { navigatorSections } from 'src/utils/Constants';


export const appRoutes: Route[] = [
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
        path: 'terms-and-conditions/:projectID',
        loadComponent: () =>
            import('./terms/terms/terms.component').then(m => m.TermsComponent)
    },
    {
        path: '**',
        redirectTo: `/${navigatorSections.homeId}`,
        pathMatch: 'full'
    }
];
