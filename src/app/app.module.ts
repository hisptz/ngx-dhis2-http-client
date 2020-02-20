import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { NgxDhis2HttpClientModule } from '@iapps/ngx-dhis2-http-client';

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        NgxDhis2HttpClientModule.forRoot({
            namespace: 'hisptz',
            version: 1,
            models: {
                users: 'id',
                organisationUnitLevels: 'id',
                organisationUnits: 'id,name,level',
                organisationUnitGroups: 'id',
                dataStore_scorecards: 'id',
            },
        }),
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
