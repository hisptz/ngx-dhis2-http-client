import { ManifestService } from './manifest.service';
import { SystemInfoService } from './system-info.service';
import { NgxDhis2HttpClientService } from './ngx-dhis2-http-client.service';

export const services: any[] = [ManifestService, SystemInfoService, NgxDhis2HttpClientService];

export * from './manifest.service';
export * from './system-info.service';
export * from './ngx-dhis2-http-client.service';
