import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import {
    NgxDhis2HttpClientService,
    Manifest,
} from '@iapps/ngx-dhis2-http-client';
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
        this.httpClient.manifest().subscribe((manifest: Manifest) => {
            console.log(manifest);
        });
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

        this.httpClient
            .get('users.json', {
                useIndexDb: true,
                fetchOnlineIfNotExist: false,
            })
            .subscribe(users => {
                console.log(users);
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
