import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { Manifest } from '../models';

@Injectable({ providedIn: 'root' })
export class ManifestService {
  private _manifest: Manifest;
  private _defaultRootUrl: string;
  private _manifestInitialized: boolean;
  private _manifestLoaded$: Subject<boolean>;

  constructor(private httpClient: HttpClient) {
    this._defaultRootUrl = '../../../';
    this._manifestInitialized = false;
    this._manifestLoaded$ = new Subject();

    this._init();
  }

  private _init(): void {
    if (!this._manifestInitialized) {
      this._manifestInitialized = true;
      this.httpClient.get<Manifest>('manifest.webapp').subscribe(
        (manifest: Manifest) => {
          this._manifest = manifest;
          this._manifestLoaded$.next(true);
        },
        () => {
          this._manifestLoaded$.next(true);
          console.warn(
            'Manifest file could not be loaded, default options have been used instead'
          );
        }
      );
    }
  }

  private _loaded(): Observable<boolean> {
    return this._manifestLoaded$.asObservable();
  }

  get(): Observable<Manifest> {
    return this._loaded().pipe(
      filter(loaded => loaded),
      map(() => this._manifest)
    );
  }

  public getRootUrl(): Observable<string> {
    return this.get().pipe(
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
