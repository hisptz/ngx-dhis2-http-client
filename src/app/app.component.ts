import { Component } from '@angular/core';
import { NgxDhis2HttpClientService } from 'ngx-dhis2-http-client';
import { SystemInfoService } from 'ngx-dhis2-http-client';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(
    private httpClient: NgxDhis2HttpClientService,
    private systemInfo: SystemInfoService
  ) {
    httpClient
      .get('organisationUnits.json', {
        useIndexDb: true,
        indexDbConfig: {
          schema: { name: 'organisationUnits', keyPath: 'id' },
          arrayKey: 'organisationUnits'
        }
      })
      .subscribe(
        res => {
          console.log(res);
        },
        error => {
          console.log(error);
        }
      );
  }
}
