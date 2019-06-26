import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { Manifest } from '../models/manifest.model';

@Injectable({ providedIn: 'root' })
export class ManifestService {
  private _manifest: Manifest;
  private _initiated: boolean;
  private _loaded$: BehaviorSubject<boolean>;
  private _defaultRootUrl: string;

  constructor(private httpClient: HttpClient) {
    this._loaded$ = new BehaviorSubject<boolean>(false);
    this._defaultRootUrl = '../../../';

    this._init();
  }

  private _init(): void {
    if (!this._initiated) {
      this._initiated = true;
      this.httpClient.get<Manifest>('manifest.webapp').subscribe(
        (manifest: Manifest) => {
          this._loaded$.next(true);
          this._manifest = manifest;
        },
        () => {
          this._loaded$.next(true);
          console.warn(
            'Manifest file could not be loaded, default options have been used instead'
          );
        }
      );
    }
  }

  private _loaded(): Observable<boolean> {
    return this._loaded$.asObservable();
  }

  getManifest(): Observable<Manifest> {
    return this._loaded().pipe(
      filter(loaded => loaded),
      map(() => this._manifest)
    );
  }

  public getRootUrl(): Observable<string> {
    return this.getManifest().pipe(
      map((manifest: Manifest) => {
        if (!manifest) {
          return this._defaultRootUrl;
        }

        return manifest.activities &&
          manifest.activities.dhis &&
          manifest.activities.dhis.href
          ? manifest.activities.dhis.href
          : this._defaultRootUrl;
      })
    );
  }
}
