import type { NavigatorSection } from "../app/models/NavigatorSection";

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
  contactId: 'contact',
  demosId: 'demos'
}

export const defaultSection = navigatorSections.homeId

export function getListSections(): string[] {
  return Object.values(navigatorSections)
}
