import {NavigatorSection} from "../app/models/NavigatorSection";

export const collectionNames = {
  certificateCollection: "last-certificates",
  emailCollection: "emails",
  projectCollections: "last-projects"
}

export const navigatorSections: NavigatorSection = {
  homeId: 'home',
  skillsId: 'skills',
  certificateId: 'certificate',
  projectId: 'project',
  contactId: 'contact'
}

export const defaultSection = navigatorSections.homeId

export function getListSections() {
  return Object.values(navigatorSections)
}
