import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';

import { ManifestService } from './manifest.service';
import { SystemInfo } from '../models/system-info.model';

@Injectable({ providedIn: 'root' })
export class SystemInfoService {
  private _systemInfoLoaded$: BehaviorSubject<boolean>;
  private systemInfoLoaded$: Observable<boolean>;
  private _systemInfoInitialized: boolean;
  private _systemInfo: SystemInfo;

  constructor(
    private manifestService: ManifestService,
    private httpClient: HttpClient
  ) {
    this._systemInfoLoaded$ = new BehaviorSubject(false);
    this.systemInfoLoaded$ = this._systemInfoLoaded$.asObservable();

    this._init();
  }

  private _init() {
    if (!this._systemInfoInitialized) {
      this._systemInfoInitialized = true;
      this.manifestService
        .getRootUrl()
        .pipe(
          mergeMap((rootUrl: string) =>
            forkJoin(
              this.httpClient.get(`${rootUrl}api/system/info`),
              this.httpClient.get(`${rootUrl}api/systemSettings`)
            ).pipe(
              map((res: any[]) => {
                return { ...res[0], ...res[1] };
              })
            )
          )
        )
        .subscribe(
          (systemInfo: any) => {
            this._systemInfo = systemInfo;
            this._systemInfoLoaded$.next(true);
          },
          error => {
            this._systemInfoLoaded$.next(true);
            console.warn('Could not load system information, Error: ' + error);
          }
        );
    }
  }

  get(): Observable<SystemInfo> {
    return this.systemInfoLoaded$.pipe(
      filter(loaded => loaded),
      map(() => this._systemInfo)
    );
  }

  public getSystemVersion(): Observable<number> {
    return this.get().pipe(
      map((systemInfo: any) => {
        if (!systemInfo) {
          return 0;
        }
        const splitedVersion = systemInfo.version
          ? systemInfo.version.split('.')
          : [];
        return parseInt(splitedVersion[1], 10) || 0;
      })
    );
  }
}
