import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Manifest } from '../models';

interface ManifestState {
  manifest: Manifest;
  loaded: boolean;
  initiated: boolean;
  defaultRootUrl: string;
}
@Injectable({ providedIn: 'root' })
export class ManifestService {
  private _manifestState: ManifestState;

  constructor(private httpClient: HttpClient) {
    this._manifestState = {
      manifest: null,
      loaded: false,
      initiated: false,
      defaultRootUrl: '../../../'
    };

    this._init();
  }

  private _init(): void {
    if (!this._manifestState.initiated) {
      this._manifestState = {
        ...this._manifestState,
        initiated: true
      };

      this.httpClient.get<Manifest>('manifest.webapp').subscribe(
        (manifest: Manifest) => {
          this._manifestState = {
            ...this._manifestState,
            manifest,
            loaded: true
          };
        },
        () => {
          this._manifestState = {
            ...this._manifestState,
            loaded: true
          };
          console.warn(
            'Manifest file could not be loaded, default options have been used instead'
          );
        }
      );
    }
  }

  getManifest(): Observable<Manifest> {
    return new Observable(observer => {
      if (this._manifestState.loaded) {
        observer.next(this._manifestState.manifest);
        observer.complete();
      }
    });
  }

  public getRootUrl(): Observable<string> {
    return new Observable(observer => {
      const manifest = this._manifestState.manifest;
      if (!manifest) {
        observer.next(this._manifestState.defaultRootUrl);
        observer.complete();
      } else {
        observer.next(
          manifest.activities &&
            manifest.activities.dhis &&
            manifest.activities.dhis.href
            ? manifest.activities.dhis.href
            : this._manifestState.defaultRootUrl
        );
        observer.complete();
      }
    });
  }
}
