import { ModuleWithProviders, NgModule, APP_INITIALIZER } from '@angular/core';
import { NgxDhis2HttpClientService } from './services';

export function initialize(ngxDhis2HttpService: NgxDhis2HttpClientService) {
  return () => ngxDhis2HttpService.init();
}

@NgModule({})
export class NgxDhis2HttpClientModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: NgxDhis2HttpClientModule,
      providers: [
        {
          provide: APP_INITIALIZER,
          useFactory: initialize,
          multi: true
        }
      ]
    };
  }
}
