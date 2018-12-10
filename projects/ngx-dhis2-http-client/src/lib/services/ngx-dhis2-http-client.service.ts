import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ManifestService } from './manifest.service';
import { SystemInfoService } from './system-info.service';
import { Observable, throwError } from 'rxjs';
import { catchError, map, mergeMap, switchMap } from 'rxjs/internal/operators';
import { HttpConfig } from '../models/http-config.model';
import { HTTP_CONFIG } from '../constants/http-config.constant';

@Injectable({ providedIn: 'root' })
export class NgxDhis2HttpClientService {
  constructor(
    private httpClient: HttpClient,
    private manifestService: ManifestService,
    private systemInfoService: SystemInfoService
  ) {}

  get(url: string, httpConfig?: HttpConfig): Observable<any> {
    const newHttpConfig = { ...HTTP_CONFIG, ...httpConfig };

    // Make a call directly from url if is external one
    if (newHttpConfig.isExternaLink) {
      return this.httpClient.get(url);
    }

    return this._getSanitizedRootUrl(newHttpConfig).pipe(
      mergeMap(rootUrl =>
        this.httpClient.get(rootUrl + url).pipe(catchError(this._handleError))
      ),
      catchError(this._handleError)
    );
  }

  post(url: string, data: any, httpConfig?: HttpConfig) {
    const newHttpConfig = { ...HTTP_CONFIG, ...httpConfig };

    return this._getSanitizedRootUrl(newHttpConfig).pipe(
      mergeMap(rootUrl =>
        this.httpClient
          .post(rootUrl + url, data)
          .pipe(catchError(this._handleError))
      ),
      catchError(this._handleError)
    );
  }

  put(url: string, data: any, httpConfig?: HttpConfig) {
    const newHttpConfig = { ...HTTP_CONFIG, ...httpConfig };

    return this._getSanitizedRootUrl(newHttpConfig).pipe(
      mergeMap(rootUrl =>
        this.httpClient
          .put(rootUrl + url, data)
          .pipe(catchError(this._handleError))
      ),
      catchError(this._handleError)
    );
  }

  delete(url: string, httpConfig?: HttpConfig) {
    const newHttpConfig = { ...HTTP_CONFIG, ...httpConfig };

    return this._getSanitizedRootUrl(newHttpConfig).pipe(
      mergeMap(rootUrl =>
        this.httpClient
          .delete(rootUrl + url)
          .pipe(catchError(this._handleError))
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
        message:
          err.error instanceof Object
            ? err.error.message
            : err.error || err.message,
        status: err.status,
        statusText: err.statusText
      };
    }
    return throwError(error);
  }

  private _getSanitizedRootUrl(httpConfig: HttpConfig) {
    return httpConfig.useRootUrl
      ? this.manifestService.getRootUrl()
      : this._getApiRootUrl(
          httpConfig.includeVersionNumber,
          httpConfig.preferPreviousApiVersion
        );
  }

  private _getApiRootUrl(
    includeVersionNumber: boolean = false,
    preferPreviousVersion: boolean = false
  ) {
    const rootUrlPromise = this.manifestService.getRootUrl().pipe(
      switchMap(rootUrl =>
        this.systemInfoService.getSystemVersion().pipe(
          map((version: number) => {
            return {
              rootUrl,
              version: version - 1 <= 25 ? version + 1 : version
            };
          })
        )
      )
    );
    return rootUrlPromise.pipe(
      map(
        (urlInfo: { rootUrl: string; version: number }) =>
          `${urlInfo.rootUrl}api/${
            includeVersionNumber && !preferPreviousVersion
              ? urlInfo.version + '/'
              : preferPreviousVersion
              ? urlInfo.version
                ? urlInfo.version - 1 + '/'
                : ''
              : ''
          }`
      )
    );
  }
}
