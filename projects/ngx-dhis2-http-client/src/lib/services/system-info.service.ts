import { Injectable } from '@angular/core';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { ManifestService } from './manifest.service';
import { map, switchMap, tap, filter } from 'rxjs/internal/operators';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class SystemInfoService {
  private _systemInfoLoaded$: Subject<boolean>;
  private _systemInfoInitialized: boolean;
  private _systemInfo: any;

  constructor(
    private manifestService: ManifestService,
    private httpClient: HttpClient
  ) {
    this._systemInfoLoaded$ = new Subject();

    this._init();
  }

  private _init() {
    if (!this._systemInfoInitialized) {
      this._systemInfoInitialized = true;
      this.manifestService
        .getRootUrl()
        .pipe(
          switchMap((rootUrl: string) =>
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

  private _loaded(): Observable<boolean> {
    return this._systemInfoLoaded$.asObservable();
  }

  get(): Observable<any> {
    return this._loaded().pipe(
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
