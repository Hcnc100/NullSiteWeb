import { Injectable } from '@angular/core';
import { Observable, of } from "rxjs";
import { collection, collectionData, CollectionReference, Firestore } from "@angular/fire/firestore";
import { Project } from "../../models/Project";
import { collectionNames } from "../../../utils/Constants";


@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  readonly listProjects: Observable<Project[]>;
  private readonly projectCollections: CollectionReference<Project>;

  constructor(firestore: Firestore) {
    this.projectCollections = collection(firestore, collectionNames.projectCollections) as CollectionReference<Project>
    this.listProjects = collectionData(this.projectCollections);
  }
}
