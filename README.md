# DHIS2 Http Client library

DHIS2 Http Client is angular 6 library that exposes services for fetching, posting, updating and deleting dhis2 resources

## installation

`npm install ngx-dhis2-http-client`

## Content

ngx-dhis2-http-client exposes two services .i.e NgxHttpClientService and ManifestService

- NgxHttpClientService: This service exposes all REST-API methods .i.e. GET, POST, PUT, DELETE
  
  - GET: `get(url: string, preferPreviousApiVersion: boolean = false, useRootUrl: boolean = false)`
  
  - POST: `post(url: string, data: any, preferPreviousApiVersion: boolean = false, useRootUrl: boolean = false)`
  
  - PUT: `put(url: string, data: any, preferPreviousApiVersion: boolean = false, useRootUrl: boolean = false)`
  
  - DELETE `delete(url: string, preferPreviousApiVersion: boolean = false, useRootUrl: boolean = false)`
  
- ManifestService: This service exposes manifest two methods getManifest and getRootUrl
  
  - getManifest: This returns payload with the format
   ```
    {
      name: string;
      version: number | string;
      description: string;
      launch_path: string;
      icons: {
        16: string;
        48: string;
        128: string;
      };
      developer: {
        name: string;
        url: string;
      };
      default_locale: string;
      activities: {
        dhis: {
          href: string;
        };
      };
    }
  ```  
  - getRootUrl: This method returns rootUrl as specified in the manifest file in activities.dhis.href. This method will return `../../../` if manifest file could not be loaded or href is not specified


## Usage

Inject NgxHttpClientService or ManifestService any where in constructor in your angular application eg

```
 import { NgxDhis2HttpClientService } from 'ngx-dhis2-http-client';
 ...
 constructor(private http: NgxDhis2HttpClientService) {
  }
 ...
```
NOTE: This library uses HttpClientModule from angular, make sure to import it in your app.module or any module you wish to use this library
