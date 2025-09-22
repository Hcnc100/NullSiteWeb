import { inject, Injectable } from '@angular/core';
import type { Observable } from "rxjs";
import type { CollectionReference } from "@angular/fire/firestore";
import { Firestore } from "@angular/fire/firestore";
import { collection, collectionData } from "@angular/fire/firestore";
import type { Project } from "../../models/Project";
import { collectionNames } from "../../../utils/Constants";


@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private readonly firestore: Firestore = inject(Firestore);
  public readonly listProjects: Observable<Project[]>;
  private readonly projectCollections: CollectionReference<Project>;

  public constructor() {
    this.projectCollections = collection(
      this.firestore, collectionNames.projectCollections) as CollectionReference<Project>
    this.listProjects = collectionData(this.projectCollections);
  }
}
