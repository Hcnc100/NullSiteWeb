import type { Signal } from '@angular/core';
import { inject, Injectable } from '@angular/core';
import type { CollectionReference } from "@angular/fire/firestore";
import { Firestore } from "@angular/fire/firestore";
import { collection, collectionData } from "@angular/fire/firestore";
import type { Project } from "../../models/Project";
import { collectionNames } from "../../../utils/Constants";
import { toSignal } from '@angular/core/rxjs-interop';


@Injectable({
  providedIn: 'root'
})
export class ProjectsService {

  private readonly firestore: Firestore = inject(Firestore);

  private readonly projectCollections: CollectionReference<Project> = collection(
    this.firestore, collectionNames.projectCollections
  ) as CollectionReference<Project>;

  public readonly listProjects: Signal<Project[] | undefined> = toSignal(
    collectionData(this.projectCollections)
  );

}
