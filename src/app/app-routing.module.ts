import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ProfileComponent} from "./profile/profile/profile.component";
import {SkillsComponent} from "./skills/skills/skills.component";
import {ProjectsComponent} from "./projects/projects/projects.component";
import {CertificateComponent} from "./certificate/certificate/certificate.component";
import {ContactComponent} from "./contact/contact/contact.component";
import {navigatorSections} from "../utils/Constants";

const routes: Routes = [
  {path: "", redirectTo: `/${navigatorSections.homeId}`, pathMatch: "full"},
  {path: navigatorSections.homeId, component: ProfileComponent},
  {path: navigatorSections.skillsId, component: SkillsComponent},
  {path: navigatorSections.projectId, component: ProjectsComponent},
  {path: navigatorSections.certificateId, component: CertificateComponent},
  {path: navigatorSections.contactId, component: ContactComponent},
  {path: '**', pathMatch: 'full', redirectTo: `/${navigatorSections.homeId}`}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
