import { ModuleWithProviders, NgModule, APP_INITIALIZER } from '@angular/core';
import {
  NgxDhis2HttpClientService,
  IndexDbServiceConfig,
  IndexDbService
} from './services';
import { HttpClientModule } from '@angular/common/http';

export function initializeDb(indexDbServiceConfig: IndexDbServiceConfig) {
  return () => new IndexDbService(indexDbServiceConfig);
}

@NgModule({
  imports: [HttpClientModule]
})
export class NgxDhis2HttpClientModule {
  static forRoot(config: IndexDbServiceConfig): ModuleWithProviders {
    return {
      ngModule: NgxDhis2HttpClientModule,
      providers: [
        { provide: IndexDbServiceConfig, useValue: config },
        {
          provide: APP_INITIALIZER,
          useFactory: initializeDb,
          deps: [IndexDbServiceConfig],
          multi: true
        }
      ]
    };
  }
}
