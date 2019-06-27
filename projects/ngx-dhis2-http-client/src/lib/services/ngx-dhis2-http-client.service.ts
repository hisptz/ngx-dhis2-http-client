import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';

import { HTTP_CONFIG } from '../constants/http-config.constant';
import { HttpConfig } from '../models/http-config.model';
import { Manifest } from '../models/manifest.model';
import { User } from '../models/user.model';
import { IndexDbService } from './index-db.service';
import { ManifestService } from './manifest.service';
import { SystemInfoService } from './system-info.service';
import { UserService } from './user.service';
import { ErrorMessage } from '../models/error-message.model';

@Injectable({ providedIn: 'root' })
export class NgxDhis2HttpClientService {
  constructor(
    private httpClient: HttpClient,
    private manifestService: ManifestService,
    private systemInfoService: SystemInfoService,
    private indexDbService: IndexDbService,
    private userService: UserService
  ) {}

  get(url: string, httpConfig?: HttpConfig): Observable<any> {
    const newHttpConfig = this._getHttpConfig(httpConfig);

    // Make a call directly from url if is external one
    if (newHttpConfig.isExternalLink) {
      return this.httpClient.get(url);
    }

    return this._get(url, newHttpConfig);
  }

  post(url: string, data: any, httpConfig?: HttpConfig) {
    return this._getRootUrl(this._getHttpConfig(httpConfig)).pipe(
      mergeMap(rootUrl =>
        this.httpClient
          .post(rootUrl + url, data)
          .pipe(catchError(this._handleError))
      ),
      catchError(this._handleError)
    );
  }

  put(url: string, data: any, httpConfig?: HttpConfig) {
    return this._getRootUrl(this._getHttpConfig(httpConfig)).pipe(
      mergeMap(rootUrl =>
        this.httpClient
          .put(rootUrl + url, data)
          .pipe(catchError(this._handleError))
      ),
      catchError(this._handleError)
    );
  }

  me(): Observable<User> {
    return this.userService.getCurrentUser();
  }

  systemInfo(): Observable<any> {
    return this.systemInfoService.get();
  }

  rootUrl(): Observable<string> {
    return this.manifestService.getRootUrl();
  }

  manifest(): Observable<Manifest> {
    return this.manifestService.getManifest();
  }

  delete(url: string, httpConfig?: HttpConfig) {
    return this._getRootUrl(this._getHttpConfig(httpConfig)).pipe(
      mergeMap(rootUrl =>
        this.httpClient
          .delete(rootUrl + url)
          .pipe(catchError(this._handleError))
      ),
      catchError(this._handleError)
    );
  }

  // private methods

  private _get(url, httpConfig: HttpConfig) {
    if (httpConfig.useIndexDb) {
      return this._getFromIndexDb(url, httpConfig);
    }

    return this._getFromServer(url, httpConfig);
  }

  private _getFromServer(url, httpConfig: HttpConfig) {
    return this._getRootUrl(httpConfig).pipe(
      mergeMap(rootUrl =>
        this.httpClient.get(rootUrl + url).pipe(catchError(this._handleError))
      ),
      catchError(this._handleError)
    );
  }
  private _getFromIndexDb(url, httpConfig: HttpConfig) {
    const urlContent = this._deriveUrlContent(url);
    const schemaName =
      urlContent && urlContent.schema ? urlContent.schema.name : undefined;

    const id =
      urlContent && urlContent.schema ? urlContent.schema.id : undefined;

    if (!schemaName) {
      console.warn('index db operations failed, Error: Schema is not supplied');
      return this._getFromServer(url, httpConfig);
    }

    return (id
      ? this.indexDbService.findById(schemaName, id)
      : this.indexDbService.findAll(schemaName)
    ).pipe(
      mergeMap((indexDbResponse: any) => {
        if (
          !indexDbResponse ||
          (indexDbResponse[schemaName] &&
            indexDbResponse[schemaName].length === 0)
        ) {
          return this._getFromServer(url, httpConfig).pipe(
            mergeMap((serverResponse: any) => {
              if (!serverResponse) {
                return of(null);
              }

              return id
                ? this.indexDbService.saveOne(schemaName, serverResponse)
                : this.indexDbService.saveBulk(
                    schemaName,
                    serverResponse[schemaName]
                  );
            })
          );
        }
        return of(indexDbResponse);
      })
    );
  }
  private _deriveUrlContent(url) {
    const splitedUrl = (url || '').split('?');
    const schemaPart = (splitedUrl[0] || '').split('/') || [];
    const schemaName = ((schemaPart[0] || '').split('.') || [])[0];

    const schema = {
      name:
        schemaName === 'dataStore'
          ? `dataStore_${((schemaPart[1] || '').split('.') || [])[0]}`
          : schemaName,
      id:
        schemaName === 'dataStore'
          ? (schemaPart[2] || '').replace('.json', '')
          : (schemaPart[1] || '').replace('.json', '')
    };

    const params = {};
    ((splitedUrl[1] || '').split('&') || []).forEach(param => {
      const splitedParams = param.split('=');
      if (splitedParams[0] || splitedParams[0] !== '') {
        params[splitedParams[0]] = [
          ...(params[splitedParams[0]] || []),
          splitedParams[1]
        ];
      }
    });

    return { schema, params };
  }

  private _getHttpConfig(httpConfig: HttpConfig) {
    return { ...HTTP_CONFIG, ...(httpConfig || {}) };
  }
  private _getRootUrl(httpConfig: HttpConfig) {
    return this.manifestService.getRootUrl().pipe(
      mergeMap(rootUrl => {
        if (httpConfig.useRootUrl) {
          return of(rootUrl);
        }

        return this._getApiRootUrl(
          rootUrl,
          httpConfig.includeVersionNumber,
          httpConfig.preferPreviousApiVersion
        );
      })
    );
  }
  private _handleError(err: HttpErrorResponse) {
    let error: ErrorMessage = null;
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      error = {
        message: err.error.toString(),
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
    rootUrl: string,
    includeVersionNumber: boolean = false,
    preferPreviousVersion: boolean = false
  ) {
    return this.systemInfoService.getSystemVersion().pipe(
      map((version: number) => {
        const versionNumber = version - 1 <= 25 ? version + 1 : version;
        return `${rootUrl}api/${
          includeVersionNumber && !preferPreviousVersion
            ? versionNumber + '/'
            : preferPreviousVersion
            ? versionNumber
              ? versionNumber - 1 + '/'
              : ''
            : ''
        }`;
      })
    );
  }
}
