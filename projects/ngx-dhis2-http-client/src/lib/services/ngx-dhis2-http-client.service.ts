import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ManifestService } from './manifest.service';
import { SystemInfoService } from './system-info.service';
import { Observable, throwError, of } from 'rxjs';
import {
  catchError,
  map,
  mergeMap,
  switchMap,
  tap
} from 'rxjs/internal/operators';
import { HttpConfig, IndexDbSchema } from '../models/http-config.model';
import { HTTP_CONFIG } from '../constants/http-config.constant';
import { IndexDbService } from './index-db.service';

@Injectable({ providedIn: 'root' })
export class NgxDhis2HttpClientService {
  constructor(
    private httpClient: HttpClient,
    private manifestService: ManifestService,
    private systemInfoService: SystemInfoService,
    private indexDbService: IndexDbService
  ) {}

  get(url: string, httpConfig?: HttpConfig): Observable<any> {
    const newHttpConfig = { ...HTTP_CONFIG, ...httpConfig };

    // Make a call directly from url if is external one
    if (newHttpConfig.isExternalLink) {
      return this.httpClient.get(url);
    }

    // load from index db
    if (newHttpConfig.useIndexDb) {
      return this._fetchFromIndexDb(newHttpConfig).pipe(
        mergeMap((indexDbResponse: any) =>
          indexDbResponse
            ? of(indexDbResponse)
            : this._get(url, newHttpConfig).pipe(
                mergeMap((response: any) =>
                  this._updateIndexDb(newHttpConfig, response)
                )
              )
        )
      );
    }

    return this._get(url, newHttpConfig);
  }

  post(url: string, data: any, httpConfig?: HttpConfig) {
    const newHttpConfig = { ...HTTP_CONFIG, ...httpConfig };

    return this._getSanitizedRootUrl(newHttpConfig).pipe(
      mergeMap(rootUrl =>
        this.httpClient
          .post(rootUrl + url, data)
          .pipe(
            mergeMap((response: any) => {
              const dataId = response.uid;
              return newHttpConfig.useIndexDb
                ? dataId
                  ? this._updateIndexDb(
                      newHttpConfig,
                      {
                        ...data,
                        id: dataId
                      },
                      'CREATE'
                    ).pipe(map(() => response))
                  : of(response)
                : of(response);
            })
          )
          .pipe(catchError(this._handleError))
      ),
      catchError(this._handleError)
    );
  }

  put(url: string, data: any, httpConfig?: HttpConfig) {
    const newHttpConfig = { ...HTTP_CONFIG, ...httpConfig };

    return this._getSanitizedRootUrl(newHttpConfig).pipe(
      mergeMap(rootUrl =>
        this.httpClient.put(rootUrl + url, data).pipe(
          mergeMap((response: any) =>
            newHttpConfig.useIndexDb
              ? this._updateIndexDb(newHttpConfig, data, 'UPDATE').pipe(
                  map(() => response)
                )
              : of(response)
          ),
          catchError(this._handleError)
        )
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
          .pipe(
            mergeMap((response: any) =>
              newHttpConfig.useIndexDb
                ? this._updateIndexDb(newHttpConfig, null, 'DELETE').pipe(
                    map(() => response)
                  )
                : of(response)
            )
          )
          .pipe(catchError(this._handleError))
      ),
      catchError(this._handleError)
    );
  }

  // private methods

  private _get(url, httpConfig: HttpConfig) {
    return this._getSanitizedRootUrl(httpConfig).pipe(
      mergeMap(rootUrl =>
        this.httpClient.get(rootUrl + url).pipe(catchError(this._handleError))
      ),
      catchError(this._handleError)
    );
  }
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

  private _updateIndexDb(
    httpConfig: HttpConfig,
    requestData: any,
    action: string = 'CREATE'
  ) {
    const indexDbSchema: IndexDbSchema = httpConfig.indexDbConfig
      ? httpConfig.indexDbConfig.schema
      : null;

    const arrayKey = httpConfig.indexDbConfig
      ? httpConfig.indexDbConfig.arrayKey
      : null;

    const indexDbKey = httpConfig.indexDbConfig
      ? httpConfig.indexDbConfig.key
      : null;

    const data = arrayKey ? requestData[arrayKey] : requestData;

    switch (action) {
      case 'CREATE':
      case 'UPDATE':
        return (action === 'CREATE'
          ? this.indexDbService.post(indexDbSchema, data)
          : this.indexDbService.put(indexDbSchema, data)
        ).pipe(
          map(() => data),
          catchError(e => {
            console.warn('Could not save data into index DB, ERROR: ' + e);
            return of(data);
          })
        );
      case 'DELETE':
        return this.indexDbService.delete(indexDbSchema, indexDbKey).pipe(
          map(() => data),
          catchError(e => {
            console.warn('Could not delete data from index DB, ERROR: ' + e);
            return of(data);
          })
        );
      default:
        console.log('No action has been specified');
        return of(data);
    }
  }

  private _fetchFromIndexDb(httpConfig: HttpConfig) {
    const indexDbSchema: IndexDbSchema = httpConfig.indexDbConfig
      ? httpConfig.indexDbConfig.schema
      : null;

    const indexDbKey = httpConfig.indexDbConfig
      ? httpConfig.indexDbConfig.key
      : null;

    return indexDbKey
      ? this.indexDbService.findOne(indexDbSchema, indexDbKey)
      : this.indexDbService.findAll(indexDbSchema).pipe(
          map(response => {
            const arrayKey = httpConfig.indexDbConfig
              ? httpConfig.indexDbConfig.arrayKey
              : null;
            return response.length > 0
              ? arrayKey
                ? { [arrayKey]: response }
                : response
              : null;
          })
        );
  }
}
