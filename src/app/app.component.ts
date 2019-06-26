import { Component } from '@angular/core';
import {
  NgxDhis2HttpClientService,
  SystemInfoService
} from 'projects/ngx-dhis2-http-client/src/public_api';

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
      .get(
        'users.json?fields=id,name,created&paging=false&filter=name:ilike:John',
        {
          useIndexDb: true,
          indexDbConfig: { schema: 'users' }
        }
      )
      .subscribe(
        res => {
          console.log(res);
        },
        error => {
          console.log(error);
        }
      );

    httpClient
      .get('users/rWLrZL8rP3K.json?fields=id,name,created', {
        useIndexDb: true
      })
      .subscribe(
        res => {
          console.log(res);
        },
        error => {
          console.log(error);
        }
      );

    this.httpClient
      .get('dhis-web-commons-stream/ping.action', {
        useRootUrl: true
      })
      .subscribe(res => {
        console.log(res);
      });

    this.httpClient.me().subscribe(me => {
      console.log(me);
    });
  }
}
