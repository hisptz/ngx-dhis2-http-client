import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ManifestService } from './manifest.service';
import { SystemInfoService } from './system-info.service';
import { Observable, throwError } from 'rxjs';
import { catchError, map, mergeMap, switchMap } from 'rxjs/internal/operators';

@Injectable({ providedIn: 'root' })
export class NgxDhis2HttpClientService {
  private _rootUrl$: Observable<string>;
  constructor(
    private httpClient: HttpClient,
    private manifestService: ManifestService,
    private systemInfoService: SystemInfoService
  ) {
    this._rootUrl$ = this.manifestService.getRootUrl();
  }

  init() {}

  get(
    url: string,
    includeVersionNumber: boolean = false,
    preferPreviousApiVersion: boolean = false,
    useRootUrl: boolean = false
  ): Observable<any> {
    const rootUrlPromise = useRootUrl
      ? this._rootUrl$
      : this._getApiRootUrl(includeVersionNumber, preferPreviousApiVersion);

    return rootUrlPromise.pipe(
      mergeMap(rootUrl =>
        this.httpClient.get(rootUrl + url).pipe(catchError(this._handleError))
      ),
      catchError(this._handleError)
    );
  }

  post(
    url: string,
    data: any,
    includeVersionNumber: boolean = false,
    preferPreviousApiVersion: boolean = false,
    useRootUrl: boolean = false,
    headerOptions?: any
  ) {
    const rootUrlPromise = useRootUrl
      ? this._rootUrl$
      : this._getApiRootUrl(includeVersionNumber, preferPreviousApiVersion);
    return rootUrlPromise.pipe(
      mergeMap(rootUrl =>
        this.httpClient
          .post(rootUrl + url, data)
          .pipe(catchError(this._handleError))
      ),
      catchError(this._handleError)
    );
  }

  put(
    url: string,
    data: any,
    includeVersionNumber: boolean = false,
    preferPreviousApiVersion: boolean = false,
    useRootUrl: boolean = false
  ) {
    const rootUrlPromise = useRootUrl
      ? this._rootUrl$
      : this._getApiRootUrl(includeVersionNumber, preferPreviousApiVersion);

    return rootUrlPromise.pipe(
      mergeMap(rootUrl =>
        this.httpClient
          .put(rootUrl + url, data)
          .pipe(catchError(this._handleError))
      ),
      catchError(this._handleError)
    );
  }

  delete(
    url: string,
    includeVersionNumber: boolean = false,
    preferPreviousApiVersion: boolean = false,
    useRootUrl: boolean = false
  ) {
    const rootUrlPromise = useRootUrl
      ? this._rootUrl$
      : this._getApiRootUrl(includeVersionNumber, preferPreviousApiVersion);

    return rootUrlPromise.pipe(
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

  private _getApiRootUrl(
    includeVersionNumber: boolean = false,
    preferPreviousVersion: boolean = false
  ) {
    const rootUrlPromise = this._rootUrl$.pipe(
      switchMap(rootUrl => {
        return this.systemInfoService.getSystemVersion().pipe(
          map((version: number) => {
            return {
              rootUrl,
              version: version - 1 <= 25 ? version + 1 : version
            };
          })
        );
      })
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
