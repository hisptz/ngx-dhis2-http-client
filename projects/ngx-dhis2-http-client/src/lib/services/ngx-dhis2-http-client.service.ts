import {
    HttpClient,
    HttpErrorResponse,
    HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject, forkJoin } from 'rxjs';
import { catchError, map, mergeMap, switchMap, filter } from 'rxjs/operators';

import {
    HTTP_CONFIG,
    DEFAULT_ROOT_URL,
    HTTP_HEADER_OPTIONS,
} from '../constants/http.constant';
import { HttpConfig } from '../models/http-config.model';
import { Manifest } from '../models/manifest.model';
import { User } from '../models/user.model';
import { IndexDbService } from './index-db.service';
import { ManifestService } from './manifest.service';
import { SystemInfoService } from './system-info.service';
import { UserService } from './user.service';
import { ErrorMessage } from '../models/error-message.model';
import { getRootUrl } from '../helpers/get-root-url.helper';
import { getSystemVersion } from '../helpers/get-system-version.helper';
import { SystemInfo } from '../models/system-info.model';

interface Instance {
    manifest: Manifest;
    rootUrl: string;
    version: number;
    systemInfo: SystemInfo;
    currentUser: User;
}

@Injectable({ providedIn: 'root' })
export class NgxDhis2HttpClientService {
    private _error: ErrorMessage;
    private _loaded$: BehaviorSubject<boolean>;
    private loaded$: Observable<boolean>;
    private _instance: Instance;
    private _initiated: boolean;
    constructor(
        private httpClient: HttpClient,
        private manifestService: ManifestService,
        private systemInfoService: SystemInfoService,
        private indexDbService: IndexDbService,
        private userService: UserService
    ) {
        this._instance = {
            manifest: null,
            rootUrl: DEFAULT_ROOT_URL,
            version: 0,
            systemInfo: null,
            currentUser: null,
        };
        this._loaded$ = new BehaviorSubject<boolean>(false);
        this.loaded$ = this._loaded$.asObservable();

        if (!this._initiated) {
            this._initiated = true;
            this.init();
        }
    }

    init() {
        this.manifestService
            .getManifest(this.httpClient)
            .pipe(
                switchMap((manifest: Manifest) => {
                    const rootUrl = getRootUrl(manifest);
                    return forkJoin(
                        this.systemInfoService
                            .get(this.httpClient, rootUrl)
                            .pipe(catchError(this._handleError)),
                        this.userService
                            .getCurrentUser(this.httpClient, rootUrl)
                            .pipe(catchError(this._handleError))
                    ).pipe(
                        map((res: any[]) => {
                            return {
                                rootUrl,
                                manifest,
                                systemInfo: res[0],
                                currentUser: res[1],
                            };
                        })
                    );
                })
            )
            .subscribe(
                res => {
                    this._instance = {
                        ...this._instance,
                        ...res,
                        version: getSystemVersion(res.systemInfo),
                    };
                    this._loaded$.next(true);
                },
                (error: ErrorMessage) => {
                    this._error = error;
                }
            );
    }

    get(url: string, httpConfig?: HttpConfig): Observable<any> {
        const newHttpConfig = this._getHttpConfig(httpConfig);

        const httpOptions = this._getHttpOptions(newHttpConfig.httpHeaders);

        // Make a call directly from url if is external one
        if (newHttpConfig.isExternalLink) {
            return httpOptions
                ? this.httpClient.get(url, httpOptions)
                : this.httpClient.get(url);
        }

        return this._get(url, newHttpConfig, httpOptions);
    }

    post(url: string, data: any, httpConfig?: HttpConfig) {
        const newHttpConfig = this._getHttpConfig(httpConfig);

        const httpOptions = this._getHttpOptions(newHttpConfig.httpHeaders);

        return this._getRootUrl(newHttpConfig).pipe(
            mergeMap(rootUrl =>
                (httpOptions
                    ? this.httpClient.post(rootUrl + url, data, httpOptions)
                    : this.httpClient.post(rootUrl + url, data)
                ).pipe(catchError(this._handleError))
            ),
            catchError(this._handleError)
        );
    }

    put(url: string, data: any, httpConfig?: HttpConfig) {
        const newHttpConfig = this._getHttpConfig(httpConfig);

        const httpOptions = this._getHttpOptions(newHttpConfig.httpHeaders);
        return this._getRootUrl(newHttpConfig).pipe(
            mergeMap(rootUrl =>
                (httpOptions
                    ? this.httpClient.put(rootUrl + url, data, httpOptions)
                    : this.httpClient.put(rootUrl + url, data)
                ).pipe(catchError(this._handleError))
            ),
            catchError(this._handleError)
        );
    }

    delete(url: string, httpConfig?: HttpConfig) {
        const newHttpConfig = this._getHttpConfig(httpConfig);

        const httpOptions = this._getHttpOptions(newHttpConfig.httpHeaders);
        return this._getRootUrl(newHttpConfig).pipe(
            mergeMap(rootUrl =>
                (httpOptions
                    ? this.httpClient.delete(rootUrl + url, httpOptions)
                    : this.httpClient.delete(rootUrl + url)
                ).pipe(catchError(this._handleError))
            ),
            catchError(this._handleError)
        );
    }

    me(): Observable<User> {
        return this._getInstance().pipe(
            map((instance: Instance) => instance.currentUser)
        );
    }

    systemInfo(): Observable<SystemInfo> {
        return this._getInstance().pipe(
            map((instance: Instance) => instance.systemInfo)
        );
    }

    rootUrl(): Observable<string> {
        return this._getInstance().pipe(
            map((instance: Instance) => instance.rootUrl)
        );
    }

    manifest(): Observable<Manifest> {
        return this._getInstance().pipe(
            map((instance: Instance) => instance.manifest)
        );
    }

    // private methods

    private _getInstance(): Observable<Instance> {
        if (this._error) {
            return throwError(this._error);
        }

        return this.loaded$.pipe(
            filter(loaded => loaded),
            map(() => this._instance)
        );
    }

    private _get(url, httpConfig: HttpConfig, httpOptions: any) {
        if (httpConfig.useIndexDb) {
            return this._getFromIndexDb(url, httpConfig, httpOptions);
        }

        return this._getFromServer(url, httpConfig, httpOptions);
    }

    private _getFromServer(url, httpConfig: HttpConfig, httpOptions: any) {
        return this._getRootUrl(httpConfig).pipe(
            mergeMap(rootUrl =>
                (httpOptions
                    ? this.httpClient.get(rootUrl + url, httpOptions)
                    : this.httpClient.get(rootUrl + url)
                ).pipe(catchError(this._handleError))
            ),
            catchError(this._handleError)
        );
    }
    private _getFromIndexDb(url, httpConfig: HttpConfig, httpOptions: any) {
        const urlContent = this._deriveUrlContent(url);
        const schemaName =
            urlContent && urlContent.schema
                ? urlContent.schema.name
                : undefined;

        const id =
            urlContent && urlContent.schema ? urlContent.schema.id : undefined;

        if (!schemaName) {
            console.warn(
                'index db operations failed, Error: Schema is not supplied'
            );
            return this._getFromServer(url, httpConfig, httpOptions);
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
                    return this._getFromServer(
                        url,
                        httpConfig,
                        httpOptions
                    ).pipe(
                        mergeMap((serverResponse: any) => {
                            if (!serverResponse) {
                                return of(null);
                            }

                            return id
                                ? this.indexDbService.saveOne(
                                      schemaName,
                                      serverResponse
                                  )
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
                    : (schemaPart[1] || '').replace('.json', ''),
        };

        const params = {};
        ((splitedUrl[1] || '').split('&') || []).forEach(param => {
            const splitedParams = param.split('=');
            if (splitedParams[0] || splitedParams[0] !== '') {
                params[splitedParams[0]] = [
                    ...(params[splitedParams[0]] || []),
                    splitedParams[1],
                ];
            }
        });

        return { schema, params };
    }

    private _getHttpConfig(httpConfig: HttpConfig) {
        return { ...HTTP_CONFIG, ...(httpConfig || {}) };
    }
    private _getRootUrl(httpConfig: HttpConfig) {
        return this._getInstance().pipe(
            mergeMap((instance: Instance) => {
                const rootUrl = instance.rootUrl;
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
                statusText: err.statusText,
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
                statusText: err.statusText,
            };
        }
        return throwError(error);
    }

    private _getApiRootUrl(
        rootUrl: string,
        includeVersionNumber: boolean = false,
        preferPreviousVersion: boolean = false
    ) {
        return this._getInstance().pipe(
            map((instance: Instance) => {
                const version = instance.version;
                const versionNumber =
                    version !== 0
                        ? version - 1 <= 25
                            ? version + 1
                            : version
                        : '';
                return versionNumber === ''
                    ? `${rootUrl}api/`
                    : `${rootUrl}api/${
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

    private _getHttpOptions(httpHeaderOptions: any) {
        return httpHeaderOptions
            ? {
                  headers: new HttpHeaders({
                      ...HTTP_HEADER_OPTIONS,
                      ...(httpHeaderOptions || {}),
                  }),
              }
            : null;
    }
}
