import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, ModuleWithProviders, NgModule } from '@angular/core';

import {
  IndexDbService,
  IndexDbServiceConfig
} from './services/index-db.service';
import { NgxDhis2HttpClientService } from './services/ngx-dhis2-http-client.service';

function initializeDb(indexDbServiceConfig: IndexDbServiceConfig) {
  return () => new IndexDbService(indexDbServiceConfig);
}

function initializeHttp(httpClient: NgxDhis2HttpClientService) {
  return () => httpClient.init();
}

// @dynamic
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
        },
        {
          provide: APP_INITIALIZER,
          useFactory: initializeHttp,
          deps: [NgxDhis2HttpClientService],
          multi: true
        }
      ]
    };
  }
}
