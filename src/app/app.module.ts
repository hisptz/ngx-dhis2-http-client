import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxDhis2HttpClientModule } from '@iapps/ngx-dhis2-http-client';

import { AppComponent } from './app.component';

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
        organisationUnits: 'id',
        organisationUnitGroups: 'id',
        dataStore_scorecards: 'id'
      }
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
