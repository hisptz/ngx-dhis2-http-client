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
    httpClient.get('identifiableObjects/m9A0aVIEU6a.json').subscribe(
      res => {
        console.log(res);
      },
      error => {
        console.log(error);
      }
    );

    httpClient.get('identifiableObjects/m9A0aVIEU6a.json').subscribe(
      res => {
        console.log(res);
      },
      error => {
        console.log(error);
      }
    );
  }
}
