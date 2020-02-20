import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { NgxDhis2HttpClientService } from '@iapps/ngx-dhis2-http-client';
import * as _ from 'lodash';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
})
export class AppComponent {
    constructor(
        private httpClient: NgxDhis2HttpClientService,
        private http: HttpClient
    ) {
        this.httpClient
            .get(
                'organisationUnits.json?fields=id,name,level,parent,path&order=level:asc&order=name:asc&filter=path:ilike:O6uvpzGd5pu&pageSize=100&page=1',
                {
                    useIndexDb: true,
                }
            )
            .subscribe(orgUnits => {
                console.log(orgUnits);
            });
    }

    onPost(e) {
        const randomId = _.random(1000, 1000000);
        e.stopPropagation();
        this.httpClient
            .post(`dataStore/http-namespace/${randomId}`, 'string value')
            .subscribe(res => {
                console.log(res);
            });
    }
}
