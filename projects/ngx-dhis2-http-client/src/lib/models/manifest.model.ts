export interface Manifest {
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
