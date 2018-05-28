import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ManifestService } from './manifest.service';
import { SystemInfoService } from './system-info.service';
import { Observable, throwError } from 'rxjs';
import { catchError, map, mergeMap, switchMap } from 'rxjs/internal/operators';

@Injectable({providedIn: 'root'})
export class NgxDhis2HttpClientService {
  constructor(private httpClient: HttpClient, private manifestService: ManifestService,
    private systemInfoService: SystemInfoService) {
  }

  get(url: string, preferPreviousApiVersion: boolean = false, useRootUrl: boolean = false): Observable<any> {
    const rootUrlPromise = useRootUrl ? this.manifestService.getRootUrl() :
      this._getApiRootUrl(preferPreviousApiVersion);

    return rootUrlPromise.pipe(
      mergeMap(rootUrl =>
        this.httpClient.get(rootUrl + url).
          pipe(catchError(this._handleError))
      ),
      catchError(this._handleError)
    );
  }

  post(url: string, data: any, preferPreviousApiVersion: boolean = false, useRootUrl: boolean = false,
    headerOptions?: any) {
    const rootUrlPromise = useRootUrl ? this.manifestService.getRootUrl() :
      this._getApiRootUrl(preferPreviousApiVersion);
    return rootUrlPromise.pipe(
      mergeMap(rootUrl =>
        this.httpClient.post(rootUrl + url, data).
          pipe(catchError(this._handleError))
      ),
      catchError(this._handleError)
    );
  }

  put(url: string, data: any, preferPreviousApiVersion: boolean = false, useRootUrl: boolean = false) {
    const rootUrlPromise = useRootUrl ? this.manifestService.getRootUrl() :
      this._getApiRootUrl(preferPreviousApiVersion);

    return rootUrlPromise.pipe(
      mergeMap(rootUrl =>
        this.httpClient.put(rootUrl + url, data).
          pipe(catchError(this._handleError))
      ),
      catchError(this._handleError)
    );
  }

  delete(url: string, preferPreviousApiVersion: boolean = false, useRootUrl: boolean = false) {
    const rootUrlPromise = useRootUrl ? this.manifestService.getRootUrl() :
      this._getApiRootUrl(preferPreviousApiVersion);

    return rootUrlPromise.pipe(
      mergeMap(rootUrl =>
        this.httpClient.delete(rootUrl + url).
          pipe(catchError(this._handleError))
      ),
      catchError(this._handleError)
    );
  }

  // private methods
  private _handleError(err: HttpErrorResponse) {
    let error = null;
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      error = {
        message: err.error,
        status: err.status,
        statusText: err.statusText
      };
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      error = {
        message: err.error instanceof Object ? err.error.message : err.error,
        status: err.status,
        statusText: err.statusText
      };
    }
    return throwError(error);
  }

  private _getApiRootUrl(preferPreviousVersion: boolean = false) {
    const rootUrlPromise = this.manifestService.getRootUrl().
      pipe(switchMap((rootUrl) => this.systemInfoService.getSystemVersion().pipe(map((version: number) => {
          return {rootUrl, version: (version - 1) <= 25 ? (version + 1) : version};
        }))
      ));
    return rootUrlPromise.pipe(
      map((urlInfo: {rootUrl: string, version: number}) => `${urlInfo.rootUrl}api/${preferPreviousVersion ?
        urlInfo.version ? ((urlInfo.version - 1) + '/') : '' : ''}`));
  }
}
