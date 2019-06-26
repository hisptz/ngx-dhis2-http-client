import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';

import { User } from '../models/user.model';
import { ManifestService } from './manifest.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private _initiated: boolean;
  private _user: User;
  private _loaded$: BehaviorSubject<boolean>;
  constructor(
    private manifestService: ManifestService,
    private httpClient: HttpClient
  ) {
    this._loaded$ = new BehaviorSubject<boolean>(false);

    this._init();
  }

  private _loaded(): Observable<boolean> {
    return this._loaded$.asObservable();
  }

  getCurrentUser(): Observable<User> {
    return this._loaded().pipe(
      filter(loaded => loaded),
      map(() => this._user)
    );
  }

  private _init() {
    if (!this._initiated) {
      this._initiated = true;
      this.manifestService
        .getRootUrl()
        .pipe(mergeMap((rootUrl: string) => this._loadCurrentUser(rootUrl)))
        .subscribe(
          (user: any) => {
            this._user = user;
            this._loaded$.next(true);
          },
          error => {
            this._loaded$.next(true);
            console.warn(`Could not load current user, Error: ${error}`);
          }
        );
    }
  }

  private _loadCurrentUser(rootUrl: string): Observable<User> {
    return forkJoin(
      this.httpClient.get(
        rootUrl +
          'api/me.json?fields=id,name,displayName,created,' +
          'lastUpdated,email,dataViewOrganisationUnits[id,name,level],' +
          'organisationUnits[id,name,level],userCredentials[username]'
      ),
      this.httpClient.get(`${rootUrl}api/me/authorization`)
    ).pipe(
      map((currentUserResults: any[]) => {
        return { ...currentUserResults[0], authorities: currentUserResults[1] };
      })
    );
  }
}
