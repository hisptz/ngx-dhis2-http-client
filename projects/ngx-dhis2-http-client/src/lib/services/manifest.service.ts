import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Manifest } from '../models';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/internal/operators';

@Injectable({providedIn: 'root'})
export class ManifestService {
  private _manifest: Manifest;
  private _defaultRootUrl: string;
  private _manifestLoaded: boolean;

  constructor(private httpClient: HttpClient) {
    this._defaultRootUrl = '../../../';
    this._manifestLoaded = false;
  }

  public getManifest(): Observable<Manifest> {
    return this._manifestLoaded ? of(this._manifest) : this.httpClient.get<Manifest>('manifest.webapp').pipe(
      catchError(() => {
        console.warn('Manifest file could not be loaded, default options have been used instead');
        return of(null);
      }),
      tap((manifest) => {
        this._manifest = manifest;
        this._manifestLoaded = true;
      }));
  }

  public getRootUrl(): Observable<string> {
    return this.getManifest().pipe(map((manifest: Manifest) => {
      if (!manifest) {
        return this._defaultRootUrl;
      }
      return manifest.activities && manifest.activities.dhis && manifest.activities.dhis.href ?
        manifest.activities.dhis.href : this._defaultRootUrl;
    }));
  }
}
